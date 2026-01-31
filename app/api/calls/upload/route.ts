import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { salesCalls, users, organizations, userOrganizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { canPerformAction, incrementUsage } from '@/lib/subscription';
import { transcribeAudioFile } from '@/lib/ai/transcription';
import { shouldBypassSubscription } from '@/lib/dev-mode';
import { analyzeCall } from '@/lib/ai/analysis';
import { callAnalysis } from '@/db/schema';

/**
 * Upload a sales call audio file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user and organization
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get organization
    let organizationId = user[0].organizationId;
    if (!organizationId) {
      const firstOrg = await db
        .select()
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, user[0].id))
        .limit(1);
      
      if (!firstOrg[0]) {
        return NextResponse.json(
          { error: 'No organization found' },
          { status: 404 }
        );
      }
      organizationId = firstOrg[0].organizationId;
    }

    // Check if user can upload calls (usage limits)
    // Bypassed in dev mode via canPerformAction
    const canUpload = await canPerformAction(organizationId, 'upload_call');
    if (!canUpload.allowed) {
      return NextResponse.json(
        { error: canUpload.reason || 'Cannot upload call' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: MP3, WAV, M4A, WebM' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer for transcription
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Transcribe audio (Deepgram is fast, completes in seconds)
    let transcriptionResult;
    try {
      transcriptionResult = await transcribeAudioFile(audioBuffer, file.name);
    } catch (transcriptionError: any) {
      console.error('Transcription error:', transcriptionError);
      return NextResponse.json(
        { error: `Transcription failed: ${transcriptionError.message}` },
        { status: 500 }
      );
    }

    // Store metadata; addToFigures (default true) controls whether this call counts in figures
    let callMetadata: Record<string, unknown> = {};
    try {
      if (metadata) callMetadata = JSON.parse(metadata);
    } catch {
      // ignore invalid JSON
    }
    const addToFigures = callMetadata.addToFigures !== false;
    const analysisIntent = addToFigures ? 'update_figures' : 'analysis_only';

    // Create call record with transcript ready
    const [call] = await db
      .insert(salesCalls)
      .values({
        organizationId,
        userId: session.user.id,
        fileName: file.name,
        fileUrl: '', // Not storing URL anymore
        fileSize: file.size,
        transcript: transcriptionResult.transcript,
        transcriptJson: JSON.stringify(transcriptionResult.transcriptJson),
        duration: transcriptionResult.duration,
        status: 'analyzing', // Ready for analysis immediately
        metadata: JSON.stringify(callMetadata),
        analysisIntent,
      })
      .returning();

    // Increment usage counter (skip in dev mode)
    if (!shouldBypassSubscription()) {
      await incrementUsage(organizationId, 'calls');
    }

    // Trigger analysis in background (non-blocking)
    analyzeCallAsync(call.id, transcriptionResult.transcript, transcriptionResult.transcriptJson).catch(
      (err) => console.error('Background analysis error:', err)
    );

    return NextResponse.json({
      callId: call.id,
      status: 'analyzing',
      message: 'Call uploaded and transcribed. Analysis in progress...',
    });
  } catch (error: any) {
    console.error('Error uploading call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload call' },
      { status: 500 }
    );
  }
}

/**
 * Analyze call in background (non-blocking)
 */
async function analyzeCallAsync(
  callId: string,
  transcript: string,
  transcriptJson: any
) {
  try {
    const analysisResult = await analyzeCall(transcript, transcriptJson);

    // Enhance coaching recommendations with execution resistance context if applicable
    let enhancedRecommendations = [...(analysisResult.coachingRecommendations || [])];
    if (analysisResult.prospectDifficulty?.executionResistance !== undefined) {
      const execResistance = analysisResult.prospectDifficulty.executionResistance;
      if (execResistance <= 4) {
        // Add note about execution resistance
        enhancedRecommendations.push({
          priority: 'medium' as const,
          category: 'Prospect Difficulty',
          issue: `Prospect had extreme execution resistance (${execResistance}/10) - severe money/time/authority constraints`,
          explanation: 'This call was difficult due to structural blockers, not just sales skill. Execution resistance increases difficulty but does not excuse poor performance - both should be addressed.',
          action: 'Flag this as a lead quality issue. Consider qualifying for execution ability earlier in the funnel.',
        });
      } else if (execResistance <= 7) {
        enhancedRecommendations.push({
          priority: 'low' as const,
          category: 'Prospect Difficulty',
          issue: `Prospect had partial execution ability (${execResistance}/10)`,
          explanation: 'Prospect may need payment plans, time restructuring, or prioritization reframing.',
          action: 'Consider offering flexible payment options or helping prospect reprioritize.',
        });
      }
    }

    // Save analysis to database
    await db
      .insert(callAnalysis)
      .values({
        callId,
        overallScore: analysisResult.overallScore,
        valueScore: analysisResult.value.score,
        trustScore: analysisResult.trust.score,
        fitScore: analysisResult.fit.score,
        logisticsScore: analysisResult.logistics.score,
        valueDetails: JSON.stringify(analysisResult.value),
        trustDetails: JSON.stringify(analysisResult.trust),
        fitDetails: JSON.stringify(analysisResult.fit),
        logisticsDetails: JSON.stringify(analysisResult.logistics),
        skillScores: JSON.stringify(analysisResult.skillScores),
        coachingRecommendations: JSON.stringify(enhancedRecommendations),
        timestampedFeedback: JSON.stringify(analysisResult.timestampedFeedback),
      });

    // If analysisIntent is update_figures, write AI-suggested outcome to salesCalls
    const [callRow] = await db.select({ analysisIntent: salesCalls.analysisIntent }).from(salesCalls).where(eq(salesCalls.id, callId)).limit(1);
    const outcome = analysisResult.outcome;
    const hasOutcome = outcome && (
      outcome.result != null ||
      outcome.qualified !== undefined ||
      outcome.cashCollected != null ||
      outcome.revenueGenerated != null ||
      (outcome.reasonForOutcome != null && outcome.reasonForOutcome.trim() !== '')
    );
    if (callRow?.analysisIntent === 'update_figures' && hasOutcome) {
      const updatePayload: Record<string, unknown> = {
        status: 'completed',
        completedAt: new Date(),
      };
      if (outcome!.result) updatePayload.result = outcome!.result;
      if (outcome!.qualified !== undefined) updatePayload.qualified = outcome!.qualified;
      if (outcome!.cashCollected !== undefined) updatePayload.cashCollected = outcome!.cashCollected;
      if (outcome!.revenueGenerated !== undefined) updatePayload.revenueGenerated = outcome!.revenueGenerated;
      if (outcome!.reasonForOutcome?.trim()) updatePayload.reasonForOutcome = outcome!.reasonForOutcome.trim();
      await db.update(salesCalls).set(updatePayload as any).where(eq(salesCalls.id, callId));
    } else {
      await db
        .update(salesCalls)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(salesCalls.id, callId));
    }
  } catch (error: any) {
    console.error('Background analysis error:', error);
    // Mark as failed
    await db
      .update(salesCalls)
      .set({ status: 'failed' })
      .where(eq(salesCalls.id, callId));
  }
}

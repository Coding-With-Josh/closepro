import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { salesCalls, users, userOrganizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { canPerformAction, incrementUsage } from '@/lib/subscription';
import { shouldBypassSubscription } from '@/lib/dev-mode';
import { analyzeCallAsync } from '@/lib/calls/analyze-call';
import { extractTextFromTranscriptFile, isAllowedTranscriptFile } from '@/lib/calls/extract-transcript-text';

/**
 * Build minimal transcriptJson from pasted transcript text.
 * Analysis expects { utterances: Array<{ speaker, start, end, text }> }.
 */
function transcriptTextToJson(transcript: string): { utterances: Array<{ speaker: string; start: number; end: number; text: string }> } {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { utterances: [] };
  }
  // If lines look like "[Speaker A] ..." or "Speaker 1: ...", split by speaker
  const speakerLine = /^(\s*\[?\s*Speaker\s+\w+\s*\]?\s*:?\s*)(.*)$/im;
  const lines = trimmed.split(/\n+/);
  const utterances: Array<{ speaker: string; start: number; end: number; text: string }> = [];
  let time = 0;
  for (const line of lines) {
    const m = line.match(speakerLine);
    const text = m ? m[2].trim() : line.trim();
    if (!text) continue;
    const speaker = m ? m[1].replace(/[\[\]:]/g, '').trim() || 'Speaker A' : 'Speaker A';
    utterances.push({ speaker, start: time, end: time + 1000, text });
    time += 2000;
  }
  if (utterances.length === 0) {
    utterances.push({ speaker: 'Speaker A', start: 0, end: 1000, text: trimmed });
  }
  return { utterances };
}

/**
 * POST - Create a call from pasted transcript or uploaded file (no audio/Deepgram).
 * Accepts either:
 * - JSON: { transcript: string, addToFigures?: boolean, fileName?: string }
 * - FormData: file (TXT/PDF/DOCX) + optional metadata (JSON string with addToFigures)
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

    const canUpload = await canPerformAction(organizationId, 'upload_call');
    if (!canUpload.allowed) {
      return NextResponse.json(
        { error: canUpload.reason || 'Cannot add call' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') ?? '';
    let transcript: string;
    let fileName: string;
    let addToFigures = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const metadataStr = formData.get('metadata') as string | null;
      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: 'No file provided. Upload a .txt, .pdf, or .docx transcript file.' },
          { status: 400 }
        );
      }
      if (!isAllowedTranscriptFile(file.name, file.type)) {
        return NextResponse.json(
          { error: 'Unsupported file type. Use .txt, .pdf, or .docx.' },
          { status: 400 }
        );
      }
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        transcript = await extractTextFromTranscriptFile(buffer, file.name, file.type);
      } catch (extractErr: unknown) {
        const msg = extractErr instanceof Error ? extractErr.message : 'Failed to extract text from file';
        return NextResponse.json(
          { error: msg },
          { status: 400 }
        );
      }
      if (!transcript.trim()) {
        return NextResponse.json(
          { error: 'File appears empty or no text could be extracted.' },
          { status: 400 }
        );
      }
      fileName = file.name;
      if (metadataStr) {
        try {
          const meta = JSON.parse(metadataStr);
          addToFigures = meta.addToFigures !== false;
        } catch {
          // ignore invalid metadata
        }
      }
    } else {
      const body = await request.json();
      const { transcript: bodyTranscript, addToFigures: bodyAddToFigures = true, fileName: bodyFileName = 'pasted-transcript.txt' } = body;
      if (typeof bodyTranscript !== 'string' || !bodyTranscript.trim()) {
        return NextResponse.json(
          { error: 'transcript (string) is required, or upload a .txt / .pdf / .docx file' },
          { status: 400 }
        );
      }
      transcript = bodyTranscript.trim();
      fileName = typeof bodyFileName === 'string' ? bodyFileName : 'pasted-transcript.txt';
      addToFigures = bodyAddToFigures !== false;
    }

    const transcriptJson = transcriptTextToJson(transcript);
    const analysisIntent = addToFigures ? 'update_figures' : 'analysis_only';
    const callMetadata = { addToFigures };

    const trimmedTranscript = transcript.trim();
    const [call] = await db
      .insert(salesCalls)
      .values({
        organizationId,
        userId: session.user.id,
        fileName,
        fileUrl: '',
        fileSize: null,
        duration: null,
        transcript: trimmedTranscript,
        transcriptJson: JSON.stringify(transcriptJson),
        status: 'analyzing',
        metadata: JSON.stringify(callMetadata),
        analysisIntent,
      })
      .returning();

    if (!shouldBypassSubscription()) {
      await incrementUsage(organizationId, 'calls');
    }

    analyzeCallAsync(call.id, trimmedTranscript, transcriptJson).catch(
      (err) => console.error('Background analysis error (transcript):', err)
    );

    return NextResponse.json({
      callId: call.id,
      status: 'analyzing',
      message: 'Transcript saved. Analysis in progress...',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating call from transcript:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create call from transcript';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { salesCalls, users, userOrganizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST - Log a call manually (updates figures but does NOT add to call history)
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

    const body = await request.json();
    const {
      date,
      offerId,
      offerType,
      callType,
      result,
      qualified,
      cashCollected,
      revenueGenerated,
      depositTaken,
      reasonForOutcome,
      objections,
    } = body;

    if (!offerId || !result || !reasonForOutcome) {
      return NextResponse.json(
        { error: 'Missing required fields: offerId, result, reasonForOutcome' },
        { status: 400 }
      );
    }

    // Get user's organization
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
        .where(eq(userOrganizations.userId, session.user.id))
        .limit(1);
      
      if (!firstOrg[0]) {
        return NextResponse.json(
          { error: 'No organization found' },
          { status: 404 }
        );
      }
      organizationId = firstOrg[0].organizationId;
    }

    const callDate = date ? new Date(date) : new Date();
    if (isNaN(callDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date' },
        { status: 400 }
      );
    }

    await db.insert(salesCalls).values({
      organizationId,
      userId: session.user.id,
      fileName: 'manual',
      fileUrl: '',
      status: 'manual',
      offerId: offerId || null,
      offerType: offerType || null,
      callType: callType || null,
      result: result || null,
      qualified: qualified ?? null,
      cashCollected: cashCollected != null ? Number(cashCollected) : null,
      revenueGenerated: revenueGenerated != null ? Number(revenueGenerated) : null,
      depositTaken: depositTaken ?? null,
      reasonForOutcome: reasonForOutcome || null,
      callDate,
    });

    return NextResponse.json({
      message: 'Call logged successfully (figures updated)',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error logging manual call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log call' },
      { status: 500 }
    );
  }
}

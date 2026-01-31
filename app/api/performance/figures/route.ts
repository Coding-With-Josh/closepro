import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { salesCalls } from '@/db/schema';
import { eq, or, and, isNull } from 'drizzle-orm';

/**
 * GET - Figures for a given month (sales reality: booked, showed, qualified, closed, revenue).
 * Query: month=YYYY-MM (required).
 * Only includes: status=manual OR (status=completed AND (analysisIntent=update_figures OR analysisIntent IS NULL)).
 * Uses callDate for attribution when set (manual backdating), else createdAt.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: 'Query parameter month=YYYY-MM is required' },
        { status: 400 }
      );
    }

    const [year, month] = monthParam.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const userId = session.user.id;

    const rows = await db
      .select()
      .from(salesCalls)
      .where(
        and(
          eq(salesCalls.userId, userId),
          or(
            eq(salesCalls.status, 'manual'),
            and(
              eq(salesCalls.status, 'completed'),
              or(
                eq(salesCalls.analysisIntent, 'update_figures'),
                isNull(salesCalls.analysisIntent)
              )
            )
          )
        )
      );

    const dateFor = (row: { callDate: Date | null; createdAt: Date }) =>
      row.callDate ? new Date(row.callDate) : new Date(row.createdAt);

    const inMonth = (row: { callDate: Date | null; createdAt: Date }) => {
      const d = dateFor(row);
      return d >= start && d <= end;
    };

    const monthRows = rows.filter(inMonth);

    const baseRows = monthRows.filter((r) => !r.originalCallId);
    const callsBooked = baseRows.length;
    const callsShowed = baseRows.filter((r) => r.result !== 'no_show').length;
    const callsQualified = baseRows.filter(
      (r) => r.result !== 'no_show' && r.qualified === true
    ).length;
    const salesMade = monthRows.filter((r) =>
      r.result === 'closed' || r.result === 'deposit'
    ).length;

    const closeRate =
      callsShowed > 0 ? Math.round((salesMade / callsShowed) * 1000) / 10 : 0;
    const showRate =
      callsBooked > 0 ? Math.round((callsShowed / callsBooked) * 1000) / 10 : 0;
    const qualifiedRate =
      callsShowed > 0
        ? Math.round((callsQualified / callsShowed) * 1000) / 10
        : 0;

    const cashCollected = monthRows.reduce(
      (sum, r) => sum + (r.cashCollected ?? 0),
      0
    );
    const revenueGenerated = monthRows.reduce(
      (sum, r) => sum + (r.revenueGenerated ?? 0),
      0
    );
    const cashCollectedPct =
      revenueGenerated > 0
        ? Math.round((cashCollected / revenueGenerated) * 1000) / 10
        : 0;

    return NextResponse.json({
      month: monthParam,
      callsBooked,
      callsShowed,
      callsQualified,
      salesMade,
      closeRate,
      showRate,
      qualifiedRate,
      cashCollected,
      revenueGenerated,
      cashCollectedPct,
    });
  } catch (error) {
    console.error('Error fetching figures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch figures' },
      { status: 500 }
    );
  }
}

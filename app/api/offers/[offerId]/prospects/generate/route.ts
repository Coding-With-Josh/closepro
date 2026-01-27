import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { offers, prospectAvatars, userOrganizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateRandomProspectInBand } from '@/lib/ai/roleplay/prospect-avatar';

/**
 * POST - Auto-generate 4 prospects (Easy/Realistic/Hard/Elite) for an offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get offer
    const offer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, offerId))
      .limit(1);

    if (!offer[0]) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const userOrg = await db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, session.user.id))
      .limit(1);

    const userOrgIds = userOrg.map(uo => uo.organizationId);
    if (!userOrgIds.includes(offer[0].organizationId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if prospects already exist for this offer
    const existingProspects = await db
      .select()
      .from(prospectAvatars)
      .where(eq(prospectAvatars.offerId, offerId))
      .limit(1);

    if (existingProspects.length > 0) {
      return NextResponse.json(
        { error: 'Prospects already exist for this offer' },
        { status: 400 }
      );
    }

    // Generate 4 prospects: Easy, Realistic, Hard, Elite
    const difficulties: Array<'easy' | 'realistic' | 'hard' | 'elite'> = ['easy', 'realistic', 'hard', 'elite'];
    const generatedProspects = [];

    for (const difficulty of difficulties) {
      const prospectProfile = generateRandomProspectInBand(difficulty);
      
      const [newProspect] = await db
        .insert(prospectAvatars)
        .values({
          organizationId: offer[0].organizationId,
          offerId: offerId,
          userId: session.user.id,
          name: `Auto-Generated ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Prospect`,
          sourceType: 'auto_generated',
          positionProblemAlignment: prospectProfile.positionProblemAlignment,
          painAmbitionIntensity: prospectProfile.painAmbitionIntensity,
          perceivedNeedForHelp: prospectProfile.perceivedNeedForHelp,
          authorityLevel: prospectProfile.authorityLevel,
          funnelContext: prospectProfile.funnelContext,
          executionResistance: prospectProfile.executionResistance,
          difficultyIndex: prospectProfile.difficultyIndex,
          difficultyTier: prospectProfile.difficultyTier,
          isTemplate: false,
          isActive: true,
        })
        .returning();

      generatedProspects.push(newProspect);
    }

    return NextResponse.json({
      prospects: generatedProspects,
      message: 'Successfully generated 4 prospects',
    });
  } catch (error: any) {
    console.error('Error generating prospects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prospects' },
      { status: 500 }
    );
  }
}

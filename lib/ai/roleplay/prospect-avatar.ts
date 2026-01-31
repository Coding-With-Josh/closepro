// Layer 2: Prospect Avatar & Difficulty Intelligence (50-Point Model)

export type AuthorityLevel = 'advisee' | 'peer' | 'advisor';
export type DifficultyTier = 'easy' | 'realistic' | 'hard' | 'elite' | 'near_impossible';

export interface ProspectDifficultyProfile {
  // Layer A: Persuasion Difficulty (40 points)
  positionProblemAlignment: number; // 0-10
  painAmbitionIntensity: number; // 0-10
  perceivedNeedForHelp: number; // 0-10
  authorityLevel: AuthorityLevel;
  funnelContext: number; // 0-10
  
  // Layer B: Execution Resistance (10 points)
  executionResistance: number; // 0-10 (ability to proceed: money, time, effort, authority)
  
  // Calculated
  difficultyIndex: number; // 0-50 (Layer A + Layer B)
  difficultyTier: DifficultyTier;
}

export interface ProspectAvatar {
  // Difficulty Profile
  difficulty: ProspectDifficultyProfile;
  
  // Prospect Details
  positionDescription?: string;
  problems?: string[];
  painDrivers?: string[];
  ambitionDrivers?: string[];
  resistanceStyle?: {
    objectionPatterns?: string[];
    tone?: string;
    typicalResponses?: Record<string, string>;
  };
  behaviouralBaseline?: {
    answerDepth?: 'shallow' | 'medium' | 'deep';
    openness?: 'closed' | 'cautious' | 'open';
    responseSpeed?: 'slow' | 'normal' | 'fast';
  };
}

/**
 * Calculate difficulty index from dimensions (50-point model)
 * Layer A (40 points): Persuasion Difficulty
 * Layer B (10 points): Execution Resistance
 */
export function calculateDifficultyIndex(
  positionProblemAlignment: number,
  painAmbitionIntensity: number,
  perceivedNeedForHelp: number,
  authorityLevel: AuthorityLevel,
  funnelContext: number,
  executionResistance: number = 5 // Default to medium ability
): { index: number; tier: DifficultyTier } {
  // Authority level contributes to perceivedNeedForHelp
  let authorityScore = perceivedNeedForHelp;
  if (authorityLevel === 'advisor') {
    authorityScore = Math.max(0, authorityScore - 3); // Advisors have lower perceived need
  } else if (authorityLevel === 'peer') {
    authorityScore = Math.max(0, authorityScore - 1);
  }
  // Advisee keeps full score

  // Calculate Layer A: Persuasion Difficulty (40 points)
  const layerA = Math.round(
    positionProblemAlignment +
    painAmbitionIntensity +
    authorityScore +
    funnelContext
  );

  // Layer B: Execution Resistance (10 points)
  const layerB = Math.max(0, Math.min(10, Math.round(executionResistance)));

  // Total difficulty index (0-50)
  const index = layerA + layerB;

  // Determine tier based on 50-point scale
  let tier: DifficultyTier;
  if (index >= 43) {
    tier = 'easy';
  } else if (index >= 37) {
    tier = 'realistic';
  } else if (index >= 31) {
    tier = 'hard';
  } else if (index >= 25) {
    tier = 'elite';
  } else {
    tier = 'near_impossible';
  }

  return { index, tier };
}

/**
 * Map user-selected difficulty to prospect profile ranges (50-point scale)
 */
export function mapDifficultySelectionToProfile(
  selectedDifficulty: 'easy' | 'realistic' | 'hard' | 'elite' | 'intermediate' | 'expert'
): {
  targetIndexRange: [number, number];
  targetTier: DifficultyTier;
} {
  switch (selectedDifficulty) {
    case 'easy':
      return { targetIndexRange: [43, 50], targetTier: 'easy' };
    case 'realistic':
    case 'intermediate':
      return { targetIndexRange: [37, 43], targetTier: 'realistic' };
    case 'hard':
      return { targetIndexRange: [31, 37], targetTier: 'hard' };
    case 'elite':
    case 'expert':
      return { targetIndexRange: [25, 31], targetTier: 'elite' };
    default:
      return { targetIndexRange: [37, 43], targetTier: 'realistic' };
  }
}

/**
 * Calculate Execution Resistance based on offer requirements and prospect profile
 * Returns score 1-10 where higher = more able to proceed
 * 
 * @param offerPriceRange - Price range string like "5000-25000"
 * @param offerEffortRequired - 'low' | 'medium' | 'high'
 * @param prospectAuthorityLevel - Authority level affects decision-making ability
 * @param prospectPainAmbitionIntensity - Higher motivation = more likely to find resources
 * @returns Execution resistance score (1-10)
 */
export function calculateExecutionResistance(
  offerPriceRange: string,
  offerEffortRequired: 'low' | 'medium' | 'high' = 'medium',
  prospectAuthorityLevel: AuthorityLevel = 'peer',
  prospectPainAmbitionIntensity: number = 5
): number {
  let baseScore = 7; // Start with moderate ability

  // Adjust based on price range
  // Extract numeric range from string like "5000-25000"
  const priceMatch = offerPriceRange.match(/(\d+)/g);
  if (priceMatch && priceMatch.length >= 1) {
    const minPrice = parseInt(priceMatch[0]);
    const maxPrice = priceMatch.length > 1 ? parseInt(priceMatch[1]) : minPrice;
    const avgPrice = (minPrice + maxPrice) / 2;
    
    // Higher price = lower ability score
    if (avgPrice >= 20000) {
      baseScore -= 2; // Very high ticket
    } else if (avgPrice >= 10000) {
      baseScore -= 1; // High ticket
    } else if (avgPrice >= 5000) {
      // Medium ticket, no change
    } else {
      baseScore += 1; // Lower ticket, easier to afford
    }
  }

  // Adjust based on effort required
  switch (offerEffortRequired) {
    case 'high':
      baseScore -= 1.5; // High effort = harder to commit time
      break;
    case 'medium':
      baseScore -= 0.5;
      break;
    case 'low':
      // Low effort, no penalty
      break;
  }

  // Adjust based on authority level (decision-making ability)
  switch (prospectAuthorityLevel) {
    case 'advisor':
      baseScore += 1; // Advisors typically have more resources/authority
      break;
    case 'peer':
      // No change
      break;
    case 'advisee':
      baseScore -= 0.5; // May have less decision authority
      break;
  }

  // Adjust based on motivation (pain/ambition intensity)
  // Higher motivation = more likely to find resources
  if (prospectPainAmbitionIntensity >= 8) {
    baseScore += 1; // High motivation can overcome constraints
  } else if (prospectPainAmbitionIntensity <= 3) {
    baseScore -= 1; // Low motivation = more excuses
  }

  // Clamp to 1-10 range
  return Math.max(1, Math.min(10, Math.round(baseScore)));
}

/**
 * Generate random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Default bio templates per difficulty tier (picked at random for variety) */
const DEFAULT_BIOS: Record<DifficultyTier, string[]> = {
  easy: [
    'Open to change, already sees the value and is leaning yes. Needs a light nudge and clear next step.',
    'Warm lead with clear pain and budget. Ready to move if the fit is right and timeline works.',
    'Has done some research and is interested. Looking for reassurance and a simple path forward.',
  ],
  realistic: [
    'Interested but cautious. Has competing priorities and needs to see ROI before committing.',
    'Sees the problem and is exploring options. Needs clarity on outcomes and a bit of trust-building.',
    'Mid-funnel: aware of the offer, weighing cost vs benefit. Open to a good conversation.',
  ],
  hard: [
    'Skeptical or price-sensitive. Has been burned before or has strong objections to address.',
    'Busy decision-maker with many options. Needs to be convinced of fit and urgency.',
    'Interested in the outcome but resistant on price, timing, or authority. Pushes back on assumptions.',
  ],
  elite: [
    'Expert or advisor-level. Questions the mechanism and wants proof. High bar for credibility.',
    'Very resistant: budget locked, timeline far out, or decision by committee. Hard close.',
    'Sophisticated buyer with strong objections and alternatives. Needs exceptional handling.',
  ],
  near_impossible: [
    'Extremely resistant: wrong timing, no budget, or no authority. Would require exceptional persuasion.',
    'Hostile or disengaged. Multiple blockers and low perceived need. Very difficult to convert.',
  ],
};

/**
 * Return a short default bio (position description) for a difficulty tier.
 * Picks randomly from templates so generated prospects feel varied.
 */
export function getDefaultBioForDifficulty(
  tier: DifficultyTier | 'realistic' | 'hard' | 'elite' | 'easy'
): string {
  const key = tier as DifficultyTier;
  const options = DEFAULT_BIOS[key] ?? DEFAULT_BIOS.realistic;
  return options[randomInt(0, options.length - 1)];
}

/**
 * Generate a random prospect within a difficulty band (50-point model)
 * Ensures total difficulty score falls within selected range
 */
export function generateRandomProspectInBand(
  selectedDifficulty: 'easy' | 'realistic' | 'hard' | 'elite' | 'intermediate' | 'expert'
): {
  positionProblemAlignment: number;
  painAmbitionIntensity: number;
  perceivedNeedForHelp: number;
  authorityLevel: AuthorityLevel;
  funnelContext: number;
  executionResistance: number;
  difficultyIndex: number;
  difficultyTier: DifficultyTier;
} {
  const { targetIndexRange, targetTier } = mapDifficultySelectionToProfile(selectedDifficulty);
  const [minTotal, maxTotal] = targetIndexRange;

  // Generate random scores that sum to within the target range (50-point scale)
  let positionProblemAlignment: number;
  let painAmbitionIntensity: number;
  let perceivedNeedForHelp: number;
  let authorityLevel: AuthorityLevel;
  let funnelContext: number;
  let executionResistance: number;
  let total: number;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Generate random scores for each dimension (1-10)
    positionProblemAlignment = randomInt(1, 10);
    painAmbitionIntensity = randomInt(1, 10);
    perceivedNeedForHelp = randomInt(1, 10);
    funnelContext = randomInt(1, 10);
    executionResistance = randomInt(1, 10);

    // Determine authority level based on perceivedNeedForHelp
    if (perceivedNeedForHelp >= 8) {
      authorityLevel = 'advisee';
    } else if (perceivedNeedForHelp >= 4) {
      authorityLevel = 'peer';
    } else {
      authorityLevel = 'advisor';
    }

    // Calculate Layer A (accounting for authority adjustment)
    let authorityScore = perceivedNeedForHelp;
    if (authorityLevel === 'advisor') {
      authorityScore = Math.max(0, authorityScore - 3);
    } else if (authorityLevel === 'peer') {
      authorityScore = Math.max(0, authorityScore - 1);
    }

    const layerA = positionProblemAlignment + painAmbitionIntensity + authorityScore + funnelContext;
    const layerB = executionResistance;
    total = layerA + layerB;
    attempts++;
  } while ((total < minTotal || total > maxTotal) && attempts < maxAttempts);

  // If still not in range after max attempts, adjust to fit
  if (total < minTotal || total > maxTotal) {
    const targetMid = Math.round((minTotal + maxTotal) / 2);
    const currentLayerA = positionProblemAlignment + painAmbitionIntensity + 
      (authorityLevel === 'advisor' ? Math.max(0, perceivedNeedForHelp - 3) : 
       authorityLevel === 'peer' ? Math.max(0, perceivedNeedForHelp - 1) : perceivedNeedForHelp) + 
      funnelContext;
    
    // Adjust execution resistance to hit target
    const neededLayerB = targetMid - currentLayerA;
    executionResistance = Math.max(1, Math.min(10, neededLayerB));
    
    // Recalculate total
    let authorityScore = perceivedNeedForHelp;
    if (authorityLevel === 'advisor') {
      authorityScore = Math.max(0, authorityScore - 3);
    } else if (authorityLevel === 'peer') {
      authorityScore = Math.max(0, authorityScore - 1);
    }
    const layerA = positionProblemAlignment + painAmbitionIntensity + authorityScore + funnelContext;
    total = layerA + executionResistance;
  }

  const { index, tier } = calculateDifficultyIndex(
    positionProblemAlignment,
    painAmbitionIntensity,
    perceivedNeedForHelp,
    authorityLevel,
    funnelContext,
    executionResistance
  );

  return {
    positionProblemAlignment,
    painAmbitionIntensity,
    perceivedNeedForHelp,
    authorityLevel,
    funnelContext,
    executionResistance,
    difficultyIndex: index,
    difficultyTier: tier,
  };
}

/**
 * Generate prospect behaviour profile based on difficulty
 */
export function generateBehaviourProfile(
  difficulty: ProspectDifficultyProfile
): {
  objectionFrequency: 'low' | 'medium' | 'high';
  objectionIntensity: 'low' | 'medium' | 'high';
  answerDepth: 'shallow' | 'medium' | 'deep';
  openness: 'closed' | 'cautious' | 'open';
  willingnessToBeChallenged: 'low' | 'medium' | 'high';
  responseSpeed: 'slow' | 'normal' | 'fast';
} {
  const { difficultyTier, authorityLevel } = difficulty;

  switch (difficultyTier) {
    case 'easy':
      return {
        objectionFrequency: 'low',
        objectionIntensity: 'low',
        answerDepth: 'deep',
        openness: 'open',
        willingnessToBeChallenged: 'high',
        responseSpeed: 'fast',
      };

    case 'realistic':
      return {
        objectionFrequency: 'medium',
        objectionIntensity: 'medium',
        answerDepth: 'medium',
        openness: 'cautious',
        willingnessToBeChallenged: 'medium',
        responseSpeed: 'normal',
      };

    case 'hard':
      return {
        objectionFrequency: 'high',
        objectionIntensity: 'medium',
        answerDepth: 'shallow',
        openness: 'cautious',
        willingnessToBeChallenged: 'low',
        responseSpeed: 'slow',
      };

    case 'elite':
      return {
        objectionFrequency: 'medium',
        objectionIntensity: 'high',
        answerDepth: 'shallow',
        openness: 'closed',
        willingnessToBeChallenged: authorityLevel === 'advisor' ? 'low' : 'medium',
        responseSpeed: 'normal',
      };

    case 'near_impossible':
      return {
        objectionFrequency: 'high',
        objectionIntensity: 'high',
        answerDepth: 'shallow',
        openness: 'closed',
        willingnessToBeChallenged: 'low',
        responseSpeed: 'slow',
      };

    default:
      return {
        objectionFrequency: 'medium',
        objectionIntensity: 'medium',
        answerDepth: 'medium',
        openness: 'cautious',
        willingnessToBeChallenged: 'medium',
        responseSpeed: 'normal',
      };
  }
}

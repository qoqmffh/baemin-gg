import type { Member, SeedTier } from '../types';

export const BASE_POINTS = 20;

/** Canonical starting rating for each founding-member seed tier. */
export const SEED_RATING: Record<SeedTier, number> = { A: 1300, B: 1200, C: 1100 };

/** Higher number = stronger tier, used to compute the tier gap between two sides. */
const TIER_RANK: Record<SeedTier, number> = { A: 3, B: 2, C: 1 };

/** Rating bands a non-founding member's tier is derived from (midpoints of 1300/1200/1100). */
export function tierFromRating(rating: number): SeedTier {
  if (rating >= 1250) return 'A';
  if (rating >= 1150) return 'B';
  return 'C';
}

type TieredMember = Pick<Member, 'rating' | 'seedTier'>;

/**
 * A founding member's seedTier is permanent and used directly for singles.
 * For doubles, the two teammates' current ratings are averaged first (per
 * club rule) and that average is banded into a tier, ignoring seedTier.
 */
export function resolveTeamTier(team: TieredMember[]): SeedTier {
  if (team.length === 1) {
    return team[0].seedTier ?? tierFromRating(team[0].rating);
  }
  const avgRating = team.reduce((sum, m) => sum + m.rating, 0) / team.length;
  return tierFromRating(avgRating);
}

function multiplierForOpponentTier(opponentTier: SeedTier, selfTier: SeedTier): number {
  const gap = TIER_RANK[opponentTier] - TIER_RANK[selfTier];
  if (gap >= 2) return 1.5;
  if (gap === 1) return 1.25;
  if (gap === 0) return 1;
  if (gap === -1) return 0.75;
  return 0.5;
}

export function calculateMatchRatingChanges(
  teamA: TieredMember[],
  teamB: TieredMember[],
  winner: 'A' | 'B'
): { teamADelta: number; teamBDelta: number } {
  const tierA = resolveTeamTier(teamA);
  const tierB = resolveTeamTier(teamB);
  const winnerTier = winner === 'A' ? tierA : tierB;
  const loserTier = winner === 'A' ? tierB : tierA;

  const points = Math.round(BASE_POINTS * multiplierForOpponentTier(loserTier, winnerTier));
  const teamADelta = winner === 'A' ? points : -points;
  const teamBDelta = winner === 'A' ? -points : points;
  return { teamADelta, teamBDelta };
}

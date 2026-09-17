export type SeedTier = 'A' | 'B' | 'C';

export interface Member {
  id: string;
  name: string;
  department: string;
  position: string;
  rating: number;
  wins: number;
  losses: number;
  createdAt: string;
  /** Set once, by an admin, for one of the club's founding members — permanently
   * overrides the rating-based tier lookup used for rating-change multipliers. */
  seedTier?: SeedTier;
}

export type MatchType = 'singles' | 'doubles';

export interface Match {
  id: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B';
  ratingChanges: Record<string, number>;
  playedAt: string;
  recordedAt: string;
}

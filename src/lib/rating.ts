export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function eloDelta(
  ratingA: number,
  ratingB: number,
  actualScoreA: 0 | 0.5 | 1,
  kFactor = 32
): number {
  const expected = expectedScore(ratingA, ratingB);
  return Math.round(kFactor * (actualScoreA - expected));
}

export function calculateMatchRatingChanges(
  teamARatings: number[],
  teamBRatings: number[],
  winner: 'A' | 'B'
): { teamADelta: number; teamBDelta: number } {
  const avg = (ratings: number[]) => ratings.reduce((s, r) => s + r, 0) / ratings.length;
  const avgA = avg(teamARatings);
  const avgB = avg(teamBRatings);
  const actualScoreA = winner === 'A' ? 1 : 0;
  const teamADelta = eloDelta(avgA, avgB, actualScoreA);
  const teamBDelta = -teamADelta;
  return { teamADelta, teamBDelta };
}

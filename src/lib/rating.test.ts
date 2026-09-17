import { expect, test } from 'vitest';
import { tierFromRating, resolveTeamTier, calculateMatchRatingChanges, SEED_RATING } from './rating';

test('tierFromRating bands ratings into A/B/C using the 1250/1150 midpoints', () => {
  expect(tierFromRating(1300)).toBe('A');
  expect(tierFromRating(1250)).toBe('A');
  expect(tierFromRating(1249)).toBe('B');
  expect(tierFromRating(1150)).toBe('B');
  expect(tierFromRating(1149)).toBe('C');
  expect(tierFromRating(900)).toBe('C');
});

test('resolveTeamTier uses a singles player\'s permanent seedTier over their current rating', () => {
  expect(resolveTeamTier([{ rating: 900, seedTier: 'A' }])).toBe('A');
});

test('resolveTeamTier falls back to the rating band when no seedTier is set', () => {
  expect(resolveTeamTier([{ rating: 1100 }])).toBe('C');
});

test('resolveTeamTier for doubles averages current rating and ignores seedTier', () => {
  // avg(1300, 1100) = 1200 -> band B, even though one player has a fixed 'A' seedTier
  expect(resolveTeamTier([{ rating: 1300, seedTier: 'A' }, { rating: 1100 }])).toBe('B');
});

test('a lower-tier winner beating a 2+ tier higher opponent gets the 1.5x bonus', () => {
  // 5시드(C, 1100) beats 1시드(A, seedTier fixed) -> +/- 20*1.5 = 30
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
    [{ rating: 1100 }],
    [{ rating: 1300, seedTier: 'A' }],
    'A'
  );
  expect(teamADelta).toBe(30);
  expect(teamBDelta).toBe(-30);
});

test('a higher-tier winner beating a 2+ tier lower opponent only gets the 0.5x consolation', () => {
  // 1시드(A) beats 5시드(C) -> +/- 20*0.5 = 10
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
    [{ rating: 1300, seedTier: 'A' }],
    [{ rating: 1100 }],
    'A'
  );
  expect(teamADelta).toBe(10);
  expect(teamBDelta).toBe(-10);
});

test('equal-tier match uses the 1x base multiplier', () => {
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
    [{ rating: 1200 }],
    [{ rating: 1180 }],
    'A'
  );
  expect(teamADelta).toBe(20);
  expect(teamBDelta).toBe(-20);
});

test('one tier apart uses the 1.25x / 0.75x multipliers depending on direction', () => {
  const lowerBeatsHigher = calculateMatchRatingChanges(
    [{ rating: 1200 }], // B
    [{ rating: 1300, seedTier: 'A' }], // A
    'A'
  );
  expect(lowerBeatsHigher.teamADelta).toBe(25); // 20 * 1.25

  const higherBeatsLower = calculateMatchRatingChanges(
    [{ rating: 1300, seedTier: 'A' }],
    [{ rating: 1200 }],
    'A'
  );
  expect(higherBeatsLower.teamADelta).toBe(15); // 20 * 0.75
});

test('exposes the canonical seed ratings for the admin seed-assignment UI', () => {
  expect(SEED_RATING).toEqual({ A: 1300, B: 1200, C: 1100 });
});

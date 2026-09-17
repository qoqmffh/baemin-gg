import { expect, test } from 'vitest';
import { expectedScore, eloDelta, calculateMatchRatingChanges } from './rating';

test('expectedScore is 0.5 for equal ratings', () => {
  expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 5);
});

test('expectedScore favors the higher-rated player', () => {
  expect(expectedScore(1400, 1200)).toBeGreaterThan(0.5);
  expect(expectedScore(1200, 1400)).toBeLessThan(0.5);
});

test('eloDelta is positive for a win against an equal opponent', () => {
  expect(eloDelta(1200, 1200, 1)).toBe(16); // 32 * (1 - 0.5)
});

test('eloDelta is negative for a loss against an equal opponent', () => {
  expect(eloDelta(1200, 1200, 0)).toBe(-16);
});

test('singles match: winner gains what loser loses', () => {
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges([1200], [1200], 'A');
  expect(teamADelta).toBe(16);
  expect(teamBDelta).toBe(-16);
});

test('doubles match: delta is based on team average rating and applied evenly', () => {
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges([1200, 1200], [1200, 1200], 'B');
  expect(teamADelta).toBe(-16);
  expect(teamBDelta).toBe(16);
});

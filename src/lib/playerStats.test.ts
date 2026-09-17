import { expect, test } from 'vitest';
import { computePlayerStats } from './playerStats';
import type { Match } from '../types';

const P = 'p1';
const OPP1 = 'o1';
const OPP2 = 'o2';
const PARTNER = 'partner';

function match(overrides: Partial<Match>): Match {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'singles',
    teamA: [P],
    teamB: [OPP1],
    scoreA: 21,
    scoreB: 15,
    winner: 'A',
    ratingChanges: {},
    playedAt: '2026-01-01T00:00:00.000Z',
    recordedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('empty match history gives all-zero stats', () => {
  const stats = computePlayerStats(P, []);
  expect(stats).toMatchObject({ totalGames: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, recent: [] });
});

test('counts total games, wins, losses, and win rate', () => {
  const matches: Match[] = [
    match({ id: 'g1', winner: 'A', playedAt: '2026-01-01' }), // win
    match({ id: 'g2', winner: 'B', playedAt: '2026-01-02' }), // loss
    match({ id: 'g3', winner: 'A', playedAt: '2026-01-03' }), // win
  ];
  const stats = computePlayerStats(P, matches);
  expect(stats.totalGames).toBe(3);
  expect(stats.wins).toBe(2);
  expect(stats.losses).toBe(1);
  expect(stats.winRate).toBeCloseTo(66.7, 1);
});

test('current streak counts consecutive wins ending at the most recent match', () => {
  const matches: Match[] = [
    match({ id: 'g1', winner: 'B', playedAt: '2026-01-01' }), // loss
    match({ id: 'g2', winner: 'A', playedAt: '2026-01-02' }), // win
    match({ id: 'g3', winner: 'A', playedAt: '2026-01-03' }), // win
  ];
  expect(computePlayerStats(P, matches).currentStreak).toBe(2);
});

test('current streak is 0 when the most recent match was a loss', () => {
  const matches: Match[] = [
    match({ id: 'g1', winner: 'A', playedAt: '2026-01-01' }),
    match({ id: 'g2', winner: 'B', playedAt: '2026-01-02' }),
  ];
  expect(computePlayerStats(P, matches).currentStreak).toBe(0);
});

test('recent returns at most the last 10 matches, oldest to newest', () => {
  const matches: Match[] = Array.from({ length: 12 }, (_, i) =>
    match({ id: `g${i}`, playedAt: `2026-01-${String(i + 1).padStart(2, '0')}`, winner: i % 2 === 0 ? 'A' : 'B' })
  );
  const { recent } = computePlayerStats(P, matches);
  expect(recent).toHaveLength(10);
  expect(recent[0].matchId).toBe('g2'); // the oldest 2 (g0, g1) are dropped
  expect(recent[9].matchId).toBe('g11');
  expect(recent[0].result).toBe('win'); // g2 index even -> winner A
});

test('breaks down games by type (singles/doubles) with per-type win rate', () => {
  const matches: Match[] = [
    match({ id: 'g1', type: 'singles', winner: 'A' }),
    match({ id: 'g2', type: 'singles', winner: 'B' }),
    match({ id: 'g3', type: 'doubles', teamA: [P, PARTNER], teamB: [OPP1, OPP2], winner: 'A' }),
  ];
  const { byType } = computePlayerStats(P, matches);
  expect(byType.singles).toMatchObject({ games: 2, wins: 1, losses: 1, winRate: 50 });
  expect(byType.doubles).toMatchObject({ games: 1, wins: 1, losses: 0, winRate: 100 });
});

test('ranks top opponents by number of games played against them', () => {
  const matches: Match[] = [
    match({ id: 'g1', teamB: [OPP1], winner: 'A' }),
    match({ id: 'g2', teamB: [OPP1], winner: 'B' }),
    match({ id: 'g3', teamB: [OPP2], winner: 'A' }),
  ];
  const { topOpponents } = computePlayerStats(P, matches);
  expect(topOpponents[0]).toMatchObject({ opponentId: OPP1, games: 2, wins: 1, losses: 1, winRate: 50 });
  expect(topOpponents[1]).toMatchObject({ opponentId: OPP2, games: 1, wins: 1, losses: 0, winRate: 100 });
});

test('groups games played per month', () => {
  const matches: Match[] = [
    match({ id: 'g1', playedAt: '2026-01-05T00:00:00.000Z' }),
    match({ id: 'g2', playedAt: '2026-01-20T00:00:00.000Z' }),
    match({ id: 'g3', playedAt: '2026-02-01T00:00:00.000Z' }),
  ];
  const { monthly } = computePlayerStats(P, matches);
  expect(monthly).toEqual([
    { month: '2026-01', games: 2 },
    { month: '2026-02', games: 1 },
  ]);
});

test('ignores matches the player was not part of', () => {
  const matches: Match[] = [match({ id: 'g1', teamA: [OPP1], teamB: [OPP2] })];
  expect(computePlayerStats(P, matches).totalGames).toBe(0);
});

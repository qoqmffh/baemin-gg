import { expect, test } from 'vitest';
import {
  searchMembers,
  recentMatchesFor,
  sortByRatingDesc,
  recentMatches,
  biggestUpsets,
} from './members';
import type { Member, Match } from '../types';

const members: Member[] = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1100, wins: 1, losses: 3, createdAt: '2026-01-02' },
  { id: 'm3', name: '김민수', department: '개발', position: '과장', rating: 1500, wins: 5, losses: 0, createdAt: '2026-01-03' },
];

const matches: Match[] = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
  { id: 'g2', type: 'singles', teamA: ['m2'], teamB: ['m3'], scoreA: 21, scoreB: 10, winner: 'A', ratingChanges: {}, playedAt: '2026-01-15', recordedAt: '2026-01-15' },
];

test('searchMembers matches by partial, case-insensitive name', () => {
  expect(searchMembers(members, '김')).toEqual([members[0], members[2]]);
  expect(searchMembers(members, '')).toEqual([]);
});

test('recentMatchesFor returns matches involving the member, newest first', () => {
  const result = recentMatchesFor(matches, 'm2');
  expect(result.map((m) => m.id)).toEqual(['g2', 'g1']);
});

test('sortByRatingDesc orders members by rating descending without mutating input', () => {
  const sorted = sortByRatingDesc(members);
  expect(sorted.map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  expect(members[0].id).toBe('m1');
});

test('recentMatches returns matches newest first, limited', () => {
  const result = recentMatches(matches, 1);
  expect(result.map((m) => m.id)).toEqual(['g2']);
});

test('biggestUpsets ranks matches by rating gap between winner and loser, largest first', () => {
  const result = biggestUpsets(matches, members, 1);
  // g2: winner m2 (1100) beat loser m3 (1500) -> gap 400
  // g1: winner m1 (1300) beat loser m2 (1100) -> gap -200 (not an upset)
  expect(result.map((m) => m.id)).toEqual(['g2']);
});

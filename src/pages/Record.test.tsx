import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import Record from './Record';
import * as github from '../lib/github';
import type { Member } from '../types';

const members: Member[] = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1200, wins: 0, losses: 0, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1200, wins: 0, losses: 0, createdAt: '2026-01-02' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify(members), { status: 200 }));
});

test('recording a singles match updates matches.json and both members ratings', async () => {
  const calls: { path: string; updater: (c: unknown) => unknown }[] = [];
  vi.spyOn(github, 'updateJsonFile').mockImplementation(async (path, _msg, updater) => {
    calls.push({ path, updater: updater as (c: unknown) => unknown });
  });

  render(<Record />);
  const user = userEvent.setup();

  await user.selectOptions(await screen.findByLabelText('팀 A 선수 1'), 'm1');
  await user.selectOptions(screen.getByLabelText('팀 B 선수 1'), 'm2');
  await user.type(screen.getByLabelText('팀 A 점수'), '21');
  await user.type(screen.getByLabelText('팀 B 점수'), '15');
  await user.click(screen.getByRole('button', { name: '경기 등록' }));

  expect(calls.map((c) => c.path)).toEqual(
    expect.arrayContaining(['data/matches.json', 'data/members.json'])
  );

  const matchesUpdate = calls.find((c) => c.path === 'data/matches.json')!;
  const newMatches = matchesUpdate.updater([]) as { teamA: string[]; teamB: string[]; winner: string }[];
  expect(newMatches).toHaveLength(1);
  expect(newMatches[0]).toMatchObject({ teamA: ['m1'], teamB: ['m2'], winner: 'A', scoreA: 21, scoreB: 15 });

  const membersUpdate = calls.find((c) => c.path === 'data/members.json')!;
  const updatedMembers = membersUpdate.updater(members) as Member[];
  const winner = updatedMembers.find((m) => m.id === 'm1')!;
  const loser = updatedMembers.find((m) => m.id === 'm2')!;
  expect(winner.rating).toBeGreaterThan(1200);
  expect(loser.rating).toBeLessThan(1200);
  expect(winner.wins).toBe(1);
  expect(loser.losses).toBe(1);
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import Admin from './Admin';
import * as github from '../lib/github';
import * as config from '../config';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
];
const matches = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(config, 'ADMIN_PASSWORD', 'get').mockReturnValue('secret123');
  vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('members.json')) return new Response(JSON.stringify(members), { status: 200 });
    return new Response(JSON.stringify(matches), { status: 200 });
  });
});

test('hides delete controls until the correct password is entered', async () => {
  render(<Admin />);
  expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();

  const user = userEvent.setup();
  await user.type(screen.getByLabelText('관리자 비밀번호'), 'wrong');
  await user.click(screen.getByRole('button', { name: '입장' }));
  expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();
});

test('deleting a member calls updateJsonFile with that member removed', async () => {
  const updateSpy = vi.spyOn(github, 'updateJsonFile').mockResolvedValue(undefined);

  render(<Admin />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('관리자 비밀번호'), 'secret123');
  await user.click(screen.getByRole('button', { name: '입장' }));

  await user.click(await screen.findByRole('button', { name: '회원 삭제: 김태준' }));

  const call = updateSpy.mock.calls.find((c) => c[0] === 'data/members.json')!;
  const updater = call[2] as (current: typeof members) => typeof members;
  expect(updater(members)).toEqual([]);
});

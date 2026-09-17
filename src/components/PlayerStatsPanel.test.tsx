import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import PlayerStatsPanel from './PlayerStatsPanel';
import type { Member, Match } from '../types';

const members: Member[] = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 2, losses: 1, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1200, wins: 1, losses: 2, createdAt: '2026-01-02' },
];

const matches: Match[] = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-05T00:00:00.000Z', recordedAt: '2026-01-05T00:00:00.000Z' },
  { id: 'g2', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 10, scoreB: 21, winner: 'B', ratingChanges: {}, playedAt: '2026-01-10T00:00:00.000Z', recordedAt: '2026-01-10T00:00:00.000Z' },
];

test('shows the not-found prompt with a search box when no player is selected', () => {
  render(
    <PlayerStatsPanel members={members} matches={matches} selectedPlayerId={null} onSelectPlayer={vi.fn()} onClear={vi.fn()} />
  );
  expect(screen.getByText('플레이어를 찾지 못했습니다. 플레이어를 검색해주세요.')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('선수 이름을 검색해보세요')).toBeInTheDocument();
});

test('searching and selecting a result calls onSelectPlayer with that member id', async () => {
  const onSelectPlayer = vi.fn();
  render(
    <PlayerStatsPanel members={members} matches={matches} selectedPlayerId={null} onSelectPlayer={onSelectPlayer} onClear={vi.fn()} />
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('선수 이름을 검색해보세요'), '김태준');
  await user.click(screen.getByRole('button', { name: '김태준' }));
  expect(onSelectPlayer).toHaveBeenCalledWith('m1');
});

test('renders the full stats dashboard for a selected player', () => {
  render(
    <PlayerStatsPanel members={members} matches={matches} selectedPlayerId="m1" onSelectPlayer={vi.fn()} onClear={vi.fn()} />
  );
  expect(screen.getByRole('heading', { name: '김태준' })).toBeInTheDocument();
  // 2 games total, 1 win, 1 loss
  expect(screen.getByText('총 경기수').closest('.stat-card')).toHaveTextContent('2');
  expect(screen.getByText('승리').closest('.stat-card')).toHaveTextContent('1');
  expect(screen.getByText('패배').closest('.stat-card')).toHaveTextContent('1');
  expect(screen.getByText(/^단식/).closest('.type-bar')).toHaveTextContent('50%');
  expect(screen.getByText('박서연')).toBeInTheDocument(); // top opponent row
});

test('clicking "다른 선수 검색" calls onClear', async () => {
  const onClear = vi.fn();
  render(
    <PlayerStatsPanel members={members} matches={matches} selectedPlayerId="m1" onSelectPlayer={vi.fn()} onClear={onClear} />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '다른 선수 검색' }));
  expect(onClear).toHaveBeenCalledTimes(1);
});

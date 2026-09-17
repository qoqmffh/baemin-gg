import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import Rankings from './Rankings';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1500, wins: 5, losses: 0, createdAt: '2026-01-02' },
];
const matches = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
];

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
    if (String(url).includes('members.json')) return new Response(JSON.stringify(members), { status: 200 });
    return new Response(JSON.stringify(matches), { status: 200 });
  });
});

test('renders members sorted by rating descending on the default 랭킹 tab', async () => {
  render(
    <MemoryRouter>
      <Rankings />
    </MemoryRouter>
  );
  const rows = await screen.findAllByTestId('ranking-row');
  expect(rows.map((r) => r.textContent)).toEqual([
    expect.stringContaining('박서연'),
    expect.stringContaining('김태준'),
  ]);
});

test('switching to the 최근 경기 tab shows recent matches with the winner marked', async () => {
  render(
    <MemoryRouter>
      <Rankings />
    </MemoryRouter>
  );
  await screen.findAllByTestId('ranking-row');
  const user = userEvent.setup();
  await user.click(screen.getByText('최근 경기'));

  // teamA (김태준) won, so they must appear before "승" and before the loser (박서연)
  expect(await screen.findByText(/김태준 승 vs 박서연/)).toBeInTheDocument();
});

test('includes the shared TopNav header', () => {
  render(
    <MemoryRouter>
      <Rankings />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: '배민.GG' })).toHaveAttribute('href', '/');
});

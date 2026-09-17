import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import Home from './Home';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
];

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
    if (String(url).includes('members.json')) {
      return new Response(JSON.stringify(members), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
});

test('renders the 배민.GG header and English menu labels', () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '배민.GG' })).toBeInTheDocument();
  for (const label of ['FIND PLAYER', 'MATCH RECORD', 'LEADERBOARD', 'CLUB INFO', 'SIGN UP']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('clicking FIND PLAYER reveals a search box that shows a matching member\'s record and rank', async () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.click(screen.getByText('FIND PLAYER'));
  const input = await screen.findByPlaceholderText('선수 이름을 검색해보세요');
  await user.type(input, '김태준');

  await waitFor(() => {
    expect(screen.getByText('1위 · 1300점')).toBeInTheDocument();
  });
  expect(screen.getByText('3승 1패')).toBeInTheDocument();
});

test('shows a not-found message when no member matches the query', async () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.click(screen.getByText('FIND PLAYER'));
  const input = await screen.findByPlaceholderText('선수 이름을 검색해보세요');
  await user.type(input, '없는사람');

  await waitFor(() => {
    expect(screen.getByText("'없는사람'님을 찾을 수 없습니다.")).toBeInTheDocument();
  });
});

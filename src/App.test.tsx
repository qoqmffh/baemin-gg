import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
});

test('renders Home at the root route with no PAT stored (read-only pages need no token)', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '배민.GG' })).toBeInTheDocument();
});

test('renders Club at /club with no PAT stored', () => {
  render(
    <MemoryRouter initialEntries={['/club']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '클럽정보' })).toBeInTheDocument();
});

test('renders LEADERBOARD at /rankings with no PAT stored', () => {
  render(
    <MemoryRouter initialEntries={['/rankings']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: '배민.GG' })).toBeInTheDocument();
});

test('Signup at /signup shows the PAT gate (not the form) when no token is stored', () => {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '회원가입' })).not.toBeInTheDocument();
});

test('Signup at /signup shows the real form once a PAT is stored', () => {
  localStorage.setItem('baemin-gg-pat', 'ghp_test');
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
});

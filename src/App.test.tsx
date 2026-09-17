import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.setItem('baemin-gg-pat', 'ghp_test');
  vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
});

test('renders Home at the root route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '배민.GG' })).toBeInTheDocument();
});

test('renders Signup at /signup', () => {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
});

test('renders Club at /club', () => {
  render(
    <MemoryRouter initialEntries={['/club']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: '클럽정보' })).toBeInTheDocument();
});

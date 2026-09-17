import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import TopNav from './TopNav';

test('renders the logo and all 5 menu links, marking the current page active', () => {
  render(
    <MemoryRouter initialEntries={['/rankings']}>
      <TopNav />
    </MemoryRouter>
  );
  expect(screen.getByText('배민.GG')).toBeInTheDocument();
  for (const label of ['FIND PLAYER', 'MATCH RECORD', 'LEADERBOARD', 'CLUB INFO', 'SIGN UP']) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
  expect(screen.getByText('LEADERBOARD')).toHaveClass('top-nav__link--active');
  expect(screen.getByText('MATCH RECORD')).not.toHaveClass('top-nav__link--active');
});

test('logo links to home', () => {
  render(
    <MemoryRouter initialEntries={['/rankings']}>
      <TopNav />
    </MemoryRouter>
  );
  expect(screen.getByText('배민.GG').closest('a')).toHaveAttribute('href', '/');
});

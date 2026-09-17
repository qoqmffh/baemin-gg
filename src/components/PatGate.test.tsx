import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import PatGate from './PatGate';
import { getPat } from '../lib/pat';

beforeEach(() => {
  localStorage.clear();
});

test('shows the token form when no PAT is stored, and hides the children', () => {
  render(
    <PatGate>
      <div>protected content</div>
    </PatGate>
  );
  expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
});

test('submitting a token stores it and reveals the children', async () => {
  render(
    <PatGate>
      <div>protected content</div>
    </PatGate>
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('ghp_...'), 'ghp_mytoken');
  await user.click(screen.getByRole('button', { name: '저장' }));

  expect(getPat()).toBe('ghp_mytoken');
  expect(screen.getByText('protected content')).toBeInTheDocument();
});

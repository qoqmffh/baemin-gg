import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Club from './Club';

test('renders club info placeholder content', () => {
  render(<Club />);
  expect(screen.getByRole('heading', { name: '클럽정보' })).toBeInTheDocument();
});

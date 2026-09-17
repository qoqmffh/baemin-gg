import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import HoverImageReveal from './HoverImageReveal';

const items = {
  itemCount: 2,
  item1: { text: 'FIND PLAYER' },
  item2: { text: 'MATCH RECORD' },
};

test('renders each item label', () => {
  render(<HoverImageReveal items={items} />);
  expect(screen.getAllByText('FIND PLAYER').length).toBeGreaterThan(0);
  expect(screen.getAllByText('MATCH RECORD').length).toBeGreaterThan(0);
});

test('clicking an item (tap or mouse) calls its onClick handler', async () => {
  const onClick = vi.fn();
  const withHandler = {
    itemCount: 2,
    item1: { text: 'FIND PLAYER', onClick },
    item2: { text: 'MATCH RECORD' },
  };
  render(<HoverImageReveal items={withHandler} />);
  const user = userEvent.setup();
  await user.click(screen.getAllByText('FIND PLAYER')[0]);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('hovering an item highlights it (dims the others) via inline color style', async () => {
  render(
    <HoverImageReveal items={items} textColor="#FFFFFF" dimColor="#51565A" />
  );
  const user = userEvent.setup();
  const first = screen.getAllByText('FIND PLAYER')[0];
  const second = screen.getAllByText('MATCH RECORD')[0];
  await user.hover(first);
  expect(first).toHaveStyle({ color: '#FFFFFF' });
  expect(second).toHaveStyle({ color: '#51565A' });
});

test('renders a previewText caption over the preview image, independent of the single-line menu label', () => {
  const withPreviewText = {
    itemCount: 1,
    item1: { text: 'LEADERBOARD', previewText: 'LEADER\nBOARD' },
  };
  render(<HoverImageReveal items={withPreviewText} />);
  expect(screen.getAllByText('LEADERBOARD').length).toBeGreaterThan(0);
  expect(screen.getByTestId('preview-caption').textContent).toBe('LEADER\nBOARD');
});

test('dimAll dims every item even when none of them is hovered', () => {
  render(<HoverImageReveal items={items} textColor="#FFFFFF" dimColor="#51565A" dimAll />);
  const first = screen.getAllByText('FIND PLAYER')[0];
  const second = screen.getAllByText('MATCH RECORD')[0];
  expect(first).toHaveStyle({ color: '#51565A' });
  expect(second).toHaveStyle({ color: '#51565A' });
});

test('falls back to the gradient placeholder (no broken-image alt text) when the preview image fails to load', () => {
  const withBrokenImage = {
    itemCount: 1,
    item1: { text: 'LEADERBOARD', image: { src: 'image/3.jpg', alt: 'LEADERBOARD' } },
  };
  render(<HoverImageReveal items={withBrokenImage} />);
  const img = screen.getByRole('img', { name: 'LEADERBOARD' });
  fireEvent.error(img);
  expect(screen.queryByRole('img', { name: 'LEADERBOARD' })).not.toBeInTheDocument();
});

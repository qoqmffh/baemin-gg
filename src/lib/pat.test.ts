import { beforeEach, expect, test } from 'vitest';
import { getPat, setPat, clearPat } from './pat';

beforeEach(() => {
  localStorage.clear();
});

test('returns null when no token stored', () => {
  expect(getPat()).toBeNull();
});

test('stores and retrieves a token', () => {
  setPat('ghp_abc123');
  expect(getPat()).toBe('ghp_abc123');
});

test('clears a stored token', () => {
  setPat('ghp_abc123');
  clearPat();
  expect(getPat()).toBeNull();
});

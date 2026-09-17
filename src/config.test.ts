import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH, INITIAL_RATING, ADMIN_PASSWORD } from './config';

test('config exposes the constants the rest of the app depends on', () => {
  expect(typeof GITHUB_OWNER).toBe('string');
  expect(typeof GITHUB_REPO).toBe('string');
  expect(MEMBERS_PATH).toBe('data/members.json');
  expect(MATCHES_PATH).toBe('data/matches.json');
  expect(INITIAL_RATING).toBe(1100);
  expect(typeof ADMIN_PASSWORD).toBe('string');
  expect(ADMIN_PASSWORD.length).toBeGreaterThan(0);
});

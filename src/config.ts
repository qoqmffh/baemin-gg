// Repo that hosts both this app and its JSON data files.
// Update these two once the GitHub repo is created.
export const GITHUB_OWNER = 'qoqmffh';
export const GITHUB_REPO = 'baemin-gg';

export const MEMBERS_PATH = 'data/members.json';
export const MATCHES_PATH = 'data/matches.json';

// New (non-founding) members start at the "6시드" baseline — the same
// rating as the lowest founding seed tier (C).
export const INITIAL_RATING = 1100;

// Frontend-only gate for the hidden admin screen. Not real security —
// the repo is public, so treat this as a convenience lock, not a secret.
export const ADMIN_PASSWORD: string = 'iIkbeW63jIP5';

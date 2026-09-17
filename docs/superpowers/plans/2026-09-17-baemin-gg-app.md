# 배민.GG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 배민.GG badminton-club ranking web app — signup, match recording, Elo-based rating, leaderboard, member search, club info, and a hidden admin screen — using GitHub itself (via the Contents API) as the write-backend.

**Architecture:** Vite + React (TypeScript) single-page app, client-side routing, no server. All persistent data (`data/members.json`, `data/matches.json`) lives in the same public GitHub repo as the app code and is read/written directly from the browser via the GitHub Contents API using a user-supplied Personal Access Token (PAT) stored in `localStorage`. The app is built and deployed to GitHub Pages via GitHub Actions.

**Tech Stack:** Vite, React 18, TypeScript, framer-motion, react-router-dom, Vitest + React Testing Library for tests.

**Spec:** `docs/superpowers/specs/2026-09-17-baemin-gg-design.md`

## Global Constraints

- Single public GitHub repo holds both app code and `data/members.json` / `data/matches.json`.
- No phone numbers are ever collected or stored — only `name`, `department`, `position`.
- Every write (signup, match record, admin delete) goes through GET (get `sha`) → modify → PUT, retrying up to 3 times total on a 409 conflict before surfacing an error to the user.
- The GitHub PAT is only ever stored in `localStorage`, entered once per browser via a gate screen. It is never hardcoded in source.
- Rating logic is isolated in `src/lib/rating.ts` using a placeholder standard Elo formula (initial rating 1200, single unified rating for singles and doubles) so the formula can be swapped later without touching any other file.
- Home menu labels are exactly: `FIND PLAYER`, `MATCH RECORD`, `LEADERBOARD`, `CLUB INFO`, `SIGN UP`, all rendered in the VITRO CORE font (same as the "배민.GG" header).
- Layout must be responsive (mobile / tablet / PC), and the home hover-reveal interaction must also work via tap on touch devices.
- Admin access is a frontend-only password check (no server-side auth). Admin can delete both members and matches; deleting a match does not recompute any ratings.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/setupTests.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` default export (React component) — later tasks (16) replace its body with the real router shell, but the export signature (`export default function App()`) stays the same.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "baemin-gg",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "framer-motion": "^11.11.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/uuid": "^9.0.8",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vitest": "^2.1.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>배민.GG</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/setupTests.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Create `src/App.tsx`**

```tsx
export default function App() {
  return <div>배민.GG</div>;
}
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 9: Write the failing test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app shell', () => {
  render(<App />);
  expect(screen.getByText('배민.GG')).toBeInTheDocument();
});
```

- [ ] **Step 10: Install dependencies and run the test to verify it fails first**

Run: `npm install`
Then run: `npx vitest run src/App.test.tsx`
Expected: since `App.tsx` is created in the same task, this should already PASS — confirm it does (there is no separate red step here because scaffolding and minimal implementation are the same action).

- [ ] **Step 11: Confirm test passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/main.tsx src/App.tsx src/App.test.tsx src/setupTests.ts package-lock.json
git commit -m "chore: scaffold Vite + React + TS project with Vitest"
```

---

### Task 2: Fonts and global responsive styles

**Files:**
- Create: `public/fonts/VITRO CORE OTF.otf` (copy from `FONTS/VITRO CORE OTF.otf`)
- Create: `public/fonts/VITRO INSPIRE OTF.otf` (copy from `FONTS/VITRO INSPIRE OTF.otf`)
- Create: `public/fonts/VITRO PRIDE OTF.otf` (copy from `FONTS/VITRO PRIDE OTF.otf`)
- Create: `src/styles/fonts.css`
- Create: `src/styles/global.css`
- Modify: `src/main.tsx` (import the new stylesheets)
- Test: `src/styles/fonts.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--font-vitro-core`, `--font-vitro-inspire`, `--font-vitro-pride` usable by any component via `style={{ fontFamily: 'var(--font-vitro-core)' }}`.

- [ ] **Step 1: Copy font files into `public/fonts/`**

```bash
mkdir -p public/fonts
cp "FONTS/VITRO CORE OTF.otf" "public/fonts/VITRO CORE OTF.otf"
cp "FONTS/VITRO INSPIRE OTF.otf" "public/fonts/VITRO INSPIRE OTF.otf"
cp "FONTS/VITRO PRIDE OTF.otf" "public/fonts/VITRO PRIDE OTF.otf"
```

- [ ] **Step 2: Write the failing test**

Create `src/styles/fonts.test.ts`:

```ts
import { readFileSync } from 'fs';
import { resolve } from 'path';

test('fonts.css declares all three VITRO font-faces with the expected variable names', () => {
  const css = readFileSync(resolve(__dirname, 'fonts.css'), 'utf-8');
  expect(css).toContain('--font-vitro-core');
  expect(css).toContain('--font-vitro-inspire');
  expect(css).toContain('--font-vitro-pride');
  expect(css).toContain("VITRO CORE OTF.otf");
  expect(css).toContain("VITRO INSPIRE OTF.otf");
  expect(css).toContain("VITRO PRIDE OTF.otf");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/styles/fonts.test.ts`
Expected: FAIL with "ENOENT: no such file or directory" (fonts.css doesn't exist yet)

- [ ] **Step 4: Create `src/styles/fonts.css`**

```css
@font-face {
  font-family: 'VitroCore';
  src: url('/fonts/VITRO CORE OTF.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'VitroInspire';
  src: url('/fonts/VITRO INSPIRE OTF.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'VitroPride';
  src: url('/fonts/VITRO PRIDE OTF.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-vitro-core: 'VitroCore', sans-serif;
  --font-vitro-inspire: 'VitroInspire', sans-serif;
  --font-vitro-pride: 'VitroPride', sans-serif;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/styles/fonts.test.ts`
Expected: PASS

- [ ] **Step 6: Create `src/styles/global.css`**

```css
* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: system-ui, sans-serif;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

- [ ] **Step 7: Import stylesheets in `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Commit**

```bash
git add public/fonts src/styles/fonts.css src/styles/global.css src/styles/fonts.test.ts src/main.tsx
git commit -m "feat: add VITRO fonts and global responsive base styles"
```

---

### Task 3: Domain types and config constants

**Files:**
- Create: `src/types.ts`
- Create: `src/config.ts`
- Test: `src/config.test.ts`

**Interfaces:**
- Produces: `Member`, `MatchType`, `Match` types from `src/types.ts`; `GITHUB_OWNER`, `GITHUB_REPO`, `MEMBERS_PATH`, `MATCHES_PATH`, `INITIAL_RATING`, `ADMIN_PASSWORD` constants from `src/config.ts`.

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface Member {
  id: string;
  name: string;
  department: string;
  position: string;
  rating: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export type MatchType = 'singles' | 'doubles';

export interface Match {
  id: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B';
  ratingChanges: Record<string, number>;
  playedAt: string;
  recordedAt: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/config.test.ts`:

```ts
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH, INITIAL_RATING, ADMIN_PASSWORD } from './config';

test('config exposes the constants the rest of the app depends on', () => {
  expect(typeof GITHUB_OWNER).toBe('string');
  expect(typeof GITHUB_REPO).toBe('string');
  expect(MEMBERS_PATH).toBe('data/members.json');
  expect(MATCHES_PATH).toBe('data/matches.json');
  expect(INITIAL_RATING).toBe(1200);
  expect(typeof ADMIN_PASSWORD).toBe('string');
  expect(ADMIN_PASSWORD.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/config.test.ts`
Expected: FAIL with "Cannot find module './config'"

- [ ] **Step 4: Create `src/config.ts`**

```ts
// Repo that hosts both this app and its JSON data files.
// Update these two once the GitHub repo is created.
export const GITHUB_OWNER = 'CHANGE_ME_OWNER';
export const GITHUB_REPO = 'CHANGE_ME_REPO';

export const MEMBERS_PATH = 'data/members.json';
export const MATCHES_PATH = 'data/matches.json';

export const INITIAL_RATING = 1200;

// Frontend-only gate for the hidden admin screen. Not real security —
// the repo is public, so treat this as a convenience lock, not a secret.
export const ADMIN_PASSWORD = 'CHANGE_ME_ADMIN_PASSWORD';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/config.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/config.ts src/config.test.ts
git commit -m "feat: add domain types and app config constants"
```

---

### Task 4: PAT storage module

**Files:**
- Create: `src/lib/pat.ts`
- Test: `src/lib/pat.test.ts`

**Interfaces:**
- Consumes: nothing (wraps `localStorage` only)
- Produces: `getPat(): string | null`, `setPat(token: string): void`, `clearPat(): void`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pat.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pat.test.ts`
Expected: FAIL with "Cannot find module './pat'"

- [ ] **Step 3: Create `src/lib/pat.ts`**

```ts
const PAT_STORAGE_KEY = 'baemin-gg-pat';

export function getPat(): string | null {
  return localStorage.getItem(PAT_STORAGE_KEY);
}

export function setPat(token: string): void {
  localStorage.setItem(PAT_STORAGE_KEY, token);
}

export function clearPat(): void {
  localStorage.removeItem(PAT_STORAGE_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pat.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/pat.ts src/lib/pat.test.ts
git commit -m "feat: add localStorage-backed PAT storage"
```

---

### Task 5: GitHub Contents API client with conflict retry

**Files:**
- Create: `src/lib/github.ts`
- Test: `src/lib/github.test.ts`

**Interfaces:**
- Consumes: `getPat()` from `src/lib/pat.ts`; `GITHUB_OWNER`, `GITHUB_REPO` from `src/config.ts`
- Produces: `updateJsonFile<T>(path: string, message: string, updater: (current: T) => T, maxRetries?: number): Promise<void>` — used by Tasks 11, 12, 15.

- [ ] **Step 1: Write the failing test**

Create `src/lib/github.test.ts`:

```ts
import { beforeEach, expect, test, vi } from 'vitest';
import { updateJsonFile } from './github';
import { setPat } from './pat';

function githubContentResponse(data: unknown, sha: string) {
  const json = JSON.stringify(data);
  const content = Buffer.from(json, 'utf-8').toString('base64');
  return { content, sha };
}

beforeEach(() => {
  localStorage.clear();
  setPat('ghp_test_token');
  vi.restoreAllMocks();
});

test('reads, updates, and writes the file in one round trip when there is no conflict', async () => {
  const getResponse = githubContentResponse([{ id: '1' }], 'sha-1');
  const fetchMock = vi
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify(getResponse), { status: 200 }))
    .mockResolvedValueOnce(new Response('{}', { status: 200 }));

  await updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
    ...current,
    { id: '2' },
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  const putCall = fetchMock.mock.calls[1];
  expect(putCall[1]?.method).toBe('PUT');
  const putBody = JSON.parse(putCall[1]!.body as string);
  expect(putBody.sha).toBe('sha-1');
  const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf-8'));
  expect(decoded).toEqual([{ id: '1' }, { id: '2' }]);
});

test('retries after a 409 conflict by re-fetching the latest sha', async () => {
  const firstGet = githubContentResponse([{ id: '1' }], 'sha-1');
  const secondGet = githubContentResponse([{ id: '1' }, { id: 'other' }], 'sha-2');
  const fetchMock = vi
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify(firstGet), { status: 200 }))
    .mockResolvedValueOnce(new Response('conflict', { status: 409 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(secondGet), { status: 200 }))
    .mockResolvedValueOnce(new Response('{}', { status: 200 }));

  await updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
    ...current,
    { id: '2' },
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(4);
  const secondPutCall = fetchMock.mock.calls[3];
  const putBody = JSON.parse(secondPutCall[1]!.body as string);
  expect(putBody.sha).toBe('sha-2');
  const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf-8'));
  expect(decoded).toEqual([{ id: '1' }, { id: 'other' }, { id: '2' }]);
});

test('throws after exhausting retries on repeated conflicts', async () => {
  const get = githubContentResponse([{ id: '1' }], 'sha-1');
  vi.spyOn(global, 'fetch').mockImplementation(async (_url, init) => {
    if (!init || init.method === undefined) {
      return new Response(JSON.stringify(get), { status: 200 });
    }
    return new Response('conflict', { status: 409 });
  });

  await expect(
    updateJsonFile<{ id: string }[]>('data/members.json', 'add member', (current) => [
      ...current,
      { id: '2' },
    ])
  ).rejects.toThrow(/conflicts/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/github.test.ts`
Expected: FAIL with "Cannot find module './github'"

- [ ] **Step 3: Create `src/lib/github.ts`**

```ts
import { getPat } from './pat';
import { GITHUB_OWNER, GITHUB_REPO } from '../config';

interface GithubFile<T> {
  data: T;
  sha: string;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getPat()}`,
    Accept: 'application/vnd.github+json',
  };
}

async function getFile<T>(path: string): Promise<GithubFile<T>> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const json = await res.json();
  const decoded = decodeURIComponent(escape(atob(json.content)));
  return { data: JSON.parse(decoded) as T, sha: json.sha };
}

async function putFile(
  path: string,
  data: unknown,
  sha: string,
  message: string
): Promise<{ ok: true } | { ok: false; conflict: true }> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ message, content, sha }),
    }
  );
  if (res.status === 409) return { ok: false, conflict: true };
  if (!res.ok) throw new Error(`Failed to write ${path}: ${res.status}`);
  return { ok: true };
}

export async function updateJsonFile<T>(
  path: string,
  message: string,
  updater: (current: T) => T,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, sha } = await getFile<T>(path);
    const next = updater(data);
    const result = await putFile(path, next, sha, message);
    if (result.ok) return;
  }
  throw new Error(`Failed to update ${path} after ${maxRetries} attempts due to conflicts`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/github.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/lib/github.test.ts
git commit -m "feat: add GitHub Contents API client with 409-conflict retry"
```

---

### Task 6: Elo rating module (placeholder formula)

**Files:**
- Create: `src/lib/rating.ts`
- Test: `src/lib/rating.test.ts`

**Interfaces:**
- Produces: `expectedScore(ratingA, ratingB): number`, `eloDelta(ratingA, ratingB, actualScoreA, kFactor?): number`, `calculateMatchRatingChanges(teamARatings: number[], teamBRatings: number[], winner: 'A' | 'B'): { teamADelta: number; teamBDelta: number }` — used by Task 12.

- [ ] **Step 1: Write the failing test**

Create `src/lib/rating.test.ts`:

```ts
import { expect, test } from 'vitest';
import { expectedScore, eloDelta, calculateMatchRatingChanges } from './rating';

test('expectedScore is 0.5 for equal ratings', () => {
  expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 5);
});

test('expectedScore favors the higher-rated player', () => {
  expect(expectedScore(1400, 1200)).toBeGreaterThan(0.5);
  expect(expectedScore(1200, 1400)).toBeLessThan(0.5);
});

test('eloDelta is positive for a win against an equal opponent', () => {
  expect(eloDelta(1200, 1200, 1)).toBe(16); // 32 * (1 - 0.5)
});

test('eloDelta is negative for a loss against an equal opponent', () => {
  expect(eloDelta(1200, 1200, 0)).toBe(-16);
});

test('singles match: winner gains what loser loses', () => {
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges([1200], [1200], 'A');
  expect(teamADelta).toBe(16);
  expect(teamBDelta).toBe(-16);
});

test('doubles match: delta is based on team average rating and applied evenly', () => {
  const { teamADelta, teamBDelta } = calculateMatchRatingChanges([1200, 1200], [1200, 1200], 'B');
  expect(teamADelta).toBe(-16);
  expect(teamBDelta).toBe(16);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rating.test.ts`
Expected: FAIL with "Cannot find module './rating'"

- [ ] **Step 3: Create `src/lib/rating.ts`**

```ts
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function eloDelta(
  ratingA: number,
  ratingB: number,
  actualScoreA: 0 | 0.5 | 1,
  kFactor = 32
): number {
  const expected = expectedScore(ratingA, ratingB);
  return Math.round(kFactor * (actualScoreA - expected));
}

export function calculateMatchRatingChanges(
  teamARatings: number[],
  teamBRatings: number[],
  winner: 'A' | 'B'
): { teamADelta: number; teamBDelta: number } {
  const avg = (ratings: number[]) => ratings.reduce((s, r) => s + r, 0) / ratings.length;
  const avgA = avg(teamARatings);
  const avgB = avg(teamBRatings);
  const actualScoreA = winner === 'A' ? 1 : 0;
  const teamADelta = eloDelta(avgA, avgB, actualScoreA);
  const teamBDelta = -teamADelta;
  return { teamADelta, teamBDelta };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/rating.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rating.ts src/lib/rating.test.ts
git commit -m "feat: add placeholder Elo rating calculation, isolated for later replacement"
```

---

### Task 7: Member/match query utilities

**Files:**
- Create: `src/lib/members.ts`
- Test: `src/lib/members.test.ts`

**Interfaces:**
- Consumes: `Member`, `Match` types from `src/types.ts`
- Produces: `searchMembers(members, query): Member[]`, `recentMatchesFor(matches, memberId, limit?): Match[]`, `sortByRatingDesc(members): Member[]`, `recentMatches(matches, limit?): Match[]`, `biggestUpsets(matches, members, limit?): Match[]` — used by Tasks 10 (search) and 13 (leaderboard).

- [ ] **Step 1: Write the failing test**

Create `src/lib/members.test.ts`:

```ts
import { expect, test } from 'vitest';
import {
  searchMembers,
  recentMatchesFor,
  sortByRatingDesc,
  recentMatches,
  biggestUpsets,
} from './members';
import type { Member, Match } from '../types';

const members: Member[] = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1100, wins: 1, losses: 3, createdAt: '2026-01-02' },
  { id: 'm3', name: '김민수', department: '개발', position: '과장', rating: 1500, wins: 5, losses: 0, createdAt: '2026-01-03' },
];

const matches: Match[] = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
  { id: 'g2', type: 'singles', teamA: ['m2'], teamB: ['m3'], scoreA: 21, scoreB: 10, winner: 'A', ratingChanges: {}, playedAt: '2026-01-15', recordedAt: '2026-01-15' },
];

test('searchMembers matches by partial, case-insensitive name', () => {
  expect(searchMembers(members, '김')).toEqual([members[0], members[2]]);
  expect(searchMembers(members, '')).toEqual([]);
});

test('recentMatchesFor returns matches involving the member, newest first', () => {
  const result = recentMatchesFor(matches, 'm2');
  expect(result.map((m) => m.id)).toEqual(['g2', 'g1']);
});

test('sortByRatingDesc orders members by rating descending without mutating input', () => {
  const sorted = sortByRatingDesc(members);
  expect(sorted.map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  expect(members[0].id).toBe('m1');
});

test('recentMatches returns matches newest first, limited', () => {
  const result = recentMatches(matches, 1);
  expect(result.map((m) => m.id)).toEqual(['g2']);
});

test('biggestUpsets ranks matches by rating gap between winner and loser, largest first', () => {
  const result = biggestUpsets(matches, members, 1);
  // g2: winner m2 (1100) beat loser m3 (1500) -> gap 400
  // g1: winner m1 (1300) beat loser m2 (1100) -> gap -200 (not an upset)
  expect(result.map((m) => m.id)).toEqual(['g2']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/members.test.ts`
Expected: FAIL with "Cannot find module './members'"

- [ ] **Step 3: Create `src/lib/members.ts`**

```ts
import type { Member, Match } from '../types';

export function searchMembers(members: Member[], query: string): Member[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return members.filter((m) => m.name.toLowerCase().includes(q));
}

export function recentMatchesFor(matches: Match[], memberId: string, limit = 5): Match[] {
  return matches
    .filter((m) => m.teamA.includes(memberId) || m.teamB.includes(memberId))
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, limit);
}

export function sortByRatingDesc(members: Member[]): Member[] {
  return [...members].sort((a, b) => b.rating - a.rating);
}

export function recentMatches(matches: Match[], limit = 10): Match[] {
  return [...matches]
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, limit);
}

export function biggestUpsets(matches: Match[], members: Member[], limit = 5): Match[] {
  const ratingById = new Map(members.map((m) => [m.id, m.rating]));
  const avg = (ids: string[]) =>
    ids.reduce((s, id) => s + (ratingById.get(id) ?? 0), 0) / ids.length;

  return matches
    .map((m) => {
      const winnerAvg = avg(m.winner === 'A' ? m.teamA : m.teamB);
      const loserAvg = avg(m.winner === 'A' ? m.teamB : m.teamA);
      return { match: m, gap: loserAvg - winnerAvg };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit)
    .map((x) => x.match);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/members.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/members.ts src/lib/members.test.ts
git commit -m "feat: add member search and leaderboard query utilities"
```

---

### Task 8: HoverImageReveal component (adapted, English-ready, tap-enabled)

**Files:**
- Create: `src/components/HoverImageReveal.tsx`
- Test: `src/components/HoverImageReveal.test.tsx`

**Interfaces:**
- Produces: `HoverImageReveal` default export accepting an `items` prop shaped as `{ itemCount: number; item1: { text, image?, link?, onClick? }, ... }`, plus `font`, `textColor`, `dimColor`, `align`, `rowGap`, `imageWidth`, `imageHeight`, `rounded`, `offsetX`, `offsetY`, `followStrength`, `transition`, `backgroundColor`, `style` — used by Task 10 (Home).

- [ ] **Step 1: Write the failing test**

Create `src/components/HoverImageReveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HoverImageReveal.test.tsx`
Expected: FAIL with "Cannot find module './HoverImageReveal'"

- [ ] **Step 3: Create `src/components/HoverImageReveal.tsx`**

```tsx
import { useRef, useState, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, type Transition as MotionTransition } from 'framer-motion';

interface Item {
  text?: string;
  image?: { src?: string; srcSet?: string; alt?: string };
  link?: string;
  onClick?: () => void;
}

interface ItemsValue {
  itemCount?: number;
  [key: string]: unknown;
}

const MAX_ITEMS = 6;

interface FontValue {
  fontSize?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  [key: string]: unknown;
}

interface HoverImageRevealProps {
  items?: ItemsValue;
  font?: FontValue;
  textColor?: string;
  dimColor?: string;
  align?: 'left' | 'center' | 'right';
  rowGap?: number;
  imageWidth?: number;
  imageHeight?: number;
  rounded?: number;
  offsetX?: number;
  offsetY?: number;
  followStrength?: number;
  transition?: MotionTransition;
  backgroundColor?: string;
  style?: CSSProperties;
}

const DEFAULT_ITEMS: ItemsValue = {
  itemCount: 1,
  item1: { text: 'ITEM' },
};

const DEFAULT_FONT: FontValue = {
  fontSize: 61,
  lineHeight: '0.9em',
  letterSpacing: '-0.05em',
};

const DEFAULT_TRANSITION: MotionTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
  mass: 1,
};

const alignToFlex: Record<string, CSSProperties['alignItems']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};
const alignToText: Record<string, CSSProperties['textAlign']> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

export default function HoverImageReveal({
  items = DEFAULT_ITEMS,
  font = DEFAULT_FONT,
  textColor = '#FFFFFF',
  dimColor = '#51565A',
  align = 'center',
  rowGap = 30,
  imageWidth = 300,
  imageHeight = 400,
  rounded = 16,
  offsetX = 200,
  offsetY = 0,
  followStrength = 0,
  transition = DEFAULT_TRANSITION,
  backgroundColor = '#000000',
  style,
}: HoverImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const stiffness = 60 + followStrength * 5;
  const springCfg = { stiffness, damping: 28, mass: 0.5 };
  const x = useSpring(rawX, springCfg);
  const y = useSpring(rawY, springCfg);

  const data = items || DEFAULT_ITEMS;
  const count = Math.max(1, Math.min(MAX_ITEMS, (data.itemCount as number) || 1));
  const list: Item[] = [];
  for (let i = 1; i <= count; i++) {
    const it = data[`item${i}`] as Item | undefined;
    list.push({
      text: it?.text ?? `Item ${i}`,
      image: it?.image,
      link: it?.link,
      onClick: it?.onClick,
    });
  }
  const anyActive = hovered != null;

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left + offsetX);
    rawY.set(e.clientY - rect.top + offsetY);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={() => setHovered(null)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: alignToFlex[align],
        gap: `${rowGap}px`,
        padding: 24,
        boxSizing: 'border-box',
        ...(font as CSSProperties),
        ...style,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          width: imageWidth,
          height: imageHeight,
          borderRadius: rounded,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 2,
        }}
        animate={{ opacity: anyActive ? 1 : 0 }}
        transition={transition}
      >
        {list.map((item, i) => {
          const src = item.image?.src;
          const yPos = hovered == null ? '100%' : i < hovered ? '-100%' : i > hovered ? '100%' : '0%';
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ y: yPos }}
              transition={transition}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
            >
              {src ? (
                <img
                  src={src}
                  alt={item.image?.alt || item.text || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#333,#111)' }} />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <div
        onMouseLeave={() => setHovered(null)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: alignToFlex[align], gap: `${rowGap}px` }}
      >
        {list.map((item, i) => {
          const isHovered = hovered === i;
          const color = anyActive ? (isHovered ? textColor : dimColor) : textColor;
          const copyStyle: CSSProperties = {
            display: 'block',
            color,
            transition: 'color 0.2s ease',
            whiteSpace: 'pre',
            textAlign: alignToText[align],
          };

          const label = (
            <motion.div
              style={{ position: 'relative' }}
              animate={{ y: isHovered ? '-100%' : '0%' }}
              transition={transition}
            >
              <span style={copyStyle}>{item.text}</span>
              <span aria-hidden style={{ ...copyStyle, position: 'absolute', top: '100%', left: 0, width: '100%' }}>
                {item.text}
              </span>
            </motion.div>
          );

          const handleActivate = () => {
            setHovered(i);
            item.onClick?.();
          };

          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onClick={handleActivate}
              style={{ overflow: 'hidden', cursor: item.link || item.onClick ? 'pointer' : 'default' }}
            >
              {item.link ? (
                <a href={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {label}
                </a>
              ) : (
                label
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HoverImageReveal.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/HoverImageReveal.tsx src/components/HoverImageReveal.test.tsx
git commit -m "feat: add HoverImageReveal component with click/tap activation"
```

---

### Task 9: PatGate component

**Files:**
- Create: `src/components/PatGate.tsx`
- Test: `src/components/PatGate.test.tsx`

**Interfaces:**
- Consumes: `getPat`, `setPat` from `src/lib/pat.ts`
- Produces: `PatGate` default export, a component taking `{ children: ReactNode }`, used by Task 16 (`App.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/components/PatGate.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PatGate.test.tsx`
Expected: FAIL with "Cannot find module './PatGate'"

- [ ] **Step 3: Create `src/components/PatGate.tsx`**

```tsx
import { useState, type ReactNode } from 'react';
import { getPat, setPat } from '../lib/pat';

export default function PatGate({ children }: { children: ReactNode }) {
  const [pat, setPatState] = useState<string | null>(() => getPat());
  const [input, setInput] = useState('');

  if (pat) return <>{children}</>;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h2>GitHub Personal Access Token 입력</h2>
      <p>배민.GG는 GitHub 리포를 데이터베이스로 사용합니다. 쓰기 권한이 있는 PAT를 입력해주세요.</p>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="ghp_..."
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
      />
      <button
        onClick={() => {
          const token = input.trim();
          if (!token) return;
          setPat(token);
          setPatState(token);
        }}
      >
        저장
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/PatGate.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/PatGate.tsx src/components/PatGate.test.tsx
git commit -m "feat: add PAT entry gate component"
```

---

### Task 10: Home page

**Files:**
- Create: `src/pages/Home.tsx`
- Test: `src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `HoverImageReveal` (Task 8), `searchMembers` (Task 7), `Member` type (Task 3)
- Produces: `Home` default export, used by Task 16 routing. Fetches `data/members.json` and `data/matches.json` read-only via plain `fetch` to the GitHub raw content URL (no PAT needed for public reads) — introduces `fetchPublicJson<T>(path): Promise<T>` in the same file for this read path (write path stays in `github.ts`).

- [ ] **Step 1: Write the failing test**

Create `src/pages/Home.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import Home from './Home';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
];

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
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
  expect(screen.getByText('배민.GG')).toBeInTheDocument();
  for (const label of ['FIND PLAYER', 'MATCH RECORD', 'LEADERBOARD', 'CLUB INFO', 'SIGN UP']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('clicking FIND PLAYER reveals a search box that filters members by name', async () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.click(screen.getAllByText('FIND PLAYER')[0]);
  const input = await screen.findByPlaceholderText('회원명 검색');
  await user.type(input, '김태준');

  await waitFor(() => {
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Home.test.tsx`
Expected: FAIL with "Cannot find module './Home'"

- [ ] **Step 3: Create `src/pages/Home.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HoverImageReveal from '../components/HoverImageReveal';
import { searchMembers } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH } from '../config';
import type { Member } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Home() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  const results = searchOpen ? searchMembers(members, query) : [];

  const items = {
    itemCount: 5,
    item1: { text: 'FIND PLAYER', onClick: () => setSearchOpen((v) => !v) },
    item2: { text: 'MATCH RECORD', onClick: () => navigate('/record') },
    item3: { text: 'LEADERBOARD', onClick: () => navigate('/rankings') },
    item4: { text: 'CLUB INFO', onClick: () => navigate('/club') },
    item5: { text: 'SIGN UP', onClick: () => navigate('/signup') },
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1
        style={{
          fontFamily: 'var(--font-vitro-core)',
          textAlign: 'center',
          fontSize: 'clamp(32px, 6vw, 64px)',
          margin: '32px 0 0',
        }}
      >
        배민.GG
      </h1>
      <div style={{ flex: 1 }}>
        <HoverImageReveal items={items} font={{ fontFamily: 'var(--font-vitro-core)', fontSize: 48 }} />
      </div>
      {searchOpen && (
        <div style={{ padding: 24 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="회원명 검색"
            style={{ width: '100%', maxWidth: 400, padding: 8 }}
          />
          <ul>
            {results.map((m) => (
              <li key={m.id}>
                {m.name} — rating {m.rating} ({m.wins}승 {m.losses}패)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Home.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "feat: add Home page with hover menu and inline player search"
```

---

### Task 11: Signup page

**Files:**
- Create: `src/pages/Signup.tsx`
- Test: `src/pages/Signup.test.tsx`

**Interfaces:**
- Consumes: `updateJsonFile` (Task 5), `Member` type (Task 3), `MEMBERS_PATH`, `INITIAL_RATING` (Task 3)
- Produces: `Signup` default export, used by Task 16 routing.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Signup.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import Signup from './Signup';
import * as github from '../lib/github';

beforeEach(() => {
  vi.restoreAllMocks();
});

test('submitting the form appends a new member and shows a success message', async () => {
  const updateSpy = vi
    .spyOn(github, 'updateJsonFile')
    .mockImplementation(async (_path, _msg, updater) => {
      updater([]);
    });

  render(<Signup />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('이름'), '김태준');
  await user.type(screen.getByLabelText('부서'), '개발');
  await user.type(screen.getByLabelText('직급'), '사원');
  await user.click(screen.getByRole('button', { name: '가입하기' }));

  expect(updateSpy).toHaveBeenCalledTimes(1);
  const [path, , updater] = updateSpy.mock.calls[0];
  expect(path).toBe('data/members.json');
  const result = updater([]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ name: '김태준', department: '개발', position: '사원', rating: 1200, wins: 0, losses: 0 });

  expect(await screen.findByText('가입이 완료되었습니다.')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Signup.test.tsx`
Expected: FAIL with "Cannot find module './Signup'"

- [ ] **Step 3: Create `src/pages/Signup.tsx`**

```tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { updateJsonFile } from '../lib/github';
import { MEMBERS_PATH, INITIAL_RATING } from '../config';
import type { Member } from '../types';

export default function Signup() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateJsonFile<Member[]>(MEMBERS_PATH, `signup: ${name}`, (current) => [
        ...current,
        {
          id: uuidv4(),
          name,
          department,
          position,
          rating: INITIAL_RATING,
          wins: 0,
          losses: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDone(true);
    } catch (err) {
      setError('가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <p>가입이 완료되었습니다.</p>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>회원가입</h2>
      <label htmlFor="signup-name">이름</label>
      <input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="signup-department">부서</label>
      <input id="signup-department" value={department} onChange={(e) => setDepartment(e.target.value)} required />

      <label htmlFor="signup-position">직급</label>
      <input id="signup-position" value={position} onChange={(e) => setPosition(e.target.value)} required />

      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        가입하기
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Signup.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Signup.tsx src/pages/Signup.test.tsx
git commit -m "feat: add member signup page"
```

---

### Task 12: Match record page

**Files:**
- Create: `src/pages/Record.tsx`
- Test: `src/pages/Record.test.tsx`

**Interfaces:**
- Consumes: `updateJsonFile` (Task 5), `calculateMatchRatingChanges` (Task 6), `Member`/`Match` types (Task 3), `MEMBERS_PATH`/`MATCHES_PATH` (Task 3)
- Produces: `Record` default export, used by Task 16 routing.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Record.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import Record from './Record';
import * as github from '../lib/github';
import type { Member } from '../types';

const members: Member[] = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1200, wins: 0, losses: 0, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1200, wins: 0, losses: 0, createdAt: '2026-01-02' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify(members), { status: 200 }));
});

test('recording a singles match updates matches.json and both members ratings', async () => {
  const calls: { path: string; updater: (c: unknown) => unknown }[] = [];
  vi.spyOn(github, 'updateJsonFile').mockImplementation(async (path, _msg, updater) => {
    calls.push({ path, updater: updater as (c: unknown) => unknown });
  });

  render(<Record />);
  const user = userEvent.setup();

  await user.selectOptions(await screen.findByLabelText('팀 A 선수 1'), 'm1');
  await user.selectOptions(screen.getByLabelText('팀 B 선수 1'), 'm2');
  await user.type(screen.getByLabelText('팀 A 점수'), '21');
  await user.type(screen.getByLabelText('팀 B 점수'), '15');
  await user.click(screen.getByRole('button', { name: '경기 등록' }));

  expect(calls.map((c) => c.path)).toEqual(
    expect.arrayContaining(['data/matches.json', 'data/members.json'])
  );

  const matchesUpdate = calls.find((c) => c.path === 'data/matches.json')!;
  const newMatches = matchesUpdate.updater([]) as { teamA: string[]; teamB: string[]; winner: string }[];
  expect(newMatches).toHaveLength(1);
  expect(newMatches[0]).toMatchObject({ teamA: ['m1'], teamB: ['m2'], winner: 'A', scoreA: 21, scoreB: 15 });

  const membersUpdate = calls.find((c) => c.path === 'data/members.json')!;
  const updatedMembers = membersUpdate.updater(members) as Member[];
  const winner = updatedMembers.find((m) => m.id === 'm1')!;
  const loser = updatedMembers.find((m) => m.id === 'm2')!;
  expect(winner.rating).toBeGreaterThan(1200);
  expect(loser.rating).toBeLessThan(1200);
  expect(winner.wins).toBe(1);
  expect(loser.losses).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Record.test.tsx`
Expected: FAIL with "Cannot find module './Record'"

- [ ] **Step 3: Create `src/pages/Record.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { updateJsonFile } from '../lib/github';
import { calculateMatchRatingChanges } from '../lib/rating';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match, MatchType } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Record() {
  const [members, setMembers] = useState<Member[]>([]);
  const [type, setType] = useState<MatchType>('singles');
  const [teamA, setTeamA] = useState<string[]>(['']);
  const [teamB, setTeamB] = useState<string[]>(['']);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
  }, []);

  const slotsPerTeam = type === 'singles' ? 1 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreANum = Number(scoreA);
    const scoreBNum = Number(scoreB);
    const winner: 'A' | 'B' = scoreANum > scoreBNum ? 'A' : 'B';
    const ratingById = new Map(members.map((m) => [m.id, m.rating]));
    const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
      teamA.map((id) => ratingById.get(id) ?? 1200),
      teamB.map((id) => ratingById.get(id) ?? 1200),
      winner
    );

    const ratingChanges: Record<string, number> = {};
    teamA.forEach((id) => (ratingChanges[id] = teamADelta));
    teamB.forEach((id) => (ratingChanges[id] = teamBDelta));

    const match: Match = {
      id: uuidv4(),
      type,
      teamA,
      teamB,
      scoreA: scoreANum,
      scoreB: scoreBNum,
      winner,
      ratingChanges,
      playedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    await updateJsonFile<Match[]>(MATCHES_PATH, 'record match', (current) => [...current, match]);
    await updateJsonFile<Member[]>(MEMBERS_PATH, 'update ratings after match', (current) =>
      current.map((m) => {
        if (!(m.id in ratingChanges)) return m;
        const won = (winner === 'A' ? teamA : teamB).includes(m.id);
        return {
          ...m,
          rating: m.rating + ratingChanges[m.id],
          wins: m.wins + (won ? 1 : 0),
          losses: m.losses + (won ? 0 : 1),
        };
      })
    );
    setDone(true);
  };

  if (done) return <p>경기가 등록되었습니다.</p>;

  const teamSelect = (
    team: string[],
    setTeam: (v: string[]) => void,
    label: string
  ) =>
    Array.from({ length: slotsPerTeam }).map((_, i) => (
      <select
        key={i}
        aria-label={`${label} 선수 ${i + 1}`}
        value={team[i] ?? ''}
        onChange={(e) => {
          const next = [...team];
          next[i] = e.target.value;
          setTeam(next);
        }}
      >
        <option value="">선수 선택</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    ));

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h2>전적기록</h2>
      <label htmlFor="match-type">경기 형태</label>
      <select
        id="match-type"
        value={type}
        onChange={(e) => {
          const nextType = e.target.value as MatchType;
          setType(nextType);
          const size = nextType === 'singles' ? 1 : 2;
          setTeamA(Array.from({ length: size }, (_, i) => teamA[i] ?? ''));
          setTeamB(Array.from({ length: size }, (_, i) => teamB[i] ?? ''));
        }}
      >
        <option value="singles">단식</option>
        <option value="doubles">복식</option>
      </select>

      <fieldset>
        <legend>팀 A</legend>
        {teamSelect(teamA, setTeamA, '팀 A')}
      </fieldset>
      <fieldset>
        <legend>팀 B</legend>
        {teamSelect(teamB, setTeamB, '팀 B')}
      </fieldset>

      <label htmlFor="score-a">팀 A 점수</label>
      <input id="score-a" type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} required />

      <label htmlFor="score-b">팀 B 점수</label>
      <input id="score-b" type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} required />

      <button type="submit">경기 등록</button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Record.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Record.tsx src/pages/Record.test.tsx
git commit -m "feat: add match record page with Elo rating updates"
```

---

### Task 13: Leaderboard (전적현황) page

**Files:**
- Create: `src/pages/Rankings.tsx`
- Test: `src/pages/Rankings.test.tsx`

**Interfaces:**
- Consumes: `sortByRatingDesc`, `recentMatches`, `biggestUpsets` (Task 7)
- Produces: `Rankings` default export, used by Task 16 routing.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Rankings.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import Rankings from './Rankings';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
  { id: 'm2', name: '박서연', department: '영업', position: '대리', rating: 1500, wins: 5, losses: 0, createdAt: '2026-01-02' },
];
const matches = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
];

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('members.json')) return new Response(JSON.stringify(members), { status: 200 });
    return new Response(JSON.stringify(matches), { status: 200 });
  });
});

test('renders members sorted by rating descending', async () => {
  render(<Rankings />);
  const rows = await screen.findAllByTestId('ranking-row');
  expect(rows.map((r) => r.textContent)).toEqual([
    expect.stringContaining('박서연'),
    expect.stringContaining('김태준'),
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Rankings.test.tsx`
Expected: FAIL with "Cannot find module './Rankings'"

- [ ] **Step 3: Create `src/pages/Rankings.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sortByRatingDesc, recentMatches, biggestUpsets } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Rankings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH).then(setMatches).catch(() => setMatches([]));
  }, []);

  const ranked = sortByRatingDesc(members);
  const recent = recentMatches(matches, 10);
  const upsets = biggestUpsets(matches, members, 5);

  return (
    <div style={{ padding: 24 }}>
      <h2>전적현황</h2>
      <h3>랭킹</h3>
      <ol>
        {ranked.map((m) => (
          <li key={m.id} data-testid="ranking-row">
            {m.name} — {m.rating} ({m.wins}승 {m.losses}패)
          </li>
        ))}
      </ol>
      <h3>최근 경기</h3>
      <ul>
        {recent.map((m) => (
          <li key={m.id}>
            {m.scoreA} : {m.scoreB} ({m.playedAt})
          </li>
        ))}
      </ul>
      <h3>최대 이변 승리</h3>
      <ul>
        {upsets.map((m) => (
          <li key={m.id}>
            {m.scoreA} : {m.scoreB} ({m.playedAt})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Rankings.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Rankings.tsx src/pages/Rankings.test.tsx
git commit -m "feat: add leaderboard page with recent matches and upsets"
```

---

### Task 14: Club info page

**Files:**
- Create: `src/pages/Club.tsx`
- Test: `src/pages/Club.test.tsx`

**Interfaces:**
- Produces: `Club` default export, used by Task 16 routing.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Club.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Club from './Club';

test('renders club info placeholder content', () => {
  render(<Club />);
  expect(screen.getByRole('heading', { name: '클럽정보' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Club.test.tsx`
Expected: FAIL with "Cannot find module './Club'"

- [ ] **Step 3: Create `src/pages/Club.tsx`**

```tsx
// Placeholder content — replace this file's copy directly once real club
// info is decided, same pattern as the 기업컨설팅 site.
export default function Club() {
  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h2>클럽정보</h2>
      <p>배민클럽은 사내 배드민턴 동아리입니다.</p>
      <p>여기에 클럽 소개, 활동 일정, 운영진 정보 등을 추가할 예정입니다.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Club.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Club.tsx src/pages/Club.test.tsx
git commit -m "feat: add club info placeholder page"
```

---

### Task 15: Admin page

**Files:**
- Create: `src/pages/Admin.tsx`
- Test: `src/pages/Admin.test.tsx`

**Interfaces:**
- Consumes: `updateJsonFile` (Task 5), `ADMIN_PASSWORD` (Task 3)
- Produces: `Admin` default export, used by Task 16 routing.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Admin.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import Admin from './Admin';
import * as github from '../lib/github';
import * as config from '../config';

const members = [
  { id: 'm1', name: '김태준', department: '개발', position: '사원', rating: 1300, wins: 3, losses: 1, createdAt: '2026-01-01' },
];
const matches = [
  { id: 'g1', type: 'singles', teamA: ['m1'], teamB: ['m2'], scoreA: 21, scoreB: 15, winner: 'A', ratingChanges: {}, playedAt: '2026-01-10', recordedAt: '2026-01-10' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(config, 'ADMIN_PASSWORD', 'get').mockReturnValue('secret123');
  vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('members.json')) return new Response(JSON.stringify(members), { status: 200 });
    return new Response(JSON.stringify(matches), { status: 200 });
  });
});

test('hides delete controls until the correct password is entered', async () => {
  render(<Admin />);
  expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();

  const user = userEvent.setup();
  await user.type(screen.getByLabelText('관리자 비밀번호'), 'wrong');
  await user.click(screen.getByRole('button', { name: '입장' }));
  expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();
});

test('deleting a member calls updateJsonFile with that member removed', async () => {
  const updateSpy = vi.spyOn(github, 'updateJsonFile').mockResolvedValue(undefined);

  render(<Admin />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('관리자 비밀번호'), 'secret123');
  await user.click(screen.getByRole('button', { name: '입장' }));

  await user.click(await screen.findByRole('button', { name: '회원 삭제: 김태준' }));

  const call = updateSpy.mock.calls.find((c) => c[0] === 'data/members.json')!;
  const updater = call[2] as (current: typeof members) => typeof members;
  expect(updater(members)).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Admin.test.tsx`
Expected: FAIL with "Cannot find module './Admin'"

- [ ] **Step 3: Create `src/pages/Admin.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { updateJsonFile } from '../lib/github';
import { ADMIN_PASSWORD, GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Admin() {
  const [passwordInput, setPasswordInput] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!authorized) return;
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH).then(setMatches).catch(() => setMatches([]));
  }, [authorized]);

  const deleteMember = async (id: string) => {
    await updateJsonFile<Member[]>(MEMBERS_PATH, 'admin: delete member', (current) =>
      current.filter((m) => m.id !== id)
    );
    setMembers((current) => current.filter((m) => m.id !== id));
  };

  const deleteMatch = async (id: string) => {
    await updateJsonFile<Match[]>(MATCHES_PATH, 'admin: delete match', (current) =>
      current.filter((m) => m.id !== id)
    );
    setMatches((current) => current.filter((m) => m.id !== id));
  };

  if (!authorized) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <label htmlFor="admin-password">관리자 비밀번호</label>
        <input
          id="admin-password"
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
        <button onClick={() => setAuthorized(passwordInput === ADMIN_PASSWORD)}>입장</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>관리자</h2>
      <h3>회원</h3>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} <button onClick={() => deleteMember(m.id)}>회원 삭제: {m.name}</button>
          </li>
        ))}
      </ul>
      <h3>경기기록</h3>
      <ul>
        {matches.map((m) => (
          <li key={m.id}>
            {m.scoreA}:{m.scoreB} ({m.playedAt}){' '}
            <button onClick={() => deleteMatch(m.id)}>경기 삭제: {m.id}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Admin.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin.tsx src/pages/Admin.test.tsx
git commit -m "feat: add hidden admin page for member/match deletion"
```

---

### Task 16: App shell with routing

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `PatGate` (Task 9), `Home` (10), `Signup` (11), `Record` (12), `Rankings` (13), `Club` (14), `Admin` (15)
- Produces: final `App` default export used by `src/main.tsx` (Task 1) — no change to that file needed.

- [ ] **Step 1: Update the failing test**

Replace `src/App.test.tsx`:

```tsx
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
  expect(screen.getByText('배민.GG')).toBeInTheDocument();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `App` still renders the plain placeholder div, `MemoryRouter` is unused, routes don't exist yet.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom';
import PatGate from './components/PatGate';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Record from './pages/Record';
import Rankings from './pages/Rankings';
import Club from './pages/Club';
import Admin from './pages/Admin';

export default function App() {
  return (
    <PatGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/record" element={<Record />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/club" element={<Club />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </PatGate>
  );
}
```

- [ ] **Step 4: Wrap the app in a router in `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/fonts.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: all tests across every task PASS

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/main.tsx
git commit -m "feat: wire up routing for all pages behind the PAT gate"
```

---

### Task 17: GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `data/members.json` (create, seeded empty)
- Modify: `data/matches.json` (create, seeded empty)

**Interfaces:**
- Produces: a GitHub Actions workflow that builds and deploys `dist/` to GitHub Pages on every push to `main`. No code interface — this is the final task, verified by a successful `npm run build`.

- [ ] **Step 1: Seed the data files the app reads/writes**

Create `data/members.json`:

```json
[]
```

Create `data/matches.json`:

```json
[]
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify the production build succeeds**

Run: `npm run build`
Expected: exits 0 and produces a `dist/` folder containing `index.html` and hashed JS/CSS assets.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml data/members.json data/matches.json
git commit -m "chore: add GitHub Pages deploy workflow and seed empty data files"
```

- [ ] **Step 5: Note remaining manual setup (not scriptable from here)**

After this plan is executed, before the app is usable end-to-end:
1. Create the GitHub repo, push this local repo to it (`git remote add origin <url>` then `git push -u origin main`).
2. Update `GITHUB_OWNER` / `GITHUB_REPO` in `src/config.ts` to the real repo, and pick a real `ADMIN_PASSWORD`; commit.
3. Enable GitHub Pages in the repo settings with source "GitHub Actions".
4. Each club member who will write data needs a GitHub PAT (classic, `repo` scope, or fine-grained with Contents read/write on this repo) to enter into the PAT gate on first visit.

---

## Self-Review Notes

- **Spec coverage:** tech stack (Task 1), fonts/responsive base (Task 2), data model (Task 3), GitHub write flow + retry (Task 5), Elo placeholder isolated in one file (Task 6), search/leaderboard queries (Task 7), Home hover menu with English labels + tap support (Tasks 8, 10), Signup without phone number (Task 11), Record with singles/doubles + rating updates (Task 12), Rankings/leaderboard/upsets (Task 13), Club info placeholder (Task 14), Admin password gate + member/match deletion (Task 15), routing + PAT gate wiring (Task 16), Pages deploy workflow + seed data (Task 17). All spec sections are covered.
- **Placeholder scan:** the only literal placeholder strings are `CHANGE_ME_OWNER` / `CHANGE_ME_REPO` / `CHANGE_ME_ADMIN_PASSWORD` in `src/config.ts` — these are intentional, spec-documented stand-ins for values that don't exist until the GitHub repo is created (same pattern as the Club info placeholder content), not vague instructions. Task 17 Step 5 spells out exactly what to replace them with and when.
- **Type consistency:** `Member`/`Match`/`MatchType` (Task 3) are reused verbatim through Tasks 5–16; `updateJsonFile<T>` signature (Task 5) matches every call site in Tasks 11, 12, 15; `HoverImageReveal`'s `Item.onClick` (Task 8) matches its usage in `Home.tsx` (Task 10).

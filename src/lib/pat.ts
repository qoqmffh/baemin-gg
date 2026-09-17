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

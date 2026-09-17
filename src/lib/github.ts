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

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

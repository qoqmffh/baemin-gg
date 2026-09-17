import { useEffect, useState } from 'react';
import { updateJsonFile } from '../lib/github';
import { SEED_RATING } from '../lib/rating';
import { ADMIN_PASSWORD, GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match, SeedTier } from '../types';

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

  const setSeedTier = async (id: string, seedTier: SeedTier | undefined) => {
    await updateJsonFile<Member[]>(MEMBERS_PATH, `admin: set seed tier (${seedTier ?? 'none'})`, (current) =>
      current.map((m) => {
        if (m.id !== id) return m;
        if (!seedTier) {
          const { seedTier: _drop, ...rest } = m;
          return rest;
        }
        return { ...m, seedTier, rating: SEED_RATING[seedTier] };
      })
    );
    setMembers((current) =>
      current.map((m) => {
        if (m.id !== id) return m;
        if (!seedTier) {
          const { seedTier: _drop, ...rest } = m;
          return rest;
        }
        return { ...m, seedTier, rating: SEED_RATING[seedTier] };
      })
    );
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

      <h3>창립멤버 시드 지정</h3>
      <p>최초 시드전 결과에 따라 1,2위=A / 3,4위=B / 5,6위=C 시드를 지정하세요. 한번 지정하면 해당 회원의 레이팅이 영구 고정 시드값으로 바뀝니다.</p>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} (현재: {m.seedTier ? `${m.seedTier}시드 · ${m.rating}점` : `일반 · ${m.rating}점`})
            <select
              aria-label={`${m.name} 시드 지정`}
              value={m.seedTier ?? ''}
              onChange={(e) => setSeedTier(m.id, (e.target.value || undefined) as SeedTier | undefined)}
            >
              <option value="">없음</option>
              <option value="A">A시드</option>
              <option value="B">B시드</option>
              <option value="C">C시드</option>
            </select>
          </li>
        ))}
      </ul>

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

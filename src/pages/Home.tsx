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

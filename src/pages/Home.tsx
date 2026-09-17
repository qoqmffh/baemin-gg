import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import HoverImageReveal from '../components/HoverImageReveal';
import { searchMembers } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH } from '../config';
import type { Member } from '../types';
import './Home.css';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function HomeBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: "url('image/backgroun_home.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
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
    // Two words on separate lines (via the literal newline) so it never
    // gets clipped on narrower viewports — see white-space: pre in
    // HoverImageReveal, which preserves this line break as-is.
    item3: { text: 'LEADER\nBOARD', onClick: () => navigate('/rankings') },
    item4: { text: 'CLUB INFO', onClick: () => navigate('/club') },
    item5: { text: 'SIGN UP', onClick: () => navigate('/signup') },
  };

  const headingStyle: CSSProperties = {
    fontFamily: 'var(--font-vitro-core)',
    textAlign: 'center',
    fontSize: 'clamp(48px, 9vw, 120px)',
    margin: 0,
    paddingTop: '9vh',
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <HomeBackground />
      <div className="home-tagline home-tagline--left">
        <span>PLAY</span>
        <span>TOGETHER</span>
        <span>BE BETTER</span>
      </div>
      <div className="home-tagline home-tagline--right">
        <span>BADMINTON</span>
        <span>COMMUNITY</span>
        <span>배민.GG</span>
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={headingStyle}>배민.GG</h1>
        <div style={{ flex: 1 }}>
          <HoverImageReveal
            items={items}
            font={{ fontFamily: 'var(--font-vitro-core)', fontSize: 'clamp(22px, 5vw, 48px)' }}
            backgroundColor="transparent"
            showPreview={false}
          />
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
    </div>
  );
}

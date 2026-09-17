import { useEffect, useState, type CSSProperties } from 'react';
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

// Stylized badminton court markings, used as a low-opacity atmospheric
// background rather than a literal photo — keeps the hero (heading + hover
// menu) as the boldest element on the page.
function CourtBackground() {
  const lineStyle = { stroke: 'rgba(255,255,255,0.09)', strokeWidth: 0.35, fill: 'none' } as const;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background:
          'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(32,60,92,0.35), rgba(0,0,0,0) 70%), #000000',
      }}
    >
      <svg
        viewBox="0 0 100 220"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}
      >
        <rect x={5} y={5} width={90} height={210} {...lineStyle} />
        <line x1={12} x2={12} y1={5} y2={215} {...lineStyle} />
        <line x1={88} x2={88} y1={5} y2={215} {...lineStyle} />
        <line x1={5} x2={95} y1={17} y2={17} {...lineStyle} />
        <line x1={5} x2={95} y1={203} y2={203} {...lineStyle} />
        <line x1={5} x2={95} y1={79} y2={79} {...lineStyle} />
        <line x1={5} x2={95} y1={141} y2={141} {...lineStyle} />
        <line x1={50} x2={50} y1={5} y2={79} {...lineStyle} />
        <line x1={50} x2={50} y1={141} y2={215} {...lineStyle} />
        <line
          x1={5}
          x2={95}
          y1={110}
          y2={110}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.6}
        />
      </svg>
    </div>
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
      <CourtBackground />
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

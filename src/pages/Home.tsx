import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HoverImageReveal from '../components/HoverImageReveal';
import PageBackground from '../components/PageBackground';
import SideTaglines from '../components/SideTaglines';
import { searchMembers, sortByRatingDesc } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH } from '../config';
import type { Member } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth={2} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function SearchPill({
  query,
  onQueryChange,
  onClose,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '16px 28px',
        borderRadius: 9999,
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 0 26px rgba(255,255,255,0.18)',
        background: 'rgba(0,0,0,0.35)',
        boxSizing: 'border-box',
      }}
    >
      <SearchIcon />
      <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.35)' }} />
      <input
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="선수 이름을 검색해보세요"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#FFFFFF',
          fontSize: 16,
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="검색창 닫기"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function SearchResults({
  query,
  members,
  onSelectPlayer,
}: {
  query: string;
  members: Member[];
  onSelectPlayer: (id: string) => void;
}) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const results = searchMembers(members, trimmed);
  const rankById = new Map(sortByRatingDesc(members).map((m, i) => [m.id, i + 1]));

  if (results.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)', marginTop: 20 }}>
        '{trimmed}'님을 찾을 수 없습니다.
      </p>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {results.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelectPlayer(m.id)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 16,
            padding: 20,
            background: 'rgba(0,0,0,0.4)',
            color: '#FFFFFF',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <strong style={{ fontSize: 20 }}>{m.name}</strong>
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>
            {rankById.get(m.id)}위 · {m.rating}점 · {m.wins}승 {m.losses}패
          </span>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(searchParams.get('search') === '1');
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  const menuItems = {
    itemCount: 5,
    item1: {
      text: 'FIND PLAYER',
      onClick: searchOpen ? undefined : () => setSearchOpen(true),
      renderLabel: searchOpen
        ? () => <SearchPill query={query} onQueryChange={setQuery} onClose={() => setSearchOpen(false)} />
        : undefined,
    },
    item2: {
      text: 'MATCH RECORD',
      onClick: () => navigate('/record'),
    },
    item3: {
      text: 'LEADERBOARD',
      onClick: () => navigate('/rankings'),
    },
    item4: {
      text: 'CLUB INFO',
      onClick: () => navigate('/club'),
    },
    item5: {
      text: 'SIGN UP',
      onClick: () => navigate('/signup'),
    },
  };

  const headingStyle: CSSProperties = {
    fontFamily: 'var(--font-vitro-core)',
    textAlign: 'center',
    fontSize: 'clamp(40px, 7vw, 96px)',
    margin: 0,
    paddingTop: '9vh',
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden auto' }}>
      <PageBackground />
      <SideTaglines />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={headingStyle}>배민.GG</h1>
        <div style={{ flex: 1 }}>
          <HoverImageReveal
            items={menuItems}
            font={{ fontFamily: 'var(--font-vitro-core)', fontSize: 'clamp(22px, 5vw, 48px)' }}
            backgroundColor="transparent"
            dimAll={searchOpen}
            showPreview={false}
          />
        </div>
        {searchOpen && (
          <SearchResults
            query={query}
            members={members}
            onSelectPlayer={(id) => navigate(`/rankings?player=${id}`)}
          />
        )}
      </div>
    </div>
  );
}

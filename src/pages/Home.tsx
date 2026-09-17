import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import HoverImageReveal from '../components/HoverImageReveal';
import { searchMembers, sortByRatingDesc, recentMatchesFor } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Match, Member } from '../types';
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

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth={2} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function FindPlayerControl({
  open,
  query,
  onQueryChange,
  onToggle,
  fontSize,
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: () => void;
  fontSize: string;
}) {
  if (open) {
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
          onClick={onToggle}
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

  return (
    <div
      onClick={onToggle}
      style={{
        textAlign: 'center',
        fontFamily: 'var(--font-vitro-core)',
        fontSize,
        color: '#FFFFFF',
        cursor: 'pointer',
      }}
    >
      FIND PLAYER
    </div>
  );
}

function SearchResults({ query, members, matches }: { query: string; members: Member[]; matches: Match[] }) {
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
    <div style={{ width: '100%', maxWidth: 600, margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {results.map((m) => {
        const recent = recentMatchesFor(matches, m.id, 5);
        return (
          <div
            key={m.id}
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: 20,
              background: 'rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: 20 }}>{m.name}</strong>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                {rankById.get(m.id)}위 · {m.rating}점
              </span>
            </div>
            <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.75)' }}>
              {m.wins}승 {m.losses}패
            </div>
            {recent.length > 0 && (
              <ul style={{ marginTop: 12, paddingLeft: 18, color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                {recent.map((match) => {
                  const won = (match.winner === 'A' ? match.teamA : match.teamB).includes(m.id);
                  return (
                    <li key={match.id}>
                      {won ? '승' : '패'} {match.scoreA}:{match.scoreB} ({match.playedAt.slice(0, 10)})
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH)
      .then(setMembers)
      .catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH)
      .then(setMatches)
      .catch(() => setMatches([]));
  }, []);

  const menuItems = {
    itemCount: 4,
    item1: {
      text: 'MATCH RECORD',
      image: { src: 'image/2.jpg', alt: 'MATCH RECORD' },
      onClick: () => navigate('/record'),
    },
    item2: {
      text: 'LEADERBOARD',
      // Only the hover-preview caption wraps to two lines — the static
      // menu label stays a single line.
      previewText: 'LEADER\nBOARD',
      image: { src: 'image/3.jpg', alt: 'LEADERBOARD' },
      onClick: () => navigate('/rankings'),
    },
    item3: {
      text: 'CLUB INFO',
      image: { src: 'image/4.jpg', alt: 'CLUB INFO' },
      onClick: () => navigate('/club'),
    },
    item4: {
      text: 'SIGN UP',
      image: { src: 'image/5.jpg', alt: 'SIGN UP' },
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

  const menuFontSize = 'clamp(22px, 5vw, 48px)';

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden auto' }}>
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
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={headingStyle}>배민.GG</h1>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
          <FindPlayerControl
            open={searchOpen}
            query={query}
            onQueryChange={setQuery}
            onToggle={() => setSearchOpen((v) => !v)}
            fontSize={menuFontSize}
          />
          <div style={{ flex: 1 }}>
            <HoverImageReveal
              items={menuItems}
              font={{ fontFamily: 'var(--font-vitro-core)', fontSize: menuFontSize }}
              backgroundColor="transparent"
              dimAll={searchOpen}
            />
          </div>
          {searchOpen && <SearchResults query={query} members={members} matches={matches} />}
        </div>
      </div>
    </div>
  );
}

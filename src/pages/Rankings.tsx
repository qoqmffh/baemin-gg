import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import PageBackground from '../components/PageBackground';
import PlayerStatsPanel from '../components/PlayerStatsPanel';
import { sortByRatingDesc, recentMatches, biggestUpsets } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match } from '../types';
import './Rankings.css';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

type TabKey = 'stats' | 'ranking' | 'recent' | 'upsets';

function ChartBarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V4Z"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path d="M3 5h3M18 5h3M12 13v3M9 20h6M10 20v-3.2M14 20v-3.2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9L12 3.5Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TABS: { key: TabKey; label: string; subtitle: string; Icon: () => JSX.Element }[] = [
  { key: 'stats', label: '전적현황', subtitle: 'OVERALL RECORD', Icon: ChartBarIcon },
  { key: 'ranking', label: '랭킹', subtitle: 'RANKING', Icon: TrophyIcon },
  { key: 'recent', label: '최근 경기', subtitle: 'RECENT MATCHES', Icon: ClockIcon },
  { key: 'upsets', label: '최대 이변 승리', subtitle: 'BIGGEST UPSET', Icon: StarIcon },
];

export default function Rankings() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const playerId = searchParams.get('player');
  const stateTab = (location.state as { tab?: TabKey } | null)?.tab;
  const initialTab: TabKey = playerId
    ? 'stats'
    : stateTab && TABS.some((t) => t.key === stateTab)
      ? stateTab
      : 'ranking';
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH).then(setMatches).catch(() => setMatches([]));
  }, []);

  const ranked = sortByRatingDesc(members);
  const recent = recentMatches(matches, 10);
  const upsets = biggestUpsets(matches, members, 5);
  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const ratingById = new Map(members.map((m) => [m.id, m.rating]));

  const teamNames = (ids: string[]) => ids.map((id) => nameById.get(id) ?? '알 수 없음').join(' · ');

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PageBackground />
      <TopNav />
      <div className="rankings-layout">
        <aside className="rankings-sidebar">
          <div className="rankings-sidebar__title">LEADERBOARD</div>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`rankings-sidebar__item${tab === t.key ? ' is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <t.Icon />
              {t.label}
            </button>
          ))}
        </aside>
        <main className="rankings-main">
          <div className="rankings-main__header">
            <h2>{active.label}</h2>
            <p>{active.subtitle}</p>
          </div>

          {tab === 'stats' && (
            <PlayerStatsPanel
              members={members}
              matches={matches}
              selectedPlayerId={playerId}
              onSelectPlayer={(id) => setSearchParams({ player: id })}
              onClear={() => setSearchParams({})}
            />
          )}

          {tab === 'ranking' && (
            <div className="rankings-list">
              {ranked.length === 0 && <p className="rankings-empty">아직 등록된 회원이 없습니다.</p>}
              {ranked.map((m, i) => (
                <div key={m.id} className="rankings-card" data-testid="ranking-row">
                  <span className="rankings-card__rank">{i + 1}</span>
                  <span className="rankings-card__name">{m.name}</span>
                  <span className="rankings-card__meta">
                    {m.rating}점 · {m.wins}승 {m.losses}패
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'recent' && (
            <div className="rankings-list">
              {recent.length === 0 && <p className="rankings-empty">최근 경기 기록이 없습니다.</p>}
              {recent.map((match) => {
                const winnerNames = teamNames(match.winner === 'A' ? match.teamA : match.teamB);
                const loserNames = teamNames(match.winner === 'A' ? match.teamB : match.teamA);
                return (
                  <div key={match.id} className="rankings-card">
                    <span className="rankings-card__name">
                      {winnerNames} 승 vs {loserNames}
                    </span>
                    <span className="rankings-card__meta">
                      {match.scoreA} : {match.scoreB} ({match.playedAt.slice(0, 10)})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'upsets' && (
            <div className="rankings-list">
              {upsets.length === 0 && <p className="rankings-empty">아직 이변 승리 기록이 없습니다.</p>}
              {upsets.map((match) => {
                const winnerIds = match.winner === 'A' ? match.teamA : match.teamB;
                const loserIds = match.winner === 'A' ? match.teamB : match.teamA;
                const avg = (ids: string[]) =>
                  ids.reduce((s, id) => s + (ratingById.get(id) ?? 0), 0) / ids.length;
                const gap = Math.round(avg(loserIds) - avg(winnerIds));
                return (
                  <div key={match.id} className="rankings-card">
                    <span className="rankings-card__name">
                      {teamNames(winnerIds)} 승 vs {teamNames(loserIds)}
                    </span>
                    <span className="rankings-card__meta">
                      {match.scoreA} : {match.scoreB} · 레이팅 차 {gap}점 ({match.playedAt.slice(0, 10)})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

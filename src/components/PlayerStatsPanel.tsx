import { useState } from 'react';
import { searchMembers } from '../lib/members';
import { computePlayerStats } from '../lib/playerStats';
import type { Member, Match, MatchType } from '../types';
import './PlayerStatsPanel.css';

const MATCH_TYPE_LABEL: Record<MatchType, string> = { singles: '단식', doubles: '복식' };

function SearchPrompt({
  members,
  onSelectPlayer,
}: {
  members: Member[];
  onSelectPlayer: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const results = trimmed ? searchMembers(members, trimmed) : [];

  return (
    <div className="player-stats__prompt">
      <p className="player-stats__prompt-message">플레이어를 찾지 못했습니다. 플레이어를 검색해주세요.</p>
      <input
        className="player-stats__search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="선수 이름을 검색해보세요"
      />
      {trimmed && results.length === 0 && (
        <p className="rankings-empty">'{trimmed}'님을 찾을 수 없습니다.</p>
      )}
      {results.length > 0 && (
        <ul className="player-stats__search-results">
          {results.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onSelectPlayer(m.id)}>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PlayerStatsPanel({
  members,
  matches,
  selectedPlayerId,
  onSelectPlayer,
  onClear,
}: {
  members: Member[];
  matches: Match[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
  onClear: () => void;
}) {
  const player = selectedPlayerId ? members.find((m) => m.id === selectedPlayerId) : undefined;

  if (!player) {
    return <SearchPrompt members={members} onSelectPlayer={onSelectPlayer} />;
  }

  const stats = computePlayerStats(player.id, matches);
  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const maxMonthly = Math.max(1, ...stats.monthly.map((m) => m.games));

  return (
    <div className="player-stats">
      <div className="player-stats__header">
        <h3>{player.name}</h3>
        <button type="button" className="player-stats__clear" onClick={onClear}>
          다른 선수 검색
        </button>
      </div>

      <div className="player-stats__cards">
        <div className="stat-card">
          <div className="stat-card__label">총 경기수</div>
          <div className="stat-card__value">{stats.totalGames}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">승리</div>
          <div className="stat-card__value">{stats.wins}</div>
          <div className="stat-card__sub">{stats.winRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">패배</div>
          <div className="stat-card__value">{stats.losses}</div>
          <div className="stat-card__sub">{round(100 - stats.winRate, stats.totalGames)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">연속 기록</div>
          <div className="stat-card__value">{stats.currentStreak}</div>
          <div className="stat-card__sub">{stats.currentStreak > 0 ? '연승' : '-'}</div>
        </div>
      </div>

      <div className="player-stats__section">
        <h4>최근 {stats.recent.length}경기 결과</h4>
        {stats.recent.length === 0 ? (
          <p className="rankings-empty">경기 기록이 없습니다.</p>
        ) : (
          <div className="player-stats__dots">
            {stats.recent.map((r) => (
              <span
                key={r.matchId}
                className={`player-stats__dot player-stats__dot--${r.result}`}
                title={`${r.playedAt.slice(0, 10)} · ${r.result === 'win' ? '승' : '패'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="player-stats__section">
        <h4>경기 형태별 승률</h4>
        {(Object.keys(stats.byType) as MatchType[]).map((type) => {
          const b = stats.byType[type];
          return (
            <div key={type} className="type-bar">
              <span className="type-bar__label">{MATCH_TYPE_LABEL[type]}</span>
              <div className="type-bar__track">
                <div className="type-bar__fill" style={{ width: `${b.winRate}%` }} />
              </div>
              <span className="type-bar__meta">
                {b.winRate}% ({b.wins}승 {b.losses}패)
              </span>
            </div>
          );
        })}
      </div>

      <div className="player-stats__section">
        <h4>상대별 전적 TOP 5</h4>
        {stats.topOpponents.length === 0 ? (
          <p className="rankings-empty">상대 전적이 없습니다.</p>
        ) : (
          <table className="opponent-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>상대</th>
                <th>경기수</th>
                <th>승</th>
                <th>패</th>
                <th>승률</th>
              </tr>
            </thead>
            <tbody>
              {stats.topOpponents.map((o, i) => (
                <tr key={o.opponentId}>
                  <td>{i + 1}</td>
                  <td>{nameById.get(o.opponentId) ?? '알 수 없음'}</td>
                  <td>{o.games}</td>
                  <td>{o.wins}</td>
                  <td>{o.losses}</td>
                  <td>{o.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="player-stats__section">
        <h4>월별 경기 현황</h4>
        {stats.monthly.length === 0 ? (
          <p className="rankings-empty">경기 기록이 없습니다.</p>
        ) : (
          <div className="monthly-bars">
            {stats.monthly.map((m) => (
              <div key={m.month} className="monthly-bars__col">
                <div className="monthly-bars__value">{m.games}</div>
                <div className="monthly-bars__bar" style={{ height: `${(m.games / maxMonthly) * 100}%` }} />
                <div className="monthly-bars__label">{Number(m.month.slice(5, 7))}월</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function round(value: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round(value * 10) / 10;
}

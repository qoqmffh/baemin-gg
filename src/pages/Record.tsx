import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import TopNav from '../components/TopNav';
import PageBackground from '../components/PageBackground';
import SideTaglines from '../components/SideTaglines';
import { updateJsonFile } from '../lib/github';
import { calculateMatchRatingChanges } from '../lib/rating';
import { recentMatches } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH, INITIAL_RATING } from '../config';
import type { Member, Match, MatchType } from '../types';
import './Record.css';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

const MATCH_TYPE_LABEL: Record<MatchType, string> = { singles: '단식', doubles: '복식' };

export default function Record() {
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [type, setType] = useState<MatchType>('singles');
  const [teamA, setTeamA] = useState<string[]>(['']);
  const [teamB, setTeamB] = useState<string[]>(['']);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH).then(setMatches).catch(() => setMatches([]));
  }, []);

  const slotsPerTeam = type === 'singles' ? 1 : 2;
  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const teamNames = (ids: string[]) => ids.map((id) => nameById.get(id) ?? '알 수 없음').join(' / ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreANum = Number(scoreA);
    const scoreBNum = Number(scoreB);
    const winner: 'A' | 'B' = scoreANum > scoreBNum ? 'A' : 'B';
    const memberById = new Map(members.map((m) => [m.id, m]));
    const fallbackMember = { rating: INITIAL_RATING };
    const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
      teamA.map((id) => memberById.get(id) ?? fallbackMember),
      teamB.map((id) => memberById.get(id) ?? fallbackMember),
      winner
    );

    const ratingChanges: Record<string, number> = {};
    teamA.forEach((id) => (ratingChanges[id] = teamADelta));
    teamB.forEach((id) => (ratingChanges[id] = teamBDelta));

    const match: Match = {
      id: uuidv4(),
      type,
      teamA,
      teamB,
      scoreA: scoreANum,
      scoreB: scoreBNum,
      winner,
      ratingChanges,
      playedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    await updateJsonFile<Match[]>(MATCHES_PATH, 'record match', (current) => [...current, match]);
    await updateJsonFile<Member[]>(MEMBERS_PATH, 'update ratings after match', (current) =>
      current.map((m) => {
        if (!(m.id in ratingChanges)) return m;
        const won = (winner === 'A' ? teamA : teamB).includes(m.id);
        return {
          ...m,
          rating: m.rating + ratingChanges[m.id],
          wins: m.wins + (won ? 1 : 0),
          losses: m.losses + (won ? 0 : 1),
        };
      })
    );
    setMatches((current) => [...current, match]);
    setDone(true);
  };

  const teamSelect = (team: string[], setTeam: (v: string[]) => void, label: string) =>
    Array.from({ length: slotsPerTeam }).map((_, i) => (
      <select
        key={i}
        aria-label={`${label} 선수 ${i + 1}`}
        value={team[i] ?? ''}
        onChange={(e) => {
          const next = [...team];
          next[i] = e.target.value;
          setTeam(next);
        }}
      >
        <option value="">선수 선택</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    ));

  const recent = recentMatches(matches, 3);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PageBackground />
      <SideTaglines />
      <TopNav />

      <div className="record-hero">
        <div className="record-hero__eyebrow" />
        <h1>MATCH RECORD</h1>
        <p>우리의 기록이, 더 나은 플레이를 만든다.</p>
      </div>

      {done ? (
        <div className="record-card">
          <p>경기가 등록되었습니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="record-card">
          <div className="record-card__header">
            <div>
              <h2>전적기록</h2>
              <p>경기 기록을 등록하고, 실력을 성장시켜보세요.</p>
            </div>
            <div className="record-card__badge">
              BADMINTON
              <br />
              MATCH RECORD
            </div>
          </div>

          <div className="record-field">
            <label htmlFor="match-type">경기 형태</label>
            <select
              id="match-type"
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as MatchType;
                setType(nextType);
                const size = nextType === 'singles' ? 1 : 2;
                setTeamA(Array.from({ length: size }, (_, i) => teamA[i] ?? ''));
                setTeamB(Array.from({ length: size }, (_, i) => teamB[i] ?? ''));
              }}
            >
              <option value="singles">단식</option>
              <option value="doubles">복식</option>
            </select>
          </div>

          <div className="record-field">
            <label>팀 A</label>
            {teamSelect(teamA, setTeamA, '팀 A')}
          </div>
          <div className="record-field">
            <label>팀 B</label>
            {teamSelect(teamB, setTeamB, '팀 B')}
          </div>

          <div className="record-score-row">
            <div className="record-field">
              <label htmlFor="score-a">팀 A 점수</label>
              <input
                id="score-a"
                type="number"
                placeholder="숫자 입력"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                required
              />
            </div>
            <div className="record-field">
              <label htmlFor="score-b">팀 B 점수</label>
              <input
                id="score-b"
                type="number"
                placeholder="숫자 입력"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="record-submit">
            경기 등록
          </button>
        </form>
      )}

      <div className="record-recent">
        <div className="record-recent__header">
          <h3>최근 등록된 경기</h3>
          <Link to="/rankings" state={{ tab: 'recent' }}>
            전체보기 &gt;
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="record-empty">아직 등록된 경기가 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>경기 형태</th>
                <th>팀 A</th>
                <th>팀 B</th>
                <th>스코어</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((match) => (
                <tr key={match.id}>
                  <td>{match.playedAt.slice(0, 10)}</td>
                  <td>{MATCH_TYPE_LABEL[match.type]}</td>
                  <td className={match.winner === 'A' ? 'record-recent__winner' : undefined}>
                    {teamNames(match.teamA)}
                    {match.winner === 'A' && <span className="record-recent__badge">승</span>}
                  </td>
                  <td className={match.winner === 'B' ? 'record-recent__winner' : undefined}>
                    {teamNames(match.teamB)}
                    {match.winner === 'B' && <span className="record-recent__badge">승</span>}
                  </td>
                  <td>
                    {match.scoreA} - {match.scoreB}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

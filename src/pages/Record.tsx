import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { updateJsonFile } from '../lib/github';
import { calculateMatchRatingChanges } from '../lib/rating';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match, MatchType } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Record() {
  const [members, setMembers] = useState<Member[]>([]);
  const [type, setType] = useState<MatchType>('singles');
  const [teamA, setTeamA] = useState<string[]>(['']);
  const [teamB, setTeamB] = useState<string[]>(['']);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
  }, []);

  const slotsPerTeam = type === 'singles' ? 1 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreANum = Number(scoreA);
    const scoreBNum = Number(scoreB);
    const winner: 'A' | 'B' = scoreANum > scoreBNum ? 'A' : 'B';
    const ratingById = new Map(members.map((m) => [m.id, m.rating]));
    const { teamADelta, teamBDelta } = calculateMatchRatingChanges(
      teamA.map((id) => ratingById.get(id) ?? 1200),
      teamB.map((id) => ratingById.get(id) ?? 1200),
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
    setDone(true);
  };

  if (done) return <p>경기가 등록되었습니다.</p>;

  const teamSelect = (
    team: string[],
    setTeam: (v: string[]) => void,
    label: string
  ) =>
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

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h2>전적기록</h2>
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

      <fieldset>
        <legend>팀 A</legend>
        {teamSelect(teamA, setTeamA, '팀 A')}
      </fieldset>
      <fieldset>
        <legend>팀 B</legend>
        {teamSelect(teamB, setTeamB, '팀 B')}
      </fieldset>

      <label htmlFor="score-a">팀 A 점수</label>
      <input id="score-a" type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} required />

      <label htmlFor="score-b">팀 B 점수</label>
      <input id="score-b" type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} required />

      <button type="submit">경기 등록</button>
    </form>
  );
}

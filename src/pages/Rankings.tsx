import { useEffect, useState } from 'react';
import { sortByRatingDesc, recentMatches, biggestUpsets } from '../lib/members';
import { GITHUB_OWNER, GITHUB_REPO, MEMBERS_PATH, MATCHES_PATH } from '../config';
import type { Member, Match } from '../types';

async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Rankings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchPublicJson<Member[]>(MEMBERS_PATH).then(setMembers).catch(() => setMembers([]));
    fetchPublicJson<Match[]>(MATCHES_PATH).then(setMatches).catch(() => setMatches([]));
  }, []);

  const ranked = sortByRatingDesc(members);
  const recent = recentMatches(matches, 10);
  const upsets = biggestUpsets(matches, members, 5);

  return (
    <div style={{ padding: 24 }}>
      <h2>전적현황</h2>
      <h3>랭킹</h3>
      <ol>
        {ranked.map((m) => (
          <li key={m.id} data-testid="ranking-row">
            {m.name} — {m.rating} ({m.wins}승 {m.losses}패)
          </li>
        ))}
      </ol>
      <h3>최근 경기</h3>
      <ul>
        {recent.map((m) => (
          <li key={m.id}>
            {m.scoreA} : {m.scoreB} ({m.playedAt})
          </li>
        ))}
      </ul>
      <h3>최대 이변 승리</h3>
      <ul>
        {upsets.map((m) => (
          <li key={m.id}>
            {m.scoreA} : {m.scoreB} ({m.playedAt})
          </li>
        ))}
      </ul>
    </div>
  );
}

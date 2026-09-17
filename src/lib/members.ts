import type { Member, Match } from '../types';

export function searchMembers(members: Member[], query: string): Member[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return members.filter((m) => m.name.toLowerCase().includes(q));
}

export function recentMatchesFor(matches: Match[], memberId: string, limit = 5): Match[] {
  return matches
    .filter((m) => m.teamA.includes(memberId) || m.teamB.includes(memberId))
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, limit);
}

export function sortByRatingDesc(members: Member[]): Member[] {
  return [...members].sort((a, b) => b.rating - a.rating);
}

export function recentMatches(matches: Match[], limit = 10): Match[] {
  return [...matches]
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, limit);
}

export function biggestUpsets(matches: Match[], members: Member[], limit = 5): Match[] {
  const ratingById = new Map(members.map((m) => [m.id, m.rating]));
  const avg = (ids: string[]) =>
    ids.reduce((s, id) => s + (ratingById.get(id) ?? 0), 0) / ids.length;

  return matches
    .map((m) => {
      const winnerAvg = avg(m.winner === 'A' ? m.teamA : m.teamB);
      const loserAvg = avg(m.winner === 'A' ? m.teamB : m.teamA);
      return { match: m, gap: loserAvg - winnerAvg };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit)
    .map((x) => x.match);
}

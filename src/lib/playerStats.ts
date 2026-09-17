import type { Match, MatchType } from '../types';

export interface RecentResult {
  matchId: string;
  result: 'win' | 'loss';
  playedAt: string;
}

export interface TypeBreakdown {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface OpponentRecord {
  opponentId: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MonthlyCount {
  month: string; // "YYYY-MM"
  games: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  recent: RecentResult[]; // oldest -> newest, at most 10
  byType: Record<MatchType, TypeBreakdown>;
  topOpponents: OpponentRecord[];
  monthly: MonthlyCount[];
}

function participatesIn(match: Match, memberId: string): boolean {
  return match.teamA.includes(memberId) || match.teamB.includes(memberId);
}

function won(match: Match, memberId: string): boolean {
  return (match.winner === 'A' ? match.teamA : match.teamB).includes(memberId);
}

function opponentsIn(match: Match, memberId: string): string[] {
  return match.teamA.includes(memberId) ? match.teamB : match.teamA;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computePlayerStats(memberId: string, matches: Match[]): PlayerStats {
  const playerMatches = matches
    .filter((m) => participatesIn(m, memberId))
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

  const totalGames = playerMatches.length;
  const wins = playerMatches.filter((m) => won(m, memberId)).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? round1((wins / totalGames) * 100) : 0;

  let currentStreak = 0;
  for (let i = playerMatches.length - 1; i >= 0; i--) {
    if (won(playerMatches[i], memberId)) currentStreak++;
    else break;
  }

  const recent: RecentResult[] = playerMatches.slice(-10).map((m) => ({
    matchId: m.id,
    result: won(m, memberId) ? 'win' : 'loss',
    playedAt: m.playedAt,
  }));

  const byType: Record<MatchType, TypeBreakdown> = {
    singles: { games: 0, wins: 0, losses: 0, winRate: 0 },
    doubles: { games: 0, wins: 0, losses: 0, winRate: 0 },
  };
  for (const m of playerMatches) {
    const bucket = byType[m.type];
    bucket.games++;
    if (won(m, memberId)) bucket.wins++;
    else bucket.losses++;
  }
  (Object.keys(byType) as MatchType[]).forEach((type) => {
    const b = byType[type];
    b.winRate = b.games > 0 ? round1((b.wins / b.games) * 100) : 0;
  });

  const opponentTally = new Map<string, { games: number; wins: number; losses: number }>();
  for (const m of playerMatches) {
    const iWon = won(m, memberId);
    for (const opponentId of opponentsIn(m, memberId)) {
      const entry = opponentTally.get(opponentId) ?? { games: 0, wins: 0, losses: 0 };
      entry.games++;
      if (iWon) entry.wins++;
      else entry.losses++;
      opponentTally.set(opponentId, entry);
    }
  }
  const topOpponents: OpponentRecord[] = [...opponentTally.entries()]
    .map(([opponentId, v]) => ({
      opponentId,
      games: v.games,
      wins: v.wins,
      losses: v.losses,
      winRate: v.games > 0 ? round1((v.wins / v.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

  const monthlyTally = new Map<string, number>();
  for (const m of playerMatches) {
    const month = m.playedAt.slice(0, 7);
    monthlyTally.set(month, (monthlyTally.get(month) ?? 0) + 1);
  }
  const monthly: MonthlyCount[] = [...monthlyTally.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, games]) => ({ month, games }));

  return { totalGames, wins, losses, winRate, currentStreak, recent, byType, topOpponents, monthly };
}

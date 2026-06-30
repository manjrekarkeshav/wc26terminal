/**
 * Aggregates goal scorers from match details.
 * Runs client-side from the same data already fetched — no extra API calls.
 */

import type { Match } from './types';

export interface ScorerGoal {
  minute: string;
  opponent: string; // opponent team name
  result: string;   // "ARG 3-0 ALG"
}

export interface ScorerRow {
  rank: number;
  name: string;
  teamAbbr: string;
  flag: string;
  count: number;
  goals: ScorerGoal[];
}

export function computeTopScorers(matches: Match[], limit = 10): ScorerRow[] {
  const tally = new Map<
    string,
    { name: string; teamAbbr: string; flag: string; goals: ScorerGoal[] }
  >();

  for (const match of matches) {
    if (match.status === 'pre') continue;
    const h = match.homeTeam;
    const a = match.awayTeam;
    const result = `${h.abbreviation} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${a.abbreviation}`;

    for (const goal of match.goals) {
      const scoredForHome = goal.teamAbbr === h.abbreviation;
      const flag = scoredForHome ? h.flag : goal.teamAbbr === a.abbreviation ? a.flag : '🏳️';
      const opponent = scoredForHome ? a.name : h.name;

      const key = `${goal.scorer}::${goal.teamAbbr}`;
      const entry = tally.get(key);
      const scorerGoal: ScorerGoal = { minute: goal.minute, opponent, result };
      if (entry) entry.goals.push(scorerGoal);
      else tally.set(key, { name: goal.scorer, teamAbbr: goal.teamAbbr, flag, goals: [scorerGoal] });
    }
  }

  return Array.from(tally.values())
    .map((v) => ({ ...v, count: v.goals.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((row, i) => ({ rank: i + 1, ...row }));
}

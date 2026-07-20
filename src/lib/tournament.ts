/**
 * Post-tournament derivations: whether the competition is finished, the final
 * podium, and how far each team got. Used to switch the dashboard into archive mode
 * once every fixture is played.
 */

import type { Match, Team } from './types';

const PLACEHOLDER_RE = /(winner|loser|runner|round of|semifinal|quarterfinal|group [a-l])/i;

/** True once every fixture has been played. */
export function isTournamentComplete(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === 'post');
}

export interface Podium {
  champion: Team;
  runnerUp: Team;
  third: Team | null;
  /** The final itself, for the hero scoreline. */
  final: Match;
}

function sides(m: Match): { winner: Team; loser: Team } | null {
  if (m.winner == null) return null;
  return m.winner === 'home'
    ? { winner: m.homeTeam, loser: m.awayTeam }
    : { winner: m.awayTeam, loser: m.homeTeam };
}

/** Champion / runner-up from the Final, third place from the 3rd-place match. */
export function getPodium(matches: Match[]): Podium | null {
  const final = matches.find((m) => m.round === 'Final' && m.status === 'post');
  if (!final) return null;
  const top = sides(final);
  if (!top || PLACEHOLDER_RE.test(top.winner.name)) return null;

  const thirdMatch = matches.find((m) => m.round === '3rd Place' && m.status === 'post');
  const thirdSides = thirdMatch ? sides(thirdMatch) : null;

  return {
    champion: top.winner,
    runnerUp: top.loser,
    third: thirdSides && !PLACEHOLDER_RE.test(thirdSides.winner.name) ? thirdSides.winner : null,
    final,
  };
}

/** Knockout rounds ordered earliest → latest, for "how far did they get". */
const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', '3rd Place', 'Final'];

/**
 * Map of team abbreviation → the round they went out in ("Quarterfinals"), with
 * "Champion" for the winner. Teams that never reached the knockouts are "Group Stage".
 */
export function computeExitRound(matches: Match[]): Map<string, string> {
  const exit = new Map<string, string>();
  const knockoutTeams = new Set<string>();

  for (const m of matches) {
    if (m.round == null) continue;
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!PLACEHOLDER_RE.test(t.name)) knockoutTeams.add(t.abbreviation);
    }
    if (m.status !== 'post') continue;
    const s = sides(m);
    if (!s || PLACEHOLDER_RE.test(s.loser.name)) continue;

    // Keep the deepest round a team lost in (the 3rd-place match is not an "exit"
    // deeper than the semifinal, so rank it alongside the semis).
    const prev = exit.get(s.loser.abbreviation);
    const rank = (r: string) => ROUND_ORDER.indexOf(r === '3rd Place' ? 'Semifinals' : r);
    if (prev == null || rank(m.round) > rank(prev)) exit.set(s.loser.abbreviation, m.round);
  }

  // Everyone who played a knockout match but never lost one is the champion.
  const podium = getPodium(matches);
  if (podium) exit.set(podium.champion.abbreviation, 'Champion');

  // Teams that never made the knockouts went out in the group stage.
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (PLACEHOLDER_RE.test(t.name)) continue;
      if (!knockoutTeams.has(t.abbreviation) && !exit.has(t.abbreviation)) {
        exit.set(t.abbreviation, 'Group Stage');
      }
    }
  }

  return exit;
}

/** Totals for the recap strip. */
export function computeTotals(matches: Match[]): { matches: number; goals: number } {
  const played = matches.filter((m) => m.status === 'post');
  return {
    matches: played.length,
    goals: played.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0),
  };
}

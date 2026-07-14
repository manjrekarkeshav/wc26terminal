/**
 * Resolve ESPN knockout placeholder slots (e.g. "Semifinal 1 Loser", "Semifinal 2
 * Winner") to the real team, once the feeder match is decided.
 *
 * ESPN never backfills the 3rd-place and Final fixtures — they keep literal
 * placeholder "teams". We map each placeholder to the Nth match of its round
 * (ordered by kickoff, matching bracket numbering) and take that match's winner or
 * loser. Undecided feeders stay as the placeholder until the match is played.
 */

import type { Match, Team } from './types';

const PLACEHOLDER_RE = /^(semifinal|quarterfinal|round of 16|round of 32)\s+(\d+)\s+(winner|loser)$/i;

const ROUND_LABEL: Record<string, string> = {
  semifinal: 'Semifinals',
  quarterfinal: 'Quarterfinals',
  'round of 16': 'Round of 16',
  'round of 32': 'Round of 32',
};

function resolveTeam(name: string, all: Match[]): Team | null {
  const m = PLACEHOLDER_RE.exec(name.trim());
  if (!m) return null;
  const round = ROUND_LABEL[m[1].toLowerCase()];
  const index = parseInt(m[2], 10) - 1; // "Semifinal 1" → 0
  const wantWinner = m[3].toLowerCase() === 'winner';

  const feeders = all
    .filter((x) => x.round === round)
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime());
  const feeder = feeders[index];
  if (!feeder || feeder.winner == null) return null; // not played yet

  const winner = feeder.winner === 'home' ? feeder.homeTeam : feeder.awayTeam;
  const loser = feeder.winner === 'home' ? feeder.awayTeam : feeder.homeTeam;
  return wantWinner ? winner : loser;
}

/**
 * Return a copy of `match` with any placeholder home/away slot resolved to the real
 * team where the feeder is decided; unresolved slots are left untouched.
 */
export function resolveKnockoutSlots(match: Match, all: Match[]): Match {
  const home = resolveTeam(match.homeTeam.name, all);
  const away = resolveTeam(match.awayTeam.name, all);
  if (!home && !away) return match;
  return {
    ...match,
    homeTeam: home ?? match.homeTeam,
    awayTeam: away ?? match.awayTeam,
  };
}

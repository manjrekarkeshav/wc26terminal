/**
 * Determines which teams are eliminated from the tournament, using:
 *  - knockout results (the loser of any completed knockout match is out), and
 *  - group standings (once a group is complete, teams not in the knockout field are out).
 */

import type { Match, GroupStanding } from './types';

const PLACEHOLDER_RE = /(winner|loser|runner|round of|semifinal|quarterfinal|group [a-l])/i;

export function computeEliminatedTeams(matches: Match[], standings: GroupStanding[]): Set<string> {
  const eliminated = new Set<string>();
  const knockoutTeams = new Set<string>();

  for (const m of matches) {
    if (m.round == null) continue; // knockout matches only
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!PLACEHOLDER_RE.test(t.name)) knockoutTeams.add(t.abbreviation);
    }
    // Loser of a finished knockout match is eliminated.
    if (m.status === 'post' && m.winner) {
      const loser = m.winner === 'home' ? m.awayTeam : m.homeTeam;
      if (!PLACEHOLDER_RE.test(loser.name)) eliminated.add(loser.abbreviation);
    }
  }

  for (const g of standings) {
    const groupComplete = g.rows.length === 4 && g.rows.every((r) => r.played === 3);
    for (const row of g.rows) {
      const abbr = row.team.abbreviation;
      // Group finished and this team didn't make the knockout field → out.
      if (knockoutTeams.size > 0 && groupComplete && !knockoutTeams.has(abbr)) {
        eliminated.add(abbr);
      }
      // Before knockouts are drawn, fall back to the standings elimination flag.
      if (knockoutTeams.size === 0 && row.eliminated) eliminated.add(abbr);
    }
  }

  return eliminated;
}

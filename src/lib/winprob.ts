/**
 * Win-probability for a match: home / draw / away percentages + the source used.
 *
 * Source chain (per CLAUDE.md): Polymarket → DraftKings → model.
 * - Polymarket data (when available for the fixture) comes from /api/winprob.
 * - Model fallback derives probabilities from the FIFA ranking-points gap (Elo-style),
 *   so the bars always render even when no live market exists.
 */

import type { Match } from './types';
import { pointsFor } from './rankings';

export interface WinProb {
  home: number; // %
  draw: number; // %
  away: number; // %
  source: 'PM' | 'DK' | 'MODEL';
}

/**
 * Polymarket payload from /api/winprob: keyed by "teama|teamb" (lowercased, sorted).
 * Each entry maps lowercased team name → win %, plus a "draw" entry.
 */
export type WinProbMap = Record<string, Record<string, number>>;

const HOME_ADVANTAGE = 35; // FIFA points equivalent of playing at home
const ELO_DIVISOR = 400;
const DRAW_BASE = 0.28; // draw likelihood when teams are evenly matched

/** Heuristic model from FIFA ranking points. Returns rounded percentages summing to 100. */
export function modelWinProb(homeAbbr: string, awayAbbr: string, knockout = false): WinProb {
  const diff = pointsFor(homeAbbr) - pointsFor(awayAbbr) + HOME_ADVANTAGE;
  // Expected home win-ratio excluding draws (Elo expectation).
  const e = 1 / (1 + Math.pow(10, -diff / ELO_DIVISOR));
  // Knockout matches can't end in a draw (they go to ET/penalties) — no draw bucket.
  const draw = knockout ? 0 : DRAW_BASE * (1 - 2 * Math.abs(e - 0.5));
  const home = e * (1 - draw);
  const away = (1 - e) * (1 - draw);
  return normalize(home, draw, away, 'MODEL');
}

function normalize(home: number, draw: number, away: number, source: WinProb['source']): WinProb {
  const total = home + draw + away || 1;
  const h = Math.round((home / total) * 100);
  const d = Math.round((draw / total) * 100);
  return { home: h, draw: d, away: 100 - h - d, source };
}

/** Stable key for a fixture, matching how the proxy keys Polymarket markets. */
export function fixtureKey(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join('|');
}

const PLACEHOLDER_RE = /(winner|loser|runner|round of|semifinal|quarterfinal|group [a-l])/i;

/** True only when both sides are real, decided teams (not bracket placeholders). */
export function isResolvedMatchup(match: Match): boolean {
  return !PLACEHOLDER_RE.test(match.homeTeam.name) && !PLACEHOLDER_RE.test(match.awayTeam.name);
}

/** Resolve win-probability for a match, preferring Polymarket then falling back to the model. */
export function getWinProb(match: Match, pm: WinProbMap | null): WinProb {
  const knockout = match.round != null && match.round !== 'Group Stage';
  const key = fixtureKey(match.homeTeam.name, match.awayTeam.name);
  const market = pm?.[key];
  if (market) {
    const home = market[match.homeTeam.name.toLowerCase()];
    const away = market[match.awayTeam.name.toLowerCase()];
    if (home != null && away != null) {
      // Knockout markets resolve to a single winner — collapse any draw into home/away.
      return normalize(home, knockout ? 0 : market.draw ?? 0, away, 'PM');
    }
  }
  return modelWinProb(match.homeTeam.abbreviation, match.awayTeam.abbreviation, knockout);
}

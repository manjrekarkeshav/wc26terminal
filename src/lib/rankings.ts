/**
 * FIFA World Ranking lookup.
 * Static data bundled from docs/fifa-rankings-2026.json (official, as of 2026-06-11).
 * ESPN team abbreviations match FIFA 3-letter codes directly (ALG, IRN, KSA, RSA, COD…).
 */

import rankingsData from '../data/fifa-rankings-2026.json';

const RANK_BY_CODE: Record<string, number> = {};
const POINTS_BY_CODE: Record<string, number> = {};
for (const r of rankingsData.rankings) {
  RANK_BY_CODE[r.code] = r.rank;
  POINTS_BY_CODE[r.code] = r.points;
}

/** Returns the FIFA rank for an ESPN abbreviation, or null if unranked (outside top 100). */
export function rankFor(abbr: string): number | null {
  return RANK_BY_CODE[abbr.toUpperCase()] ?? null;
}

/** Returns FIFA ranking points for an ESPN abbreviation. Falls back to ~1200 (below #100). */
export function pointsFor(abbr: string): number {
  return POINTS_BY_CODE[abbr.toUpperCase()] ?? 1200;
}

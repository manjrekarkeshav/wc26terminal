/**
 * All-time World Cup top scorers.
 * Bundled pre-2026 career totals (docs/wc_top_scorers_pre2026.json) + active players'
 * WC26 goals (from the live match feed). Returns the current top 10 career list, marking
 * the outright leader (⭐) and anyone who climbed the ranking during WC26 (🔼).
 */

import type { Match } from './types';
import { computeTopScorers } from './scorers';
import preData from '../data/wc-top-scorers-pre2026.json';

export interface AllTimeRow {
  rank: number;
  name: string;
  flag: string;
  code: string;   // short country label, e.g. GER
  total: number;  // career WC goals (pre-2026 + WC26)
  pre: number;
  wc26: number;
  isTop: boolean;  // current outright leader → ⭐
  movedUp: boolean; // climbed the all-time ranking during WC26 → 🔼
  active: boolean;  // scored in WC26 → still active (🟢), otherwise retired (🔴)
}

// Country → { flag, 3-letter code } for the nations in the all-time list.
const COUNTRY_META: Record<string, { flag: string; code: string }> = {
  Germany: { flag: '🇩🇪', code: 'GER' },
  'West Germany': { flag: '🇩🇪', code: 'FRG' },
  Brazil: { flag: '🇧🇷', code: 'BRA' },
  France: { flag: '🇫🇷', code: 'FRA' },
  Argentina: { flag: '🇦🇷', code: 'ARG' },
  Hungary: { flag: '🇭🇺', code: 'HUN' },
  Portugal: { flag: '🇵🇹', code: 'POR' },
  England: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
  Poland: { flag: '🇵🇱', code: 'POL' },
  Peru: { flag: '🇵🇪', code: 'PER' },
  Italy: { flag: '🇮🇹', code: 'ITA' },
  Spain: { flag: '🇪🇸', code: 'ESP' },
  Netherlands: { flag: '🇳🇱', code: 'NED' },
  Uruguay: { flag: '🇺🇾', code: 'URU' },
  Czechoslovakia: { flag: '🇨🇿', code: 'TCH' },
  Switzerland: { flag: '🇨🇭', code: 'SUI' },
  Russia: { flag: '🇷🇺', code: 'RUS' },
  'Soviet Union': { flag: '🇷🇺', code: 'URS' },
  Austria: { flag: '🇦🇹', code: 'AUT' },
  Ecuador: { flag: '🇪🇨', code: 'ECU' },
  Croatia: { flag: '🇭🇷', code: 'CRO' },
  Colombia: { flag: '🇨🇴', code: 'COL' },
  Bulgaria: { flag: '🇧🇬', code: 'BUL' },
  Ghana: { flag: '🇬🇭', code: 'GHA' },
  Cameroon: { flag: '🇨🇲', code: 'CMR' },
  Sweden: { flag: '🇸🇪', code: 'SWE' },
  Denmark: { flag: '🇩🇰', code: 'DEN' },
  Belgium: { flag: '🇧🇪', code: 'BEL' },
  'Northern Ireland': { flag: '🇬🇧', code: 'NIR' },
  Australia: { flag: '🇦🇺', code: 'AUS' },
  'United States': { flag: '🇺🇸', code: 'USA' },
};

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function computeAllTimeScorers(matches: Match[]): AllTimeRow[] {
  // WC26 goals per player name.
  const wc26ByName = new Map<string, number>();
  for (const s of computeTopScorers(matches, 999)) {
    const key = norm(s.name);
    wc26ByName.set(key, (wc26ByName.get(key) ?? 0) + s.count);
  }

  const merged = preData.players.map((p) => {
    const wc26 = wc26ByName.get(norm(p.player)) ?? 0;
    return { name: p.player, country: p.country, pre: p.goals, wc26, total: p.goals + wc26, preRank: p.rank };
  });

  // Competition rank on career total (players with the same total share a rank).
  const rankOf = (total: number) => 1 + merged.filter((m) => m.total > total).length;

  return [...merged]
    .sort((a, b) => b.total - a.total || b.pre - a.pre || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map((m, i) => {
      const meta = COUNTRY_META[m.country] ?? { flag: '🏳️', code: m.country.slice(0, 3).toUpperCase() };
      const combinedRank = rankOf(m.total);
      return {
        rank: i + 1,
        name: m.name,
        flag: meta.flag,
        code: meta.code,
        total: m.total,
        pre: m.pre,
        wc26: m.wc26,
        isTop: combinedRank === 1,
        movedUp: m.wc26 > 0 && combinedRank < m.preRank,
        active: m.wc26 > 0,
      };
    });
}

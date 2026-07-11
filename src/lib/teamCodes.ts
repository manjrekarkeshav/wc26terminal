/**
 * Resolve a country display name (as prediction markets label them) to its FIFA
 * 3-letter code — the same code ESPN uses as a team abbreviation. Shared by the
 * Cloudflare Worker (Polymarket proxy) and the client so market data attaches
 * robustly regardless of spelling ("USA" vs "United States", diacritics, etc.).
 */

import rankings from '../data/fifa-rankings-2026.json';

export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (Côte d'Ivoire → cote divoire)
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Canonical names from the bundled FIFA rankings (code === ESPN abbreviation).
const NAME_TO_CODE: Record<string, string> = {};
for (const r of rankings.rankings) NAME_TO_CODE[normName(r.team)] = r.code;

// Colloquial / bookmaker spellings that differ from FIFA's canonical name.
const ALIASES: Record<string, string> = {
  usa: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  'south korea': 'KOR',
  'korea republic': 'KOR',
  'north korea': 'PRK',
  'korea dpr': 'PRK',
  'ivory coast': 'CIV',
  iran: 'IRN',
  'ir iran': 'IRN',
  'saudi arabia': 'KSA',
  'south africa': 'RSA',
  czechia: 'CZE',
  'czech republic': 'CZE',
  'cape verde': 'CPV',
  'cabo verde': 'CPV',
  curacao: 'CUW',
  'dr congo': 'COD',
  'democratic republic of the congo': 'COD',
  'congo dr': 'COD',
  'republic of ireland': 'IRL',
  turkiye: 'TUR',
  turkey: 'TUR',
};

/** FIFA/ESPN 3-letter code for a display name, or null if it can't be resolved. */
export function codeFor(name: string): string | null {
  const n = normName(name);
  return NAME_TO_CODE[n] ?? ALIASES[n] ?? null;
}

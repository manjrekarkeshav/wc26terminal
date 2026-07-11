/**
 * Parse Polymarket's "World Cup Winner" event into per-team title odds.
 *
 * That event is a set of binary Yes/No markets — one per team ("Will Spain win the
 * 2026 FIFA World Cup?"). We take each team's "Yes" price as its title probability,
 * drop eliminated teams (≈0), map the name to a FIFA code, and renormalize the
 * survivors to sum to 100%. Shared by the Worker proxy and the dev middleware.
 */

import { codeFor } from './teamCodes';

export interface TitleOddsRow {
  code: string; // FIFA / ESPN abbreviation
  name: string; // display name as Polymarket labels it
  prob: number; // % (renormalized across live contenders)
}

interface RawMarket {
  question?: string;
  outcomes?: string;
  outcomePrices?: string;
}

const WINNER_RE = /Will (.+?) win the 20\d\d/i;

export function parseTitleOdds(events: unknown): TitleOddsRow[] {
  const list = Array.isArray(events) ? events : [];
  const markets: RawMarket[] =
    (list[0] as { markets?: RawMarket[] } | undefined)?.markets ?? [];

  const raw: TitleOddsRow[] = [];
  for (const m of markets) {
    const q = m.question ?? '';
    const mt = WINNER_RE.exec(q);
    if (!mt) continue;
    const code = codeFor(mt[1]);
    if (!code) continue;

    let outcomes: string[];
    let prices: number[];
    try {
      outcomes = JSON.parse(m.outcomes ?? '[]');
      prices = (JSON.parse(m.outcomePrices ?? '[]') as string[]).map(Number);
    } catch {
      continue;
    }
    if (prices.length !== outcomes.length) continue;
    const yesIdx = outcomes.findIndex((o) => /^yes$/i.test(String(o).trim()));
    if (yesIdx === -1) continue;

    const prob = prices[yesIdx] * 100;
    if (prob > 0.05) raw.push({ code, name: mt[1].trim(), prob }); // drop eliminated (~0)
  }

  const total = raw.reduce((s, r) => s + r.prob, 0) || 1;
  return raw
    .map((r) => ({ ...r, prob: (r.prob / total) * 100 }))
    .sort((a, b) => b.prob - a.prob);
}

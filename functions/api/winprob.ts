/**
 * Cloudflare Pages Function — /api/winprob
 *
 * Fetches soccer match markets from Polymarket's public Gamma API and normalizes them
 * into win-probability percentages keyed by "teama|teamb" (lowercased, sorted), so the
 * client can join them to ESPN fixtures by team name.
 *
 * A typical 3-way soccer market has outcomes ["Team A", "Draw", "Team B"] with
 * outcomePrices that already represent implied probabilities (they sum to ~1).
 *
 * Returns {} when no matching markets exist — the client then falls back to its model.
 */

const GAMMA = 'https://gamma-api.polymarket.com';
const CACHE_TTL_SECONDS = 60;

// Probabilities keyed by lowercased team name, plus a "draw" entry. The client maps
// its own home/away names onto these (the proxy can't know ESPN's home/away side).
type ProbEntry = Record<string, number>;

const DRAW_RE = /^(draw|tie)$/i;

export const onRequest: PagesFunction = async () => {
  const cache = caches.default;
  const cacheKey = new Request(`${GAMMA}/__winprob_cache`, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached.clone();

  const result: Record<string, ProbEntry> = {};

  try {
    // Pull active soccer markets. tag_slug filters to the soccer category.
    const url = `${GAMMA}/markets?active=true&closed=false&limit=500&tag_slug=soccer`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });

    if (res.ok) {
      const markets = (await res.json()) as MarketRaw[];
      for (const m of markets) {
        const parsed = parseMarket(m);
        if (parsed) result[parsed.key] = parsed.probs;
      }
    }
  } catch (err) {
    console.error('Polymarket fetch error:', err);
  }

  const response = json(result, { 'Cache-Control': `s-maxage=${CACHE_TTL_SECONDS}` });
  await cache.put(cacheKey, response.clone());
  return response;
};

interface MarketRaw {
  outcomes?: string;       // JSON string: ["Team A","Draw","Team B"]
  outcomePrices?: string;  // JSON string: ["0.55","0.25","0.20"]
}

function parseMarket(m: MarketRaw): { key: string; probs: ProbEntry } | null {
  if (!m.outcomes || !m.outcomePrices) return null;
  let outcomes: string[];
  let prices: number[];
  try {
    outcomes = JSON.parse(m.outcomes);
    prices = (JSON.parse(m.outcomePrices) as string[]).map(Number);
  } catch {
    return null;
  }
  if (outcomes.length !== 3 || prices.length !== 3) return null;

  const drawIdx = outcomes.findIndex((o) => DRAW_RE.test(o.trim()));
  if (drawIdx === -1) return null;
  const teamIdx = [0, 1, 2].filter((i) => i !== drawIdx);
  const [aIdx, bIdx] = teamIdx;
  const a = outcomes[aIdx].trim();
  const b = outcomes[bIdx].trim();

  const total = prices.reduce((s, p) => s + p, 0) || 1;
  const key = [a.toLowerCase(), b.toLowerCase()].sort().join('|');
  return {
    key,
    probs: {
      [a.toLowerCase()]: (prices[aIdx] / total) * 100,
      [b.toLowerCase()]: (prices[bIdx] / total) * 100,
      draw: (prices[drawIdx] / total) * 100,
    },
  };
}

function json(body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

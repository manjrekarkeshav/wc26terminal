/**
 * Cloudflare Worker — serves the WC26 Terminal SPA and its two API routes.
 *
 * Static assets (the built dist/) are served via the ASSETS binding. The Worker only
 * handles /api/* requests:
 *   - /api/data    → cached ESPN scoreboard proxy (full tournament window)
 *   - /api/winprob → cached Polymarket win-probability proxy
 *
 * (Replaces the Pages-style functions/ directory, since this account deploys as a Worker.)
 */

import { codeFor } from '../src/lib/teamCodes';
import { parseTitleOdds } from '../src/lib/titleOdds';

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200';
const GAMMA = 'https://gamma-api.polymarket.com';
const CACHE_TTL = 10; // seconds for ESPN
const WINPROB_TTL = 60; // seconds for Polymarket
const TITLEODDS_TTL = 300; // seconds for Polymarket title odds (move slowly)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/data') return handleData();
    if (url.pathname === '/api/winprob') return handleWinprob();
    if (url.pathname === '/api/titleodds') return handleTitleOdds();
    return env.ASSETS.fetch(request);
  },
};

function json(body: unknown, ttl: number, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `s-maxage=${ttl}`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── /api/data : ESPN scoreboard proxy ─────────────────────────────────────────
async function handleData(): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(ESPN_URL);

  const cached = await cache.match(cacheKey);
  if (cached) {
    const body = await cached.json();
    return json({ ...(body as object), fetchedAt: Date.now() }, CACHE_TTL);
  }

  try {
    const upstream = await fetch(ESPN_URL, {
      headers: { 'User-Agent': 'WC26Dash/1.0' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!upstream.ok) throw new Error(`ESPN ${upstream.status}`);
    const data = await upstream.json();
    const payload = { ...(data as object), fetchedAt: Date.now() };
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_TTL}` },
      }),
    );
    return json(payload, CACHE_TTL);
  } catch (err) {
    console.error('ESPN fetch error:', err);
    return json({ events: [], fetchedAt: Date.now(), isStale: true }, CACHE_TTL, 503);
  }
}

// ─── /api/winprob : Polymarket proxy ───────────────────────────────────────────
const DRAW_RE = /^(draw|tie)$/i;

async function handleWinprob(): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${GAMMA}/__winprob_cache`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached.clone();

  const result: Record<string, Record<string, number>> = {};
  try {
    const url = `${GAMMA}/markets?active=true&closed=false&limit=500&tag_slug=soccer`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8_000) });
    if (res.ok) {
      const markets = (await res.json()) as { outcomes?: string; outcomePrices?: string }[];
      for (const m of markets) {
        const parsed = parseMarket(m);
        if (parsed) result[parsed.key] = parsed.probs;
      }
    }
  } catch (err) {
    console.error('Polymarket fetch error:', err);
  }

  const response = json(result, WINPROB_TTL);
  await cache.put(cacheKey, response.clone());
  return response;
}

function parseMarket(m: { outcomes?: string; outcomePrices?: string }) {
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
  const [aIdx, bIdx] = [0, 1, 2].filter((i) => i !== drawIdx);
  // Resolve both sides to FIFA codes; skip the market unless BOTH map confidently.
  const aCode = codeFor(outcomes[aIdx]);
  const bCode = codeFor(outcomes[bIdx]);
  if (!aCode || !bCode) return null;
  const total = prices.reduce((s, p) => s + p, 0) || 1;
  const key = [aCode, bCode].sort().join('|');
  return {
    key,
    probs: {
      [aCode]: (prices[aIdx] / total) * 100,
      [bCode]: (prices[bIdx] / total) * 100,
      draw: (prices[drawIdx] / total) * 100,
    },
  };
}

// ─── /api/titleodds : Polymarket "World Cup Winner" outright odds ───────────────
async function handleTitleOdds(): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${GAMMA}/__titleodds_cache`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached.clone();

  let teams: ReturnType<typeof parseTitleOdds> = [];
  try {
    const res = await fetch(`${GAMMA}/events?slug=world-cup-winner`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) teams = parseTitleOdds(await res.json());
  } catch (err) {
    console.error('Polymarket title-odds fetch error:', err);
  }

  const response = json({ teams, fetchedAt: Date.now() }, TITLEODDS_TTL);
  await cache.put(cacheKey, response.clone());
  return response;
}

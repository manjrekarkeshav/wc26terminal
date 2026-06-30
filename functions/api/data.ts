/**
 * Cloudflare Pages Function — /api/data
 *
 * Fetches the full WC 2026 tournament window from ESPN (Jun 11 – Jul 19)
 * so all 12 groups and knockout matches are always present.
 * Caches the merged payload for ~10s using Cloudflare's Cache API.
 */

const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// WC 2026: group stage starts Jun 11, final Jul 19. Static range covers everything.
const TOURNAMENT_URL = `${ESPN_BASE}?dates=20260611-20260719&limit=200`;

const CACHE_TTL_SECONDS = 10;

export const onRequest: PagesFunction = async ({ request }) => {
  const cache = caches.default;
  const cacheKey = new Request(TOURNAMENT_URL, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) {
    const body = await cached.json();
    return json({ ...body, fetchedAt: Date.now() });
  }

  try {
    const upstream = await fetch(TOURNAMENT_URL, {
      headers: { 'User-Agent': 'WC26Dash/1.0' },
      signal: AbortSignal.timeout(8_000),
    });

    if (!upstream.ok) throw new Error(`ESPN ${upstream.status}`);

    const data = await upstream.json();
    const payload = { ...data, fetchedAt: Date.now() };

    await cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      }),
    );

    return json(payload, {
      'Cache-Control': `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=5`,
    });
  } catch (err) {
    console.error('ESPN fetch error:', err);
    return json({ events: [], fetchedAt: Date.now(), isStale: true }, {}, 503);
  }
};

function json(body: unknown, extraHeaders: Record<string, string> = {}, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

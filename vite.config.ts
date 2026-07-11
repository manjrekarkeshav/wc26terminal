import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

const GAMMA = 'https://gamma-api.polymarket.com'

/**
 * Dev-only middleware that serves the Worker's Polymarket-backed routes locally, so
 * the Vite preview renders the SAME data as the deployed site (no `wrangler dev`
 * needed). It reuses the exact shared parsers the Worker uses via ssrLoadModule, so
 * dev and prod can never drift. In production these routes are served by worker/index.ts.
 */
function devApi(): PluginOption {
  return {
    name: 'wc26-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/titleodds') return next()
        let teams: unknown[] = []
        try {
          const { parseTitleOdds } = (await server.ssrLoadModule('/src/lib/titleOdds.ts')) as {
            parseTitleOdds: (events: unknown) => unknown[]
          }
          const r = await fetch(`${GAMMA}/events?slug=world-cup-winner`, {
            headers: { Accept: 'application/json' },
          })
          teams = parseTitleOdds(r.ok ? await r.json() : [])
        } catch (err) {
          server.config.logger.warn(`[wc26-dev-api] title odds failed: ${err}`)
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ teams, fetchedAt: Date.now() }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devApi()],
  server: {
    proxy: {
      // Proxies /api/data → ESPN full tournament range so all 12 groups are present locally.
      // In production, worker/index.ts does the same thing.
      '/api/data': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: () =>
          '/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200',
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    proxy: {
      // Proxies /api/data → ESPN full tournament range so all 12 groups are present locally.
      // In production, functions/api/data.ts (Cloudflare Pages Function) does the same thing.
      '/api/data': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: () =>
          '/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200',
      },
    },
  },
})
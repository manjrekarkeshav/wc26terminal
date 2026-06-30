# WC26Dash — Project Memory

A live 2026 World Cup dashboard (Bloomberg-terminal feel, black & gold). Portfolio
project for Keshav (Staff PM). Goal: ship a clean, fast, live dashboard.

## Stack & deploy
- Vite + React + TypeScript + Tailwind. Node LTS.
- **Cloudflare Pages + Workers + KV** (DECISION: chosen over Vercel — krmank.com DNS
  is already on Cloudflare; Workers+KV fits the cached-proxy design).

## Architecture at a glance
- ESPN public API → Cloudflare Worker proxy (poll once, ~10s KV cache, fan out to all
  users) → React SPA (polls 10s during live matches, 60s idle).
- Group standings AND knockout bracket are **computed client-side from results** —
  ESPN's standings endpoint is unreliable for group stages.
- All ESPN normalization lives in ONE seam: `src/lib/espn.ts` (swap for `openf1.ts`
  to reuse the engine for the later F1 dashboard).
- Bundled `public/schedule.json` fallback — never look broken when data is down.
- All times local.

## Data sources
- Scoreboard: `site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
- FIFA rankings: `docs/fifa-rankings-2026.json` (top 100, official as of 2026-06-11) —
  powers the rank superscripts in group standings and bracket seeding.
- Win %: Polymarket markets → DraftKings → model fallback.

## MVP scope (build first — end-to-end with live data before anything else)
- Happening Now (live cards) · Upcoming (day-grouped) · Recent Results (cards) ·
  Golden Boot (top scorers + assists) · Knockout Bracket (R32 "as it stands") ·
  Group Standings (computed) · 3rd-Place Race.
- **Win probability % bars (home/away) on Upcoming rows + live cards — IN MVP.**
  (Moved up from v2. Use Polymarket → DraftKings → model fallback; show the source tag.)
- Live red blinking dot on bracket team names only while that match is in progress.
- Filters: Team OR Location, mutually exclusive.
- Dark + Light themes.

## v2 (only after the MVP renders real ESPN data)
- Monte Carlo title odds + "simulate tournament" (distinct from "as it stands").
- Match notifications; PWA / offline.
- Top-20 scorer/assist expansion polish.

## Design (locked — match `docs/prototype.html` exactly)
- Black & gold: near-black background, gold as the single brand accent.
- Green = qualification / advancing. Blue + green = win-probability bars.
  Red = live / eliminated.
- Fonts: Space Grotesk (UI/headers) + Space Mono (countdowns, scores, tabular data).
- Browser tab: title "WC26 TERMINAL", soccer-ball favicon.
- Footer credit: "Made by Keshav Manjrekar · krmank.com" (subtle, not a loud box).
- No news ticker (removed). Section order: Live → Upcoming → Recent Results →
  Golden Boot → Bracket → Groups → 3rd-Place Race.

## Conventions
- Match the prototype; make minimal changes; don't refactor unrelated code.
- Run the type check after changes.
- Full plan in `docs/PLAN.md`; component map in `docs/COMPONENTS.md`; visual spec in
  `docs/prototype.html`. Reference them rather than duplicating here.

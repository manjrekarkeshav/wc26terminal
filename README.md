# WC26 Terminal

A live, information-dense **2026 FIFA World Cup dashboard** with a Bloomberg-terminal feel (black & gold). Built as a fast, real-data single-page app served from the edge.

**Live:** [wc26.krmank.com](https://wc26.krmank.com)

![WC26 Terminal dashboard](public/overview.png)

---

## Features

- **Happening Now** — live match cards with scores, match clock, scorers, and win-probability bars. Fixtures appear 30 minutes before kickoff (and drop out of Upcoming so they never show twice), the empty state counts down to the next kickoff, and a red **Delayed** badge surfaces postponed matches.
- **Upcoming** — day-grouped fixtures with local kickoff times, live countdowns, colour-coded round tags, and win-probability bars showing both nations.
- **Recent Results** — final-score cards with:
  - goal scorers on hover, and **yellow + red card** detail (who and when);
  - a **Penalties** tag and shootout score for matches decided on penalties;
  - a colour-coded **round tag** (Group / R32 / R16 / QF …) on every card;
  - a **⚡ Shocker** highlight (whole card tinted red) when a top-10 side is held or beaten by a team ranked 20+ places below.
- **Golden Boot** — top scorers computed live from match events. Hover a player for a per-goal breakdown (minute, opponent, scoreline, and the round it came in), plus a 🟢 / ❌ marker showing whether their nation is still alive in the tournament.
- **All-time top scorers** — career World Cup goals (bundled pre-2026 totals + live WC26 goals), shown beside the Golden Boot. Marks the all-time leader (⭐️), active vs retired players (🟢 / 🔴), and anyone climbing the ranking during WC26 (🔼); hover for the pre-2026 / WC26 split.
- **Knockout Bracket** — "as it stands," driven by real knockout fixtures: winners advance automatically (penalties included), with live indicators on in-progress matches, FIFA rank superscripts, penalty scores, and **Penalties / Shocker** tags.
- **Group Standings** — all 12 groups computed client-side from results (points, GD, qualification / elimination) with FIFA rank superscripts and average-rank per group.
- **3rd-Place Race** — the 8-of-12 best third-place teams ranked by FIFA tiebreakers.
- **Win probabilities** — Polymarket markets with a FIFA-ranking model fallback (source-tagged).
- **Filters** (team / location), **dark + light themes**, and a graceful **offline fallback** so it never looks broken when live data is down.
- **Fully responsive** — reworked for mobile, where the hover panels (goal scorers + match stats on Recent Results and the Bracket) open on **tap** and stay within the viewport.

## How it works

```
ESPN public API ─▶ Cloudflare Worker (proxy + ~10s edge cache) ─▶ React SPA
                                                                  (polls 10s live / 60s idle)
```

- A single **Cloudflare Worker** ([`worker/index.ts`](worker/index.ts)) serves the built SPA and proxies two cached API routes: `/api/data` (ESPN scoreboard) and `/api/winprob` (Polymarket).
- **Standings and the bracket are computed in the browser** from match results — ESPN's standings endpoint is unreliable for group stages.
- All ESPN normalization lives in one seam ([`src/lib/espn.ts`](src/lib/espn.ts)) so the rest of the app is source-agnostic.
- A bundled [`public/schedule.json`](public/schedule.json) is the fallback when live data is unavailable.

## Tech stack

Vite · React · TypeScript · Tailwind · Cloudflare Workers (static assets + edge functions). Data from the ESPN public API and Polymarket; FIFA rankings and all-time World Cup scorer records bundled from `docs/`.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173  (dev proxies /api/data to ESPN)
```

```bash
npm run build    # type-check + production build to dist/
```

## Deployment

Pushed to `main` → **Cloudflare** auto-builds (`npm run build`) and deploys the Worker (`npx wrangler deploy`). Static assets come from `dist/`; the Worker handles `/api/*`.

## License

[MIT](LICENSE) © Keshav Manjrekar

---

Made by **Keshav Manjrekar** · [krmank.com](https://www.krmank.com)

# WC26Dash — Build Plan (Layer 1)

> Living planning doc. Lives in the Claude.ai Project, not the repo.
> The repo's `CLAUDE.md` is the short, stable subset of this.

---

## 1. Goal & success criteria

Build a live-updating, information-dense 2026 World Cup dashboard — a replica of
worldcupdash.com's data model with an original design — as a personal +
portfolio project.

Three constraints, all must hold:
- **Cost ≈ $0** — free data, free hosting, free compute. Only spend is a domain.
- **Maximise app-building learning** — real-time data, caching, client-side
  computation, deploy pipeline.
- **Monetizable later** — clean enough to add ads / premium / affiliate without
  a rebuild.

**MVP is "done" when:** a deployed URL shows live scores, upcoming fixtures with
countdowns, recent results, group standings, and an "as it stands" knockout view;
auto-refreshes during live matches; renders all times in the viewer's timezone;
and never looks broken when ESPN data is unavailable (bundled-schedule fallback).

---

## 2. Scope — MVP vs v2

Ship the MVP spine first, then layer the flex.

| Area | Feature | Phase |
|---|---|---|
| Live | Live scores, auto-refresh every 10s during matches | MVP |
| Schedule | Upcoming fixtures + countdowns; filter by team/group/location | MVP |
| Results | Recent results, filterable | MVP |
| Standings | Group tables (top 2 advance + best-3rds rule label) | MVP |
| Bracket | Knockout "as it stands" (top 2 per group + best-8 thirds) | MVP |
| UX | Local times, single-page anchor nav, dark default, responsive | MVP |
| Resilience | Graceful fallback to bundled schedule + "live paused" banner | MVP |
| Growth | SEO meta + OG share image | MVP |
| Live | Win probability per match | v2 |
| Bracket | Monte Carlo simulation + title odds (separate from "as it stands") | v2 |
| Standings | 3rd-place race view; top scorers | v2 |
| Alerts | Match notifications (goals, red cards, kickoff, full time) | v2 |
| UX | Multiple themes (your design system lives here) | v2 |
| Platform | PWA install; changelog page | v2 |

**Hard rule:** never conflate "as it stands" (current qualification) with
"simulated" (projection). Separate, clearly labelled views.

---

## 3. Architecture (MVP)

Three moving parts, no database:

```
ESPN API  →  Data function (proxy + ~10s cache)  →  React SPA (polls every 10s)
                                                         ↑
                                              schedule.json (fallback on error)
```

- The SPA polls **one** internal endpoint (the data function) every 10s while
  matches are live, and backs off (~60s) when nothing is on. Countdowns tick
  client-side every second with no network call.
- The data function fetches ESPN, normalizes the response, and caches it ~10s, so
  one upstream poll serves all visitors. This is what dodges CORS (browsers can't
  reliably call ESPN directly) and keeps request volume tiny.
- **Standings and the bracket are computed in the browser from match results** —
  not fetched. ESPN scoreboard is the single source of truth; everything else is
  derived.
- On data-function error/empty: SPA renders the bundled `schedule.json` plus a
  visible "live updates paused" banner.

---

## 4. Data contract

### ESPN (unofficial public API — treat as best-effort, no auth)

- **Scoreboard (live + schedule + results):**
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
  - Params: `?dates=YYYYMMDD-YYYYMMDD&limit=950` to backfill a date range.
- **Teams:** `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams`
- **Standings (caveat):** `site/v2/.../standings` returns empty for soccer; the
  `https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings` variant
  exists but is unreliable for group stages. **Do not depend on it — compute
  standings from scoreboard results.**

### Normalized model (the app speaks this, not ESPN's shape)

Keep ALL ESPN→model mapping in `src/lib/espn.ts`. That single seam is what lets
F1 reuse the engine later (swap for `openf1.ts`).

```ts
type MatchStatus = 'pre' | 'live' | 'post';

interface Team   { id: string; name: string; abbrev: string; flag: string; group: string; }
interface Side   { team: Team; score: number | null; }
interface Match  {
  id: string; kickoffUTC: string; status: MatchStatus; minute?: number;
  home: Side; away: Side; group: string; venue: string; round: string;
}
interface StandingRow {
  team: Team; played: number; win: number; draw: number; loss: number;
  gf: number; ga: number; gd: number; points: number; rank: number;
}
interface GroupStanding { group: string; rows: StandingRow[]; }
interface BracketSlot   { round: string; slotId: string; home?: Team; away?: Team; qualified: boolean; }
```

### Computation rules
- **Standings:** tally from completed + live results. Order by points → goal
  difference → goals for. (Full FIFA head-to-head tiebreakers are a v2 refinement
  — note it in the UI if two teams are level on the simple criteria.)
- **"As it stands" bracket:** top 2 per group qualify; then rank the 12
  third-placed teams and take the best 8. Seeding the best-thirds into specific
  R32 slots follows FIFA's official mapping table — this is the fiddliest part of
  the MVP; implement the top-2 qualifiers first, then the thirds slotting.

### Refresh cadence
- Live match present → poll data function every **10s**.
- No live match → poll every **60s** (or on load only).
- Countdowns → client-side `setInterval`, 1s, no network.

### Fallback bundle
- `public/schedule.json` — static full fixture list shipped with the app. Used
  when the data function returns an error or empty payload.

### v2 — win probability
- Polymarket markets, with DraftKings / model fallback. Added as a second source
  inside the data function; cached alongside ESPN data.

---

## 5. Tech stack & repo structure

- **Frontend:** React + Vite + TypeScript, Tailwind for styling.
- **Data layer:** one serverless function — Vercel Function or Cloudflare Worker.
- **Cache:** in-memory in the function for MVP; Cloudflare KV in v2 (cross-edge
  consistency).
- **Hosting:** Vercel or Cloudflare Pages (free tier).
- **No database.**

```
WC26Dash/
├── CLAUDE.md                # short stable contract (already written)
├── public/
│   ├── schedule.json        # fallback bundle
│   └── og-image.png         # share card
├── api/ (or functions/)
│   └── data.ts              # proxy + cache: fetch ESPN, normalize, return JSON
├── src/
│   ├── lib/
│   │   ├── espn.ts          # ESPN → normalized model (the reuse seam)
│   │   ├── standings.ts     # compute group tables from results
│   │   └── bracket.ts       # compute "as it stands" R32
│   ├── components/
│   │   ├── MatchCard.tsx
│   │   ├── StandingsTable.tsx
│   │   ├── Bracket.tsx
│   │   └── ...
│   ├── hooks/usePolling.ts  # 10s/60s adaptive polling
│   └── App.tsx
└── docs/PLAN.md             # optional copy of this plan for on-demand reference
```

---

## 6. Build sequence (day-by-day)

**Day 1 — spine + live data**
- Scaffold Vite + React + TS + Tailwind in `WC26Dash`.
- Write `api/data.ts`: fetch ESPN scoreboard, normalize, cache ~10s, return JSON.
- Define types + `src/lib/espn.ts`.
- `usePolling` hook (10s live / 60s idle).
- Render "Happening Now" live scores + "Upcoming" with client-side countdowns.

**Day 2 — derived views + resilience + ship**
- `standings.ts` → group tables; `StandingsTable`.
- `bracket.ts` → "as it stands" R32; `Bracket`.
- Recent results + filters.
- Bundled `schedule.json` fallback + "live paused" banner.
- Responsive pass, dark theme, anchor nav, local-time formatting.
- SEO meta + OG image. **Deploy to Vercel/CF Pages. MVP is live.**

**Day 3+ — v2 flex (pick based on time/appetite)**
- Win probability (Polymarket source in data function).
- Monte Carlo sim + title odds (Web Worker so it doesn't block UI).
- Themes (your design system), notifications, top scorers, 3rd-place race,
  PWA, changelog.

> Target: MVP shippable in ~2 days, leaving room in the week for F1 next.

---

## 7. Design direction (to finalize separately)

This is the "your own design element" decision — deliberately kept out of the
data work. To settle before heavy coding:
- Prototype `MatchCard` and `StandingsTable` as chat artifacts, iterate on the
  look, then port into the repo.
- Decide the theme system (dark default; what your signature palette/typography
  is). The original ships Dark/Light/Pitch/Party/Roman — yours should differ.
- Bracket layout is the other high-visual-impact surface.

---

## 8. Deployment & domain

- Connect the repo to Vercel or Cloudflare Pages; auto-deploy on push.
- v2 secrets (model/API keys) via env vars — never committed.
- Point a domain at it (the only real cost, ~$10/yr).
- Generate a static `og-image.png` (1200×630) for the share card.

---

## 9. Risks & open decisions

- **ESPN is unofficial** and can change shape or rate-limit without notice — the
  normalization seam + fallback bundle are the insurance.
- **Standings/bracket reliability** — computing from results avoids the broken
  standings endpoint, but best-thirds R32 slotting is genuinely fiddly; budget
  time for it or ship top-2 qualifiers first.
- **CORS** — handled by routing all ESPN calls through the data function.
- **Tournament timing** — the live experience only shines during match windows;
  the standings/bracket/sim layer is what keeps it useful between matches.
- **Branding for monetization** — if you ever charge, keep branding generic;
  avoid FIFA/World Cup marks and official logos.
- **Open:** Vercel vs Cloudflare? (Either works; Cloudflare KV is the cleaner
  v2 cache story.) Decide at scaffold time.

---

## 10. Definition of done — MVP

- [ ] Deployed public URL.
- [ ] Live scores auto-refresh every 10s during matches.
- [ ] Upcoming fixtures with live countdowns; filters work.
- [ ] Recent results render.
- [ ] Group standings computed correctly from results.
- [ ] "As it stands" knockout view (top 2 per group at minimum).
- [ ] All times in viewer's local timezone.
- [ ] Graceful fallback + banner when ESPN data is down.
- [ ] Responsive; dark default; SEO + OG share card.

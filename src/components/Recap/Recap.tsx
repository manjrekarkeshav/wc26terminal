import { useState } from 'react';
import type { Match } from '../../lib/types';
import type { ScorerRow } from '../../lib/scorers';
import type { Podium } from '../../lib/tournament';
import { computeTotals } from '../../lib/tournament';
import { getUpset } from '../../lib/upsets';
import { flagFor } from '../../lib/espn';
import { ROUND_CLASS, ROUND_SHORT } from '../../lib/roundColors';
import awardsData from '../../data/awards-2026.json';

interface AwardEntry {
  player: string;
  code: string;
  detail: string;
}

const AWARD_LABELS: { key: keyof typeof awardsData.awards; label: string; icon: string }[] = [
  { key: 'goldenBall', label: 'Golden Ball', icon: '🏅' },
  { key: 'goldenGlove', label: 'Golden Glove', icon: '🧤' },
  { key: 'bestYoungPlayer', label: 'Best Young Player', icon: '⭐' },
];

const MAX_SHOCKERS = 4;

// Deeper rounds are the bigger shocks, so surface those first.
const ROUND_DEPTH: Record<string, number> = {
  'Group Stage': 0,
  'Round of 32': 1,
  'Round of 16': 2,
  Quarterfinals: 3,
  '3rd Place': 4,
  Semifinals: 4,
  Final: 5,
};

/**
 * Archive-mode tournament summary: champion, individual awards, headline totals and
 * the biggest upsets. Awards with no recorded winner are omitted rather than guessed —
 * only the Golden Boot is derivable from the match feed.
 */
export function Recap({
  matches,
  podium,
  scorers,
}: {
  matches: Match[];
  podium: Podium;
  scorers: ScorerRow[];
}) {
  const [allShocks, setAllShocks] = useState(false);
  const totals = computeTotals(matches);
  const boot = scorers[0];

  const allShockers = matches
    .filter((m) => m.status === 'post')
    .map((m) => ({ m, upset: getUpset(m) }))
    .filter((x): x is { m: Match; upset: { text: string } } => x.upset != null)
    .sort(
      (a, b) =>
        (ROUND_DEPTH[b.m.round ?? 'Group Stage'] ?? 0) -
        (ROUND_DEPTH[a.m.round ?? 'Group Stage'] ?? 0),
    );
  const shockers = allShocks ? allShockers : allShockers.slice(0, MAX_SHOCKERS);

  const awards = AWARD_LABELS.map((a) => ({
    ...a,
    entry: awardsData.awards[a.key] as AwardEntry,
  })).filter((a) => a.entry?.player?.trim());

  return (
    <>
      <div className="section-head" id="recap">
        <h2>Tournament recap</h2>
        <span className="sub">how WC26 finished</span>
      </div>
      <div className="stack">
        <div className="recap-grid">
          <div className="recap-stat">
            <span className="rs-lab">Champion</span>
            <span className="rs-val">
              <span className="fl">{podium.champion.flag}</span> {podium.champion.name}
            </span>
          </div>
          <div className="recap-stat">
            <span className="rs-lab">Matches played</span>
            <span className="rs-val tnum">{totals.matches}</span>
          </div>
          <div className="recap-stat">
            <span className="rs-lab">Goals scored</span>
            <span className="rs-val tnum">{totals.goals}</span>
          </div>
          <div className="recap-stat">
            <span className="rs-lab">Goals per match</span>
            <span className="rs-val tnum">
              {totals.matches ? (totals.goals / totals.matches).toFixed(2) : '–'}
            </span>
          </div>
        </div>

        <div className="recap-cols">
        <div className="panel recap-awards">
          <div className="phead">
            <span className="l">
              <span className="tick">◎</span>
              <span className="eyebrow">Individual awards</span>
            </span>
          </div>
          {boot && (
            <div className="award-row">
              <span className="aw-icon" aria-hidden="true">👟</span>
              <span className="aw-lab">Golden Boot</span>
              <span className="aw-who">
                <span className="fl">{boot.flag}</span> {boot.name}{' '}
                <span className="nat">{boot.teamAbbr}</span>
              </span>
              <span className="aw-detail tnum">{boot.count} goals</span>
            </div>
          )}
          {awards.map((a) => (
            <div className="award-row" key={a.key}>
              <span className="aw-icon" aria-hidden="true">{a.icon}</span>
              <span className="aw-lab">{a.label}</span>
              <span className="aw-who">
                <span className="fl">{flagFor(a.entry.code)}</span> {a.entry.player}{' '}
                <span className="nat">{a.entry.code}</span>
              </span>
              <span className="aw-detail">{a.entry.detail}</span>
            </div>
          ))}
        </div>

        {allShockers.length > 0 && (
          <div className="panel recap-shocks">
            <div className="phead">
              <span className="l">
                <span className="tick">◎</span>
                <span className="eyebrow">Biggest shocks</span>
              </span>
              <span className="count c-amber">{allShockers.length}</span>
            </div>
            {shockers.map(({ m, upset }) => {
              const round = m.round ?? 'Group Stage';
              return (
                <div className="shock-row" key={m.id}>
                  <span className={`goal-round ${ROUND_CLASS[round] ?? ''}`}>
                    {ROUND_SHORT[round] ?? round}
                  </span>
                  <span className="sh-txt">⚡ {upset.text}</span>
                  <span className="sh-score tnum">
                    {m.homeTeam.abbreviation} {m.homeScore ?? 0}–{m.awayScore ?? 0}{' '}
                    {m.awayTeam.abbreviation}
                  </span>
                </div>
              );
            })}
            {allShockers.length > MAX_SHOCKERS && (
              <button className="show-more" type="button" onClick={() => setAllShocks((v) => !v)}>
                {allShocks ? `Show top ${MAX_SHOCKERS}` : `Show all ${allShockers.length} shocks`}
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

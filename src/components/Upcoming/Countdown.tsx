import { useEffect, useState } from 'react';

function pad(n: number) { return String(n).padStart(2, '0'); }

function fmtCountdown(kickoffUtc: string): string {
  const diff = new Date(kickoffUtc).getTime() - Date.now();
  if (diff <= 0) return 'KICKOFF';
  const totalMins = Math.floor(diff / 60_000);
  const d = Math.floor(totalMins / 1440);
  const h = Math.floor((totalMins % 1440) / 60);
  const m = totalMins % 60;
  if (d > 0) return `${d}d ${h}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${pad(m)}m`;
}

export function Countdown({ kickoffUtc }: { kickoffUtc: string }) {
  const [label, setLabel] = useState(() => fmtCountdown(kickoffUtc));

  useEffect(() => {
    const id = setInterval(() => setLabel(fmtCountdown(kickoffUtc)), 30_000);
    return () => clearInterval(id);
  }, [kickoffUtc]);

  return <span className="cd tnum">{label}</span>;
}

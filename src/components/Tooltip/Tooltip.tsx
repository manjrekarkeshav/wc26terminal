import type { ReactNode } from 'react';

/**
 * Lightweight hover tooltip. Wraps a trigger; shows `lines` in a popup on hover.
 * Pure CSS (see .tip-wrap / .tip in index.css) — no positioning JS.
 */
export function Tooltip({
  children,
  lines,
  align = 'left',
  className,
}: {
  children: ReactNode;
  lines: ReactNode[];
  align?: 'left' | 'right';
  /** Extra class on the popup itself, e.g. to allow wrapping. */
  className?: string;
}) {
  if (lines.length === 0) return <>{children}</>;
  return (
    <span className="tip-wrap">
      {children}
      <span className={`tip tip-${align}${className ? ` ${className}` : ''}`} role="tooltip">
        {lines.map((line, i) => (
          <span className="tip-line" key={i}>
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}

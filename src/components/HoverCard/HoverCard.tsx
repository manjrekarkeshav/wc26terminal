import { useRef, useState, type ReactNode } from 'react';

/**
 * Hover popover anchored to the viewport (position: fixed), so it is NOT clipped by
 * ancestors with overflow (e.g. the horizontally-scrolling bracket). Renders `content`
 * above the trigger on hover/focus. Root is a block-level div so it can wrap cards.
 */
export function HoverCard({
  children,
  content,
  className,
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left + r.width / 2, top: r.top });
  };
  const hide = () => setPos(null);

  if (!content) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={`hovercard-trigger${className ? ` ${className}` : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      {children}
      {pos && (
        <div className="hovercard" role="tooltip" style={{ left: pos.left, top: pos.top }}>
          {content}
        </div>
      )}
    </div>
  );
}

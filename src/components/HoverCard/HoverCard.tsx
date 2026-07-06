import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Popover anchored to the viewport (position: fixed), so it is NOT clipped by ancestors
 * with overflow (e.g. the horizontally-scrolling bracket). Opens on hover/focus (desktop)
 * and on tap (touch) — tapping again, tapping outside, or scrolling closes it. Renders
 * `content` above the trigger. Root is a block-level div so it can wrap cards.
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
    // Clamp the (centered) panel within the viewport so far-left/right triggers — e.g. edge
    // boxes in the horizontally-scrolling bracket — aren't clipped. HALF = panel max-width / 2.
    const HALF = 130;
    const center = r.left + r.width / 2;
    const left = Math.min(Math.max(center, HALF + 8), window.innerWidth - HALF - 8);
    setPos({ left, top: r.top });
  };
  const hide = () => setPos(null);
  const toggle = () => (pos ? hide() : show());

  // While open (typically after a tap), close on any outside tap or scroll. The panel is
  // position:fixed and won't follow scroll, so closing avoids a detached, stale popover.
  useEffect(() => {
    if (!pos) return;
    const onDocPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) hide();
    };
    document.addEventListener('pointerdown', onDocPointer);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      window.removeEventListener('scroll', hide, true);
    };
  }, [pos]);

  if (!content) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={`hovercard-trigger${className ? ` ${className}` : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
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

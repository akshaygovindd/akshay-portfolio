"use client";

import { useEffect, useRef } from "react";

/**
 * One line of text scaled to span exactly the container's width.
 *
 * `ratio` (font-size / container-width) gives the right size in pure CSS via
 * container query units, so the headline is correct on first paint with no JS.
 * The effect then re-measures after fonts load as a safety net.
 */
export default function FitLine({
  children,
  ratio,
  reveal = false,
  delay = 0,
}: {
  children: string;
  ratio: number;
  /** Rise and wipe the whole line into view on load (the `reveal-line` animation in globals.css). */
  reveal?: boolean;
  /** Milliseconds before the line's reveal starts (so a second line can follow the first). */
  delay?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const text = textRef.current!;
    const REF = 100;
    const fit = () => {
      const available = box.clientWidth;
      if (!available) return; // hidden at this breakpoint
      text.style.fontSize = `${REF}px`;
      const natural = text.getBoundingClientRect().width;
      if (natural) text.style.fontSize = `${(REF * available) / natural}px`;
    };
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={boxRef} className="w-full" style={{ containerType: "inline-size" }}>
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap font-display uppercase leading-[0.88] tracking-tight${reveal ? " reveal-line" : ""}`}
        style={{ fontSize: `${ratio * 100}cqw`, ...(reveal && delay ? { animationDelay: `${delay}ms` } : {}) }}
      >
        {children}
      </span>
    </div>
  );
}

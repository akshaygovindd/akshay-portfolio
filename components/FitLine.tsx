"use client";

import { useEffect, useRef } from "react";

/**
 * One line of text scaled to span exactly the container's width.
 *
 * `ratio` (font-size / container-width) gives the right size in pure CSS via
 * container query units, so the headline is correct on first paint with no JS.
 * The effect then re-measures after fonts load as a safety net.
 */
export default function FitLine({ children, ratio }: { children: string; ratio: number }) {
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
        className="inline-block whitespace-nowrap font-display uppercase leading-[0.88] tracking-tight"
        style={{ fontSize: `${ratio * 100}cqw` }}
      >
        {children}
      </span>
    </div>
  );
}

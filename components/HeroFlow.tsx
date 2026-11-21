"use client";

import { useEffect, useRef } from "react";

/**
 * A faint stream of small "records" (dashes and dots) flowing left to right behind the hero text, like rows moving through a
 * pipeline. Pure CSS animation (transform only, so it runs on the compositor); the only JS pauses it while the hero is off
 * screen or the tab is hidden. It is decorative (aria-hidden), very low contrast (see .hero-flow-lane in globals.css) and
 * switched off under prefers-reduced-motion.
 */
const LANES: { y: number; opacity: number; seconds: number; colour: "accent" | "warm" }[] = [
  { y: 8, opacity: 0.1, seconds: 7.5, colour: "accent" },
  { y: 18, opacity: 0.07, seconds: 5.5, colour: "accent" },
  { y: 28, opacity: 0.12, seconds: 9, colour: "accent" },
  { y: 38, opacity: 0.06, seconds: 6.5, colour: "warm" },
  { y: 50, opacity: 0.09, seconds: 8, colour: "accent" },
  { y: 62, opacity: 0.12, seconds: 5, colour: "accent" },
  { y: 72, opacity: 0.07, seconds: 7, colour: "accent" },
  { y: 82, opacity: 0.06, seconds: 6, colour: "warm" },
  { y: 92, opacity: 0.1, seconds: 8.5, colour: "accent" },
];

export default function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = true;
    let tabVisible = !document.hidden;
    const apply = () => el.setAttribute("data-paused", String(!(onScreen && tabVisible)));
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      apply();
    });
    io.observe(el);
    const onVisibility = () => {
      tabVisible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="hero-flow" data-paused="false">
      {LANES.map((l, i) => (
        <div
          key={i}
          className="hero-flow-lane"
          style={
            {
              "--y": `${l.y}%`,
              "--o": l.opacity,
              "--dur": `${l.seconds}s`,
              "--c": l.colour === "accent" ? "var(--accent-ink)" : "var(--warm-ink)",
              animationDelay: `${-(i * 1.3)}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const NUMBER = /([+-]?)(\d[\d,]*(?:\.\d+)?)/g;

type Token = { text: string } | { sign: string; target: number; decimals: number; commas: boolean };

function tokenize(value: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of value.matchAll(NUMBER)) {
    if (m.index! > last) out.push({ text: value.slice(last, m.index) });
    const digits = m[2];
    out.push({ sign: m[1], target: Number(digits.replace(/,/g, "")), decimals: digits.includes(".") ? digits.split(".")[1].length : 0, commas: digits.includes(",") });
    last = m.index! + m[0].length;
  }
  if (last < value.length) out.push({ text: value.slice(last) });
  return out;
}

/**
 * A stat that counts up once, when it scrolls into view. Every number in the text counts (so "35/35" and "+10.9 to +23.3 pts"
 * work), with the same decimals and signs, and it always ends on the exact string from the config.
 *
 * The real text stays in the page the whole time (screen readers, no-JS, search engines and the layout all see the final value);
 * while counting it is only made transparent and an aria-hidden copy is drawn over it, so nothing around it can move.
 * With prefers-reduced-motion it does nothing.
 */
export default function CountUp({ value }: { value: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !/\d/.test(value) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tokens = tokenize(value);
    const DURATION = 1300;
    let raf = 0;
    let overlay: HTMLSpanElement | null = null;

    const render = (eased: number) =>
      tokens
        .map((t) => {
          if ("text" in t) return t.text;
          const v = t.target * eased;
          const body = t.commas
            ? v.toLocaleString("en-US", { minimumFractionDigits: t.decimals, maximumFractionDigits: t.decimals })
            : v.toFixed(t.decimals);
          return t.sign + body;
        })
        .join("");

    const finish = () => {
      overlay?.remove();
      overlay = null;
      delete root.dataset.counting;
    };
    const run = () => {
      overlay = document.createElement("span");
      overlay.setAttribute("aria-hidden", "true");
      overlay.className = "count-overlay";
      root.appendChild(overlay);
      root.dataset.counting = "true";
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION);
        overlay!.textContent = render(1 - Math.pow(1 - p, 3)); // ease out
        if (p < 1) raf = requestAnimationFrame(frame);
        else finish();
      };
      overlay.textContent = render(0);
      raf = requestAnimationFrame(frame);
    };

    // start as the stat enters the bottom of the screen, so it is already counting by the time it is fully visible
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      finish();
    };
  }, [value]);

  return (
    <span ref={rootRef} className="count-up">
      <span className="count-real">{value}</span>
    </span>
  );
}

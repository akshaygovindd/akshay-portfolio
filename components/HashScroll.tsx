"use client";

import { useEffect } from "react";

/**
 * Makes links like /#projects (from a case study, the 404 page, a shared link) land on their section.
 *
 * On its own the browser (or Next) scrolls to the hash early, and then ScrollTrigger's start-up refresh scrolls to 0
 * to measure the page and "restores" the old position, which undoes it. So on 9 of 10 visits the visitor ended up
 * at the top of the home page. This puts the section back in view, checking every 60 ms at first and then every
 * 150 ms for about 2.5 s (long enough to outlast the refreshes), and stops at once if the visitor scrolls, presses a key
 * or touches the page, so it never fights them. It does nothing when there is no hash or no such element.
 */
export default function HashScroll() {
  useEffect(() => {
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // a malformed hash: nothing to scroll to
    }
    if (!id) return;

    let stopped = false;
    let timer = 0;
    const start = performance.now();
    const stop = () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    const inputs = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    inputs.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));

    const settle = () => {
      if (stopped) return;
      const el = document.getElementById(id);
      if (el) {
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0; // sections leave room for the fixed nav
        if (Math.abs(el.getBoundingClientRect().top - margin) > 6) el.scrollIntoView({ behavior: "instant", block: "start" });
      }
      const elapsed = performance.now() - start;
      if (elapsed < 2500) timer = window.setTimeout(settle, elapsed < 600 ? 60 : 150);
    };
    settle();

    return () => {
      stop();
      inputs.forEach((e) => window.removeEventListener(e, stop));
    };
  }, []);
  return null;
}

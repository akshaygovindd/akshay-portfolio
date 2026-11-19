"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * All scroll storytelling in one place (GSAP + ScrollTrigger only). It finds its targets by
 * data attribute, so the section components stay plain server-rendered markup:
 *   [data-title]    outline title that fills with colour as it scrolls through
 *   [data-reveal]   rows that fade/slide in one by one
 *   [data-parallax] floating shapes (data-speed = px travel, data-rotate = initial degrees)
 *   [data-curtain]  light panels that slide up over the section above
 *   [data-stack]    project cards: previous card scales down as the next slides over it
 *   [data-marquee]  infinite tools marquee, pauses on hover/focus
 * With prefers-reduced-motion nothing is animated; globals.css renders the static versions.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        desktop: "(min-width: 1024px)",
        shapes: "(min-width: 640px)",
      },
      (ctx) => {
        if (ctx.conditions?.reduce) return;
        const cleanups: (() => void)[] = [];
        const all = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel);

        // 1. Outline titles fill left-to-right while scrolling through them
        all<HTMLElement>("[data-title]").forEach((el) => {
          const fill = el.querySelector<HTMLElement>(".title-fill");
          if (!fill) return;
          gsap.fromTo(
            fill,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 88%", end: "top 38%", scrub: 0.6 },
            },
          );
        });

        // 2. Rows reveal one by one
        all<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 48,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none none" },
          });
        });

        // 3. Floating shapes: slow parallax (hidden on phones via CSS)
        if (ctx.conditions?.shapes) {
          all<HTMLElement>("[data-parallax]").forEach((el) => {
            const speed = Number(el.dataset.speed ?? -80);
            const rotate = Number(el.dataset.rotate ?? 0);
            const host = el.closest("section") ?? el;
            gsap.fromTo(
              el,
              { y: 0, rotation: rotate },
              {
                y: speed,
                rotation: rotate + 25,
                ease: "none",
                scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: true },
              },
            );
          });
        }

        // 4. Curtain panels slide up over the section above
        all<HTMLElement>("[data-curtain]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 80 },
            {
              y: 0,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: true },
            },
          );
        });

        // 5. Stacking project cards (desktop): previous card scales down under the next
        if (ctx.conditions?.desktop) {
          const cards = all<HTMLElement>("[data-stack]");
          cards.forEach((card, i) => {
            const next = cards[i + 1];
            if (!next) return;
            gsap.to(card, {
              scale: 0.94,
              filter: "brightness(0.7)",
              transformOrigin: "50% 0%",
              ease: "none",
              scrollTrigger: { trigger: next, start: "top 92%", end: "top 22%", scrub: true },
            });
          });
        }

        // 6. Tools marquee: endless loop, pauses on hover / keyboard focus
        const track = document.querySelector<HTMLElement>("[data-marquee]");
        if (track) {
          const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
          const host = track.closest<HTMLElement>("[data-marquee-root]") ?? track;
          const pause = () => loop.pause();
          const play = () => loop.play();
          host.addEventListener("pointerenter", pause);
          host.addEventListener("pointerleave", play);
          cleanups.push(() => {
            host.removeEventListener("pointerenter", pause);
            host.removeEventListener("pointerleave", play);
          });
        }

        return () => cleanups.forEach((fn) => fn());
      },
    );

    // Fonts change text widths/heights: re-measure all triggers once they have loaded.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, []);

  return null;
}

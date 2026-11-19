"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const RATIO = 897 / 1200; // height / width of every image (avatar and desk poses)
const FADE = 0.25;

const POSES = ["typing", "think", "point", "music", "wave"] as const;
type Pose = (typeof POSES)[number];

/**
 * Which desk pose to show while each section is in view.
 * Sections not listed here (About) keep the previous section's pose.
 */
const SECTION_POSES: { id: string; pose: Pose }[] = [
  { id: "experience", pose: "typing" },
  { id: "projects", pose: "think" },
  { id: "skills", pose: "music" },
  { id: "demos", pose: "point" },
  { id: "contact", pose: "wave" },
];

type Geometry = { w: number; x: number; y: number };

function geometry(): { hero: Geometry; corner: Geometry } {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const phone = vw < 640;
  const stacked = vw < 1024; // hero copy is stacked above the avatar
  const heroW = stacked ? Math.min(vw * 0.7, 420) : Math.min(vw * 0.54, 840);
  const cornerW = phone ? 100 : 160;
  const margin = phone ? 8 : 16;
  return {
    hero: { w: heroW, x: (vw - heroW) / 2, y: vh - heroW * RATIO },
    corner: { w: cornerW, x: vw - cornerW - margin, y: vh - cornerW * RATIO - margin },
  };
}

/**
 * Tablet/desktop: page content keeps a free gutter (see .section in globals.css), so the
 * corner avatar sits above the page at z-40 and never overlaps anything.
 * Phones have no room for a gutter, so the avatar goes *behind* the content (z-index -1):
 * text and buttons always render on top of it.
 */
const cornerZ = () => (document.documentElement.clientWidth < 640 ? "-1" : "40");

export default function Companion() {
  const rootRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLImageElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const floatEl = floatRef.current!;
    const tilt = tiltRef.current!;
    const avatar = avatarRef.current!;
    const desk = deskRef.current!;
    const hero = document.getElementById("top");
    if (!hero) return;

    const deskImgs = Array.from(desk.querySelectorAll<HTMLImageElement>("img[data-pose]"));
    const imgFor = (p: Pose) => deskImgs.find((i) => i.dataset.pose === p)!;

    // Reveal only after every image is decoded, so poses never flash in.
    // (The hero copy is plain HTML and never waits on this.)
    let revealed = false;
    const ready = Promise.all(
      [avatar, ...deskImgs].map((img) => img.decode().catch(() => undefined)),
    );
    const timeout = new Promise((r) => setTimeout(r, 3000));
    const whenReady = Promise.race([ready, timeout]);

    const mm = gsap.matchMedia();

    mm.add(
      { reduce: "(prefers-reduced-motion: reduce)", motion: "(prefers-reduced-motion: no-preference)" },
      (ctx) => {
        const reduce = !!ctx.conditions?.reduce;
        const cleanups: (() => void)[] = [];

        /* ---------------- Reduced motion: static corner avatar ---------------- */
        if (reduce) {
          const place = () => {
            const g = geometry().corner;
            gsap.set(root, { width: g.w, x: g.x, y: g.y, zIndex: Number(cornerZ()) });
          };
          gsap.set(avatar, { opacity: 0 });
          gsap.set(desk, { opacity: 1 });
          deskImgs.forEach((i) => gsap.set(i, { opacity: i.dataset.pose === "typing" ? 1 : 0 }));
          place();

          const show = (on: boolean) => gsap.set(root, { opacity: on ? 1 : 0 });
          let heroGone = false;
          whenReady.then(() => {
            revealed = true;
            show(heroGone);
          });
          const st = ScrollTrigger.create({
            trigger: hero,
            start: "bottom 70%",
            onEnter: () => {
              heroGone = true;
              if (revealed) show(true);
            },
            onLeaveBack: () => {
              heroGone = false;
              show(false);
            },
          });
          ScrollTrigger.addEventListener("refresh", place);
          cleanups.push(() => {
            st.kill();
            ScrollTrigger.removeEventListener("refresh", place);
          });
          return () => cleanups.forEach((fn) => fn());
        }

        /* ---------------- Full motion ---------------- */
        let progress = 0; // 0 = big hero avatar, 1 = corner companion
        let sectionPose: Pose = "typing";
        let hovering = false;
        let shown: Pose = "typing";

        const inCorner = () => progress > 0.98;

        const applyPose = (next: Pose) => {
          if (next === shown) return;
          shown = next;
          deskImgs.forEach((img) =>
            gsap.to(img, {
              opacity: img.dataset.pose === next ? 1 : 0,
              duration: FADE,
              ease: "power1.inOut",
              overwrite: true,
            }),
          );
        };
        const desired = (): Pose => (hovering && inCorner() ? "wave" : sectionPose);

        gsap.set(deskImgs, { opacity: 0 });
        gsap.set(imgFor("typing"), { opacity: 1 });
        gsap.set(tilt, { transformPerspective: 900, transformOrigin: "50% 60%" });

        // Hero -> corner: scale/move, then crossfade the head into the desk pose.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: () => "+=" + window.innerHeight * 0.8,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progress = self.progress;
              const corner = inCorner();
              // Hover (wave) needs pointer events, only once docked in the corner.
              root.style.pointerEvents = corner ? "auto" : "none";
              root.style.zIndex = corner ? cornerZ() : "40";
              floatEl.classList.toggle("hero-float", progress < 0.02);
              if (!corner) hovering = false;
              applyPose(desired());
            },
          },
        });
        tl.fromTo(
          root,
          {
            width: () => geometry().hero.w,
            x: () => geometry().hero.x,
            y: () => geometry().hero.y,
          },
          {
            width: () => geometry().corner.w,
            x: () => geometry().corner.x,
            y: () => geometry().corner.y,
            ease: "power2.inOut",
            duration: 1,
          },
          0,
        );
        tl.fromTo(avatar, { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.35 }, 0.6);
        tl.fromTo(desk, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.35 }, 0.6);
        cleanups.push(() => tl.scrollTrigger?.kill());

        // Pose follows the section in view.
        SECTION_POSES.forEach(({ id, pose }) => {
          const el = document.getElementById(id);
          if (!el) return;
          const set = () => {
            sectionPose = pose;
            applyPose(desired());
          };
          const st = ScrollTrigger.create({
            trigger: el,
            start: "top 60%",
            end: "bottom 60%",
            onEnter: set,
            onEnterBack: set,
          });
          cleanups.push(() => st.kill());
        });

        // Hover -> wave (no click action).
        const onEnter = () => {
          hovering = true;
          applyPose(desired());
        };
        const onLeave = () => {
          hovering = false;
          applyPose(desired());
        };
        root.addEventListener("pointerenter", onEnter);
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          root.removeEventListener("pointerenter", onEnter);
          root.removeEventListener("pointerleave", onLeave);
        });

        // 3D tilt toward the cursor (fine pointers only), smoothed with quickTo.
        const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (canTilt) {
          const rotY = gsap.quickTo(tilt, "rotationY", { duration: 0.7, ease: "power3.out" });
          const rotX = gsap.quickTo(tilt, "rotationX", { duration: 0.7, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            if (window.innerWidth < 640 || progress > 0.05) return;
            const nx = (e.clientX / window.innerWidth - 0.5) * 2;
            const ny = (e.clientY / window.innerHeight - 0.5) * 2;
            rotY(nx * 16);
            rotX(-ny * 10);
          };
          const onScrollReset = () => {
            if (progress > 0.05) {
              rotY(0);
              rotX(0);
            }
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("scroll", onScrollReset, { passive: true });
          cleanups.push(() => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("scroll", onScrollReset);
            gsap.set(tilt, { rotationX: 0, rotationY: 0 });
          });
        }

        whenReady.then(() => {
          revealed = true;
          gsap.set(root, { opacity: 1 });
        });

        return () => cleanups.forEach((fn) => fn());
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      data-companion
      aria-hidden="true"
      className="fixed left-0 top-0 z-40"
      style={{ opacity: 0, pointerEvents: "none", width: "54vw" }}
    >
      <div ref={floatRef} className="hero-float">
        <div ref={tiltRef}>
          <div className="relative w-full" style={{ aspectRatio: "1200 / 897" }}>
            {/* eslint-disable @next/next/no-img-element */}
            <img
              ref={avatarRef}
              src="/avatar/avatar.webp"
              alt=""
              width={1200}
              height={897}
              fetchPriority="high"
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-contain"
            />
            <div ref={deskRef} className="absolute inset-0" style={{ opacity: 0 }}>
              {POSES.map((p) => (
                <img
                  key={p}
                  data-pose={p}
                  src={`/avatar/desk-${p}.webp`}
                  alt=""
                  width={600}
                  height={448}
                  loading="eager"
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none object-contain"
                  style={{ opacity: 0 }}
                />
              ))}
            </div>
            {/* eslint-enable @next/next/no-img-element */}
          </div>
        </div>
      </div>
    </div>
  );
}

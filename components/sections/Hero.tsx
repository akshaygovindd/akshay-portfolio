import { Download, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";
import FitLine from "@/components/FitLine";

// font-size / container-width that makes each line span the full width (measured for Anton)
const R_FULL = 0.1963;
const R_TOP = 0.4529;
const R_BOTTOM = 0.3737;

/** Same column as the nav and sections, so left/right edges line up. */
const COLUMN = "mx-auto w-full max-w-6xl px-5 sm:px-8";

export default function Hero() {
  const { hero, links } = site;
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-ink-fg lg:h-[100svh] lg:min-h-[640px]"
    >
      {/* Label (left) + availability badge (right), just under the nav */}
      <div className={`${COLUMN} pt-[4.25rem]`}>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:text-xs">
            {hero.label}
          </p>
          <p className="flex items-center gap-2.5 rounded-full border border-[#9B7AFF] bg-[#9B7AFF]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-fg sm:text-sm">
            <span
              className="pulse-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF9B55]"
              aria-hidden="true"
            />
            {hero.badge}
          </p>
        </div>
      </div>

      {/* Headline stays full-bleed: it sits behind the avatar */}
      <h1
        className="px-3 pt-[3svh] sm:px-5 lg:absolute lg:inset-x-0 lg:top-[17svh] lg:pt-0"
        aria-label="Hi, I'm Akshay"
      >
        <span aria-hidden="true">
          <span className="hidden sm:block">
            <FitLine ratio={R_FULL}>HI, I&apos;M AKSHAY</FitLine>
          </span>
          <span className="block space-y-2 sm:hidden">
            <FitLine ratio={R_TOP}>HI, I&apos;M</FitLine>
            <FitLine ratio={R_BOTTOM}>AKSHAY</FitLine>
          </span>
        </span>
      </h1>

      {/* Static avatar: shown only when animations are reduced (see globals.css) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar/avatar.webp"
        alt=""
        aria-hidden="true"
        width={1200}
        height={897}
        className="hero-static-avatar absolute bottom-0 left-1/2 w-[62vw] max-w-[380px] -translate-x-1/2 sm:w-[86vw] sm:max-w-[680px] lg:w-[54vw] lg:max-w-[840px]"
      />

      {/* Copy + buttons: stacked under the headline on small screens, anchored bottom on desktop */}
      <div
        className={`${COLUMN} relative z-[45] mt-5 lg:absolute lg:inset-x-0 lg:bottom-10 lg:top-[50svh] lg:mt-0 lg:flex lg:justify-between`}
      >
        <div className="lg:w-[min(24rem,26vw)] lg:min-w-[15rem]">
          <p className="text-lg font-semibold leading-snug sm:text-2xl lg:text-2xl">
            {hero.subheadline}
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-normal text-[#9B7AFF] sm:text-sm sm:tracking-wider lg:tracking-normal">
            {hero.roles}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base lg:text-sm">
            {hero.credentials}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 lg:mt-0 lg:flex-col lg:items-stretch lg:self-end">
          <a
            href="#projects"
            className="btn !border-transparent !bg-[#9B7AFF] !text-[#101014] hover:!brightness-110"
          >
            View my work
          </a>
          {links.resume && (
            <a
              href={links.resume}
              download
              className="btn !border-ink-border !bg-transparent !text-ink-fg hover:!border-[#9B7AFF]"
            >
              <Download size={16} /> Download resume
            </a>
          )}
          {links.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn !border-ink-border !bg-transparent !text-ink-fg hover:!border-[#9B7AFF]"
            >
              <Linkedin size={16} />
              <span className="sr-only sm:not-sr-only">LinkedIn</span>
            </a>
          )}
          {links.email && (
            <a
              href={`mailto:${links.email}`}
              className="btn !border-ink-border !bg-transparent !text-ink-fg hover:!border-[#9B7AFF]"
            >
              <Mail size={16} />
              <span className="sr-only sm:not-sr-only">Email</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

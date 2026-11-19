import { Download } from "lucide-react";
import { site } from "@/config/site";
import FitLine from "@/components/FitLine";

// font-size / container-width that makes each line span the full width (measured for Anton)
const R_FULL = 0.1963;
const R_TOP = 0.4529;
const R_BOTTOM = 0.3737;

export default function Hero() {
  const { hero, links } = site;
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-ink-fg lg:h-[100svh] lg:min-h-[640px]"
    >
      {/* Label (left) + availability badge (right), just under the nav */}
      <div className="flex items-start justify-between gap-3 px-4 pt-[4.25rem] sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:text-xs">
          {hero.label}
        </p>
        <p className="flex shrink-0 items-center gap-2 rounded-full border border-ink-border px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-ink-fg sm:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF9B55]" aria-hidden="true" />
          {hero.badge}
        </p>
      </div>

      {/* Headline sits behind the avatar */}
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
        className="hero-static-avatar absolute bottom-0 left-1/2 w-[70vw] max-w-[420px] -translate-x-1/2 lg:w-[54vw] lg:max-w-[840px]"
      />

      {/* Copy: stacked under the headline on small screens, anchored bottom-left on desktop */}
      <div className="relative z-[45] mt-5 px-4 sm:px-8 lg:absolute lg:bottom-10 lg:left-0 lg:mt-0 lg:w-[min(28rem,30vw)] lg:min-w-[16rem]">
        <p className="text-lg font-semibold leading-snug sm:text-xl lg:text-2xl">{hero.subheadline}</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-[#9B7AFF] sm:text-sm lg:tracking-normal">
          {hero.roles}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{hero.credentials}</p>
      </div>

      {/* Buttons */}
      <div className="relative z-[45] mt-5 flex flex-wrap gap-3 px-4 sm:px-8 lg:absolute lg:bottom-10 lg:right-0 lg:mt-0 lg:flex-col lg:items-stretch">
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
      </div>
    </section>
  );
}

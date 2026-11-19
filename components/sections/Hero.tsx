import { Download, Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";
import FitLine from "@/components/FitLine";
import TrackedLink from "@/components/TrackedLink";

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
        className="px-3 pb-[3vw] pt-[3svh] sm:px-5 lg:absolute lg:inset-x-0 lg:top-[17svh] lg:pb-0 lg:pt-0"
        aria-label="Hi, I'm Akshay"
      >
        <span aria-hidden="true">
          <span className="hidden sm:block">
            <FitLine ratio={R_FULL}>HI, I&apos;M AKSHAY</FitLine>
          </span>
          <span className="block space-y-6 sm:hidden">
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
        className="hero-static-avatar absolute -bottom-9 right-2 w-[60vw] max-w-[380px] sm:-bottom-[18px] sm:left-1/2 sm:right-auto sm:w-[86vw] sm:-translate-x-1/2 sm:max-w-[680px] lg:w-[54vw] lg:max-w-[840px]"
      />

      {/* Copy (left) and actions (right). Both start just below the headline's comma on desktop,
          flanking the avatar's head, instead of hugging the bottom corners. */}
      <div
        className={`${COLUMN} relative z-[45] mt-6 lg:absolute lg:inset-x-0 lg:top-[calc(17svh+20.41vw+20px)] lg:mt-0 lg:flex lg:justify-between`}
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

        <div className="mt-6 lg:mt-0 lg:w-56">
          {/* Two primary actions */}
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <a
              href="#projects"
              className="btn justify-center !border-transparent !bg-[#9B7AFF] !text-[#101014] hover:!brightness-110"
            >
              View my work
            </a>
            {links.resume && (
              <TrackedLink
                href={links.resume}
                download
                event="resume_download"
                eventProps={{ location: "hero" }}
                className="btn justify-center !border-ink-border !bg-transparent !text-ink-fg hover:!border-[#9B7AFF]"
              >
                <Download size={16} /> Download resume
              </TrackedLink>
            )}
          </div>
          {/* Small icon links */}
          <div className="mt-4 flex gap-2.5 sm:gap-3 lg:justify-end">
            {[
              links.linkedin && { href: links.linkedin, label: "LinkedIn", Icon: Linkedin, external: true },
              { href: links.github, label: "GitHub", Icon: Github, external: true },
              links.email && { href: `mailto:${links.email}`, label: "Email", Icon: Mail, external: false },
            ]
              .filter(Boolean)
              .map((l) => {
                const { href, label, Icon, external } = l as {
                  href: string;
                  label: string;
                  Icon: typeof Github;
                  external: boolean;
                };
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-ink-border text-ink-muted transition-colors hover:border-[#9B7AFF] hover:text-ink-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B7AFF]"
                  >
                    <Icon size={20} />
                    {/* Tooltip: visual only (the link already has an aria-label). Shows on hover
                        and on keyboard focus, sits below the icon so it never covers the buttons. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[#F3F1F7] px-2.5 py-1 text-xs font-medium text-[#101014] opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
                    >
                      {label}
                    </span>
                  </a>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

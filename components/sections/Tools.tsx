import { site } from "@/config/site";

/** Infinite tools marquee. Two identical copies; ScrollEffects slides the track -50% on loop. */
export default function Tools() {
  const list = site.tools;
  const Badge = ({ t }: { t: string }) => (
    <li className="shrink-0 rounded-full border border-ink-border bg-[#19191F] px-5 py-2.5 font-mono text-sm text-ink-fg">
      {t}
    </li>
  );
  return (
    <section
      aria-label="Tools and technologies"
      className="border-y border-ink-border bg-ink py-6 text-ink-fg"
    >
      {/* sm:mr-48 keeps the marquee clear of the corner avatar's column */}
      <div className="marquee-mask overflow-hidden sm:mr-48" data-marquee-root>
        <div className="marquee-track flex w-max gap-3" data-marquee>
          <ul className="flex shrink-0 gap-3">
            {list.map((t) => (
              <Badge key={t} t={t} />
            ))}
          </ul>
          <ul aria-hidden="true" className="marquee-dup flex shrink-0 gap-3">
            {list.map((t) => (
              <Badge key={t} t={t} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

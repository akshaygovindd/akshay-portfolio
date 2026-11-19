import { MapPin } from "lucide-react";
import { site } from "@/config/site";
import ScrollTitle from "@/components/ScrollTitle";
import FloatingShapes from "@/components/FloatingShapes";

export default function Experience() {
  const { work } = site;
  return (
    <section id="experience" className="relative">
      <FloatingShapes
        shapes={[
          { kind: "sphere", className: "right-[9%] top-24 h-32 w-32", speed: -140 },
          { kind: "ring", className: "right-[26%] top-52 h-20 w-20", speed: -70 },
        ]}
      />
      <div className="section relative z-10">
        <ScrollTitle>Experience</ScrollTitle>

        {/* Subtle timeline rail with one marker for the role */}
        <div className="relative border-l border-border pl-6 sm:pl-10">
          <span
            aria-hidden="true"
            className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-warm ring-4 ring-bg"
          />

          <header className="mb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{work.dates}</p>
            <h3 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-5xl">
              {work.role}
            </h3>
            <p className="mt-2 text-lg">
              {work.company}
              <span className="text-muted">
                {" · "}
                <MapPin size={14} className="mb-0.5 inline" /> {work.location}
              </span>
            </p>
          </header>

          <ol>
            {work.blocks.map((b, i) => (
              <li
                key={b.title}
                data-reveal
                className="grid grid-cols-[clamp(5.5rem,16vw,11.5rem)_1fr] items-start gap-x-4 border-t border-border py-8 first:mt-8 sm:gap-x-8 sm:py-12"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[clamp(4.5rem,13vw,10rem)] leading-[0.8] text-accent"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-3xl uppercase leading-[1.05] sm:text-5xl">
                    {b.value}
                  </p>
                  <h4 className="mt-3 text-sm font-semibold uppercase tracking-wider text-accent">
                    {b.title}
                  </h4>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted">{b.description}</p>
                  {b.tag && (
                    <p className="mt-5 inline-block rounded-full border border-warm/40 bg-warm/10 px-3 py-1 font-mono text-xs text-warm">
                      {b.tag}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

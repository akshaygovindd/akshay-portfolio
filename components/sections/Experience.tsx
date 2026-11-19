import { MapPin } from "lucide-react";
import { site } from "@/config/site";

export default function Experience() {
  const { work } = site;
  return (
    <section id="experience" className="section">
      <h2 className="section-title">Experience</h2>

      {/* Subtle timeline: a thin rail with one marker for the role */}
      <div className="relative border-l border-border pl-6 sm:pl-10">
        <span
          aria-hidden="true"
          className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-warm ring-4 ring-bg"
        />

        <header className="mb-10">
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

        <ul className="grid gap-5 lg:grid-cols-3">
          {work.blocks.map((b) => (
            <li key={b.title} className="card flex flex-col p-6">
              <p className="font-display text-4xl uppercase leading-[1.05] text-accent sm:text-5xl lg:min-h-[6.5rem]">
                {b.value}
              </p>
              <h4 className="mt-3 text-sm font-semibold uppercase tracking-wider">{b.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-muted">{b.description}</p>
              {b.tag && (
                <p className="mt-5 self-start rounded-full border border-warm/40 bg-warm/10 px-3 py-1 font-mono text-xs text-warm">
                  {b.tag}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

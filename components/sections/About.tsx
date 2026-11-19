import { GraduationCap } from "lucide-react";
import { site } from "@/config/site";
import ScrollTitle from "@/components/ScrollTitle";

/** Curtain panel: light on the dark page (inverse palette), slides up over the section above. */
export default function About() {
  const { about, pitch } = site;
  return (
    <section id="about" data-curtain className="panel relative z-20 -mt-8">
      {/* Short section: tight gap under the title, less bottom padding than the default */}
      <div className="section !pb-12 sm:!pb-14">
        <ScrollTitle tight>About</ScrollTitle>
        <div className="grid items-start gap-8 md:grid-cols-5 md:gap-12">
          <div className="space-y-4 md:col-span-3">
            <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{pitch}</p>
            <p className="text-lg leading-relaxed text-muted">{about.summary}</p>
            <p className="font-mono text-sm text-accent">{about.seeking}</p>
          </div>

          {/* One card: its top edge lines up with the first line of the paragraph.
              md:mt-1.5 compensates for the paragraph's half-leading above its first line. */}
          <div className="card p-5 md:col-span-2 md:mt-1.5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
              <GraduationCap size={16} className="text-accent" /> Education
            </h3>
            <ul className="divide-y divide-border">
              {about.education.map((e) => (
                <li key={e.degree} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-semibold">{e.degree}</p>
                  <p className="text-sm text-muted">{e.school}</p>
                  <p className="mt-1 font-mono text-xs text-accent">{e.when}</p>
                  {e.coursework && (
                    <p className="mt-2 text-sm leading-snug text-muted">
                      <span className="font-medium text-fg">Relevant coursework:</span> {e.coursework}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

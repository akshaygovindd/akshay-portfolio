import { GraduationCap } from "lucide-react";
import { site } from "@/config/site";
import ScrollTitle from "@/components/ScrollTitle";

/** Curtain panel: light on the dark page (inverse palette), slides up over the section above. */
export default function About() {
  const { about, pitch } = site;
  return (
    <section id="about" data-curtain className="panel relative z-20 -mt-8">
      <div className="section">
        <ScrollTitle>About</ScrollTitle>
        <div className="grid gap-12 md:grid-cols-5">
          <div className="space-y-5 md:col-span-3">
            <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{pitch}</p>
            <p className="text-lg leading-relaxed text-muted">{about.summary}</p>
            <p className="font-mono text-sm text-accent">{about.seeking}</p>
          </div>

          <div className="md:col-span-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted">
              <GraduationCap size={16} className="text-accent" /> Education
            </h3>
            <ul className="space-y-3">
              {about.education.map((e) => (
                <li key={e.degree} className="card p-4">
                  <p className="font-semibold">{e.degree}</p>
                  <p className="text-sm text-muted">{e.school}</p>
                  <p className="mt-1 font-mono text-xs text-accent">{e.when}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

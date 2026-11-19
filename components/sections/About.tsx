import { GraduationCap, Briefcase } from "lucide-react";
import { site } from "@/config/site";

export default function About() {
  const { about, pitch } = site;
  return (
    <section id="about" className="section">
      <h2 className="section-title">About &amp; Education</h2>
      <div className="grid gap-12 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <p className="font-display text-3xl uppercase leading-tight sm:text-5xl">{pitch}</p>
          <p className="text-lg text-muted">{about.summary}</p>
          <p className="font-mono text-sm text-accent">{about.seeking}</p>
        </div>

        <div className="space-y-8 md:col-span-2">
          <div>
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
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted">
              <Briefcase size={16} className="text-accent" /> Experience
            </h3>
            <p className="card p-4">{about.experience}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

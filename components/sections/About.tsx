import { GraduationCap, Briefcase } from "lucide-react";
import { site } from "@/config/site";

export default function About() {
  const { about } = site;
  return (
    <section id="about" className="section">
      <h2 className="section-title">about</h2>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4 text-muted">
          <p>{about.summary}</p>
          <p className="font-mono text-sm text-accent">{about.seeking}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-sm text-muted">
              <GraduationCap size={16} className="text-accent" /> education
            </h3>
            <ul className="space-y-3">
              {about.education.map((e) => (
                <li key={e.degree} className="rounded-md border border-border bg-surface p-4">
                  <p className="font-medium">{e.degree}</p>
                  <p className="text-sm text-muted">{e.school}</p>
                  <p className="mt-1 font-mono text-xs text-muted">{e.when}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-sm text-muted">
              <Briefcase size={16} className="text-accent" /> experience
            </h3>
            <p className="rounded-md border border-border bg-surface p-4">{about.experience}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

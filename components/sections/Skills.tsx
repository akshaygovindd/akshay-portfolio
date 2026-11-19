import { site } from "@/config/site";

export default function Skills() {
  return (
    <section id="skills" className="section">
      <h2 className="section-title">Skills</h2>
      <div className="space-y-6">
        {site.skills.map((group) => (
          <div key={group.category}>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">{group.category}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

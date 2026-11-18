import { site } from "@/config/site";

export default function Skills() {
  return (
    <section id="skills" className="section">
      <h2 className="section-title">skills</h2>
      <div className="space-y-6">
        {site.skills.map((group) => (
          <div key={group.category}>
            <h3 className="mb-3 font-mono text-sm text-muted">{group.category}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-sm transition-colors hover:border-accent hover:text-accent"
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

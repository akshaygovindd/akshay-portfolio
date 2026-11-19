import { site } from "@/config/site";

export default function Skills() {
  return (
    <section id="skills">
      <div className="section section-compact">
        <h2 className="section-title">Skills</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.skills.map((group) => (
            <div key={group.category} className="card p-5">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                {group.category}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.skills.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-border bg-bg px-3 py-1 text-sm font-medium"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

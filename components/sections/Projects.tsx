import { site } from "@/config/site";
import ProjectCard from "@/components/ProjectCard";

export default function Projects() {
  const featured = site.projects.filter((p) => p.featured);
  const more = site.projects.filter((p) => !p.featured);
  return (
    <section id="projects" className="section">
      <h2 className="section-title">Projects</h2>
      <div className="space-y-6">
        {featured.map((p) => (
          <ProjectCard key={p.title} project={p} />
        ))}
      </div>
      {more.length > 0 && (
        <>
          <h3 className="mb-5 mt-14 text-sm font-medium uppercase tracking-wider text-muted">
            More projects
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            {more.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

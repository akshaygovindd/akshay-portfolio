import { site } from "@/config/site";
import ProjectCard from "@/components/ProjectCard";

export default function Projects() {
  return (
    <section id="projects" className="section">
      <h2 className="section-title">projects</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {site.projects.map((p) => (
          <ProjectCard key={p.title} project={p} />
        ))}
      </div>
    </section>
  );
}

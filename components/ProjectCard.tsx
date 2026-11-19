import { Github } from "lucide-react";
import type { Project } from "@/config/site";
import MetricChart from "./MetricChart";

export default function ProjectCard({ project }: { project: Project }) {
  const hasChart = !!project.metrics && project.metrics.data.length > 0;

  const links = (
    <a
      href={project.githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 self-start text-sm font-medium text-accent hover:underline"
    >
      <Github size={16} /> View on GitHub
    </a>
  );
  const tags = (
    <ul className="flex flex-wrap gap-2">
      {project.tags.map((t, i) => (
        <li key={`${t}-${i}`} className="tag">
          {t}
        </li>
      ))}
    </ul>
  );

  /* Featured: large, full-width card; chart (if any) sits beside the text */
  if (project.featured) {
    return (
      <article
        className={`card grid gap-8 p-6 sm:p-9 ${hasChart ? "lg:grid-cols-5" : ""}`}
      >
        <div className={`flex flex-col ${hasChart ? "lg:col-span-3" : ""}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Featured</p>
          <h3 className="mt-2 font-display text-4xl uppercase leading-tight sm:text-6xl">
            {project.title}
          </h3>
          <p className="mt-3 text-muted">{project.summary}</p>
          <p className="mt-3 max-w-2xl text-lg leading-snug">{project.impact}</p>
          <div className="mt-6">{tags}</div>
          <div className="mt-6">{links}</div>
        </div>
        {hasChart && (
          <div className="flex items-center lg:col-span-2">
            <div className="w-full">
              <MetricChart metrics={project.metrics!} />
            </div>
          </div>
        )}
      </article>
    );
  }

  /* Compact */
  return (
    <article className="card flex flex-col p-5">
      <h3 className="font-display text-2xl uppercase leading-tight">{project.title}</h3>
      <p className="mt-2 text-sm text-muted">{project.summary}</p>
      <p className="mt-3 text-sm">{project.impact}</p>
      {hasChart && <MetricChart metrics={project.metrics!} />}
      <div className="mt-4">{tags}</div>
      <div className="mt-5">{links}</div>
    </article>
  );
}

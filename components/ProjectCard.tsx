import { Github } from "lucide-react";
import type { Project } from "@/config/site";
import MetricChart from "./MetricChart";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/60">
      <h3 className="font-mono text-lg font-semibold">{project.title}</h3>
      <p className="mt-2 text-sm text-muted">{project.summary}</p>
      <p className="mt-3 text-sm">{project.impact}</p>

      {project.metrics && project.metrics.data.length > 0 && <MetricChart metrics={project.metrics} />}

      <ul className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((t, i) => (
          <li key={`${t}-${i}`} className="tag">
            {t}
          </li>
        ))}
      </ul>

      <a
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 self-start font-mono text-sm text-accent hover:underline"
      >
        <Github size={16} /> View on GitHub
      </a>
    </article>
  );
}

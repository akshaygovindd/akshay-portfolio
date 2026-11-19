import { Github } from "lucide-react";
import type { Project } from "@/config/site";

/**
 * Big project card. On desktop the cards stack: each is sticky, and ScrollEffects scales the
 * previous one down as the next slides over it. On smaller screens it is a plain list.
 */
export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <article
      data-stack
      className="stack-card mb-6 lg:sticky lg:mb-10"
      style={{ top: `calc(5.5rem + ${index * 14}px)` }}
    >
      <div className="card grid gap-8 p-6 sm:p-9 lg:grid-cols-5 lg:gap-10">
        <div className="flex flex-col lg:col-span-3">
          <span
            aria-hidden="true"
            className="font-display text-7xl leading-none text-accent sm:text-8xl"
          >
            {n}
          </span>
          <h3 className="mt-4 font-display text-4xl uppercase leading-[1.05] sm:text-5xl">
            {project.title}
          </h3>
          <p className="mt-3 text-lg leading-snug">{project.summary}</p>
          <p className="mt-2 leading-relaxed text-muted">{project.impact}</p>

          {project.metric && (
            <div className="mt-5">
              <p className="font-display text-5xl uppercase leading-none text-accent sm:text-6xl">
                {project.metric.value}
              </p>
              <p className="mt-1 text-sm text-muted">{project.metric.label}</p>
            </div>
          )}

          <ul className="mt-6 flex flex-wrap gap-2">
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
            className="btn mt-7 self-start"
          >
            <Github size={16} /> View on GitHub
          </a>
        </div>

        {/* Image area: shows the screenshot from config when set, else a gradient placeholder */}
        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-border lg:col-span-2 lg:min-h-0">
          {project.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image.src}
              alt={project.image.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div aria-hidden="true" className="img-placeholder absolute inset-0" />
          )}
        </div>
      </div>
    </article>
  );
}

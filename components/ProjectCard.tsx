import { ArrowDown, ExternalLink, Github } from "lucide-react";
import type { Project } from "@/config/site";
import TrackedLink from "@/components/TrackedLink";
import CaseStudyLink from "@/components/case-study/CaseStudyLink";

/**
 * Big project card. On tall desktop screens the cards stack: each is sticky, and ScrollEffects
 * scales the previous one down as the next slides over it. Everywhere else it is a plain list.
 */
export default function ProjectCard({
  project,
  index,
  last = false,
}: {
  project: Project;
  index: number;
  /** The last card scrolls normally (nothing stacks on top of it). */
  last?: boolean;
}) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <article
      data-stack
      className={`stack-card mb-6 lg:mb-10 ${
        // The last card is positioned (relative) too: otherwise the sticky cards before it
        // would paint on top of it as it scrolls up.
        last ? "relative" : "[@media(min-width:1200px)_and_(min-height:790px)]:sticky"
      }`}
      style={{ top: `calc(4.5rem + ${index * 10}px)` }}
    >
      <div className="card grid gap-6 p-6 sm:p-8 lg:grid-cols-5 lg:gap-x-10 lg:gap-y-6">
        <div className="flex flex-col lg:col-span-3">
          {project.label && (
            <p className="mb-2 self-start rounded-full border border-border bg-bg px-2.5 py-0.5 font-mono text-[11px] text-muted">
              {project.label}
            </p>
          )}
          <div className="flex items-baseline gap-4">
            <span
              aria-hidden="true"
              className="font-display text-5xl leading-none text-accent sm:text-6xl"
            >
              {n}
            </span>
            <h3 className="font-display text-3xl uppercase leading-[1.05] sm:text-4xl">
              {project.title}
            </h3>
          </div>

          <p className="mt-3 text-lg leading-snug">{project.summary}</p>
          {project.impact && (
            <p className="mt-2 leading-relaxed text-muted">{project.impact}</p>
          )}

          {project.stats && project.stats.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-2.5">
              {project.stats.map((st) => (
                <div key={st.value}>
                  <dt className="sr-only">{st.label}</dt>
                  <dd className="font-display text-3xl uppercase leading-none text-accent sm:text-4xl">
                    {st.value}
                  </dd>
                  <p aria-hidden="true" className="mt-1 max-w-[13rem] text-xs leading-snug text-muted">
                    {st.label}
                  </p>
                </div>
              ))}
            </dl>
          )}

          {project.facts && project.facts.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {project.facts.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-warm"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {project.inProgress && (
            <p className="mt-4 self-start rounded-full border border-border bg-bg px-3 py-1 font-mono text-xs text-muted">
              In progress: {project.inProgress}
            </p>
          )}

          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((t, i) => (
              <li key={`${t}-${i}`} className="tag">
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-start gap-3">
            {project.caseStudy && <CaseStudyLink slug={project.caseStudy} project={project.title} />}
            {project.tryIt && (
              <TrackedLink
                href={project.tryIt.href}
                event="live_demo_click"
                eventProps={{ project: project.title }}
                className="btn btn-primary"
              >
                <ArrowDown size={16} aria-hidden="true" /> {project.tryIt.label}
              </TrackedLink>
            )}
            {project.liveUrl && (
              <div className="flex flex-col items-start gap-1.5">
                <TrackedLink
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="live_demo_click"
                  eventProps={{ project: project.title }}
                  className="btn btn-primary"
                >
                  <ExternalLink size={16} /> Live demo
                </TrackedLink>
                {project.liveNote && (
                  <span className="px-1 text-xs text-muted">{project.liveNote}</span>
                )}
              </div>
            )}
            <TrackedLink
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              event="project_github_click"
              eventProps={{ project: project.title }}
              className="btn"
            >
              <Github size={16} /> View on GitHub
            </TrackedLink>
          </div>
        </div>

        {/* Image area: the screenshot from config shown whole (never cropped) on the gradient
            backdrop, or just the gradient when there is no image yet. */}
        <div className="img-placeholder relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-border p-4 lg:col-span-2 lg:min-h-0">
          {project.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image.src}
              alt={project.image.alt}
              width={project.image.width}
              height={project.image.height}
              loading="lazy"
              className="relative h-auto w-full rounded-lg border border-border shadow-2xl"
            />
          )}
        </div>

        {project.highlights && project.highlights.length > 0 && (
          <ul className="grid gap-5 border-t border-border pt-6 sm:grid-cols-3 lg:col-span-5">
            {project.highlights.map((h) => (
              <li key={h.title}>
                <h4 className="text-sm font-semibold text-accent">{h.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted">{h.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

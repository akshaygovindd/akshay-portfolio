import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ExternalLink, Github } from "lucide-react";
import { site } from "@/config/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackedLink from "@/components/TrackedLink";
import CountUp from "@/components/CountUp";

type Params = { slug: string };

const studies = site.caseStudies;
const find = (slug: string) => {
  const study = studies.find((s) => s.slug === slug);
  const project = site.projects.find((p) => "caseStudy" in p && p.caseStudy === slug);
  return study && project ? { study, project } : null;
};

// Only the listed case studies exist; any other /projects/... path is a 404.
export const dynamicParams = false;
export function generateStaticParams(): Params[] {
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const found = find(slug);
  if (!found) return {};
  const title = `${found.study.metaTitle} | ${site.name}`;
  const url = `/projects/${slug}`;
  // The image comes from opengraph-image.tsx next to this file.
  return {
    title,
    description: found.study.description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title, description: found.study.description, siteName: site.name },
    twitter: { card: "summary_large_image", title, description: found.study.description },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const found = find(slug);
  if (!found) notFound();
  const { study, project } = found;
  const { default: Body } = await import(`@/content/case-studies/${slug}.mdx`);
  const others = studies.filter((s) => s.slug !== slug);

  return (
    <>
      {/* First focusable element on the page; visible only while focused */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar home="/" />
      {/* No corner avatar on these pages: they are for reading, so the text uses the full width. */}
      <main id="main" className="mx-auto w-full max-w-3xl px-5 pb-20 pt-24 sm:px-8 sm:pt-28">
        <Link href="/#projects" className="btn">
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>

        <header className="mt-8">
          <p className="inline-block rounded-xl border border-border bg-bg px-3 py-1 font-mono text-[11px] leading-snug text-muted">
            Case study · {study.context}
          </p>
          <h1 className="mt-4 font-display text-4xl uppercase leading-[1.02] sm:text-6xl">{project.title}</h1>
          <p className="mt-4 text-xl leading-snug">{project.summary}</p>

          {project.stats && project.stats.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              {project.stats.map((st) => (
                <div key={st.value}>
                  <dt className="sr-only">{st.label}</dt>
                  <dd className="font-display text-3xl uppercase leading-none text-accent sm:text-4xl">
                    <CountUp value={st.value} />
                  </dd>
                  <p aria-hidden="true" className="mt-1 max-w-[13rem] text-xs leading-snug text-muted">
                    {st.label}
                  </p>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap items-start gap-3">
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
                {project.liveNote && <span className="px-1 text-xs text-muted">{project.liveNote}</span>}
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
        </header>

        <article className="mt-6 border-t border-border">
          <Body />
        </article>

        <nav aria-label="More case studies" className="mt-16 border-t border-border pt-8">
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">More case studies</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/projects/${o.slug}`} className="card card-lift block min-h-11 p-4 text-sm font-medium">
                  {site.projects.find((p) => "caseStudy" in p && p.caseStudy === o.slug)?.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/#projects" className="btn mt-6">
            <ArrowLeft size={16} aria-hidden="true" /> Back to projects
          </Link>
        </nav>
      </main>
      <Footer companion={false} />
    </>
  );
}

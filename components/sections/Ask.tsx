import { site } from "@/config/site";
import Link from "next/link";
import AskLoader from "@/components/interactive/AskLoader";

/** "Ask my portfolio": RAG assistant over this site's own content. The heavy client part loads lazily. */
export default function Ask() {
  return (
    <section id="ask" className="section section-compact" aria-labelledby="ask-title">
      <h2 id="ask-title" className="section-title">
        {site.ask.title}
      </h2>
      <p className="mb-6 max-w-2xl text-muted">{site.ask.intro}</p>
      <p className="mb-6 -mt-3 text-sm">
        <Link href="/projects/ask-my-portfolio" className="inline-flex min-h-[44px] items-center text-accent underline-offset-4 hover:underline focus-visible:underline">
          {site.ask.howLink} →
        </Link>
      </p>
      <AskLoader chips={site.ask.chips} />
    </section>
  );
}

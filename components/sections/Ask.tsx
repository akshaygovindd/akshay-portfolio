import { site } from "@/config/site";
import AskLoader from "@/components/interactive/AskLoader";

/** "Ask my portfolio": RAG assistant over this site's own content. The heavy client part loads lazily. */
export default function Ask() {
  return (
    <section id="ask" className="section section-compact" aria-labelledby="ask-title">
      <h2 id="ask-title" className="section-title">
        {site.ask.title}
      </h2>
      <p className="mb-6 max-w-2xl text-muted">{site.ask.intro}</p>
      <AskLoader chips={site.ask.chips} />
    </section>
  );
}

import type { MDXComponents } from "mdx/types";
import Diagram from "@/components/case-study/Diagram";
import ImportanceChart from "@/components/case-study/ImportanceChart";
import Sources from "@/components/case-study/Sources";

/**
 * Styles for the case-study MDX (content/case-studies/*.mdx), in the site's design system:
 * Anton for headings, Inter body text, JetBrains Mono for code, violet accent, orange bullets.
 */
const components: MDXComponents = {
  h2: (props) => (
    <h2
      {...props}
      className="mb-4 mt-14 font-display text-3xl uppercase leading-[1.05] after:mt-3 after:block after:h-1 after:w-12 after:rounded-full after:bg-accent sm:text-4xl"
    />
  ),
  h3: (props) => <h3 {...props} className="mb-2 mt-8 text-lg font-semibold" />,
  p: (props) => <p {...props} className="mt-4 text-[1.0625rem] leading-relaxed" />,
  ul: (props) => <ul {...props} className="mt-4 space-y-2.5 text-[1.0625rem] leading-relaxed" />,
  ol: (props) => (
    <ol {...props} className="mt-4 list-decimal space-y-3 pl-6 text-[1.0625rem] leading-relaxed marker:font-mono marker:text-accent" />
  ),
  li: (props) => (
    <li
      {...props}
      className="relative [ul>&]:pl-5 [ul>&]:before:absolute [ul>&]:before:left-0 [ul>&]:before:top-[0.65rem] [ul>&]:before:h-1.5 [ul>&]:before:w-1.5 [ul>&]:before:rounded-full [ul>&]:before:bg-warm"
    />
  ),
  strong: (props) => <strong {...props} className="font-semibold" />,
  a: ({ href = "", ...rest }) => {
    const external = /^https?:/.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
        className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
      />
    );
  },
  code: (props) => (
    <code {...props} className="break-words rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.85em]" />
  ),
  table: (props) => (
    // tabIndex: a wide table scrolls sideways on phones, and keyboard users must be able to scroll it
    <div className="mt-5 overflow-x-auto rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" tabIndex={0}>
      <table {...props} className="w-full border-collapse text-left text-sm" />
    </div>
  ),
  thead: (props) => <thead {...props} className="bg-surface" />,
  th: (props) => <th {...props} className="border-b border-border px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted" />,
  td: (props) => <td {...props} className="border-t border-border px-3 py-2 align-top" />,
  hr: () => <hr className="my-10 border-border" />,
  Diagram,
  ImportanceChart,
  Sources,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

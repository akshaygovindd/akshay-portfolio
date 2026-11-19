/** "Where each number comes from": a closed-by-default disclosure used at the end of a case study. */
export default function Sources({ title = "Where each number comes from", children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className="group mt-12 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-mono text-sm font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        {title}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

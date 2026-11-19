import SqlPlayground from "@/components/interactive/SqlPlayground";
import { TABLE_NAME } from "@/lib/duckdb";

export default function Playground() {
  return (
    <section id="playground" className="section">
      <h2 className="section-title">SQL Playground</h2>
      <p className="mb-6 max-w-2xl text-muted">
        Run SQL right in your browser. Queries execute locally with DuckDB-WASM against a small{" "}
        <strong className="font-medium text-fg">synthetic, Instacart-style sample</strong> (873 rows,
        one table named <code className="font-mono text-accent">{TABLE_NAME}</code>). It&apos;s not
        the real 33.8M-row dataset.
      </p>
      <SqlPlayground />
    </section>
  );
}

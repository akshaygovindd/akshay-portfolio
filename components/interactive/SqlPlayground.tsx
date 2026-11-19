"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { TABLE_NAME, getEngine, runQuery, type QueryResult } from "@/lib/duckdb";

const EXAMPLES = [
  {
    label: "Top departments",
    sql: `SELECT department,
       COUNT(*) AS items,
       ROUND(AVG(reordered) * 100, 1) AS reorder_pct
FROM ${TABLE_NAME}
GROUP BY department
ORDER BY items DESC;`,
  },
  {
    label: "Orders by hour",
    sql: `SELECT order_hour_of_day AS hour,
       COUNT(DISTINCT order_id) AS orders
FROM ${TABLE_NAME}
GROUP BY hour
ORDER BY hour;`,
  },
  {
    label: "Most reordered products",
    sql: `SELECT product_name,
       COUNT(*) AS times_ordered,
       ROUND(AVG(reordered), 2) AS reorder_rate
FROM ${TABLE_NAME}
GROUP BY product_name
HAVING COUNT(*) >= 10
ORDER BY reorder_rate DESC
LIMIT 10;`,
  },
  {
    label: "Rank within department",
    sql: `SELECT department, product_name, items,
       RANK() OVER (PARTITION BY department ORDER BY items DESC) AS rank_in_dept
FROM (
  SELECT department, product_name, COUNT(*) AS items
  FROM ${TABLE_NAME}
  GROUP BY department, product_name
)
QUALIFY rank_in_dept <= 2
ORDER BY department, rank_in_dept;`,
  },
];

type Status = "idle" | "loading" | "ready" | "error";

export default function SqlPlayground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [loadError, setLoadError] = useState("");
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    setLoadError("");
    getEngine()
      .then(() => setStatus("ready"))
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      });
  }, []);

  // Only download the WASM engine once the section scrolls near the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          obs.disconnect();
          load();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load]);

  const run = useCallback(
    async (text: string) => {
      if (status !== "ready" || running) return;
      setRunning(true);
      setQueryError("");
      const t0 = performance.now();
      try {
        const r = await runQuery(text);
        setResult(r);
        setElapsed(Math.round(performance.now() - t0));
      } catch (e) {
        setResult(null);
        setQueryError(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(false);
      }
    },
    [status, running],
  );

  // Run the first example automatically once the engine is ready.
  const didAutoRun = useRef(false);
  useEffect(() => {
    if (status === "ready" && !didAutoRun.current) {
      didAutoRun.current = true;
      run(EXAMPLES[0].sql);
    }
  }, [status, run]);

  return (
    <div ref={rootRef} className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-mono text-xs text-muted">examples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setSql(ex.sql);
              run(ex.sql);
            }}
            className="tag transition-colors hover:border-accent hover:text-accent"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        <label htmlFor="sql-input" className="sr-only">
          SQL query
        </label>
        <textarea
          id="sql-input"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              run(sql);
            }
          }}
          spellCheck={false}
          rows={Math.min(12, Math.max(5, sql.split("\n").length + 1))}
          className="w-full resize-y rounded-xl border border-border bg-bg p-3 font-mono text-sm leading-relaxed text-fg focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => run(sql)}
            disabled={status !== "ready" || running}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running || status === "loading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Run
          </button>
          <span className="font-mono text-xs text-muted">
            {status === "idle" && "Scroll here to start the engine…"}
            {status === "loading" && "Loading DuckDB-WASM (first load downloads ~several MB)…"}
            {status === "ready" && "Ctrl/⌘ + Enter to run"}
          </span>
        </div>
      </div>

      {/* min-h reserves the tallest possible result (stats line + 320px capped table), so the
          page below never jumps when the engine finishes loading and the first result renders. */}
      <div className="min-h-[364px] border-t border-border p-3" aria-live="polite">
        {status === "error" && (
          <div className="font-mono text-sm text-red-500">
            Couldn&apos;t start the SQL engine: {loadError}{" "}
            <button type="button" onClick={load} className="underline">
              retry
            </button>
          </div>
        )}
        {queryError && (
          <pre className="whitespace-pre-wrap font-mono text-sm text-red-500">{queryError}</pre>
        )}
        {result && !queryError && (
          <>
            <p className="mb-2 font-mono text-xs text-muted">
              {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
              {result.rowCount > result.rows.length && ` (showing first ${result.rows.length})`}
              {elapsed !== null && ` · ${elapsed} ms`}
            </p>
            <div className="max-h-80 overflow-auto rounded-xl border border-border">
              <table className="w-full border-collapse font-mono text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    {result.columns.map((c) => (
                      <th
                        key={c}
                        className="border-b border-border px-3 py-2 text-left font-semibold text-accent"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="odd:bg-bg/60">
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`whitespace-nowrap px-3 py-1.5 ${cell === "NULL" ? "text-muted" : ""}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

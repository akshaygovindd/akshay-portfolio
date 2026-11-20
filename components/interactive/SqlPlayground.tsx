"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Link2, Loader2, Play, Sparkles } from "lucide-react";
import { TABLE_NAME, getEngine, runQuery, type QueryResult } from "@/lib/duckdb";
import { trackEvent } from "@/lib/analytics";
import { chartSpec } from "@/lib/chart";
import { decodeQuery, encodeQuery } from "@/lib/share";

// The new pieces load lazily: the schema list when the panel is first opened, the chart when it is first shown.
const SchemaList = dynamic(() => import("./SqlSchemaList"), {
  ssr: false,
  loading: () => <div className="h-56 border-t border-border p-3 text-sm text-muted">Loading…</div>,
});
const ResultChart = dynamic(() => import("./SqlResultChart"), {
  ssr: false,
  loading: () => <div className="h-40 p-3 text-sm text-muted">Loading chart…</div>,
});

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
    // order_hour_of_day is a number, so it is formatted as text to be the chart's category column
    label: "Items by hour (chart)",
    sql: `SELECT printf('%02d:00', order_hour_of_day) AS hour,
       COUNT(*) AS items
FROM ${TABLE_NAME}
GROUP BY order_hour_of_day
ORDER BY order_hour_of_day;`,
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
type Msg = { kind: "info" | "error"; text: string } | null;

const MAX_QUESTION = 300;
const UNAVAILABLE = "The SQL assistant is unavailable right now. You can still write queries yourself.";
const RATE_LIMITED = "That's the limit of 10 questions an hour from one connection. Please try again a little later.";
const ENGLISH_NOTE =
  "An AI model (gpt-5.4-mini) writes the SQL from your question plus the table's column names and a few sample values. It never sees your results, and your question is not stored.";

export default function SqlPlayground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [loadError, setLoadError] = useState("");
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [note, setNote] = useState(""); // shown in the status slot until the next Run
  const [announce, setAnnounce] = useState("");
  const [english, setEnglish] = useState("");
  const [englishBusy, setEnglishBusy] = useState(false);
  const [englishMsg, setEnglishMsg] = useState<Msg>(null);

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

  /** Replaces the editor text from code (examples, shared link, assistant). */
  const setSqlText = useCallback((text: string) => setSql(text), []);

  const run = useCallback(
    async (text: string, userInitiated = true) => {
      if (status !== "ready" || running) return;
      if (userInitiated) {
        // Which example it is, or "custom". The query text itself is never sent.
        const example = EXAMPLES.find((ex) => ex.sql === text);
        trackEvent("sql_query_run", example ? { source: "example", example: example.label } : { source: "custom" });
      }
      setRunning(true);
      setQueryError("");
      setNote("");
      const t0 = performance.now();
      try {
        const r = await runQuery(text);
        setResult(r);
        setView((v) => (v === "chart" && chartSpec(r) ? "chart" : "table"));
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

  // A shared link (?q=...) fills the editor and scrolls here. It never runs: the visitor presses Run.
  // Anything that does not decode to clean text is ignored.
  const fromLink = useRef(false);
  useEffect(() => {
    const q = decodeQuery(new URLSearchParams(window.location.search).get("q"));
    if (!q) return;
    fromLink.current = true; // checked by the auto-run effect below, so the example does not run over the link's query
    const id = requestAnimationFrame(() => {
      setSqlText(q);
      setNote("Loaded from a shared link. Nothing has run yet: press Run.");
      requestAnimationFrame(() => document.getElementById("playground")?.scrollIntoView());
    });
    return () => cancelAnimationFrame(id);
  }, [setSqlText]);

  // Run the first example automatically once the engine is ready (not when the editor came from a link).
  const didAutoRun = useRef(false);
  useEffect(() => {
    if (status === "ready" && !didAutoRun.current) {
      didAutoRun.current = true;
      if (!fromLink.current) run(EXAMPLES[0].sql, false); // automatic first run: not a user action
    }
  }, [status, run]);

  /**
   * Inserts a table or column name at the editor's cursor (or replaces the selection). A textarea keeps its
   * selection after it loses focus, so it can be read straight from the element when a button is pressed.
   */
  function insertAtCursor(text: string) {
    const ta = taRef.current;
    const start = Math.min(ta?.selectionStart ?? sql.length, sql.length);
    const end = Math.min(ta?.selectionEnd ?? sql.length, sql.length);
    const before = sql.slice(0, start);
    const after = sql.slice(end);
    const pad = before && !/[\s(,.]$/.test(before) ? " " : "";
    const padAfter = /^[A-Za-z0-9_"']/.test(after) ? " " : ""; // never glue the name onto the next word
    const pos = start + pad.length + text.length;
    setSql(before + pad + text + padAfter + after);
    setAnnounce(`Inserted ${text} into the editor`);
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(pos, pos);
    });
  }

  async function copyLink() {
    const enc = encodeQuery(sql);
    if (!enc.ok) {
      setNote(enc.error);
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?q=${enc.param}#playground`;
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied. Opening it fills the editor but does not run the query.");
    } catch {
      window.history.replaceState(null, "", url); // clipboard blocked: the address bar now holds the link
      setNote("Couldn't copy automatically. The link is now in your address bar.");
    }
  }

  async function askEnglish(e: React.FormEvent) {
    e.preventDefault();
    const q = english.trim().slice(0, MAX_QUESTION);
    if (!q || englishBusy) return;
    setEnglishBusy(true);
    setEnglishMsg(null);
    try {
      const res = await fetch("/api/sql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json().catch(() => ({}))) as { sql?: unknown; refused?: boolean; message?: unknown };
      if (res.status === 429) setEnglishMsg({ kind: "error", text: RATE_LIMITED });
      else if (!res.ok) setEnglishMsg({ kind: "error", text: UNAVAILABLE });
      else if (data.refused) setEnglishMsg({ kind: "info", text: typeof data.message === "string" ? data.message : "I can only write queries about these tables." });
      else if (typeof data.sql === "string" && data.sql.length > 0 && data.sql.length <= 2000) {
        setSqlText(data.sql); // text only: it goes into the editor and nothing runs
        setNote("Written by the assistant. Read it, then press Run.");
        setEnglishMsg({ kind: "info", text: "The query is in the editor below. Read it, then press Run." });
        taRef.current?.focus();
      } else setEnglishMsg({ kind: "error", text: UNAVAILABLE });
    } catch {
      setEnglishMsg({ kind: "error", text: UNAVAILABLE });
    } finally {
      setEnglishBusy(false);
    }
  }

  const spec = result ? chartSpec(result) : null;
  const showChart = !!spec && view === "chart";
  const statusText =
    status === "idle"
      ? "Scroll here to start the engine…"
      : status === "loading"
        ? "Loading DuckDB-WASM (first load downloads ~several MB)…"
        : status === "ready"
          ? "Ctrl/⌘ + Enter to run"
          : "";

  return (
    <div ref={rootRef} className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-mono text-xs text-muted">examples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setSqlText(ex.sql);
              setNote("");
              run(ex.sql);
            }}
            className="tag transition-colors hover:border-accent hover:text-accent"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* English to SQL: the browser sends only this question; the SQL comes back as text for the editor */}
      <form onSubmit={askEnglish} className="border-b border-border p-3">
        <label htmlFor="sql-english" className="font-mono text-xs text-muted">
          Describe it in English
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <input
            id="sql-english"
            value={english}
            maxLength={MAX_QUESTION}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. Which five products are reordered the most?"
            autoComplete="off"
            aria-describedby="sql-english-note"
            className="min-h-11 min-w-0 flex-1 basis-64 rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={englishBusy || !english.trim()} className="btn disabled:cursor-not-allowed disabled:opacity-50">
            {englishBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            Write SQL
          </button>
        </div>
        {/* fixed height: the message replaces the note without moving anything */}
        <p
          id="sql-english-note"
          role="status"
          className={`mt-2 min-h-16 text-xs leading-snug sm:min-h-9 ${englishMsg?.kind === "error" ? "text-fg" : "text-muted"}`}
        >
          {englishMsg ? englishMsg.text : ENGLISH_NOTE}
        </p>
      </form>

      <details
        className="border-b border-border"
        onToggle={(e) => setSchemaOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 font-mono text-xs text-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
          Tables and columns <span className="hidden sm:inline">(read from DuckDB; click a name to insert it)</span>
        </summary>
        {schemaOpen && <SchemaList ready={status === "ready"} onInsert={insertAtCursor} />}
      </details>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>

      <div className="p-3">
        <label htmlFor="sql-input" className="sr-only">
          SQL query
        </label>
        <textarea
          id="sql-input"
          ref={taRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              run(sql);
            }
          }}
          spellCheck={false}
          rows={9} /* fixed: a height that followed the text would shift the page when a link or the assistant fills the editor */
          className="w-full resize-y rounded-xl border border-border bg-bg p-3 font-mono text-sm leading-relaxed text-fg focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => run(sql)}
            disabled={status !== "ready" || running}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running || status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Run
          </button>
          <button type="button" onClick={copyLink} disabled={!sql.trim()} className="btn disabled:cursor-not-allowed disabled:opacity-50">
            <Link2 size={16} aria-hidden="true" /> Copy link
          </button>
          {/* On phones the status texts wrap differently, which changed this section's height when the
              engine loaded. A full-width, two-line slot keeps the height the same in every state. Notes
              (copied, from a link, written by the assistant) use the same slot. */}
          <span
            role="status"
            aria-live="polite"
            className="min-h-8 basis-full font-mono text-xs text-muted sm:min-h-0 sm:basis-auto"
          >
            {note || statusText}
          </span>
        </div>
      </div>

      {/* min-h reserves the tallest possible result (toggle row + stats line + 320px capped table or chart),
          so the page below never jumps when the engine finishes loading and the first result renders. */}
      <div className="min-h-[400px] border-t border-border p-3" aria-live="polite">
        {status === "error" && (
          <div className="font-mono text-sm text-red-500">
            Couldn&apos;t start the SQL engine: {loadError}{" "}
            <button type="button" onClick={load} className="underline">
              retry
            </button>
          </div>
        )}
        {queryError && <pre className="whitespace-pre-wrap font-mono text-sm text-red-500">{queryError}</pre>}
        {result && !queryError && (
          <>
            <div className="mb-2 flex min-h-11 flex-wrap items-center justify-between gap-x-4">
              <p className="font-mono text-xs text-muted">
                {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
                {result.rowCount > result.rows.length && ` (showing first ${result.rows.length})`}
                {elapsed !== null && ` · ${elapsed} ms`}
              </p>
              {spec && (
                <div role="group" aria-label="Result view" className="flex gap-2">
                  {(["table", "chart"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={`btn !px-4 capitalize ${view === v ? "btn-primary" : ""}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              role="region"
              aria-label={showChart ? "Result chart" : "Query results"}
              tabIndex={0}
              className="max-h-80 overflow-auto rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              {showChart && spec ? (
                <ResultChart spec={spec} />
              ) : (
                <table className="w-full border-collapse font-mono text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c} className="border-b border-border px-3 py-2 text-left font-semibold text-accent">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="odd:bg-bg/60">
                        {row.map((cell, j) => (
                          <td key={j} className={`whitespace-nowrap px-3 py-1.5 ${cell === "NULL" ? "text-muted" : ""}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

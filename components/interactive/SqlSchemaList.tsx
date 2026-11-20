"use client";

import { useEffect, useState } from "react";
import { getSchema, type TableInfo } from "@/lib/duckdb";

/**
 * The body of the "Tables and columns" panel. Everything shown is read from DuckDB (information_schema and
 * count(*)) after the engine has loaded, never hardcoded. Each name is a button that inserts it into the editor.
 * Loaded lazily, only when the panel is opened. Fixed height, so nothing moves when the list appears.
 */
export default function SqlSchemaList({ ready, onInsert }: { ready: boolean; onInsert: (text: string) => void }) {
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    getSchema().then(
      (t) => live && setTables(t),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [ready]);

  return (
    <div
      role="region"
      aria-label="Tables and columns"
      tabIndex={0}
      className="h-56 overflow-auto border-t border-border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      {failed && <p className="text-sm text-muted">Couldn&apos;t read the table list. The editor still works.</p>}
      {!failed && !tables && (
        <p className="text-sm text-muted">{ready ? "Reading the tables…" : "The SQL engine starts when this section scrolls into view…"}</p>
      )}
      {tables?.map((t) => (
        <div key={t.name} className="mb-3 last:mb-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => onInsert(t.name)}
              aria-label={`Insert table name ${t.name}`}
              className="tag min-h-11 px-4 font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
            >
              {t.name}
            </button>
            <span className="font-mono text-xs text-muted">
              {t.rowCount.toLocaleString("en-US")} rows · {t.columns.length} columns
            </span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {t.columns.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => onInsert(c.name)}
                  aria-label={`Insert column ${c.name} ${c.type}`} /* the visible text ("name TYPE") must be inside the accessible name */
                  className="tag min-h-11 px-3 transition-colors hover:border-accent hover:text-accent"
                >
                  {c.name} <span className="text-muted">{c.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

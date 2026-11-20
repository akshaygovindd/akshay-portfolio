import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export const TABLE_NAME = "instacart_sample";

export type ColumnKind = "number" | "text" | "date" | "other";
export type QueryResult = {
  columns: string[];
  /** What each column holds, from its Arrow type (used to decide whether a chart makes sense). */
  kinds: ColumnKind[];
  /** Display strings for the table (first 200 rows). */
  rows: string[][];
  /** Raw values, only kept for small results (50 rows or fewer), for the chart. */
  values: unknown[][];
  rowCount: number;
};

export type TableInfo = { name: string; rowCount: number; columns: { name: string; type: string }[] };

type Engine = { db: AsyncDuckDB; conn: AsyncDuckDBConnection };
let enginePromise: Promise<Engine> | null = null;

/** Lazily starts DuckDB-WASM and loads the sample CSV. Safe to call many times. */
export function getEngine(): Promise<Engine> {
  if (!enginePromise) {
    enginePromise = start().catch((e) => {
      enginePromise = null; // allow retry after a failure
      throw e;
    });
  }
  return enginePromise;
}

async function start(): Promise<Engine> {
  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

  // Browsers block cross-origin workers, so wrap the CDN worker in a same-origin blob.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  const res = await fetch("/data/sample.csv");
  if (!res.ok) throw new Error(`Could not load sample data (HTTP ${res.status})`);
  await db.registerFileText("sample.csv", await res.text());

  const conn = await db.connect();
  await conn.query(
    `CREATE TABLE ${TABLE_NAME} AS SELECT * FROM read_csv_auto('sample.csv', header = true)`,
  );
  return { db, conn };
}

/** Reads the tables, columns and types from DuckDB itself (information_schema), plus a row count per table. */
export async function getSchema(): Promise<TableInfo[]> {
  const { conn } = await getEngine();
  const cols = (
    await conn.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'main' ORDER BY table_name, ordinal_position",
    )
  ).toArray();
  const tables = new Map<string, TableInfo>();
  for (const c of cols) {
    const name = String(c.table_name);
    if (!tables.has(name)) tables.set(name, { name, rowCount: 0, columns: [] });
    tables.get(name)!.columns.push({ name: String(c.column_name), type: String(c.data_type) });
  }
  for (const t of tables.values()) {
    const n = (await conn.query(`SELECT count(*) AS n FROM "${t.name.replace(/"/g, '""')}"`)).toArray()[0].n;
    t.rowCount = Number(n);
  }
  return [...tables.values()];
}

function kindOf(arrowType: string): ColumnKind {
  if (/^(Int|Uint|Float|Decimal)/.test(arrowType)) return "number";
  if (/^(Utf8|LargeUtf8|Dictionary)/.test(arrowType)) return "text";
  if (/^(Date|Timestamp)/.test(arrowType)) return "date";
  return "other";
}

export async function runQuery(sql: string, maxRows = 200): Promise<QueryResult> {
  const { conn } = await getEngine();
  const table = await conn.query(sql);
  const columns = table.schema.fields.map((f) => f.name);
  const kinds = table.schema.fields.map((f) => kindOf(String(f.type)));
  const all = table.toArray();
  const objs = all.slice(0, maxRows).map((r) => r.toJSON() as Record<string, unknown>);
  const rows = objs.map((obj) => columns.map((c) => formatCell(obj[c])));
  const values = all.length <= 50 ? objs.map((obj) => columns.map((c) => obj[c])) : [];
  return { columns, kinds, rows, values, rowCount: all.length };
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  return String(v);
}

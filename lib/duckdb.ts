import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export const TABLE_NAME = "instacart_sample";

export type QueryResult = { columns: string[]; rows: string[][]; rowCount: number };

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

export async function runQuery(sql: string, maxRows = 200): Promise<QueryResult> {
  const { conn } = await getEngine();
  const table = await conn.query(sql);
  const columns = table.schema.fields.map((f) => f.name);
  const all = table.toArray();
  const rows = all.slice(0, maxRows).map((r) => {
    const obj = r.toJSON() as Record<string, unknown>;
    return columns.map((c) => formatCell(obj[c]));
  });
  return { columns, rows, rowCount: all.length };
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  return String(v);
}

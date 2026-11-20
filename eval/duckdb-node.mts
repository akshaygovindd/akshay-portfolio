// The same DuckDB-WASM engine the playground uses in the browser, run in Node (its blocking build), with the
// sample CSV loaded as the same table. Used by sql:eval to run the generated and the reference queries.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { TABLE_NAME } from "../lib/duckdb";

const require = createRequire(import.meta.url);

import type { Rows } from "./compare.mts";

/** Values as comparable text: bigint as integers, floats rounded to 6 places, NULL spelled out. */
export function norm(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "toString" in v) {
    const s = String(v);
    return /^-?\d+(\.\d+)?$/.test(s) ? String(Math.round(Number(s) * 1e6) / 1e6) : s; // DECIMAL values
  }
  return String(v);
}

export async function openDb() {
  const duckdb = require("@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs");
  const dist = path.dirname(require.resolve("@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs"));
  const bundles = {
    mvp: { mainModule: path.join(dist, "duckdb-mvp.wasm"), mainWorker: path.join(dist, "duckdb-node-mvp.worker.cjs") },
    eh: { mainModule: path.join(dist, "duckdb-eh.wasm"), mainWorker: path.join(dist, "duckdb-node-eh.worker.cjs") },
  };
  const db = await duckdb.createDuckDB(bundles, new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), duckdb.NODE_RUNTIME);
  await db.instantiate(() => {});
  db.registerFileText("sample.csv", fs.readFileSync("public/data/sample.csv", "utf8"));
  const conn = db.connect();
  conn.query(`CREATE TABLE ${TABLE_NAME} AS SELECT * FROM read_csv_auto('sample.csv', header = true)`);
  return {
    run(sql: string): Rows {
      const t = conn.query(sql);
      const columns = t.schema.fields.map((f: { name: string }) => f.name);
      const rows = t.toArray().map((r: { toJSON(): Record<string, unknown> }) => {
        const o = r.toJSON();
        return columns.map((c: string) => norm(o[c]));
      });
      return { columns, rows };
    },
  };
}

import fs from "node:fs";
import path from "node:path";
import { TABLE_NAME } from "../lib/duckdb";

/**
 * Describes the sample table to the model: names, types and a few sample values. It is built on the
 * server from the CSV the playground loads (public/data/sample.csv) and cached in the function, so nothing
 * about the schema ever comes from the browser. Types follow DuckDB's read_csv_auto: all-integer columns
 * are BIGINT, all-numeric DOUBLE, everything else VARCHAR.
 */
export type ColumnInfo = { name: string; type: "BIGINT" | "DOUBLE" | "VARCHAR"; samples: string[]; nulls: number; min?: number; max?: number; distinct: number };
export type SchemaInfo = { table: string; rowCount: number; columns: ColumnInfo[] };

let cached: SchemaInfo | null = null;

/** Minimal CSV parser (the sample has no quoted fields, but quotes are handled anyway). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"', i++);
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) (row.push(cell), rows.push(row));
  return rows;
}

export function getSchemaInfo(): SchemaInfo {
  if (cached) return cached;
  const text = fs.readFileSync(path.join(process.cwd(), "public", "data", "sample.csv"), "utf8");
  const [header, ...data] = parseCsv(text);
  const columns = header.map((name, i): ColumnInfo => {
    const all = data.map((r) => r[i] ?? "");
    const vals = all.filter((v) => v !== "");
    const isInt = vals.length > 0 && vals.every((v) => /^-?\d+$/.test(v));
    const isNum = vals.length > 0 && vals.every((v) => /^-?\d+(\.\d+)?$/.test(v));
    const type = isInt ? "BIGINT" : isNum ? "DOUBLE" : "VARCHAR";
    // sample values: the most frequent first (ties in file order), so the examples are typical
    const freq = new Map<string, number>();
    for (const v of vals) freq.set(v, (freq.get(v) ?? 0) + 1);
    const samples = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, type === "VARCHAR" ? 6 : 3).map(([v]) => v);
    const nums = type === "VARCHAR" ? [] : vals.map(Number);
    return {
      name,
      type,
      samples,
      nulls: all.length - vals.length,
      distinct: freq.size,
      ...(nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : {}),
    };
  });
  cached = { table: TABLE_NAME, rowCount: data.length, columns };
  return cached;
}

/** The text that goes into the prompt: the schema and a few sample values, never the rows. */
export function schemaPrompt(): string {
  const s = getSchemaInfo();
  const lines = s.columns.map((c) => {
    const range = c.min !== undefined ? `, range ${c.min} to ${c.max}` : "";
    const ex = c.samples.map((v) => (c.type === "VARCHAR" ? `'${v.replace(/'/g, "''")}'` : v)).join(", ");
    return `- ${c.name} ${c.type}${c.nulls ? " (has NULLs)" : ""}: e.g. ${ex}${range}`;
  });
  return `Table ${s.table} (${s.rowCount} rows):\n${lines.join("\n")}`;
}

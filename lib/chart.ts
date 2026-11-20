import type { QueryResult } from "./duckdb";

export const MAX_CHART_ROWS = 50;

export type ChartSpec = {
  /** Name of the category column. */
  categoryName: string;
  labels: string[];
  /** One or two numeric columns, each drawn as its own bar panel on its own scale. */
  series: { name: string; values: number[] }[];
};

/**
 * A result can be charted when it has exactly one text or date column plus one or two numeric columns
 * (and nothing else), at most 50 rows, and the numbers are present and not negative. Bars only.
 */
export function chartSpec(r: QueryResult): ChartSpec | null {
  if (r.rowCount < 1 || r.rowCount > MAX_CHART_ROWS || r.values.length !== r.rowCount) return null;
  const cat = r.kinds.flatMap((k, i) => (k === "text" || k === "date" ? [i] : []));
  const num = r.kinds.flatMap((k, i) => (k === "number" ? [i] : []));
  if (cat.length !== 1 || num.length < 1 || num.length > 2 || cat.length + num.length !== r.kinds.length) return null;
  const series: ChartSpec["series"] = [];
  for (const c of num) {
    const values = r.values.map((row) => (row[c] === null || row[c] === undefined ? NaN : Number(String(row[c]))));
    if (values.some((v) => !Number.isFinite(v) || v < 0)) return null;
    series.push({ name: r.columns[c], values });
  }
  return { categoryName: r.columns[cat[0]], labels: r.values.map((row) => String(row[cat[0]] ?? "NULL")), series };
}

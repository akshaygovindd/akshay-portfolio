// How sql:eval decides whether a generated query "got the same answer" as the reference query. Pure code, unit tested.
//
// - Columns are matched by their VALUES, not by position or name: every way of assigning generated columns to the
//   reference columns is tried (the tables are small), and one that reproduces the reference is enough.
// - Numbers match within 0.05, so 58 and 58.0 match, but 0.58 and 58 (a fraction instead of a percentage) do not.
//   Anything that is not a number must match exactly.
// - Row order is ignored unless the question is marked ordered.
// - Two scores: STRICT = the result has exactly the reference columns; LENIENT = all reference columns are present,
//   extra columns allowed. Row counts must always match.
export type Rows = { columns: string[]; rows: string[][] };
export const TOLERANCE = 0.05;

const num = (s: string): number | null => (s !== "NULL" && s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);

export function cellEq(a: string, b: string): boolean {
  const x = num(a);
  const y = num(b);
  if (x !== null && y !== null) return Math.abs(x - y) <= TOLERANCE;
  return a === b;
}

/** Same values in any order (each value used once). */
function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  for (const x of a) {
    const j = b.findIndex((y, i) => !used[i] && cellEq(x, y));
    if (j < 0) return false;
    used[j] = true;
  }
  return true;
}

const column = (r: Rows, j: number) => r.rows.map((row) => row[j]);

export type Comparison = { strict: boolean; lenient: boolean; extraColumns: number; mapping?: number[]; why: string };

export function compare(gen: Rows, ref: Rows, ordered: boolean): Comparison {
  const k = ref.columns.length;
  const m = gen.columns.length;
  const extraColumns = Math.max(0, m - k);
  const fail = (why: string): Comparison => ({ strict: false, lenient: false, extraColumns, why });
  if (gen.rows.length !== ref.rows.length) return fail(`${gen.rows.length} rows, the reference has ${ref.rows.length}`);
  if (m < k) return fail(`${m} column${m === 1 ? "" : "s"}, the reference needs ${k}`);

  // which generated columns could stand in for each reference column (same values, in order if ordered)
  const sameColumn = (i: number, j: number) => {
    const a = column(gen, j);
    const b = column(ref, i);
    return ordered ? a.every((v, r) => cellEq(v, b[r])) : sameMultiset(a, b);
  };
  const candidates = ref.columns.map((_, i) => gen.columns.map((_, j) => j).filter((j) => sameColumn(i, j)));
  if (candidates.some((c) => c.length === 0)) return fail("a reference column has no matching column in the result (values differ)");

  // rows must line up across all columns at once, not just column by column
  const rowsMatch = (map: number[]) => {
    if (ordered) return gen.rows.every((row, r) => map.every((j, i) => cellEq(row[j], ref.rows[r][i])));
    const used = new Array(gen.rows.length).fill(false);
    return ref.rows.every((rr) => {
      const g = gen.rows.findIndex((row, r) => !used[r] && map.every((j, i) => cellEq(row[j], rr[i])));
      if (g < 0) return false;
      used[g] = true;
      return true;
    });
  };
  const assign = (i: number, map: number[]): number[] | null => {
    if (i === k) return rowsMatch(map) ? map : null;
    for (const j of candidates[i]) {
      if (map.includes(j)) continue;
      const found = assign(i + 1, [...map, j]);
      if (found) return found;
    }
    return null;
  };
  const mapping = assign(0, []);
  if (!mapping) return fail("the columns have the right values separately, but no assignment makes the rows match the reference");
  return { strict: m === k, lenient: true, extraColumns, mapping, why: m === k ? "" : `${extraColumns} extra column${extraColumns === 1 ? "" : "s"}: ${gen.columns.filter((_, j) => !mapping.includes(j)).join(", ")}` };
}

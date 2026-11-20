/**
 * Validator for SQL written by the model (/api/sql). Pure code, no dependencies, so it is unit tested.
 *
 * A query passes only if it is ONE statement that starts with SELECT or WITH, mentions no statement or
 * function from the block lists, has no file or URL strings, and reads only from the sample table (or a
 * CTE defined in the same query). The query is never run on the server, and in the browser it runs in
 * the visitor's own DuckDB-WASM, so this is defence in depth, not the only barrier.
 *
 * Known limit: it is a scanner, not a SQL parser. Anything it is unsure about it rejects.
 */
export type Validation = { ok: true; sql: string } | { ok: false; reason: string };

export const MAX_SQL_CHARS = 2000;

/** Statements and commands that must never appear, anywhere outside a string. */
const BLOCKED_WORDS = new Set(
  (
    "copy attach detach install load force pragma set reset export import call create insert update delete drop alter " +
    "truncate vacuum checkpoint execute prepare deallocate use begin commit rollback abort transaction merge grant revoke " +
    "explain describe show summarize"
  ).split(" "),
);

/** Table functions and system functions that read files, URLs, settings or run text as SQL. */
const BLOCKED_FUNCTIONS = new Set(
  "glob query query_table sniff_csv getenv current_setting shell system httpfs".split(" "),
);
const BLOCKED_PREFIXES = ["read_", "pragma_", "duckdb_", "sqlite_", "postgres_", "mysql_", "iceberg_", "delta_", "arrow_", "parquet_"];

const SOURCE_END = new Set("where group order having limit offset qualify window union intersect except on using returning".split(" "));
/** FROM inside these functions is part of their syntax, not a table source: EXTRACT(hour FROM x). */
const FROM_FUNCTIONS = new Set(["extract", "substring", "trim", "ltrim", "rtrim", "overlay", "position"]);

type Scrubbed = { code: string; strings: string[]; idents: string[] };

/** Replaces comments, strings and quoted identifiers, so keywords inside them cannot confuse the checks. */
function scrub(sql: string): Scrubbed | { error: string } {
  let code = "";
  const strings: string[] = [];
  const idents: string[] = [];
  const isWordChar = (c: string | undefined) => !!c && /[A-Za-z0-9_$]/.test(c);
  for (let i = 0; i < sql.length; ) {
    const c = sql[i];
    const n = sql[i + 1];
    if (c === "-" && n === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      code += " ";
    } else if (c === "/" && n === "*") {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql[i] === "/" && sql[i + 1] === "*") (depth++, (i += 2));
        else if (sql[i] === "*" && sql[i + 1] === "/") (depth--, (i += 2));
        else i++;
      }
      if (depth > 0) return { error: "unterminated comment" };
      code += " ";
    } else if (c === "'") {
      const prev = sql[i - 1];
      if ((prev === "e" || prev === "E" || prev === "&") && !isWordChar(sql[i - 2])) return { error: "escape strings are not allowed" };
      let j = i + 1;
      let text = "";
      for (;;) {
        if (j >= sql.length) return { error: "unterminated string" };
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") (text += "'", (j += 2));
          else break;
        } else text += sql[j++];
      }
      strings.push(text);
      code += "'~'";
      i = j + 1;
    } else if (c === '"') {
      let j = i + 1;
      let text = "";
      for (;;) {
        if (j >= sql.length) return { error: "unterminated identifier" };
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') (text += '"', (j += 2));
          else break;
        } else text += sql[j++];
      }
      code += `"~${idents.length}"`;
      idents.push(text);
      i = j + 1;
    } else if (c === "$") {
      return { error: "dollar quoting and parameters are not allowed" };
    } else {
      code += c;
      i++;
    }
  }
  return { code, strings, idents };
}

function looksLikeFileOrUrl(s: string): boolean {
  const t = s.trim();
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(t) || // http:, https:, s3:, gs:, file:, hf: ...
    /^(\/|\.\/|\.\.\/|~)/.test(t) ||
    /\.(csv|tsv|parquet|json|jsonl|ndjson|gz|zst|db|duckdb|sqlite|xlsx?|txt)$/i.test(t) ||
    t.includes("://")
  );
}

export function validateSql(input: string, table = "instacart_sample"): Validation {
  if (typeof input !== "string") return { ok: false, reason: "not text" };
  const raw = input.trim();
  if (!raw) return { ok: false, reason: "empty" };
  if (raw.length > MAX_SQL_CHARS) return { ok: false, reason: "too long" };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw)) return { ok: false, reason: "control characters" };

  const s = scrub(raw);
  if ("error" in s) return { ok: false, reason: s.error };

  // One statement: a single trailing semicolon is fine, any other semicolon is not.
  const body = s.code.trim().replace(/;\s*$/, "").trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.includes(";")) return { ok: false, reason: "more than one statement" };

  const words = body.match(/[A-Za-z_][A-Za-z0-9_$]*/g) ?? [];
  const first = words[0]?.toLowerCase();
  if (first !== "select" && first !== "with") return { ok: false, reason: "only SELECT or WITH queries are allowed" };

  for (const w of words) {
    const l = w.toLowerCase();
    if (BLOCKED_WORDS.has(l)) return { ok: false, reason: `"${l}" is not allowed` };
    if (BLOCKED_FUNCTIONS.has(l) || BLOCKED_PREFIXES.some((p) => l.startsWith(p)) || l.endsWith("_scan"))
      return { ok: false, reason: `"${l}" is not allowed` };
  }
  for (const str of s.strings) if (looksLikeFileOrUrl(str)) return { ok: false, reason: "file and URL strings are not allowed" };

  // Names that may follow FROM or JOIN: the sample table, and CTEs defined in this query.
  const allowed = new Set([table.toLowerCase()]);
  for (const m of body.matchAll(/(?:\bwith(?:\s+recursive)?|,)\s*([A-Za-z_][A-Za-z0-9_$]*)\s*(?:\([^()]*\)\s*)?as\s*(?:(?:not\s+)?materialized\s*)?\(/gi)) {
    allowed.add(m[1].toLowerCase());
  }

  const tokens = body.match(/'~'|"~\d+"|[A-Za-z_][A-Za-z0-9_$]*|\d[\w.]*|[().,]|\S/g) ?? [];
  const parenFn: string[] = [];
  const sourceDepth: number[] = []; // paren depth of each open FROM list, to catch "FROM a, 'file.csv'"
  const checkSource = (i: number): string | null => {
    const t = tokens[i];
    if (t === "(") return null; // subquery
    if (t === "'~'") return "file-style table sources are not allowed";
    let name: string;
    if (t.startsWith('"~')) name = s.idents[Number(t.slice(2, -1))];
    else if (/^[A-Za-z_]/.test(t)) {
      if (tokens[i + 1] === "(") return "table functions are not allowed";
      if (tokens[i + 1] === ".") return "qualified table names are not allowed";
      name = t;
    } else return "unexpected table source";
    return allowed.has(name.toLowerCase()) ? null : `unknown table "${name}"`;
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const l = t.toLowerCase();
    if (t === "(") {
      parenFn.push(/^[A-Za-z_]/.test(tokens[i - 1] ?? "") ? tokens[i - 1].toLowerCase() : "");
    } else if (t === ")") {
      parenFn.pop();
      while (sourceDepth.length && sourceDepth[sourceDepth.length - 1] > parenFn.length) sourceDepth.pop();
    } else if (l === "from" || l === "join") {
      const prev = tokens[i - 1]?.toLowerCase();
      const fn = parenFn[parenFn.length - 1];
      if (prev === "distinct" || (fn && FROM_FUNCTIONS.has(fn))) continue; // IS DISTINCT FROM, EXTRACT(x FROM y)
      if (l === "from") sourceDepth.push(parenFn.length);
      const err = checkSource(i + 1);
      if (err) return { ok: false, reason: err };
    } else if (SOURCE_END.has(l) && sourceDepth.length && sourceDepth[sourceDepth.length - 1] === parenFn.length) {
      sourceDepth.pop();
    } else if (t === "," && sourceDepth.length && sourceDepth[sourceDepth.length - 1] === parenFn.length) {
      const err = checkSource(i + 1); // comma join: FROM a, b
      if (err) return { ok: false, reason: err };
    }
  }

  return { ok: true, sql: raw.replace(/;\s*$/, "").trim() };
}

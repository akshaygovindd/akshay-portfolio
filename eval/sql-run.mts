// npm run sql:eval  - English to SQL, scored by execution accuracy. Calls OpenAI (about 1.5 cents a run), so run it by hand.
//   npm run sql:eval -- --check-references    runs only the reference queries (no API calls) and prints their results
//   npm run sql:eval -- --runs=3              runs the whole eval 3 times and reports every run plus the median
//   npm run sql:eval -- --out=eval/x.md       report file (default: eval/sql-results-<date>.md)
//   npm run sql:eval -- --label="..." --date=2026-11-20
// For each question in eval/sql-questions.jsonl the model's SQL (through the same generateSql() the route uses) and
// the reference SQL are both run in DuckDB (Node, same engine as the browser) and compared by eval/compare.mts:
// columns matched by their values (any order, any names), numbers within 0.05, row order ignored unless the question
// is "ordered". Two scores: STRICT (exactly the reference columns) and LENIENT (extra columns allowed).
// Questions in set "judgment" are shown, never scored. eval/sql-refusals.jsonl holds prompts that must be refused; the
// report says which layer stopped each one. The model's output is sampled, so a single run is a sample, not a verdict.
import fs from "node:fs";
import { generateSql, SQL_MODEL } from "../sqlgen/generate";
import { validateSql } from "../sqlgen/validate";
import { openDb } from "./duckdb-node.mts";
import { compare, TOLERANCE, type Rows } from "./compare.mts";

// USD per 1M tokens (gpt-5.4-mini standard tier, from OpenAI's model page)
const PRICE = { in: 0.75, out: 4.5 };
const read = (f: string) =>
  fs
    .readFileSync(f, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
const db = await openDb();
const questions = read("eval/sql-questions.jsonl") as { id: number; set: string; q: string; reference: string; ordered?: boolean; note?: string }[];
// `unsafe` (a regex) marks the dangerous part of a prompt: if the model writes SQL without it, it defused the request.
const refusals = read("eval/sql-refusals.jsonl") as { q: string; unsafe?: string }[];
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const preview = (r: Rows, n = 5) =>
  [r.columns.join(" | "), ...r.rows.slice(0, n).map((x) => x.join(" | ")), ...(r.rows.length > n ? [`... ${r.rows.length} rows in all`] : [])].map((l) => "    " + l).join("\n");
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const pct = (a: number, n: number) => `${Math.round((100 * a) / n)}%`;

if (process.argv.includes("--check-references")) {
  for (const { id, set, q, reference, ordered, note } of questions) {
    const v = validateSql(reference);
    const r = db.run(reference);
    console.log(`\n#${id} [${set}] ${q}\n  ${reference}\n  validator: ${v.ok ? "ok" : "REJECTS: " + v.reason} | ordered: ${!!ordered} | ${r.rows.length} rows | ${r.columns.join(", ")}${note ? `\n  note: ${note}` : ""}`);
    r.rows.slice(0, 8).forEach((x) => console.log("    " + x.join(" | ")));
  }
  process.exit(0);
}

type Verdict = "PASS" | "LENIENT" | "WRONG" | "ERROR" | "REFUSED" | "BLOCKED" | "JUDGMENT";
type SetTally = { n: number; strict: number; lenient: number };
type Run = {
  strictN: number;
  lenientN: number;
  total: number;
  bySet: Record<string, SetTally>;
  refused: number;
  layers: { model: number; validator: number; defused: number; none: number };
  verdicts: Record<number, Verdict>;
  /** What the judgment question's query did: the cut-off it chose and how many rows it counted. */
  judgment: { threshold: number | null; counted: string; customers: number | null; text: string } | null;
  cost: number;
  medianMs: number;
  inTok: number;
  outTok: number;
  /** Markdown of this run's tables and details; `h` is the heading prefix. */
  body: (h: string) => string;
};

const THRESHOLD = /HAVING[^;]*?(>=|>)\s*(\d+)/i;
const thresholdOf = (sql: string): number | null => {
  const m = THRESHOLD.exec(sql);
  return m ? (m[1] === ">" ? Number(m[2]) + 1 : Number(m[2])) : null;
};

async function evaluate(runLabel: string): Promise<Run> {
  let inTok = 0,
    outTok = 0,
    strictN = 0,
    lenientN = 0;
  const bySet: Record<string, SetTally> = {};
  const verdicts: Record<number, Verdict> = {};
  const times: number[] = [];
  const rows: string[] = [];
  const failures: string[] = [];
  const everyQuery: string[] = [];
  const judgmentBlocks: string[] = [];
  let judgment: Run["judgment"] = null;
  for (const { id, set, q, reference, ordered, note } of questions) {
    const scored = set !== "judgment";
    const T = scored ? (bySet[set] ??= { n: 0, strict: 0, lenient: 0 }) : { n: 0, strict: 0, lenient: 0 }; // judgment questions get no score row
    T.n++;
    const t0 = Date.now();
    const g = await generateSql(q);
    times.push(Date.now() - t0);
    inTok += g.usage.inputTokens;
    outTok += g.usage.outputTokens;
    const expected = db.run(reference);
    let verdict: Verdict;
    let detail = "";
    let sql = "";
    let got: Rows | null = null;
    if (g.kind === "refused") {
      verdict = g.reason === "off_topic" ? "REFUSED" : "BLOCKED";
      detail = g.reason === "off_topic" ? "the model answered REFUSE" : `the validator blocked what the model wrote (${g.raw ?? ""})`;
    } else {
      sql = g.sql;
      try {
        got = db.run(g.sql);
        const c = compare(got, expected, !!ordered);
        verdict = !scored ? "JUDGMENT" : c.strict ? "PASS" : c.lenient ? "LENIENT" : "WRONG";
        detail = c.why;
      } catch (e) {
        verdict = "ERROR";
        detail = String(e instanceof Error ? e.message : e).split("\n")[0];
      }
    }
    verdicts[id] = verdict;
    everyQuery.push(`#${id} [${set}] ${verdict}: ${q}\n  generated: ${oneLine(sql) || "(none)"}\n  reference: ${oneLine(reference)}`);
    if (verdict === "PASS") (strictN++, T.strict++);
    if (verdict === "PASS" || verdict === "LENIENT") (lenientN++, T.lenient++);
    if (!scored) {
      // The definition the model chose: the number in "HAVING COUNT(...) >= N" (or "> N", which means N + 1), and what it counted.
      const t = thresholdOf(sql);
      const counted = /COUNT\s*\(\s*DISTINCT\s+order_id/i.test(sql) ? "distinct orders" : /COUNT\s*\(\s*\*\s*\)/i.test(sql) ? "item rows (COUNT(*))" : "";
      const text = t !== null
        ? `at least ${t}, counting ${counted || "something the script could not read (see the query)"}`
        : sql
          ? /\bHAVING\b|\bWHERE\b/i.test(sql)
            ? "a cut-off the script could not read (see the query)"
            : "no cut-off: the query ranks every customer, without picking any as loyal"
          : `(no query: ${verdict.toLowerCase()})`;
      const refT = thresholdOf(reference);
      judgment = { threshold: t, counted, customers: got ? got.rows.length : null, text };
      judgmentBlocks.push(
        [
          `#${id}: ${q}`,
          `  reference definition: at least ${refT} distinct orders -> ${expected.rows.length} customers`,
          `  model's definition:   ${text} -> ${got ? got.rows.length + " customers" : "no result"}${got && compare(got, expected, false).lenient ? "  (same customers as the reference)" : ""}`,
          `  generated: ${oneLine(sql) || "(none)"}`,
          `  reference: ${oneLine(reference)}`,
        ].join("\n"),
      );
    }
    rows.push(`| ${id} | ${set} | ${scored ? verdict : `${verdict} (not scored)`} | ${q} | ${[detail && verdict === "LENIENT" ? detail : "", note ?? ""].filter(Boolean).join(" ")} |`);
    if (verdict !== "PASS" && scored) {
      failures.push(
        [
          `#${id} [${set}] ${verdict}: ${q}`,
          `  why:       ${detail || "(no detail)"}`,
          ...(note ? [`  note:      ${note}`] : []),
          `  generated: ${oneLine(sql) || "(none)"}`,
          `  reference: ${oneLine(reference)}${ordered ? "   [ordered]" : ""}`,
          ...(got ? ["  generated result:", preview(got)] : []),
          "  reference result:",
          preview(expected),
        ].join("\n"),
      );
    }
    console.log(`${runLabel} ${verdict.padEnd(8)} #${String(id).padStart(2)} ${q.slice(0, 64)}`);
  }

  // Prompts that must be refused. Two layers can stop one: the model (answers REFUSE) or the validator (blocks what the
  // model wrote). If SQL gets through both, that is a failure.
  const refRows: string[] = [];
  const layers = { model: 0, validator: 0, defused: 0, none: 0 };
  for (const { q, unsafe } of refusals) {
    const g = await generateSql(q);
    inTok += g.usage.inputTokens;
    outTok += g.usage.outputTokens;
    let layer: string;
    let what: string;
    if (g.kind === "sql" && unsafe && !new RegExp(unsafe, "i").test(g.sql)) {
      // Neither layer stopped it: the model answered the harmless part and left the unsafe part out. The query passed the validator.
      layers.defused++;
      layer = "neither: the model left out the unsafe part and wrote only a safe query";
      what = oneLine(g.sql);
    } else if (g.kind === "sql") {
      layers.none++;
      layer = "NOT STOPPED (wrote SQL)";
      what = oneLine(g.sql);
    } else if (g.reason === "off_topic") {
      layers.model++;
      layer = "model (answered REFUSE)";
      what = "REFUSE";
    } else {
      layers.validator++;
      layer = "validator";
      what = oneLine(g.raw ?? "");
    }
    refRows.push(`| ${layer} | ${q} | ${what} |`);
    console.log(`${runLabel} ${layer.padEnd(26)} ${q.slice(0, 56)}`);
  }

  const total = questions.filter((q) => q.set !== "judgment").length; // scored questions only
  const cost = (inTok * PRICE.in + outTok * PRICE.out) / 1e6;
  const medianMs = median(times);
  const refused = layers.model + layers.validator;
  const body = (h: string) => {
    const out: string[] = [];
    out.push(`${h} Result\n`);
    out.push(`| Set | Questions | Strict | Lenient |\n|---|---|---|---|`);
    for (const [name, t] of Object.entries(bySet)) out.push(`| ${name} | ${t.n} | ${t.strict} of ${t.n} (${pct(t.strict, t.n)}) | ${t.lenient} of ${t.n} (${pct(t.lenient, t.n)}) |`);
    out.push(`| **Overall** | ${total} | **${strictN} of ${total}** (${pct(strictN, total)}) | **${lenientN} of ${total}** (${pct(lenientN, total)}) |\n`);
    out.push(`- **Refusals: ${refused} of ${refusals.length}** off-topic or injection prompts stopped: ${layers.model} by the model (REFUSE), ${layers.validator} by the validator. ${layers.defused} defused (the model wrote only a safe query, without the unsafe part), ${layers.none} NOT stopped.`);
    out.push(`- Median time per question: ${medianMs} ms (generation only, from a laptop). Tokens: ${inTok} in, ${outTok} out. Cost of this run: $${cost.toFixed(4)} ($${(cost / (total + refusals.length)).toFixed(5)} per call).\n`);
    out.push(`${h} Questions\n\nPASS = strict. LENIENT = right values but extra columns. WRONG = the values differ. ERROR = DuckDB rejected the query. REFUSED / BLOCKED = no SQL came back (model / validator). JUDGMENT = shown, never scored.\n\n| # | Set | Result | Question | Note |\n|---|---|---|---|---|\n${rows.join("\n")}\n`);
    if (judgmentBlocks.length)
      out.push(`${h} Judgment question (not scored)\n\nThe question names a word the data does not define. This compares the definition the model chose with the reference definition, with no pass or fail.\n\n\`\`\`\n${judgmentBlocks.join("\n\n")}\n\`\`\`\n`);
    out.push(`${h} Prompts that must be refused\n\n| Stopped by | Prompt | What came back |\n|---|---|---|\n${refRows.join("\n")}\n`);
    out.push(failures.length ? `${h} Every question that was not a strict pass, with both queries\n\n\`\`\`\n${failures.join("\n\n")}\n\`\`\`\n` : `${h} Every question that was not a strict pass\n\nNone.\n`);
    out.push(`${h} Every generated query next to its reference\n\nSo a pass can be checked by eye, not only by the comparison.\n\n\`\`\`\n${everyQuery.join("\n\n")}\n\`\`\`\n`);
    return out.join("\n");
  };
  return { strictN, lenientN, total, bySet, refused, layers, verdicts, judgment, cost, medianMs, inTok, outTok, body };
}

const runsN = Math.max(1, Number(arg("runs") ?? 1));
const date = arg("date") ?? new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
const outFile = arg("out") ?? `eval/sql-results-${date}.md`;
const label = arg("label") ?? "";
const runs: Run[] = [];
for (let i = 1; i <= runsN; i++) runs.push(await evaluate(runsN > 1 ? `[run ${i}/${runsN}]` : ""));

const total = runs[0].total;
const hard = (r: Run) => r.bySet["hard"] ?? { n: 0, strict: 0, lenient: 0 };
const clear = (r: Run) => r.bySet["clear"] ?? { n: 0, strict: 0, lenient: 0 };
const out: string[] = [];
out.push(`# English to SQL eval, ${date}${label ? ` (${label})` : ""}`);
out.push(`
- Script: \`eval/sql-run.mts\` (\`npm run sql:eval${runsN > 1 ? ` -- --runs=${runsN}` : ""}\`). Questions and reference queries: \`eval/sql-questions.jsonl\` (${questions.length}, of which ${total} are scored). Prompts that must be refused: \`eval/sql-refusals.jsonl\` (${refusals.length}).
- Model: \`${SQL_MODEL}\`, through the same \`generateSql()\` as the \`/api/sql\` route, including its validator. The table is \`instacart_sample\` (873 rows).
- Scoring (\`eval/compare.mts\`, unit tested): the generated and the reference query are both run in DuckDB (Node, the same DuckDB-WASM engine as the browser) and compared.
  - Columns are matched by their values, not by position or name (every assignment of result columns to reference columns is tried).
  - Numbers match within ${TOLERANCE}, so 58 and 58.0 match; a fraction instead of a percentage (0.58 for 58) does not.
  - Row order is ignored unless the question is marked ordered (only question 12).
  - **Strict**: the result has exactly the reference columns. **Lenient**: all reference columns are present, extra columns allowed. Row counts must match in both.
- Sets: **clear** (questions 1 to 15: precise wording, a column or a number named), **hard** (16, 17, 19, 20, 21: recruiter-style wording with no column names, vague words, NULLs, a tie, typos; scored out of 5) and **judgment** (question 18, "loyal customers": the question does not define the word, so any threshold is defensible; shown with the model's definition next to the reference one, with no pass or fail and left out of every score). The notes say where a different answer is defensible.
- The questions and reference queries were drafted by Claude and reviewed by Akshay. ${total} scored questions is a small sample.
- The model's output is sampled, so the same code gives different scores on different runs. ${runsN > 1 ? `This file reports ${runsN} independent runs of the whole eval, each one below, and their median.` : "One run is a sample, not a verdict."}
- Prices for cost: gpt-5.4-mini $${PRICE.in} and $${PRICE.out} per million input and output tokens.
`);

if (runsN > 1) {
  out.push(`## Summary of the ${runsN} runs\n`);
  out.push(`| Run | Clear strict | Hard strict | Hard lenient | Overall strict | Overall lenient | Refusals | Question 18: the cut-off the model chose |\n|---|---|---|---|---|---|---|---|`);
  runs.forEach((r, i) =>
    out.push(`| ${i + 1} | ${clear(r).strict} of ${clear(r).n} | ${hard(r).strict} of ${hard(r).n} | ${hard(r).lenient} of ${hard(r).n} | ${r.strictN} of ${r.total} | ${r.lenientN} of ${r.total} | ${r.refused} stopped, ${r.layers.defused} defused, ${r.layers.none} not stopped | ${r.judgment ? `${r.judgment.text} (${r.judgment.customers ?? "no"} customers)` : "-"} |`),
  );
  const med = (f: (r: Run) => number) => median(runs.map(f));
  const thresholds = runs.map((r) => r.judgment?.threshold).filter((t): t is number => typeof t === "number");
  const custs = runs.map((r) => r.judgment?.customers).filter((t): t is number => typeof t === "number");
  out.push(
    `| **Median** | **${med((r) => clear(r).strict)} of ${clear(runs[0]).n}** | **${med((r) => hard(r).strict)} of ${hard(runs[0]).n}** | **${med((r) => hard(r).lenient)} of ${hard(runs[0]).n}** | **${med((r) => r.strictN)} of ${total}** | **${med((r) => r.lenientN)} of ${total}** | ${med((r) => r.refused)} stopped, ${med((r) => r.layers.defused)} defused | ${thresholds.length ? `median cut-off ${median(thresholds)} (${thresholds.length} of ${runs.length} runs gave one), median ${median(custs)} customers` : "no run gave a cut-off"} |\n`,
  );
  out.push(`The reference definition for question 18 is at least 6 distinct orders (8 customers); it is not scored.\n`);
  // per question across the runs: where the variation is
  out.push(`### Each question across the runs\n\n| # | Set | Question | ${runs.map((_, i) => `Run ${i + 1}`).join(" | ")} |\n|---|---|---|${runs.map(() => "---").join("|")}|`);
  for (const { id, set, q } of questions) out.push(`| ${id} | ${set} | ${q} | ${runs.map((r) => r.verdicts[id]).join(" | ")} |`);
  out.push("");
  const costAll = runs.reduce((a, r) => a + r.cost, 0);
  out.push(`Total cost of the ${runsN} runs: $${costAll.toFixed(4)}.\n`);
  runs.forEach((r, i) => out.push(`## Run ${i + 1} in full\n\n${r.body("###")}`));
} else {
  out.push(runs[0].body("##"));
}
fs.writeFileSync(outFile, out.join("\n"));
const r0 = runs[runsN - 1];
console.log(`\n${runsN} run${runsN > 1 ? "s" : ""}. Last run: strict ${r0.strictN}/${total}, lenient ${r0.lenientN}/${total}. Wrote ${outFile}`);

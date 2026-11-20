import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { site } from "../config/site";
import { getSql, toVector } from "./db";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const TOP_K = 5;
/** Most keyword-only chunks added on top of the vector top-5. */
export const MAX_KEYWORD_EXTRAS = 3;

export type Retrieved = {
  hash: string;
  source: string;
  title: string;
  url: string;
  content: string;
  /** cosine similarity (1 - cosine distance); for keyword-only hits it is computed the same way */
  score: number;
  via: "vector" | "keyword";
  /** true when the chunk contains an exact term from the question (also set on vector hits) */
  keywordMatch?: boolean;
};

/**
 * Vocabulary of tools and skills, taken from config/site.ts (tools marquee, skills groups, project tags),
 * minus parentheticals such as "(coursework)". A question that names one of these ("dbt", "SQL", "Power BI",
 * "SCD Type 2", "MotherDuck") always gets a keyword lookup, whatever its case.
 */
const clean = (t: string) => t.replace(/\s*\(.*?\)\s*/g, "").trim();
const VOCAB = [
  ...new Set(
    [...site.tools, ...site.skills.flatMap((g) => g.skills), ...site.projects.flatMap((p) => p.tags)]
      .map(clean)
      .filter((t) => t.length >= 2),
  ),
];
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");

/**
 * Exact terms worth a keyword lookup:
 * 1. any vocabulary term found in the question as a whole word (case-insensitive, optional plural "s");
 * 2. terms outside the vocabulary that look technical: acronyms ("RFM"), tokens with digits or inner capitals
 *    ("GridSearchCV", "F1"), and runs of capitalised words that contain such a token or that do not start the
 *    question ("Delta Lake"). Plain capitalised words ("Has", "Akshay") are ignored.
 */
export function exactTerms(question: string): string[] {
  const lower = question.toLowerCase();
  const terms: string[] = VOCAB.filter((t) => new RegExp(`(?<![a-z0-9])${escapeRe(t.toLowerCase())}s?(?![a-z0-9])`).test(lower));

  const tokens = question.replace(/[?!,;:()"\u201c\u201d]/g, " ").split(/\s+/).filter(Boolean);
  const isCap = (t: string) => /^[A-Z0-9]/.test(t);
  const special = (t: string) => /^[A-Z]{2,}\b/.test(t) || /\d/.test(t) || /^[A-Za-z]+[A-Z]/.test(t);
  for (let i = 0; i < tokens.length; ) {
    if (!isCap(tokens[i])) { i++; continue; }
    let j = i;
    while (j < tokens.length && isCap(tokens[j])) j++;
    const run = tokens.slice(i, j).map((t) => t.replace(/[.'\u2019]s?$/, ""));
    if (run.some(special) || (run.length > 1 && i > 0)) terms.push(run.join(" "));
    for (const t of run) if (run.length > 1 && special(t)) terms.push(t);
    i = j;
  }
  const seen = new Set<string>();
  return terms.filter((t) => t.length >= 2 && !seen.has(t.toLowerCase()) && !!seen.add(t.toLowerCase())).slice(0, 6);
}

export type RetrievalResult = {
  chunks: Retrieved[];
  embedTokens: number;
  terms: string[];
  ms: number;
};

export async function retrieve(question: string): Promise<RetrievalResult> {
  const t0 = Date.now();
  const sql = getSql();
  const { embedding, usage } = await embed({ model: openai.textEmbedding(EMBEDDING_MODEL), value: question });
  const vec = toVector(embedding);

  const top = (await sql`
    select hash, source, title, url, content, 1 - (embedding <=> ${vec}::vector) as score
    from chunks order by embedding <=> ${vec}::vector limit ${TOP_K}`) as Omit<Retrieved, "via">[];
  const chunks: Retrieved[] = top.map((r) => ({ ...r, score: Number(r.score), via: "vector" }));

  // keyword fallback: chunks containing an exact term that the vector search did not already return
  const terms = exactTerms(question);
  if (terms.length) {
    // whole-word, case-insensitive: "SQL" must not match inside "PostgreSQL"
    const patterns = terms.map((t) => `\\m${escapeRe(t)}s?\\M`);
    const have = chunks.map((c) => c.hash);
    const kw = (await sql`
      select hash, source, title, url, content, 1 - (embedding <=> ${vec}::vector) as score
      from chunks
      where content ~* any(${patterns}) and not (hash = any(${have}))
      order by (select count(*) from unnest(${patterns}::text[]) p where content ~* p) desc, embedding <=> ${vec}::vector
      limit ${MAX_KEYWORD_EXTRAS}`) as Omit<Retrieved, "via">[];
    chunks.push(...kw.map((r) => ({ ...r, score: Number(r.score), via: "keyword" as const, keywordMatch: true })));
    // vector hits that also contain an exact term count as keyword matches (they must pass the relevance gate)
    const inTop = (await sql`select hash from chunks where hash = any(${have}) and content ~* any(${patterns})`).map((r) => r.hash as string);
    for (const c of chunks) if (inTop.includes(c.hash)) c.keywordMatch = true;
  }
  return { chunks, embedTokens: usage.tokens ?? 0, terms, ms: Date.now() - t0 };
}

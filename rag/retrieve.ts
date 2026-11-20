import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { getSql, toVector } from "./db";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const TOP_K = 5;
/** Most keyword-only chunks added on top of the vector top-5. */
export const MAX_KEYWORD_EXTRAS = 2;

export type Retrieved = {
  hash: string;
  source: string;
  title: string;
  url: string;
  content: string;
  /** cosine similarity (1 - cosine distance); for keyword-only hits it is computed the same way */
  score: number;
  via: "vector" | "keyword";
};

const STARTERS = new Set("what which who whom whose when where why how did does do is are was were can could would should tell give list show explain describe".split(" "));

/**
 * Exact terms worth a keyword lookup: acronyms ("SCD", "RFM"), tokens with digits or inner capitals
 * ("PySpark", "GridSearchCV", "F1"), and runs of such tokens joined with plain words that start a
 * capital or digit ("SCD Type 2", "Delta Lake MERGE"). Plain capitalised single words are ignored.
 */
export function exactTerms(question: string): string[] {
  const tokens = question.replace(/[?!,;:()"“”]/g, " ").split(/\s+/).filter(Boolean);
  const isCap = (t: string) => /^[A-Z0-9]/.test(t);
  const special = (t: string) => /^[A-Z]{2,}\b/.test(t) || /\d/.test(t) || /^[A-Za-z]+[A-Z]/.test(t.slice(0, 1) + t.slice(1));
  const terms = new Set<string>();
  for (let i = 0; i < tokens.length; ) {
    if (!isCap(tokens[i]) || (i === 0 && STARTERS.has(tokens[i].toLowerCase()))) { i++; continue; }
    let j = i;
    while (j < tokens.length && isCap(tokens[j])) j++;
    const run = tokens.slice(i, j).map((t) => t.replace(/\.$/, ""));
    if (run.length > 1 || special(run[0])) terms.add(run.join(" "));
    // single special tokens inside a longer run too (e.g. "FoodLens" in "Does FoodLens SCD Type 2")
    for (const t of run) if (run.length > 1 && special(t)) terms.add(t);
    i = j;
  }
  return [...terms].filter((t) => t.length >= 2).slice(0, 4);
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
    const patterns = terms.map((t) => `%${t.replace(/[%_\\]/g, "\\$&")}%`);
    const have = chunks.map((c) => c.hash);
    const kw = (await sql`
      select hash, source, title, url, content, 1 - (embedding <=> ${vec}::vector) as score
      from chunks
      where content ilike any(${patterns}) and not (hash = any(${have}))
      order by (select count(*) from unnest(${patterns}::text[]) p where content ilike p) desc, embedding <=> ${vec}::vector
      limit ${MAX_KEYWORD_EXTRAS}`) as Omit<Retrieved, "via">[];
    chunks.push(...kw.map((r) => ({ ...r, score: Number(r.score), via: "keyword" as const })));
  }
  return { chunks, embedTokens: usage.tokens ?? 0, terms, ms: Date.now() - t0 };
}

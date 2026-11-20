// npm run rag:eval  (manual: it calls OpenAI). Reports hit@5 and correct-citation rate on eval/questions.jsonl,
// and how eval/refusals.jsonl (off-topic and injection prompts) is handled. Bypasses the rate limiter.
// Add -- --retrieval-only to skip the chat calls (embeddings only, a fraction of a cent).
import fs from "node:fs";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { retrieve } from "../rag/retrieve";
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, MIN_SIMILARITY, NOT_ON_SITE, SYSTEM, buildUserMessage, isAnswerable } from "../rag/answer";

// USD per 1M tokens. gpt-5.4-mini: OpenAI model page (standard tier). text-embedding-3-small: OpenAI pricing page.
const PRICE = { chatIn: 0.75, chatOut: 4.5, embed: 0.02 };
const read = (f: string) =>
  fs
    .readFileSync(f, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
const withChat = !process.argv.includes("--retrieval-only");

let inTok = 0,
  outTok = 0,
  embTok = 0;
const rows: string[] = [];
type Tally = { n: number; hit5: number; hitAny: number; cited: number; strict: number; noCite: number };
const sets: Record<string, Tally> = {};
let hit5 = 0,
  hitAny = 0,
  cited = 0,
  strict = 0,
  noCite = 0;
const questions = read("eval/questions.jsonl");

async function chat(q: string, chunks: Awaited<ReturnType<typeof retrieve>>["chunks"]) {
  const out = await generateText({
    model: openai(CHAT_MODEL),
    instructions: SYSTEM,
    messages: [{ role: "user", content: buildUserMessage(q, chunks) }],
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  inTok += out.usage.inputTokens ?? 0;
  outTok += out.usage.outputTokens ?? 0;
  return out.text;
}

for (const { id, q, expected, set = "original" } of questions) {
  const T = (sets[set] ??= { n: 0, hit5: 0, hitAny: 0, cited: 0, strict: 0, noCite: 0 });
  T.n++;
  const r = await retrieve(q);
  embTok += r.embedTokens;
  const vec = r.chunks.filter((c) => c.via === "vector");
  const h5 = vec.some((c) => expected.includes(c.url));
  const hAny = r.chunks.some((c) => expected.includes(c.url));
  hit5 += +h5;
  hitAny += +hAny;
  T.hit5 += +h5;
  T.hitAny += +hAny;
  let note = "";
  if (withChat) {
    const text = await chat(q, r.chunks);
    const nums = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const urls = nums.map((n) => r.chunks[n - 1]?.url).filter(Boolean) as string[];
    if (!urls.length) (noCite++, T.noCite++);
    const okc = urls.some((u) => expected.includes(u)), oks = urls.length > 0 && urls.every((u) => expected.includes(u));
    cited += +okc;
    strict += +oks;
    T.cited += +okc;
    T.strict += +oks;
    note = `cites ${[...new Set(urls)].join(" ") || "NONE"}${text.startsWith("That isn't covered") ? "  (REFUSED)" : ""}`;
  }
  rows.push(`${h5 ? "HIT " : hAny ? "kw  " : "MISS"} #${String(id).padStart(2)} top=${vec[0].score.toFixed(2)} ${q.slice(0, 62).padEnd(62)} ${note}`);
}

const refusals = read("eval/refusals.jsonl");
let refused = 0,
  gated = 0;
const rrows: string[] = [];
for (const { q } of refusals) {
  const r = await retrieve(q);
  embTok += r.embedTokens;
  const best = Math.max(...r.chunks.map((c) => c.score));
  let ok = false,
    how = "";
  if (!isAnswerable(r.chunks)) {
    ok = true;
    gated++;
    how = "gate (no model call)";
  } else if (withChat) {
    const text = await chat(q, r.chunks);
    ok = text.trim() === NOT_ON_SITE;
    how = ok ? "model refusal" : "ANSWERED: " + text.slice(0, 80).replace(/\n/g, " ");
  } else how = "passes the gate (model not called)";
  refused += +ok;
  rrows.push(`${ok ? "ok  " : "pass"} best=${best.toFixed(2)} ${q.slice(0, 60).padEnd(60)} ${how}`);
}

const n = questions.length;
console.log(rows.join("\n"));
console.log("\nrefusals / off-topic / injection:\n" + rrows.join("\n"));
const cost = (inTok * PRICE.chatIn + outTok * PRICE.chatOut + embTok * PRICE.embed) / 1e6;
console.log("\nper set:  n  hit@5  +keyword  citation  strict  no-cite");
for (const [k, t] of Object.entries(sets))
  console.log(`${k.padEnd(10)} ${String(t.n).padStart(2)}  ${t.hit5}/${t.n}   ${t.hitAny}/${t.n}      ${withChat ? `${t.cited}/${t.n}      ${t.strict}/${t.n}    ${t.noCite}` : "-"}`);
console.log(`
questions: ${n}   similarity gate: ${MIN_SIMILARITY}
hit@5 (vector top-5 has an expected source): ${hit5}/${n} = ${((100 * hit5) / n).toFixed(0)}%
hit with keyword extras:                      ${hitAny}/${n} = ${((100 * hitAny) / n).toFixed(0)}%${
  withChat
    ? `
correct citation (answer cites an expected source): ${cited}/${n} = ${((100 * cited) / n).toFixed(0)}%
strict (every cited source is expected):            ${strict}/${n} = ${((100 * strict) / n).toFixed(0)}%
answers with no citation: ${noCite}`
    : ""
}
refusal handling: ${refused}/${refusals.length} refused (${gated} stopped by the gate)
tokens: chat in ${inTok}, chat out ${outTok}, embedding ${embTok}
cost: $${cost.toFixed(4)} (gpt-5.4-mini $${PRICE.chatIn}/$${PRICE.chatOut} per 1M in/out; embeddings $${PRICE.embed}/1M)`);

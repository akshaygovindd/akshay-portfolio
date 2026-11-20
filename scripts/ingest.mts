// npm run rag:ingest  - chunk the corpus, embed only chunks whose hash is new, upsert, and delete stale rows.
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildCorpus } from "../rag/corpus";
import { getSql, toVector } from "../rag/db";

const sql = getSql();
const chunks = await buildCorpus();
const existing = new Set((await sql`select hash from chunks`).map((r) => r.hash as string));
const fresh = chunks.filter((c) => !existing.has(c.hash));
const live = new Set(chunks.map((c) => c.hash));
const stale = [...existing].filter((h) => !live.has(h));

let tokens = 0;
for (let i = 0; i < fresh.length; i += 64) {
  const batch = fresh.slice(i, i + 64);
  const { embeddings, usage } = await embedMany({
    model: openai.textEmbedding("text-embedding-3-small"),
    values: batch.map((c) => c.content),
  });
  tokens += usage.tokens ?? 0;
  for (let j = 0; j < batch.length; j++) {
    const c = batch[j];
    await sql`insert into chunks (hash, source, title, url, content, embedding)
      values (${c.hash}, ${c.source}, ${c.title}, ${c.url}, ${c.content}, ${toVector(embeddings[j])}::vector)
      on conflict (hash) do nothing`;
  }
}
for (const h of stale) await sql`delete from chunks where hash = ${h}`;

console.log(
  `chunks: ${chunks.length} | embedded: ${fresh.length} (${tokens} tokens) | unchanged: ${chunks.length - fresh.length} | removed: ${stale.length}`,
);
if (process.argv.includes("--list")) for (const c of chunks) console.log(`${c.content.length}\t${c.source}\t${c.url}\t${c.title}`);

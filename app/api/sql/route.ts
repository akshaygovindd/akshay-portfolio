import { generateSql, MAX_QUESTION_CHARS } from "@/sqlgen/generate";
import { checkLimits, clientIp } from "@/rag/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * English to SQL for the playground. The browser sends only the question. The model gets the table schema
 * (built on the server from the sample CSV) and the question, and answers with one SELECT, which is validated
 * here and returned as text. It is never run on the server and the browser never runs it automatically.
 * Limits: 10 an hour per hashed IP (its own bucket), counted in the same 200-a-day cap as the other assistant.
 * The question is not stored or logged.
 */
export async function POST(req: Request) {
  let question = "";
  try {
    const body = (await req.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!question || question.length > MAX_QUESTION_CHARS) return json({ error: "bad_request" }, 400);

  try {
    const limit = await checkLimits(clientIp(req), "sql");
    if (limit === "ip") return json({ error: "rate_limited" }, 429);
    if (limit === "global") return json({ error: "unavailable" }, 503);

    const g = await generateSql(question);
    if (g.kind === "sql") return json({ sql: g.sql });
    return json({ refused: true, message: g.message });
  } catch {
    // bad or expired key, budget reached, provider rate limit, Neon down: all look the same to the visitor
    return json({ error: "unavailable" }, 503);
  }
}

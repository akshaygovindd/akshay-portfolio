import { createUIMessageStreamResponse, streamText, toUIMessageStream } from "ai";
import type { UIMessageChunk } from "ai";
import { openai } from "@ai-sdk/openai";
import { retrieve } from "@/rag/retrieve";
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, MAX_QUESTION_CHARS, NOT_ON_SITE, SYSTEM, buildUserMessage, isAnswerable } from "@/rag/answer";
import { checkLimits } from "@/rag/ratelimit";
import type { AskMessage, AskMetadata } from "@/rag/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const json = (error: "unavailable" | "rate_limited" | "bad_request", status: number) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

function clientIp(req: Request): string {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const started = Date.now();
  let question = "";
  try {
    const body = (await req.json()) as { messages?: AskMessage[] };
    const last = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
    question = (last?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("").trim();
  } catch {
    return json("bad_request", 400);
  }
  if (!question || question.length > MAX_QUESTION_CHARS) return json("bad_request", 400);

  try {
    // Limits first: a hashed IP bucket (10/hour) and the site-wide daily cap (200/day), both in Neon.
    const limit = await checkLimits(clientIp(req));
    if (limit === "ip") return json("rate_limited", 429);
    if (limit === "global") return json("unavailable", 503);

    const r = await retrieve(question);
    const base: AskMetadata = {
      chunks: r.chunks.map((c, i) => ({ n: i + 1, title: c.title, url: c.url, score: Number(c.score.toFixed(3)), via: c.via, source: c.source })),
      retrievalMs: r.ms,
      embedTokens: r.embedTokens,
      model: CHAT_MODEL,
    };

    // Nothing relevant: answer without spending a chat call.
    if (!isAnswerable(r.chunks)) {
      const id = "a";
      const chunks: UIMessageChunk[] = [
        { type: "start", messageMetadata: { ...base, generated: false } },
        { type: "text-start", id },
        { type: "text-delta", id, delta: NOT_ON_SITE },
        { type: "text-end", id },
        { type: "finish", messageMetadata: { totalMs: Date.now() - started, inputTokens: 0, outputTokens: 0 } },
      ];
      return createUIMessageStreamResponse({
        stream: new ReadableStream({
          start(c) {
            chunks.forEach((x) => c.enqueue(x));
            c.close();
          },
        }),
      });
    }

    const result = streamText({
      model: openai(CHAT_MODEL),
      instructions: SYSTEM,
      messages: [{ role: "user", content: buildUserMessage(question, r.chunks) }],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxRetries: 1,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        messageMetadata: ({ part }) => {
          if (part.type === "start") return { ...base, generated: true } satisfies AskMetadata;
          if (part.type === "finish")
            return {
              totalMs: Date.now() - started,
              inputTokens: part.totalUsage.inputTokens,
              outputTokens: part.totalUsage.outputTokens,
            } satisfies AskMetadata;
        },
        onError: () => "unavailable",
      }),
    });
  } catch {
    // Bad or expired key, budget reached, provider rate limit, Neon down: all look the same to the visitor.
    return json("unavailable", 503);
  }
}

"use client";

import "./zod-jitless";

import { useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, Send } from "lucide-react";
import type { AskMessage } from "@/rag/types";

const MAX_CHARS = 300;
const UNAVAILABLE = "The assistant is unavailable right now. The rest of the site works as usual.";
const RATE_LIMITED = "That's the limit of 10 questions per hour from one connection. Please try again a little later.";

const transport = new DefaultChatTransport<AskMessage>({ api: "/api/ask" });

export default function AskPanel({ chips, boxClass }: { chips: string[]; boxClass: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat<AskMessage>({ transport });
  const busy = status === "submitted" || status === "streaming";

  const question = [...messages].reverse().find((m) => m.role === "user");
  const answer = [...messages].reverse().find((m) => m.role === "assistant");
  const text = answer?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  const meta = answer?.metadata;
  const failed = status === "error" || !!error;

  function ask(q: string) {
    const t = q.trim().slice(0, MAX_CHARS);
    if (!t || busy) return;
    setInput("");
    void sendMessage({ text: t });
  }

  // [1][2] in the answer become links to the cited chunk's section.
  const cited = new Set<number>();
  const rendered = text.split(/(\[\d+\])/).map((piece, i) => {
    const m = /^\[(\d+)\]$/.exec(piece);
    const chunk = m && meta?.chunks?.find((c) => c.n === Number(m[1]));
    if (!chunk) return <span key={i}>{piece}</span>;
    cited.add(chunk.n);
    return (
      <Link key={i} href={chunk.url} className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent" aria-label={`Source ${chunk.n}: ${chunk.title}`}>
        {piece}
      </Link>
    );
  });
  const sources = (meta?.chunks ?? []).filter((c) => cited.has(c.n));
  const errorText = error?.message.includes("rate_limited") ? RATE_LIMITED : UNAVAILABLE;

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-mono text-xs text-muted">try:</span>
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => ask(c)}
            className="tag min-h-11 px-4 text-left transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap items-center gap-3 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask a question about this portfolio
        </label>
        <input
          id="ask-input"
          value={input}
          maxLength={MAX_CHARS}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a project, a decision or a number…"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 basis-64 rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          Ask
        </button>
      </form>

      {/* Fixed height so streaming text never moves the page (CLS stays 0). The region scrolls inside. */}
      <div
        role="region"
        aria-label="Answer"
        tabIndex={0}
        className={`${boxClass.replace("h-[34rem]", "h-[26rem]").replace("sm:h-[31rem]", "sm:h-[22rem]")} overflow-y-auto border-t border-border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent`}
      >
        <div aria-live="polite" aria-atomic="false">
          {!question && <p className="text-muted">Ask a question, or pick one above. Nothing you type is stored.</p>}
          {question && (
            <p className="font-mono text-xs text-muted">
              Q: {question.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
            </p>
          )}
          {busy && !text && <p className="mt-3 text-muted">Searching the site…</p>}
          {failed && (
            <p role="status" className="mt-3 text-fg">
              {errorText}
            </p>
          )}
          {text && !failed && <p className="mt-3 whitespace-pre-wrap leading-relaxed">{rendered}</p>}
        </div>

        {sources.length > 0 && !busy && (
          <ul className="mt-4 space-y-1 text-sm">
            {sources.map((s) => (
              <li key={s.n}>
                <span className="font-mono text-muted">[{s.n}] </span>
                <Link href={s.url} className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {meta?.chunks && !failed && (
          <details className="mt-5 rounded-xl border border-border bg-bg p-3 text-sm">
            <summary className="min-h-11 cursor-pointer py-2.5 font-medium">How this answer was built</summary>
            <p className="mt-2 text-muted">
              {meta.generated === false
                ? "No passage was relevant enough, so the language model was not called."
                : `The question was embedded, the closest passages were retrieved from the site's own content, and ${meta.model ?? "the model"} wrote the answer from them only.`}
            </p>
            <ol className="mt-3 space-y-1.5">
              {meta.chunks.map((c) => (
                <li key={c.n} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs text-muted">[{c.n}]</span>
                  <Link href={c.url} className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                    {c.title}
                  </Link>
                  <span className="font-mono text-xs text-muted">
                    similarity {c.score.toFixed(3)} · {c.via === "keyword" ? "keyword match" : "vector"}
                  </span>
                </li>
              ))}
            </ol>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs sm:grid-cols-4">
              <div><dt className="text-muted">retrieval</dt><dd>{meta.retrievalMs ?? "-"} ms</dd></div>
              <div><dt className="text-muted">total</dt><dd>{meta.totalMs !== undefined ? `${meta.totalMs} ms` : busy ? "…" : "-"}</dd></div>
              <div><dt className="text-muted">tokens in / out</dt><dd>{meta.inputTokens ?? (busy ? "…" : "-")} / {meta.outputTokens ?? (busy ? "…" : "-")}</dd></div>
              <div><dt className="text-muted">embedding tokens</dt><dd>{meta.embedTokens ?? "-"}</dd></div>
            </dl>
          </details>
        )}
      </div>
    </div>
  );
}

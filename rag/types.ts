import type { UIMessage } from "ai";

/** What the "How this answer was built" panel shows. Shared by the route (server) and the panel (client). */
export type AskMetadata = {
  chunks?: { n: number; title: string; url: string; score: number; via: "vector" | "keyword"; source: string }[];
  retrievalMs?: number;
  embedTokens?: number;
  /** false when the question was answered without calling the chat model */
  generated?: boolean;
  totalMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
};
export type AskMessage = UIMessage<AskMetadata>;

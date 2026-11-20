import { neon } from "@neondatabase/serverless";

/** Neon over HTTP (no connection pool to manage in serverless functions). */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/** pgvector text literal, e.g. "[0.1,0.2]". */
export const toVector = (v: number[]) => `[${v.join(",")}]`;

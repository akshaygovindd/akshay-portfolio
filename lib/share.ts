/**
 * Share links for the SQL playground: the query travels in the URL as ?q=<base64url of UTF-8 text>.
 * Decoding is strict and only ever yields plain text for the editor: it is never run and never rendered as HTML.
 */
export const MAX_SHARE_CHARS = 2000;

export type Encoded = { ok: true; param: string } | { ok: false; error: string };

export function encodeQuery(sql: string): Encoded {
  const bytes = new TextEncoder().encode(sql);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const param = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (param.length > MAX_SHARE_CHARS)
    return { ok: false, error: `This query is too long to share as a link (the limit is ${MAX_SHARE_CHARS} characters). Try a shorter one.` };
  return { ok: true, param };
}

/** Returns the query text, or null for anything that is not a clean, reasonably sized base64url string of text. */
export function decodeQuery(param: string | null | undefined): string | null {
  if (!param || param.length > MAX_SHARE_CHARS || !/^[A-Za-z0-9_-]+$/.test(param)) return null;
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // plain text only: no NUL or other control characters (tabs and line breaks are fine)
    if (!text.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}

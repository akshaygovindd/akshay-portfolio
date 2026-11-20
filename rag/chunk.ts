/** Chunking by heading: one chunk per section when it fits, otherwise paragraph-packed pieces with a small overlap. */
export const MAX_CHARS = 1600; // about 400 tokens (chars / 4)
export const OVERLAP_CHARS = 200; // about 50 tokens

export function splitSection(text: string): string[] {
  const body = text.trim();
  if (body.length <= MAX_CHARS) return body ? [body] : [];

  // Break into paragraphs, and break any paragraph that is itself too long at sentence ends.
  const pieces: string[] = [];
  for (const para of body.split(/\n{2,}/)) {
    if (para.length <= MAX_CHARS) {
      pieces.push(para);
      continue;
    }
    let cur = "";
    for (const sentence of para.split(/(?<=[.!?])\s+/)) {
      if (cur && cur.length + sentence.length + 1 > MAX_CHARS) {
        pieces.push(cur);
        cur = "";
      }
      cur = cur ? `${cur} ${sentence}` : sentence;
    }
    if (cur) pieces.push(cur);
  }

  const chunks: string[] = [];
  let cur = "";
  for (const piece of pieces) {
    if (cur && cur.length + piece.length + 2 > MAX_CHARS) {
      chunks.push(cur);
      // overlap: carry the tail of the previous chunk (from a word boundary)
      const tail = cur.slice(-OVERLAP_CHARS);
      cur = tail.slice(tail.indexOf(" ") + 1) + "\n\n" + piece;
    } else {
      cur = cur ? `${cur}\n\n${piece}` : piece;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

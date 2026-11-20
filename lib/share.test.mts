import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeQuery, encodeQuery, MAX_SHARE_CHARS } from "./share";
import { chartSpec } from "./chart";
import type { QueryResult } from "./duckdb";

test("a query survives a round trip, including non-ASCII text", () => {
  for (const q of ["SELECT 1", "SELECT department, COUNT(*)\nFROM instacart_sample\nGROUP BY 1", "SELECT 'café ☕ 日本語' AS s"]) {
    const e = encodeQuery(q);
    assert.ok(e.ok);
    if (e.ok) {
      assert.match(e.param, /^[A-Za-z0-9_-]+$/); // url-safe: no +, / or =
      assert.equal(decodeQuery(e.param), q);
    }
  }
});

test("a query that is too long gives a friendly error", () => {
  const e = encodeQuery("SELECT " + "1,".repeat(1200) + "1");
  assert.equal(e.ok, false);
  if (!e.ok) assert.match(e.error, /too long to share/);
  assert.ok(encodeQuery("SELECT 1").ok);
  // the limit is on the encoded parameter
  const atLimit = encodeQuery("a".repeat(Math.floor((MAX_SHARE_CHARS * 3) / 4)));
  assert.ok(atLimit.ok);
});

test("bad input decodes to null and never throws", () => {
  const bads = [
    null,
    undefined,
    "",
    "!!!",
    "<script>alert(1)</script>",
    "SELECT 1", // not base64url (space)
    "a".repeat(MAX_SHARE_CHARS + 1),
    "%E0%A4%A", // percent junk
    "/w==", // not url-safe alphabet
    "gA", // valid base64, not valid UTF-8 (0x80)
    "AAAA", // NUL bytes
  ];
  for (const b of bads) assert.equal(decodeQuery(b as string), null, String(b));
});

test("markup in a link is just text: it decodes to a string and nothing else", () => {
  const html = '<img src=x onerror=alert(1)>';
  const e = encodeQuery(html);
  assert.ok(e.ok);
  if (e.ok) assert.equal(decodeQuery(e.param), html); // returned as a plain string; the editor shows it as text
});

const res = (kinds: QueryResult["kinds"], values: unknown[][], names?: string[]): QueryResult => ({
  columns: names ?? kinds.map((_, i) => `c${i}`),
  kinds,
  rows: [],
  values,
  rowCount: values.length,
});

test("chartSpec: one category column plus one or two numeric columns, at most 50 rows", () => {
  assert.ok(chartSpec(res(["text", "number"], [["a", 1n], ["b", 2n]])));
  assert.ok(chartSpec(res(["number", "text"], [[1, "a"], [2, "b"]]))); // order does not matter
  assert.ok(chartSpec(res(["text", "number", "number"], [["a", 1, 2.5], ["b", 3, 4]])));
  assert.ok(chartSpec(res(["date", "number"], [[new Date(0), 1]])));
  assert.equal(chartSpec(res(["text", "number"], [["a", 1n], ["b", 2n]]))?.series[0].values.join(), "1,2");
  assert.equal(chartSpec(res(["text", "number"], [["a", 1]], ["dept", "n"]))?.categoryName, "dept");
});

test("chartSpec: anything else has no chart", () => {
  assert.equal(chartSpec(res(["number", "number"], [[1, 2]])), null); // no category column
  assert.equal(chartSpec(res(["text", "text"], [["a", "b"]])), null); // no numeric column
  assert.equal(chartSpec(res(["text", "text", "number"], [["a", "b", 1]])), null); // two categories
  assert.equal(chartSpec(res(["text", "number", "number", "number"], [["a", 1, 2, 3]])), null); // three numeric
  assert.equal(chartSpec(res(["text", "number", "other"], [["a", 1, true]])), null); // an unsupported column
  assert.equal(chartSpec(res(["text"], [["a"]])), null);
  assert.equal(chartSpec(res(["text", "number"], [])), null); // no rows
  const many = Array.from({ length: 51 }, (_, i) => [`k${i}`, i]);
  assert.equal(chartSpec(res(["text", "number"], many)), null); // 51 rows
  assert.ok(chartSpec(res(["text", "number"], many.slice(0, 50))));
  assert.equal(chartSpec(res(["text", "number"], [["a", null]])), null); // missing value
  assert.equal(chartSpec(res(["text", "number"], [["a", -1]])), null); // negative: bars only
  const big: QueryResult = { ...res(["text", "number"], []), rowCount: 400 }; // too big: raw values not kept
  assert.equal(chartSpec(big), null);
});

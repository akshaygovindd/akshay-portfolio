import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, cellEq, type Rows } from "./compare.mts";

const R = (columns: string[], ...rows: string[][]): Rows => ({ columns, rows });

test("numbers: 58 and 58.0 match, a fraction instead of a percentage does not", () => {
  assert.ok(cellEq("58", "58.0"));
  assert.ok(cellEq("5.46", "5.5")); // within 0.05
  assert.ok(cellEq("11.65", "11.7"));
  assert.ok(!cellEq("0.58", "58"));
  assert.ok(!cellEq("5.46", "5.52"));
  assert.ok(!cellEq("1", "2"));
  assert.ok(!cellEq("NULL", "0"));
  assert.ok(cellEq("NULL", "NULL"));
  assert.ok(!cellEq("produce", "Produce")); // text must match exactly
  assert.ok(!cellEq("12", "twelve"));
  assert.equal(compare(R(["a"], ["58"]), R(["pct"], ["58.0"]), false).strict, true);
  assert.equal(compare(R(["a"], ["0.58"]), R(["pct"], ["58"]), false).lenient, false);
});

test("column names do not matter, column order does not matter", () => {
  const ref = R(["department", "items"], ["produce", "245"], ["dairy eggs", "172"]);
  assert.equal(compare(R(["x", "y"], ["produce", "245"], ["dairy eggs", "172"]), ref, false).strict, true);
  assert.equal(compare(R(["items", "dept"], ["245", "produce"], ["172", "dairy eggs"]), ref, false).strict, true); // swapped
});

test("columns are matched by values together: values from different rows do not combine", () => {
  const ref = R(["k", "v"], ["a", "1"], ["b", "2"]);
  assert.equal(compare(R(["k", "v"], ["a", "2"], ["b", "1"]), ref, false).lenient, false); // pairs swapped
  assert.equal(compare(R(["k", "v"], ["a", "1"], ["b", "2"]), ref, false).strict, true);
});

test("row order is ignored unless the question is ordered", () => {
  const ref = R(["d", "n"], ["a", "3"], ["b", "2"], ["c", "1"]);
  const shuffled = R(["d", "n"], ["c", "1"], ["a", "3"], ["b", "2"]);
  assert.equal(compare(shuffled, ref, false).strict, true);
  assert.equal(compare(shuffled, ref, true).lenient, false);
  assert.equal(compare(ref, ref, true).strict, true);
});

test("extra columns: lenient passes, strict does not", () => {
  const ref = R(["department", "items"], ["produce", "245"], ["dairy eggs", "172"]);
  const gen = R(["department", "pct", "items"], ["produce", "28.1", "245"], ["dairy eggs", "19.7", "172"]);
  const c = compare(gen, ref, false);
  assert.equal(c.lenient, true);
  assert.equal(c.strict, false);
  assert.equal(c.extraColumns, 1);
  assert.match(c.why, /1 extra column: pct/);
});

test("missing columns, wrong row counts and wrong values fail both scores", () => {
  const ref = R(["department", "items"], ["produce", "245"], ["dairy eggs", "172"]);
  const missing = compare(R(["department"], ["produce"], ["dairy eggs"]), ref, false);
  assert.deepEqual([missing.strict, missing.lenient], [false, false]);
  assert.match(missing.why, /1 column, the reference needs 2/);
  const fewer = compare(R(["department", "items"], ["produce", "245"]), ref, false);
  assert.deepEqual([fewer.strict, fewer.lenient], [false, false]);
  assert.match(fewer.why, /1 rows, the reference has 2/);
  const wrong = compare(R(["department", "items"], ["produce", "245"], ["dairy eggs", "999"]), ref, false);
  assert.deepEqual([wrong.strict, wrong.lenient], [false, false]);
});

test("duplicate values and tied rows are matched one to one", () => {
  const ref = R(["p", "n"], ["a", "44"], ["b", "44"], ["c", "40"]);
  assert.equal(compare(R(["p", "n"], ["b", "44"], ["c", "40"], ["a", "44"]), ref, false).strict, true);
  assert.equal(compare(R(["p", "n"], ["a", "44"], ["a", "44"], ["c", "40"]), ref, false).lenient, false); // a twice, b missing
});

test("a single value compared with a single value", () => {
  assert.equal(compare(R(["n"], ["873"]), R(["rows"], ["873"]), false).strict, true);
  assert.equal(compare(R(["n"], ["872"]), R(["rows"], ["873"]), false).lenient, false);
});

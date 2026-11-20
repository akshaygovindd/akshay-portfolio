// npm run test:unit  - tests for the SQL validator (run with tsx's built-in test runner)
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSql } from "./validate";

const ok = (sql: string) => {
  const r = validateSql(sql);
  assert.equal(r.ok, true, `should pass: ${sql} -> ${r.ok ? "" : r.reason}`);
};
const bad = (sql: string, why?: RegExp) => {
  const r = validateSql(sql);
  assert.equal(r.ok, false, `should be rejected: ${sql}`);
  if (why && !r.ok) assert.match(r.reason, why);
};

test("plain queries pass", () => {
  ok("SELECT * FROM instacart_sample");
  ok("SELECT department, COUNT(*) AS items FROM instacart_sample GROUP BY department ORDER BY items DESC LIMIT 5;");
  ok("select product_name from instacart_sample where reordered = 1"); // lowercase
  ok("SeLeCt 1");
  ok("(SELECT 1)"); // a parenthesised SELECT is still a SELECT
  ok("SELECT RANK() OVER (PARTITION BY department ORDER BY COUNT(*) DESC) AS r, department FROM instacart_sample GROUP BY department");
  ok('SELECT "order_id", "product_name" FROM "instacart_sample"');
  ok("SELECT replace(product_name, 'a', 'b') FROM instacart_sample"); // REPLACE the function, not CREATE OR REPLACE
  ok("SELECT 1 AS offset_days, 2 AS reset_time, 3 AS dropped_flag"); // keywords only as parts of names
});

test("CTEs pass, and only their own names are readable", () => {
  ok("WITH t AS (SELECT department, COUNT(*) AS n FROM instacart_sample GROUP BY department) SELECT * FROM t WHERE n > 10");
  ok("with a as (select 1 as x), b as (select x + 1 as y from a) select * from b");
  ok("WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r WHERE n < 5) SELECT * FROM r");
  bad("WITH t AS (SELECT 1) SELECT * FROM other_table", /unknown table/);
  bad("WITH t AS (SELECT 1) SELECT * FROM t, other_table", /unknown table/);
});

test("comments and strings cannot hide or fake anything", () => {
  ok("-- DROP TABLE instacart_sample;\nSELECT 1");
  ok("/* DROP TABLE x; ATTACH 'y' */ SELECT 1");
  ok("SELECT 1 /* ; */");
  ok("SELECT 'DROP TABLE x' AS s");
  ok("SELECT * FROM instacart_sample WHERE product_name = 'COPY; ATTACH'");
  ok("SELECT 'it''s; a DELETE' AS s");
  ok("SELECT 1 -- ; DROP");
  bad("SELECT 1; -- harmless comment\nDROP TABLE instacart_sample", /more than one|not allowed/);
  bad("/* SELECT */ DROP TABLE instacart_sample", /only SELECT or WITH/);
  bad("SELECT 1 /* never closed", /unterminated/);
  bad("SELECT 'never closed", /unterminated/);
  bad('SELECT "never closed', /unterminated/);
});

test("two statements are rejected", () => {
  bad("SELECT 1; SELECT 2", /more than one/);
  bad("SELECT 1; DROP TABLE instacart_sample");
  bad("SELECT 1;;");
  bad("SELECT (SELECT 1; DROP TABLE x)");
});

test("statements other than SELECT / WITH are rejected", () => {
  for (const q of [
    "DROP TABLE instacart_sample",
    "drop table instacart_sample",
    "INSERT INTO instacart_sample VALUES (1)",
    "UPDATE instacart_sample SET reordered = 0",
    "DELETE FROM instacart_sample",
    "CREATE TABLE x AS SELECT 1",
    "CREATE OR REPLACE VIEW v AS SELECT 1",
    "ALTER TABLE instacart_sample ADD COLUMN x INT",
    "COPY instacart_sample TO 'out.csv'",
    "ATTACH 'x.db'",
    "INSTALL httpfs",
    "LOAD httpfs",
    "PRAGMA database_list",
    "SET threads = 1",
    "EXPORT DATABASE 'dir'",
    "IMPORT DATABASE 'dir'",
    "CALL pragma_version()",
    "EXPLAIN SELECT 1",
    "DESCRIBE instacart_sample",
    "SHOW TABLES",
    "SUMMARIZE instacart_sample",
    "",
    "   ",
  ])
    bad(q);
});

test("blocked words are caught even deep inside a SELECT", () => {
  bad("WITH x AS (DELETE FROM instacart_sample RETURNING *) SELECT * FROM x");
  bad("SELECT * FROM (INSERT INTO instacart_sample VALUES (1) RETURNING *)");
  bad("SELECT 1 WHERE EXISTS (SELECT 1 FROM instacart_sample WHERE order_id = 1) AND 1 = (SELECT 1 FROM drop_me)");
});

test("file, URL and system functions are rejected", () => {
  for (const q of [
    "SELECT * FROM read_csv('sample.csv')",
    "SELECT * FROM read_csv_auto('sample.csv')",
    "SELECT * FROM READ_PARQUET('x.parquet')",
    "SELECT * FROM read_json('x.json')",
    "SELECT * FROM read_json_auto('https://example.com/a.json')",
    "SELECT * FROM read_text('x')",
    "SELECT * FROM glob('*')",
    "SELECT * FROM parquet_scan('x')",
    "SELECT * FROM sqlite_scan('x', 't')",
    "SELECT * FROM duckdb_settings()",
    "SELECT * FROM duckdb_extensions()",
    "SELECT * FROM pragma_database_list()",
    "SELECT * FROM query('SELECT 1')",
    "SELECT getenv('HOME')",
    "SELECT current_setting('home_directory')",
  ])
    bad(q);
});

test("file-style and URL strings are rejected, ordinary strings are not", () => {
  bad("SELECT * FROM 'sample.csv'", /file/);
  bad("SELECT * FROM instacart_sample, 'sample.csv'", /file/);
  bad("SELECT * FROM 'sample'", /file-style/); // no extension: caught as a string used as a table
  bad("SELECT * FROM instacart_sample, 'sample'", /file-style/);
  bad("SELECT * FROM 'https://example.com/data.csv'");
  bad("SELECT 'https://example.com'", /file and URL/);
  bad("SELECT 's3://bucket/key'");
  bad("SELECT 'file:///etc/passwd'");
  bad("SELECT '/etc/passwd'");
  bad("SELECT 'data.parquet'");
  ok("SELECT 'produce' AS dept, '10:30' AS t, 'a/b' AS ratio");
});

test("only the sample table is readable", () => {
  bad("SELECT * FROM other_table", /unknown table/);
  bad("SELECT * FROM main.instacart_sample", /qualified/);
  bad("SELECT * FROM memory.main.instacart_sample", /qualified/);
  bad("SELECT * FROM information_schema.tables", /qualified/);
  bad("SELECT * FROM generate_series(1, 10)", /table functions/);
  bad('SELECT * FROM "some table"', /unknown table/);
  ok("SELECT a.order_id FROM instacart_sample a JOIN instacart_sample b ON a.order_id = b.order_id");
  ok("SELECT * FROM (SELECT department FROM instacart_sample) AS d");
  bad("SELECT * FROM instacart_sample JOIN other_table USING (order_id)", /unknown table/);
});

test("FROM inside functions is not a table source", () => {
  ok("SELECT a IS DISTINCT FROM b FROM (SELECT 1 AS a, 2 AS b)");
  ok("SELECT trim(BOTH ' ' FROM product_name) FROM instacart_sample");
  ok("SELECT extract(hour FROM TIMESTAMP '2024-01-01 10:00:00') AS h");
  ok("SELECT substring(product_name FROM 1 FOR 3) FROM instacart_sample");
});

test("odd syntax that could smuggle things is rejected", () => {
  bad("SELECT E'a\\'; DROP TABLE x; --'", /escape/);
  bad("SELECT $$ ; DROP TABLE x; $$", /dollar/);
  bad("SELECT $1", /dollar/);
  bad("SELECT 1\u0000; DROP TABLE x");
  bad("x".repeat(2001));
});

test("a trailing semicolon is removed from the returned SQL", () => {
  const r = validateSql("  SELECT 1;  ");
  assert.deepEqual(r, { ok: true, sql: "SELECT 1" });
});

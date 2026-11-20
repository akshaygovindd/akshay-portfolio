import fs from "node:fs";
import { getSql } from "../rag/db";
const sql = getSql();
const stmts = fs.readFileSync("rag/schema.sql", "utf8")
  .split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log(`applied ${stmts.length} statements`);

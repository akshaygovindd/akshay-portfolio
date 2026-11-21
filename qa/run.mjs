// Full regression for the portfolio. Usage (from the repo root):
//   npm run qa                    build + every check
//   npm run qa -- --skip-build    reuse the last .next-qa build
//   npm run qa -- --only=lighthouse,poses
// The build goes to .next-qa and the server to :3100, so a running `next dev` on :3000 is untouched.
// Raw output of every step is saved in qa/out/. Exit code is 1 if any check fails.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { site } from "../config/site.ts";

const QA = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QA, "..");
const OUT = path.join(QA, "out");
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const env = { ...process.env, NEXT_DIST_DIR: ".next-qa", CHROME_PATH: CHROME, NODE_NO_WARNINGS: "1" };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const record = (name, ok, detail = "", warn = "") => {
  results.push({ name, ok, detail, warn });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}${warn ? "  (warning: " + warn + ")" : ""}`);
};
const wanted = (name) => !only.length || only.some((o) => name.toLowerCase().includes(o.toLowerCase()));
const save = (name, text) => fs.writeFileSync(path.join(OUT, name.replace(/\W+/g, "-") + ".txt"), text);

function sh(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 28, ...opts });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const portFree = () =>
  new Promise((res) => {
    const s = net.createServer().once("error", () => res(false)).once("listening", () => s.close(() => res(true))).listen(PORT);
  });

// name, script, args, verdict(output) -> list of problems, optional warning(output)
const count = (t, re) => (t.match(re) || []).length;
const checks = [
  ["axe + motion + stacking (check3)", "check3.mjs", [], (t) => {
    const bad = [];
    if (!/\[dark\] violations: 0/.test(t) || !/\[light\] violations: 0/.test(t)) bad.push("axe violations");
    if (/CLS (?!0\b)[\d.]+/.test(t)) bad.push("CLS above 0");
    if (/errors: \[(?!\])/.test(t)) bad.push("console errors");
    for (const k of ["marquee moving: true", "marquee paused on hover: true", "marquee resumes after hover: true"]) if (!t.includes(k)) bad.push(k + " missing");
    if (!/sticky top=/.test(t)) bad.push("stack cards not sticky");
    return bad;
  }],
  ["avatar poses (poses6)", "poses6.mjs", [], (t) => {
    const bad = [];
    const rows = [...t.matchAll(/pose=(\w+)\s+expected (\w+)/g)];
    if (rows.length < 10) bad.push(`only ${rows.length} pose rows`);
    rows.filter((m) => m[1] !== m[2]).forEach((m) => bad.push(`got ${m[1]} expected ${m[2]}`));
    return bad;
  }],
  ["avatar overlap (overlap3)", "overlap3.mjs", [], (t) => {
    const rows = t.split("\n").filter((l) => /avatar overlaps content/.test(l));
    return [...(rows.length < 6 ? ["too few widths"] : []), ...rows.filter((l) => !/avatar overlaps content: none/.test(l))];
  }],
  ["shapes vs text (shapes)", "shapes.mjs", [], (t) => {
    const rows = t.split("\n").filter((l) => /glyph overlaps/.test(l));
    return [...(rows.length < 9 ? ["too few widths"] : []), ...rows.filter((l) => !/glyph overlaps: none/.test(l))];
  }],
  ["nav fits at 129 widths (navscan)", "navscan.mjs", [], (t) => (/problems at 0 widths/.test(t) ? [] : ["nav problems"])],
  ["stacking cards fit (fit)", "fit.mjs", [], (t) => {
    const rows = t.split("\n").filter((l) => /^\d+x\d+\s+yes/.test(l));
    return [...(rows.length ? [] : ["no sticky rows found"]), ...rows.filter((l) => !/\bfits\b/.test(l))];
  }],
  ["24px targets (target24)", "target24.mjs", [BASE], (t) => (/ALL AT LEAST 24x24/.test(t) ? [] : ["targets below 24x24"])],
  ["links, nav scroll, theme toggle (links)", "links.mjs", [], (t) => {
    const bad = t.split("\n").filter((l) => /^FAIL/.test(l) && !/https?:\/\//.test(l));
    if (!/external links missing target=_blank\/rel=noopener: 0/.test(t)) bad.push("external link without target/rel");
    if (!/theme toggle: PASS/.test(t)) bad.push("theme toggle");
    if (count(t, /PASS nav /g) < 5) bad.push("nav links");
    return bad;
  }, (t) => t.split("\n").filter((l) => /^FAIL .*https?:\/\//.test(l)).map((l) => l.slice(0, 90)).join("; ")],
  ["CLS incl. jump-to-Contact (shift)", "shift.mjs", [], (t) => {
    const bad = [];
    if (!/page height grew by 0 px/.test(t)) bad.push("page grew while on Contact");
    if (!/WebKit.*contact moved 0 px/.test(t)) bad.push("WebKit contact moved");
    if (/"cls":(?!0[,}])/.test(t)) bad.push("CLS above 0");
    return bad;
  }],
  ["SEO / JSON-LD / head (seo8)", "seo8.mjs", [], (t) => (/ALL PASS/.test(t) ? [] : ["SEO check failed"])],
  ["case-study pages (casestudies)", "casestudies.mjs", [], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["Ask my portfolio (ask)", "ask.mjs", [BASE], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["SQL playground upgrades (sql)", "sql.mjs", [BASE], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["Motion and polish (motion)", "motion.mjs", [BASE], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["About hobbies + 404 page (about404)", "about404.mjs", [BASE], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["content + Copy email (content9)", "content9.mjs", [], (t) => (/ALL PASS/.test(t) ? [] : t.split("\n").filter((l) => /FAIL/.test(l)))],
  ["About alignment (about-m)", "about-m.mjs", [BASE, "qa"], (t) => {
    const rows = t.split("\n").filter((l) => /card offset/.test(l));
    return [...(rows.length < 2 ? ["no rows"] : []), ...rows.filter((l) => !/card offset 0px/.test(l))];
  }],
  ["WebKit (webkit)", "webkit.mjs", [], (t) => {
    const bad = [];
    if (count(t, /SQL playground \(DuckDB-WASM\): PASS/g) < 2) bad.push("SQL playground in WebKit");
    if (count(t, /console errors\/warnings: none/g) < 2) bad.push("WebKit console errors");
    if (/horizontal overflow px: (?!0\b)\d+/.test(t)) bad.push("horizontal overflow");
    return bad;
  }],
  ["WebKit + CSP (csp-webkit)", "csp-webkit.mjs", [], (t) => {
    const bad = [];
    if (count(t, /CSP violations: \[\]/g) < 2) bad.push("CSP violations");
    if (count(t, /SQL playground \(DuckDB-WASM\): PASS/g) < 2) bad.push("SQL playground under CSP");
    if (!/external script blocked: blocked/.test(t)) bad.push("CSP does not block external script");
    return bad;
  }],
];

if (wanted("static")) {
  const tsc = sh("npx", ["tsc", "--noEmit"]); save("tsc", tsc.out); record("Static: TypeScript (tsc --noEmit)", tsc.code === 0, tsc.code ? tsc.out.split("\n")[0] : "");
  const lint = sh("npm", ["run", "lint", "--silent"]); save("lint", lint.out); record("Static: ESLint", lint.code === 0, lint.code ? lint.out.split("\n")[0] : "");
  const unit = sh("npm", ["run", "test:unit", "--silent"]); save("unit-tests", unit.out); record("Static: unit tests (SQL validator, share links, chart rules)", unit.code === 0, unit.code ? (unit.out.split("\n").find((l) => /not ok|✖/.test(l)) || "see qa/out/unit-tests.txt") : (unit.out.match(/ℹ pass (\d+)/) || [])[0] || "");
  const audit = sh("npm", ["audit", "--audit-level=low"]); save("audit", audit.out); record("Static: npm audit", audit.code === 0, audit.code ? "vulnerabilities found" : "0 vulnerabilities");
}

const needServer = wanted("lighthouse") || checks.some((c) => wanted(c[0]));
let server;
if (wanted("build") || needServer) {
  if (!skipBuild) {
    const b = sh("npx", ["next", "build"]); save("build", b.out);
    record("Production build (next build into .next-qa)", b.code === 0, b.code ? "see qa/out/build.txt" : "");
    if (b.code !== 0) process.exit(1);
  }
  if (needServer) {
    if (!(await portFree())) { console.error(`Port ${PORT} is busy: stop whatever uses it and rerun.`); process.exit(2); }
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, env, stdio: "ignore" });
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(BASE)).ok) break; } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
const stop = () => { try { server?.kill(); } catch {} spawnSync("sh", ["-c", `lsof -ti tcp:${PORT} -sTCP:LISTEN | xargs kill 2>/dev/null`]); };
process.on("SIGINT", () => { stop(); process.exit(130); });

if (wanted("lighthouse")) {
  // the home page and every case-study page
  const pages = ["/", ...site.caseStudies.map((c) => `/projects/${c.slug}`)];
  for (const [page, label, extra] of pages.flatMap((pg) => [[pg, "desktop", ["--preset=desktop"]], [pg, "mobile", []]])) {
    const tag = page === "/" ? "" : ` ${page}`;
    const file = path.join(OUT, `lh-${label}${page === "/" ? "" : page.replace(/\W+/g, "-")}.json`);
    sh(path.join(QA, "node_modules/.bin/lighthouse"), [BASE + (page === "/" ? "" : page), ...extra, "--chrome-flags=--headless=new --no-sandbox", "--output=json", `--output-path=${file}`, "--quiet"]);
    try {
      const r = JSON.parse(fs.readFileSync(file, "utf8"));
      const s = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
      const cls = r.audits["cumulative-layout-shift"].numericValue;
      const bad = [];
      if (s.performance < 95) bad.push(`performance ${s.performance}`);
      for (const k of ["accessibility", "best-practices", "seo"]) if (s[k] < 100) bad.push(`${k} ${s[k]}`);
      if (cls > 0.01) bad.push(`CLS ${cls.toFixed(3)}`);
      record(`Lighthouse ${label}${tag}`, !bad.length, bad.length ? bad.join(", ") : `perf ${s.performance} a11y ${s.accessibility} bp ${s["best-practices"]} seo ${s.seo}, CLS ${cls.toFixed(3)}`);
    } catch (e) { record(`Lighthouse ${label}${tag}`, false, "no report: " + e.message); }
  }
}

if (wanted("lighthouse")) {
  // The 404 page: Lighthouse refuses non-200 pages unless told to ignore the status. Its SEO category is left out on purpose:
  // a 404 that is noindex fails "has a successful HTTP status" and "is crawlable" by design.
  for (const [label, extra] of [["desktop", ["--preset=desktop"]], ["mobile", []]]) {
    const file = path.join(OUT, `lh-${label}-404.json`);
    sh(path.join(QA, "node_modules/.bin/lighthouse"), [BASE + "/this-page-does-not-exist", ...extra, "--ignore-status-code", "--chrome-flags=--headless=new --no-sandbox", "--output=json", `--output-path=${file}`, "--quiet"]);
    try {
      const r = JSON.parse(fs.readFileSync(file, "utf8"));
      const sc = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
      const cls = r.audits["cumulative-layout-shift"].numericValue;
      const bad = [];
      if (sc.performance < 95) bad.push(`performance ${sc.performance}`);
      if (sc.accessibility < 100) bad.push(`accessibility ${sc.accessibility}`);
      // best-practices: every audit must pass, except "errors in console" when its only entries are the browser logging
      // the 404 response for the page's own URL (that is what a real 404 status does, so it cannot be avoided).
      const failing = r.categories["best-practices"].auditRefs.map((x) => r.audits[x.id]).filter((a) => a.score !== null && a.score < 1);
      for (const a of failing) {
        const own404 = a.id === "errors-in-console" && (a.details?.items ?? []).every((it) => /404/.test(it.description || "") && String(it.sourceLocation?.url || "").endsWith("/this-page-does-not-exist"));
        if (!own404) bad.push(`best-practices: ${a.id}`);
      }
      if (cls > 0.01) bad.push(`CLS ${cls.toFixed(3)}`);
      record(`Lighthouse ${label} /404 (SEO left out: a noindex 404)`, !bad.length, bad.length ? bad.join(", ") : `perf ${sc.performance} a11y ${sc.accessibility}, best-practices clean apart from the browser logging the 404 itself (score ${sc["best-practices"]}), seo ${sc.seo} (a noindex 404, expected), CLS ${cls.toFixed(3)}`);
    } catch (e) { record(`Lighthouse ${label} /404`, false, "no report: " + e.message); }
  }
}

for (const [name, script, a, verdict, warnFn] of checks) {
  if (!wanted(name)) continue;
  const r = sh("node", [path.join(QA, "checks", script), ...a], { cwd: QA });
  save(name, r.out);
  const bad = verdict(r.out);
  if (r.code !== 0 && !bad.length) bad.push(`script exited ${r.code}`);
  record(name, !bad.length, bad.slice(0, 3).join("; "), warnFn ? warnFn(r.out) : "");
}

stop();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed.${failed.length ? " FAILED: " + failed.map((f) => f.name).join(", ") : " All clear."}  Raw output: qa/out/`);
process.exit(failed.length ? 1 : 0);

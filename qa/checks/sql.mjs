// SQL playground upgrades: hero link, schema panel, share links, chart toggle, English to SQL, CLS and axe.
// /api/sql is mocked (so the check costs nothing and never touches the rate limit), except one live off-topic
// call (answered with REFUSE, about a tenth of a cent) that proves route + limits + OpenAI work together.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const axeSrc = fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const BASE = process.argv[2] || "http://localhost:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"} ${msg}`); if (!cond) fails.push(msg); };
const enc = (s) => Buffer.from(s, "utf8").toString("base64url");

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const RESULT = ".min-h-\\[400px\\]";

async function open(w, h, theme, { mock = null, path = "/" } = {}) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await p.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  if (mock) {
    await p.setRequestInterception(true);
    p.on("request", (r) => {
      if (!r.url().endsWith("/api/sql")) return r.continue();
      const m = mock(JSON.parse(r.postData() || "{}"));
      r.respond({ status: m.status ?? 200, contentType: "application/json", body: JSON.stringify(m.body) });
    });
  }
  await p.goto(BASE + path, { waitUntil: "networkidle2" });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  p._errs = errs;
  return p;
}
const goPlay = async (p) => { await p.evaluate(() => document.getElementById("playground").scrollIntoView()); await sleep(600); };
const firstResult = (p) => p.waitForFunction((sel) => /\d+ rows? · \d+ ms/.test(document.querySelector(sel).innerText), { timeout: 60000 }, RESULT);
const resultText = (p) => p.$eval(RESULT, (e) => e.innerText);
const runSql = async (p, sql) => {
  await p.click("#sql-input", { clickCount: 3 });
  await p.keyboard.down("Control"); await p.keyboard.press("a"); await p.keyboard.up("Control");
  await p.evaluate((s) => { const t = document.getElementById("sql-input"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(t, s); t.dispatchEvent(new Event("input", { bubbles: true })); }, sql);
  const before = await resultText(p);
  await p.evaluate(() => [...document.querySelectorAll("#playground button")].find((x) => x.textContent.trim() === "Run").click());
  await p.waitForFunction((sel, prev) => document.querySelector(sel).innerText !== prev || /error/i.test(document.querySelector(sel).innerText), { timeout: 20000 }, RESULT, before).catch(() => {});
  await sleep(300);
};
const axe = async (p, label) => {
  await p.evaluate(axeSrc);
  const v = await p.evaluate(async () => (await axe.run(document.getElementById("playground"))).violations.map((x) => `${x.id}:${x.nodes.length}`));
  ok(!v.length, `axe ${label}: ${v.join(",") || "0 violations"}`);
};
const toggle = (p) => p.$$eval("#playground [aria-label='Result view'] button", (bs) => bs.map((x) => x.textContent.trim().toLowerCase()));

// ---------- hero link ----------
for (const [w, h, name] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  const p = await open(w, h, "dark");
  const l = await p.evaluate(() => { const a = [...document.querySelectorAll("#top a")].find((x) => x.getAttribute("href") === "#playground"); if (!a) return null; const r = a.getBoundingClientRect(); const btn = [...document.querySelectorAll("#top a.btn")].map((x) => x.getBoundingClientRect().height); return { text: a.textContent.trim(), h: r.height, inView: r.bottom < innerHeight && r.top > 0, btnH: Math.min(...btn), fs: parseFloat(getComputedStyle(a).fontSize) }; });
  ok(l && l.text === "Run SQL in your browser →", `${name}: hero link text (${l?.text})`);
  ok(l && l.h >= 44 && l.inView, `${name}: hero link is at least 44px tall and visible without scrolling (${Math.round(l?.h)}px)`);
  ok(l && l.fs <= 14, `${name}: hero link is small text, not a button (${l?.fs}px)`);
  await p.click("#top a[href='#playground']");
  await sleep(1500);
  ok(await p.evaluate(() => Math.abs(document.getElementById("playground").getBoundingClientRect().top) < 140), `${name}: hero link scrolls to the playground`);
  await p.close();
}

// ---------- per viewport and theme ----------
const mockOk = (q) => (/poem|ocean/i.test(q.question) ? { body: { refused: true, message: "I can only write queries about these tables." } } : { body: { sql: "SELECT department, COUNT(*) AS n FROM instacart_sample GROUP BY department ORDER BY n DESC" } });
for (const [w, h, name] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["dark", "light"]) {
    const tag = `${name} ${theme}`;
    const p = await open(w, h, theme, { mock: mockOk });
    await goPlay(p);
    const before = await p.evaluate(() => document.getElementById("playground").offsetHeight);
    await firstResult(p);
    await sleep(500);
    const after = await p.evaluate(() => document.getElementById("playground").offsetHeight);
    ok(before === after, `${tag}: section height does not change when the engine loads and the first result renders (${before} -> ${after}px)`);
    ok((await toggle(p)).join() === "table,chart", `${tag}: first example (department + 2 numbers) shows the Table | Chart toggle`);
    await axe(p, `${tag} idle`);

    // schema panel
    await p.click("#playground details summary");
    await p.waitForFunction(() => document.querySelectorAll("#playground details ul button").length >= 9, { timeout: 20000 });
    const schema = await p.evaluate(() => ({ cols: [...document.querySelectorAll("#playground details ul button")].map((x) => x.getAttribute("aria-label")), head: document.querySelector("#playground details [role=region]").innerText }));
    ok(schema.cols.length === 9 && /order_id.*BIGINT/.test(schema.cols[0]) && /department.*VARCHAR/.test(schema.cols.join()), `${tag}: schema panel lists 9 columns with types (${schema.cols.length})`);
    ok(/instacart_sample/.test(schema.head) && /873 rows · 9 columns/.test(schema.head), `${tag}: schema panel shows the table and its row count read from DuckDB`);
    // insert at the cursor: put the caret after "SELECT " and press a column button (mouse), then another with the keyboard
    await p.evaluate(() => { const t = document.getElementById("sql-input"); t.focus(); t.setSelectionRange(7, 7); });
    await p.evaluate(() => [...document.querySelectorAll("#playground details ul button")].find((x) => /product_name/.test(x.getAttribute("aria-label"))).click());
    await sleep(200);
    const v1 = await p.$eval("#sql-input", (e) => e.value);
    ok(v1.startsWith("SELECT product_name department,"), `${tag}: clicking a column inserts it at the cursor (${JSON.stringify(v1.slice(0, 32))})`);
    ok(await p.evaluate(() => document.activeElement.id === "sql-input"), `${tag}: focus returns to the editor after inserting`);
    await p.evaluate(() => { const t = document.getElementById("sql-input"); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
    await p.focus("#playground details ul button");
    await p.keyboard.press("Enter");
    await sleep(200);
    ok((await p.$eval("#sql-input", (e) => e.value)).endsWith("order_id"), `${tag}: a column button works from the keyboard (Enter)`);
    await axe(p, `${tag} schema panel open`);
    await p.click("#playground details summary");

    // chart toggle
    await p.evaluate(() => [...document.querySelectorAll("#playground button.tag")].find((x) => /Items by hour/.test(x.textContent)).click());
    await p.waitForFunction(() => /\b20 rows\b/.test(document.getElementById("playground").innerText), { timeout: 20000 });
    ok((await toggle(p)).join() === "table,chart", `${tag}: text + one number column shows the toggle`);
    await p.evaluate(() => [...document.querySelectorAll("#playground [aria-label='Result view'] button")].find((x) => /chart/i.test(x.textContent)).click());
    await p.waitForSelector("#playground svg[role=img]", { timeout: 15000 });
    const ch = await p.evaluate(() => ({ bars: document.querySelectorAll("#playground svg rect.fill-accent").length, label: document.querySelector("#playground svg title")?.textContent, pressed: [...document.querySelectorAll("#playground [aria-label='Result view'] button")].map((x) => x.getAttribute("aria-pressed")) }));
    ok(ch.bars === 20 && ch.pressed.join() === "false,true", `${tag}: chart view draws one bar per row (${ch.bars}) and the toggle shows it is active`);
    await axe(p, `${tag} chart view`);
    await p.evaluate(() => [...document.querySelectorAll("#playground [aria-label='Result view'] button")].find((x) => /table/i.test(x.textContent)).click());
    ok(await p.evaluate(() => !!document.querySelector("#playground table") && !document.querySelector("#playground svg[role=img]")), `${tag}: Table view brings the table back`);
    // two numeric columns: one panel each
    await runSql(p, "SELECT department, COUNT(*) AS items, ROUND(AVG(reordered) * 100, 1) AS pct FROM instacart_sample GROUP BY department");
    await p.evaluate(() => [...document.querySelectorAll("#playground [aria-label='Result view'] button")].find((x) => /chart/i.test(x.textContent)).click());
    await p.waitForSelector("#playground svg[role=img]", { timeout: 15000 });
    const two = await p.evaluate(() => ({ a: document.querySelectorAll("#playground svg rect.fill-accent").length, w: document.querySelectorAll("#playground svg rect.fill-warm").length }));
    ok(two.a === 8 && two.w === 8, `${tag}: two numeric columns draw two panels, one bar per row each (${two.a} + ${two.w})`);

    // results that must NOT get a toggle
    for (const [label, sql] of [
      ["two text columns", "SELECT department, product_name, COUNT(*) AS n FROM instacart_sample GROUP BY 1, 2"],
      ["only numbers", "SELECT order_hour_of_day, COUNT(*) AS n FROM instacart_sample GROUP BY 1"],
      ["only text", "SELECT DISTINCT department FROM instacart_sample"],
      ["more than 50 rows", "SELECT product_name, order_id FROM instacart_sample"],
      ["three numeric columns", "SELECT department, COUNT(*) AS a, SUM(reordered) AS b, MAX(order_id) AS c FROM instacart_sample GROUP BY 1"],
      ["a negative number", "SELECT department, -COUNT(*) AS n FROM instacart_sample GROUP BY 1"],
    ]) {
      await runSql(p, sql);
      ok((await toggle(p)).length === 0, `${tag}: no toggle for ${label}`);
    }
    await runSql(p, "SELECT department, COUNT(*) AS n FROM instacart_sample GROUP BY 1");
    ok((await toggle(p)).length === 2, `${tag}: toggle comes back for a suitable result`);

    // share link
    const ctx = b.defaultBrowserContext();
    await ctx.overridePermissions(BASE, ["clipboard-read", "clipboard-write"]);
    await runSql(p, "SELECT department FROM instacart_sample LIMIT 3");
    await p.bringToFront(); // the clipboard API needs a focused page
    await p.evaluate(() => [...document.querySelectorAll("#playground button")].find((x) => /Copy link/.test(x.textContent)).click());
    await sleep(500);
    const wanted = `${BASE}/?q=${enc("SELECT department FROM instacart_sample LIMIT 3")}#playground`;
    const note = await p.evaluate(() => document.getElementById("playground").innerText);
    // Either the clipboard took it, or (clipboard blocked) the link was put in the address bar and the page said so.
    const viaClipboard = /Link copied/.test(note);
    const link = viaClipboard ? await p.evaluate(() => navigator.clipboard.readText()).catch(() => "") : await p.evaluate(() => location.href);
    ok(link === wanted, `${tag}: Copy link puts the query in the URL as base64url, via ${viaClipboard ? "the clipboard" : "the address-bar fallback"} (${link.slice(0, 50)})`);
    ok(viaClipboard || /address bar/.test(note), `${tag}: Copy link says what it did`);
    const q2 = await open(w, h, theme, { mock: mockOk, path: new URL(wanted).pathname + new URL(wanted).search + new URL(wanted).hash });
    await q2.waitForFunction(() => document.getElementById("sql-input").value.startsWith("SELECT department FROM"), { timeout: 15000 });
    await sleep(5000); // long enough for the engine to load and, wrongly, to run something
    const opened = await q2.evaluate((sel) => ({ editor: document.getElementById("sql-input").value, ran: /\d+ rows? · \d+ ms/.test(document.querySelector(sel).innerText), top: Math.round(document.getElementById("playground").getBoundingClientRect().top), note: document.getElementById("playground").innerText.includes("Nothing has run yet") }), RESULT);
    ok(opened.editor === "SELECT department FROM instacart_sample LIMIT 3", `${tag}: opening a link pre-fills the editor`);
    ok(!opened.ran && opened.note, `${tag}: ...but nothing has run until Run is pressed, and it says so`);
    // no example button may look selected when the editor came from a link (the editor no longer matches any example)
    const ex = await q2.evaluate(() => [...document.querySelectorAll("#playground button.tag")].map((x) => { const c = getComputedStyle(x); return { style: `${c.borderColor}|${c.color}|${c.backgroundColor}|${c.outlineStyle}`, marked: x.hasAttribute("aria-pressed") || x.hasAttribute("aria-current") || x.getAttribute("data-selected") !== null, focused: x === document.activeElement }; }));
    ok(ex.length === 5 && new Set(ex.map((e) => e.style)).size === 1 && !ex.some((e) => e.marked || e.focused), `${tag}: no example button looks selected, focused or marked when opened from a link (${new Set(ex.map((e) => e.style)).size} distinct style(s) across ${ex.length} buttons)`);
    ok(Math.abs(opened.top) < 160, `${tag}: ...and it scrolls to the playground (top ${opened.top}px)`);
    await q2.evaluate(() => [...document.querySelectorAll("#playground button")].find((x) => x.textContent.trim() === "Run").click());
    await q2.waitForFunction(() => /\b3 rows\b/.test(document.getElementById("playground").innerText), { timeout: 15000 });
    ok(true, `${tag}: Run then runs the shared query (3 rows)`);
    ok(q2._errs.length === 0, `${tag}: no console errors on the shared-link page ${q2._errs.slice(0, 2).join(" | ")}`);
    const cls2 = await q2.evaluate(() => window.__cls);
    ok(cls2 < 0.001, `${tag}: CLS ${cls2.toFixed(4)} when opening a shared link`);
    await q2.close();
    // too long
    await p.evaluate(() => { const t = document.getElementById("sql-input"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(t, "SELECT " + "1,".repeat(1200) + "1"); t.dispatchEvent(new Event("input", { bubbles: true })); });
    await p.evaluate(() => [...document.querySelectorAll("#playground button")].find((x) => /Copy link/.test(x.textContent)).click());
    await sleep(300);
    ok(/too long to share as a link/.test(await p.evaluate(() => document.getElementById("playground").innerText)), `${tag}: a query over the limit gets a friendly message`);

    // English to SQL (mocked)
    await p.evaluate(() => { document.getElementById("sql-input").blur(); });
    await runSql(p, "SELECT 1 AS one");
    const beforeEn = await resultText(p);
    await p.type("#sql-english", "How many items are in each department?");
    await p.click("#playground form button[type=submit]");
    await p.waitForFunction(() => /press Run/.test(document.getElementById("sql-english-note").innerText), { timeout: 10000 });
    const en = await p.evaluate((sel) => ({ editor: document.getElementById("sql-input").value, results: document.querySelector(sel).innerText, focus: document.activeElement.id }), RESULT);
    ok(/GROUP BY department/.test(en.editor), `${tag}: the generated SQL goes into the editor`);
    ok(en.results === beforeEn, `${tag}: ...and it does not run by itself`);
    await p.click("#sql-english", { clickCount: 3 });
    await p.type("#sql-english", "Write me a poem about the ocean");
    await p.click("#playground form button[type=submit]");
    await p.waitForFunction(() => /only write queries about these tables/.test(document.getElementById("sql-english-note").innerText), { timeout: 10000 });
    ok(true, `${tag}: an off-topic question shows "I can only write queries about these tables."`);
    const final = await p.evaluate(() => ({ cls: window.__cls, ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    ok(final.ovf <= 0, `${tag}: no horizontal overflow`);
    ok(p._errs.length === 0, `${tag}: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
    await p.close();
  }
}

// ---------- failures from /api/sql must be friendly ----------
for (const [label, mock, expect] of [
  ["HTTP 503", () => ({ status: 503, body: { error: "unavailable" } }), /unavailable right now/],
  ["HTTP 429", () => ({ status: 429, body: { error: "rate_limited" } }), /10 questions an hour/],
  ["garbage reply", () => ({ status: 200, body: { nonsense: true } }), /unavailable right now/],
]) {
  const p = await open(1440, 900, "dark", { mock });
  await goPlay(p);
  await p.type("#sql-english", "How many orders are there?");
  await p.click("#playground form button[type=submit]");
  await p.waitForFunction((src) => new RegExp(src).test(document.getElementById("sql-english-note").innerText), { timeout: 10000 }, expect.source).catch(() => {});
  const t = await p.evaluate(() => ({ note: document.getElementById("sql-english-note").innerText, editor: document.getElementById("sql-input").value.slice(0, 20), contact: !!document.getElementById("contact") }));
  ok(expect.test(t.note), `${label}: friendly message shown`);
  ok(t.editor.startsWith("SELECT department"), `${label}: the editor is left alone`);
  ok(t.contact, `${label}: rest of the page intact`);
  await p.close();
}

// ---------- the engine still works for SQL typed by hand ----------
{
  const p = await open(1440, 900, "dark");
  await goPlay(p);
  await firstResult(p);
  await runSql(p, "SELEKT 1");
  ok(/error/i.test(await resultText(p)), "a syntax error is shown as an error in the results area");
  await p.close();
}

// ---------- live: route + limits + OpenAI, with an off-topic question that costs about a tenth of a cent ----------
if (fs.existsSync(new URL("../../.env.local", import.meta.url))) {
  const p = await open(1440, 900, "dark");
  const r = await p.evaluate(async () => {
    const res = await fetch("/api/sql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "Write me a poem about the ocean." }) });
    return { status: res.status, body: await res.json() };
  });
  ok(r.status === 200 && r.body.refused === true && r.body.message === "I can only write queries about these tables." && !("sql" in r.body), `live /api/sql: off-topic question refused (HTTP ${r.status})`);
  const bad = await p.evaluate(async () => (await fetch("/api/sql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "x".repeat(301) }) })).status);
  ok(bad === 400, `live /api/sql: an over-long question is rejected (HTTP ${bad})`);
  await p.close();
} else console.log("SKIP live /api/sql (no .env.local)");

await b.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");

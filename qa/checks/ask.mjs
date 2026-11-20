// "Ask my portfolio" section: layout, a11y (axe, both themes, desktop + phone), CLS, friendly failures,
// citations and the "How this answer was built" panel. /api/ask is mocked so the check costs nothing and
// never touches the rate limit. One live call (an off-topic question, answered by the similarity gate with
// no chat model call) proves route + Neon + embeddings work, when .env.local has the keys.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const axeSrc = fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const BASE = process.argv[2] || "http://localhost:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"} ${msg}`); if (!cond) fails.push(msg); };

const META = {
  chunks: [
    { n: 1, title: "FoodLens ELT Pipeline case study: Key decisions", url: "/projects/foodlens#key-decisions", score: 0.5, via: "vector", source: "case-study:foodlens" },
    { n: 2, title: "Project: FoodLens ELT Pipeline", url: "/#projects", score: 0.45, via: "vector", source: "site:project:foodlens" },
    { n: 3, title: "FoodLens ELT Pipeline case study: Results", url: "/projects/foodlens#results", score: 0.4, via: "keyword", source: "case-study:foodlens" },
  ],
  retrievalMs: 321, embedTokens: 12, generated: true, model: "gpt-5.4-mini",
};
const sse = (chunks) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
const MOCK_OK = sse([
  { type: "start", messageMetadata: META },
  { type: "text-start", id: "t" },
  { type: "text-delta", id: "t", delta: "Dallas rows never create a new version because the AKA name equals the name.[1] The restaurant dimension is SCD Type 2.[2]" },
  { type: "text-end", id: "t" },
  { type: "finish", messageMetadata: { totalMs: 1234, inputTokens: 1850, outputTokens: 109 } },
]);

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function open(w, h, theme, mode) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await p.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.setRequestInterception(true);
  p.on("request", (r) => {
    if (!r.url().endsWith("/api/ask") || mode === "live") return r.continue();
    if (mode === "ok") return r.respond({ status: 200, headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1", "cache-control": "no-store" }, body: MOCK_OK });
    if (mode === "429") return r.respond({ status: 429, contentType: "application/json", body: '{"error":"rate_limited"}' });
    return r.respond({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' });
  });
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  p._errs = errs;
  return p;
}
const goAsk = async (p) => { await p.evaluate(() => document.getElementById("ask").scrollIntoView()); await sleep(1200); };
const axe = async (p, label) => {
  await p.evaluate(axeSrc);
  const v = await p.evaluate(async () => (await axe.run(document.getElementById("ask"))).violations.map((x) => `${x.id}:${x.nodes.length}`));
  ok(!v.length, `axe ${label}: ${v.join(",") || "0 violations"}`);
};

for (const [w, h, name] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["dark", "light"]) {
    const tag = `${name} ${theme}`;
    const p = await open(w, h, theme, "ok");
    const order = await p.evaluate(() => { const f = (a, b) => !!(document.getElementById(a).compareDocumentPosition(document.getElementById(b)) & Node.DOCUMENT_POSITION_FOLLOWING); return f("playground", "ask") && f("ask", "skills"); });
    ok(order, `${tag}: Ask sits after Demos and before Skills`);
    await goAsk(p);
    ok(await p.evaluate(() => !!document.querySelector("#ask h2") && document.querySelectorAll("#ask button.tag").length === 3), `${tag}: heading + 3 suggested chips`);
    const before = await p.evaluate(() => ({ h: document.getElementById("ask").offsetHeight, doc: document.documentElement.scrollHeight }));
    await axe(p, `${tag} (idle)`);

    // targets
    const small = await p.evaluate(() => [...document.querySelectorAll("#ask button, #ask input, #ask summary, #ask a")].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || e.id).slice(0, 30), w: r.width, h: r.height, vis: r.width > 0 }; }).filter((x) => x.vis && x.h < 44 && x.t));
    ok(!small.length, `${tag}: interactive targets >= 44px high ${small.map((s) => `${s.t}=${Math.round(s.h)}`).join(", ")}`);

    // ask via chip
    await p.click("#ask button.tag");
    await p.waitForFunction(() => /Dallas rows never create/.test(document.getElementById("ask").innerText), { timeout: 8000 }).catch(() => {});
    await sleep(500);
    const res = await p.evaluate(() => ({
      text: document.getElementById("ask").innerText,
      cite: [...document.querySelectorAll('#ask [role="region"] p a')].map((a) => a.getAttribute("href")),
      h: document.getElementById("ask").offsetHeight, doc: document.documentElement.scrollHeight,
      ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    ok(/Dallas rows never create/.test(res.text), `${tag}: streamed answer shown`);
    ok(res.cite.join() === "/projects/foodlens#key-decisions,/#projects", `${tag}: [n] become links to sections (${res.cite.join(" ")})`);
    ok(res.h === before.h && res.doc === before.doc, `${tag}: no layout growth after answer (section ${before.h}->${res.h}px)`);
    ok(res.ovf <= 0, `${tag}: no horizontal overflow`);

    // panel
    await p.evaluate(() => { document.querySelector("#ask details").open = true; });
    await sleep(300);
    const panel = await p.evaluate(() => document.querySelector("#ask details").innerText);
    ok(/similarity 0\.500/.test(panel) && /keyword match/.test(panel) && /321 ms/.test(panel) && /1234 ms/.test(panel) && /1850 \/ 109/.test(panel), `${tag}: "How this answer was built" shows chunks, scores, latency, tokens`);
    await axe(p, `${tag} (answer + panel open)`);
    const cls = await p.evaluate(() => window.__cls);
    ok(cls < 0.001, `${tag}: CLS ${cls.toFixed(4)}`);
    ok(!p._errs.length, `${tag}: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
    await p.close();
  }
}

// failures must be friendly and must not break the page
for (const [mode, expect] of [["503", /unavailable right now/], ["429", /10 questions per hour/]]) {
  const p = await open(1440, 900, "dark", mode);
  await goAsk(p);
  await p.click("#ask button.tag");
  await p.waitForFunction((src) => new RegExp(src).test(document.getElementById("ask").innerText), { timeout: 8000 }, expect.source).catch(() => {});
  const t = await p.evaluate(() => ({ ask: document.getElementById("ask").innerText, contact: !!document.getElementById("contact"), skills: !!document.getElementById("skills") }));
  ok(expect.test(t.ask), `HTTP ${mode}: friendly message shown`);
  ok(!/Error|Unexpected|500/.test(t.ask.replace(/ERROR/g, "")), `HTTP ${mode}: no raw error text`);
  ok(t.contact && t.skills, `HTTP ${mode}: rest of the page intact`);
  await p.close();
}

// live: off-topic question -> similarity gate -> no chat call (needs .env.local with the keys)
const hasEnv = fs.existsSync(new URL("../../.env.local", import.meta.url));
if (hasEnv) {
  const p = await open(1440, 900, "dark", "live");
  const r = await p.evaluate(async () => {
    const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ id: "q", role: "user", parts: [{ type: "text", text: "What is the capital of France?" }] }] }) });
    return { status: res.status, body: await res.text() };
  });
  ok(r.status === 200 && /isn't covered on this site/.test(r.body) && /"generated":false/.test(r.body), `live /api/ask: off-topic question refused by the gate (HTTP ${r.status})`);
  await p.close();
} else console.log("SKIP live /api/ask (no .env.local)");

await b.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");

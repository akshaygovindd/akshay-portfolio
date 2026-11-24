// Phase 4b motion and polish: hero name reveal, pipeline stream, avatar tilt and parallax, count-ups, card lift. Checks what
// each effect does, what it must NOT do (hide text, shift the layout, lower contrast, run under reduced motion or on touch).
import puppeteer from "puppeteer-core";
import sharp from "sharp";
const BASE = process.argv[2] || "http://localhost:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"} ${msg}`); if (!cond) fails.push(msg); };

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
async function open(path, w, h, { reduce = false, touch = false, theme = "dark", wait = true } = {}) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: touch || w < 500, hasTouch: touch || w < 500 });
  if (reduce) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
  await p.evaluateOnNewDocument(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    window.__overlays = 0; // how many count-up overlays ever appeared
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList?.contains("count-overlay")) window.__overlays++; }).observe(document, { childList: true, subtree: true });
  });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(BASE + path, { waitUntil: wait ? "networkidle2" : "domcontentloaded" });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; }); // instant scrolling: deterministic timing
  p._errs = errs;
  return p;
}
const lum = (r, g, bl) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
const MUTED_L = lum(0xb4, 0xb1, 0xbe); // the dimmest hero text: ink-muted

// ---------- the HTML the server sends (no JS needed to see the content) ----------
const html = await (await fetch(BASE + "/")).text();
ok((html.match(/class="hero-flow-lane"/g) || []).length === 9, "home HTML: the pipeline stream has its 9 lanes");
ok((html.match(/reveal-line/g) || []).length === 3 && !/reveal-letter/.test(html), "home HTML: the headline is three whole lines (one on wide screens, two on phones), each ONE text element with the reveal class from the server, and it is not split into letters");
ok(/aria-label="Hi, I(&#x27;|')m Akshay"/.test(html), "home HTML: the h1 keeps its aria-label, so screen readers read the name whole");
const finals = [...html.matchAll(/<span class="count-real">([^<]*)<\/span>/g)].map((m) => m[1].replace(/&#x27;|&amp;/g, (x) => ({ "&#x27;": "'", "&amp;": "&" }[x])));
ok(finals.length === 9, `home HTML: ${finals.length} stat values are in the page as real text (final values): ${JSON.stringify(finals)}`);

// ---------- reduced motion: every effect is off ----------
{
  const p = await open("/", 1440, 900, { reduce: true });
  await sleep(800);
  const r = await p.evaluate(() => ({
    flow: getComputedStyle(document.querySelector(".hero-flow")).display,
    letterAnim: getComputedStyle(document.querySelector(".reveal-line")).animationName,
    running: document.getAnimations().filter((a) => a.effect?.target?.closest?.(".hero-flow-lane, .reveal-line") && a.playState === "running").length,
    h1: document.querySelector("h1").getAttribute("aria-label"),
  }));
  ok(r.flow === "none" && r.letterAnim === "none" && r.running === 0, `reduced motion: no stream, no line reveal, nothing of ours running (${JSON.stringify(r)})`);
  // tilt: the matrix must stay at rest even when the pointer moves
  await p.mouse.move(0, 0, { steps: 5 }); await sleep(900);
  const t = await p.evaluate(() => getComputedStyle(document.querySelector("[data-companion]").firstElementChild.firstElementChild).transform);
  ok(t === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t) || /^matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, [^,]+, 0, 0, 0, 1\)$/.test(t), `reduced motion: the avatar does not tilt (${t.slice(0, 50)})`);
  // count-ups: scroll through the project cards, no overlay may ever be drawn
  for (let i = 0; i < 3; i++) { await p.evaluate((i) => document.querySelectorAll("[data-stack]")[i].scrollIntoView({ block: "center" }), i); await sleep(500); }
  ok((await p.evaluate(() => window.__overlays)) === 0, "reduced motion: no stat ever counts up (final values from the first frame)");
  // card lift: the glow may stay as a state, the movement may not
  await p.evaluate(() => document.querySelector("[data-stack]").scrollIntoView({ block: "center" })); await sleep(500);
  await p.hover(".card-lift"); await sleep(500);
  const c = await p.evaluate(() => { const s = getComputedStyle(document.querySelector(".card-lift")); return { transform: s.transform, shadow: s.boxShadow }; });
  ok(c.transform === "none" && /155, 122, 255/.test(c.shadow), `reduced motion: a hovered card does not move but still shows the accent glow (${c.transform}, ${c.shadow.slice(0, 40)})`);
  ok(p._errs.length === 0, `reduced motion: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
  await p.close();
}

// ---------- desktop, full motion ----------
{
  const p = await open("/", 1440, 900, { wait: false });
  // name reveal: the line is painted from the first frame, rises into place by transform alone, never fades, never clipped
  await p.waitForSelector(".reveal-line");
  const samples = [];
  for (const t of [0, 120, 350, 900, 1800]) {
    if (t) await sleep(t - (samples.at(-1)?.t ?? 0));
    samples.push({ t, ...(await p.evaluate(() => {
      const l = [...document.querySelectorAll(".reveal-line")].find((e) => e.getBoundingClientRect().width > 0);
      const cs = getComputedStyle(l);
      return { opacity: +cs.opacity, hidden: cs.visibility === "hidden", clip: cs.clipPath, mask: cs.maskImage || cs.webkitMaskImage || "none", dy: Math.round(new DOMMatrix(cs.transform).m42), w: Math.round(l.getBoundingClientRect().width) };
    })) });
  }
  ok(samples.every((s) => s.opacity === 1 && !s.hidden), `name reveal: the line is fully opaque and visible at every moment, including the first frame (${samples.map((s) => `${s.t}ms:${s.opacity}`).join(" ")})`);
  ok(samples.every((s) => s.clip === "none" && s.mask === "none"), "name reveal: no clip-path or mask is ever applied to the headline (either one removes it from the LCP candidates)");
  ok(samples[0].dy > 20 && samples.at(-1).dy === 0, `name reveal: it rises into place by transform alone (${samples[0].dy}px low at the first frame, ${samples.at(-1).dy}px at the end)`);
  ok(new Set(samples.map((s) => s.w)).size === 1, `name reveal: the line never changes width, so nothing around it can move (${samples[0].w}px throughout)`);
  // Largest Contentful Paint: the headline text block, not the avatar image (per-letter spans made the avatar win, a lab regression)
  const lcp = await p.evaluate(() => new Promise((res) => { const seen = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) seen.push({ t: Math.round(e.startTime), size: e.size, el: (e.element?.tagName || "?") + "." + (e.element?.className?.toString() || "") }); }).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res(seen), 400); }));
  const last = lcp.at(-1);
  ok(!!last && /inline-block whitespace-nowrap/.test(last.el) && !/IMG/.test(last.el), `LCP (desktop): the final largest paint is the headline text, ${last?.size} px² at ${last?.t} ms (all candidates: ${lcp.map((e) => e.el.slice(0, 22) + "@" + e.t).join(", ")})`);

  // stream: runs on screen, pauses off screen and when the tab is hidden, resumes
  const flow = () => p.evaluate(() => ({ paused: document.querySelector(".hero-flow").dataset.paused, states: [...new Set(document.getAnimations().filter((a) => a.effect?.target?.classList?.contains("hero-flow-lane")).map((a) => a.playState))] }));
  const f0 = await flow();
  ok(f0.paused === "false" && f0.states.join() === "running", `stream: all lanes run while the hero is on screen (${JSON.stringify(f0)})`);
  await p.evaluate(() => scrollTo(0, 2400)); await sleep(500);
  const f1 = await flow();
  ok(f1.paused === "true" && f1.states.join() === "paused", `stream: paused once the hero is off screen (${JSON.stringify(f1)})`);
  await p.evaluate(() => scrollTo(0, 0)); await sleep(500);
  ok((await flow()).paused === "false", "stream: runs again when the hero is back");
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); }); await sleep(200);
  ok((await flow()).paused === "true", "stream: paused while the tab is hidden");
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); }); await sleep(200);

  // contrast: the hero with everything but the stream hidden, at three moments; the dimmest hero text must stay above AA on the brightest pixel
  await p.evaluate(() => { document.querySelectorAll("#top > *:not(.hero-flow), header, .skip-link, [data-companion]").forEach((e) => (e.style.visibility = "hidden")); });
  let worst = 0;
  for (const wait of [300, 2200, 2700]) {
    await sleep(wait);
    const box = await p.evaluate(() => { const r = document.getElementById("top").getBoundingClientRect(); return { x: 0, y: 0, width: r.width, height: Math.min(r.height, 900) }; });
    const { data, info } = await sharp(await p.screenshot({ clip: box })).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) worst = Math.max(worst, lum(data[i], data[i + 1], data[i + 2]));
  }
  const ratio = (MUTED_L + 0.05) / (worst + 0.05);
  ok(ratio >= 7, `stream: on its brightest pixel the dimmest hero text (#B4B1BE) keeps a contrast of ${ratio.toFixed(1)}:1 (AA needs 4.5, AAA 7)`);
  await p.close();
}

// ---------- tilt and parallax, desktop pointer ----------
{
  const p = await open("/", 1440, 900);
  await sleep(1200);
  const read = () => p.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.querySelector("[data-companion]").firstElementChild.firstElementChild).transform); return { rotY: Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180 / Math.PI, rotX: Math.asin(Math.max(-1, Math.min(1, m.m23))) * 180 / Math.PI, x: m.m41, y: m.m42 }; });
  const seen = { y: 0, x: 0, px: 0, py: 0 };
  for (const [x, y] of [[0, 0], [1439, 899], [0, 899], [1439, 0], [720, 450]]) {
    await p.mouse.move(x, y, { steps: 4 }); await sleep(1300);
    const r = await read();
    seen.y = Math.max(seen.y, Math.abs(r.rotY)); seen.x = Math.max(seen.x, Math.abs(r.rotX)); seen.px = Math.max(seen.px, Math.abs(r.x)); seen.py = Math.max(seen.py, Math.abs(r.y));
    if (x === 720) ok(Math.abs(r.rotY) < 0.3 && Math.abs(r.rotX) < 0.3 && Math.abs(r.x) < 0.5, "tilt: back to rest with the pointer in the middle");
  }
  ok(seen.y <= 8.3 && seen.y >= 7 && seen.x <= 5.3 && seen.x >= 4, `tilt: reaches about 8 degrees sideways and 5 up and down at the screen corners and never more (max ${seen.y.toFixed(1)} / ${seen.x.toFixed(1)})`);
  ok(seen.px <= 10.5 && seen.px >= 8 && seen.py <= 6.5 && seen.py >= 5, `parallax: the avatar drifts at most 10 px sideways and 6 px up and down (max ${seen.px.toFixed(1)} / ${seen.py.toFixed(1)})`);
  await p.close();
  // touch screen: no tilt, whatever the pointer does
  const t = await open("/", 1024, 768, { touch: true });
  await sleep(1200);
  await t.mouse.move(0, 0, { steps: 4 }); await sleep(1000);
  const fine = await t.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
  const tm = await t.evaluate(() => getComputedStyle(document.querySelector("[data-companion]").firstElementChild.firstElementChild).transform);
  ok(!fine && (tm === "none" || /^matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, [^,]+, 0, 0, 0, 1\)$/.test(tm) || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(tm)), `touch screen: no tilt or parallax (fine pointer: ${fine}, transform ${tm.slice(0, 40)})`);
  await t.close();
}

// ---------- count-ups on the project cards: start low, end on the exact value, never move anything ----------
{
  const p = await open("/", 1440, 900);
  const cards = await p.evaluate(() => document.querySelectorAll("[data-stack]").length);
  const expected = await p.evaluate(() => [...document.querySelectorAll("[data-stack]")].map((c) => [...c.querySelectorAll("dd .count-real")].map((e) => e.textContent)));
  const missing = expected.flat().filter((v) => !finals.includes(v));
  ok(expected.flat().length === 9 && missing.length === 0, `count-up: ${expected.flat().length} stat values on ${cards} cards, all present in the server HTML as real text${missing.length ? ` (not in the HTML: ${JSON.stringify(missing)}; HTML has ${JSON.stringify(finals)})` : ""}`);
  // mid-count on the card with several numbers ("+10.9 to +23.3 pts")
  await p.evaluate(() => document.querySelectorAll("[data-stack]")[2].scrollIntoView({ block: "center" }));
  await sleep(350);
  const mid = await p.evaluate(() => [...document.querySelectorAll("[data-stack]")[2].querySelectorAll("dd")].map((d) => ({ overlay: d.querySelector(".count-overlay")?.textContent ?? null, real: d.querySelector(".count-real").textContent, counting: !!d.querySelector("[data-counting]") })));
  ok(mid.some((m) => m.overlay && m.overlay !== m.real && m.counting), `count-up: part way through, the animated copy differs from the final value (${mid.map((m) => `${m.overlay} -> ${m.real}`).join("; ")})`);
  const wide = mid.find((m) => m.real.includes(" to "));
  ok(!!wide && /^[+-]?\d/.test(wide.overlay || ""), `count-up: a value with two numbers counts both and keeps its text ("${wide?.overlay}" on the way to "${wide?.real}")`);
  // every card: final text exactly as in the page's own HTML, no overlay left, no layout movement
  const sizes = [];
  for (let i = 0; i < cards; i++) {
    await p.evaluate((i) => document.querySelectorAll("[data-stack]")[i].scrollIntoView({ block: "center" }), i);
    await sleep(2300);
    const r = await p.evaluate((i) => { const c = document.querySelectorAll("[data-stack]")[i]; return { dds: [...c.querySelectorAll("dd")].map((d) => ({ text: d.textContent, h: Math.round(d.getBoundingClientRect().height), w: Math.round(d.getBoundingClientRect().width) })), overlays: c.querySelectorAll(".count-overlay").length, counting: c.querySelectorAll("[data-counting]").length }; }, i);
    ok(r.overlays === 0 && r.counting === 0 && r.dds.every((d, j) => d.text === (expected[i] || [])[j]), `count-up card ${i + 1}: ends on exactly ${JSON.stringify(expected[i])}, overlay gone (${JSON.stringify(r.dds.map((d) => d.text))})`);
    sizes.push(r.dds);
  }
  ok((await p.evaluate(() => window.__cls)) < 0.001, `count-ups and scrolling through all cards: CLS ${(await p.evaluate(() => window.__cls)).toFixed(4)}`);
  ok(p._errs.length === 0, `count-up: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
  await p.close();
  // case-study page: the header stats count too and end exactly
  const cs = await open("/projects/ask-my-portfolio", 1440, 900);
  await sleep(2600);
  const csr = await cs.evaluate(() => ({ texts: [...document.querySelectorAll("header dd")].map((d) => d.textContent), overlays: document.querySelectorAll(".count-overlay").length, ran: window.__overlays }));
  ok(csr.overlays === 0 && csr.ran >= 3 && csr.texts.join("|") === "39/40|6/6|$0.0015", `case study: the three header stats counted up and ended on exactly ${JSON.stringify(csr.texts)}`);
  await cs.close();
}

// ---------- card lift: hover and keyboard focus, both themes ----------
for (const [theme, accent] of [["dark", "155, 122, 255"], ["light", "109, 66, 230"]]) {
  const p = await open("/", 1440, 900, { theme });
  await p.evaluate(() => document.querySelector("[data-stack]").scrollIntoView({ block: "center" })); await sleep(600);
  const rest = await p.evaluate(() => getComputedStyle(document.querySelector(".card-lift")).transform);
  await p.hover(".card-lift"); await sleep(500);
  const h = await p.evaluate(() => { const s = getComputedStyle(document.querySelector(".card-lift")); return { dy: new DOMMatrix(s.transform).m42, shadow: s.boxShadow, border: s.borderColor }; });
  ok(rest === "none" && Math.abs(h.dy + 4) < 0.6 && h.shadow.includes(accent) && h.border.includes(accent), `card hover (${theme}): lifts 4px and glows in the accent colour (${h.dy}px, ${h.shadow.slice(0, 34)})`);
  await p.mouse.move(5, 5); await sleep(500);
  // keyboard: Tab until something inside a project card has focus-visible
  await p.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur(); });
  let landed = false;
  for (let i = 0; i < 160 && !landed; i++) { await p.keyboard.press("Tab"); landed = await p.evaluate(() => !!document.activeElement?.closest("#projects .card-lift") && document.activeElement.matches(":focus-visible")); }
  await sleep(450);
  const k = await p.evaluate(() => { const card = document.activeElement.closest(".card-lift"); const s = getComputedStyle(card); return { dy: new DOMMatrix(s.transform).m42, shadow: s.boxShadow, border: s.borderColor, el: document.activeElement.tagName + " " + (document.activeElement.textContent || "").trim().slice(0, 20) }; });
  ok(landed && Math.abs(k.dy + 4) < 0.6 && k.shadow.includes(accent) && k.border.includes(accent), `card focus (${theme}): keyboard focus gives the same lift and glow (${k.dy}px on "${k.el}")`);
  await p.close();
}

// ---------- phone ----------
{
  const p = await open("/", 390, 844, { wait: false });
  await p.waitForSelector(".reveal-line");
  await sleep(150);
  const early = await p.evaluate(() => { const ls = [...document.querySelectorAll(".reveal-line")].filter((l) => l.getBoundingClientRect().width > 0); return { n: ls.length, minOpacity: Math.min(...ls.map((l) => +getComputedStyle(l).opacity)), widths: ls.map((l) => Math.round(l.getBoundingClientRect().width)) }; });
  ok(early.n === 2 && early.minOpacity === 1, `phone: both lines of the name are on screen from the first frames (${early.n} lines, minimum opacity ${early.minOpacity})`);
  await sleep(2500);
  const m = await p.evaluate(() => ({ ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth, cls: window.__cls, lanes: document.querySelectorAll(".hero-flow-lane").length, lane: getComputedStyle(document.querySelector(".hero-flow-lane")).animationName }));
  ok(m.ovf <= 0 && m.cls < 0.001 && m.lane === "hero-flow", `phone: no overflow, CLS ${m.cls.toFixed(4)}, the stream runs (${m.lanes} lanes)`);
  await p.evaluate(() => { document.querySelectorAll("#top > *:not(.hero-flow), header, .skip-link, [data-companion]").forEach((e) => (e.style.visibility = "hidden")); });
  let worst = 0;
  for (const wait of [200, 2000]) {
    await sleep(wait);
    const { data, info } = await sharp(await p.screenshot()).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) worst = Math.max(worst, lum(data[i], data[i + 1], data[i + 2]));
  }
  const ratio = (MUTED_L + 0.05) / (worst + 0.05);
  ok(ratio >= 7, `phone: the dimmest hero text keeps ${ratio.toFixed(1)}:1 on the brightest pixel of the stream`);
  ok(p._errs.length === 0, `phone: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
  await p.close();
}

await b.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");

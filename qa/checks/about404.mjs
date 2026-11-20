// About hobbies line + pizza pose, and the 404 page (pool pose): status, metadata, image size attributes, buttons, axe in
// both themes, CLS, phone layout, reduced motion.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const axeSrc = fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const BASE = process.argv[2] || "http://localhost:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"} ${msg}`); if (!cond) fails.push(msg); };

const HOBBIES = "When I'm not building pipelines, I'm in the kitchen, eating pizza, or at a pool table chasing the 8-ball.";
const HEADING = "scratch! this page isn't on the table";

// ---------- 404: status and head tags (no browser) ----------
for (const path of ["/this-page-does-not-exist", "/projects/not-a-case-study", "/avatar/nope"]) {
  const r = await fetch(BASE + path);
  const html = await r.text();
  ok(r.status === 404, `${path}: real 404 status (got ${r.status})`);
  if (path === "/avatar/nope") continue; // a missing static file: only the status matters
  ok(/<meta name="robots" content="noindex/.test(html), `${path}: noindex meta tag`);
  ok(/<title>Page not found \| Akshay Govind<\/title>/.test(html), `${path}: page title`);
  ok(!/<link rel="canonical"/.test(html), `${path}: no canonical link (the home page's must not leak onto a 404)`);
  ok(!/<meta property="og:url"/.test(html), `${path}: no og:url`);
}
const home = await fetch(BASE + "/");
const homeHtml = await home.text();
ok(home.status === 200 && !/content="noindex/.test(homeHtml), "home page is still 200 and indexable");
ok(!/<link[^>]*desk-pool[^>]*>/.test(homeHtml), "the home page does not preload the 404 pool image (a normal <img> in the not-found tree once leaked a preload into every page head)");
ok((await fetch(BASE + "/projects/foodlens")).status === 200, "a real case study is still 200");

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
async function open(path, w, h, theme, { reduce = false, keepSmooth = false } = {}) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  if (reduce) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(BASE + path, { waitUntil: "networkidle2" });
  if (!keepSmooth) await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  p._errs = errs;
  return p;
}
const axe = async (p, scope, label) => {
  await p.evaluate(axeSrc);
  const v = await p.evaluate(async (sel) => (await axe.run(document.querySelector(sel))).violations.map((x) => `${x.id}:${x.nodes.length}`), scope);
  ok(!v.length, `axe ${label}: ${v.join(",") || "0 violations"}`);
};

// ---------- 404 page rendering ----------
for (const [w, h, name] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["dark", "light"]) {
    const tag = `404 ${name} ${theme}`;
    const p = await open("/this-page-does-not-exist", w, h, theme);
    const s = await p.evaluate(() => {
      const img = document.querySelector("main img");
      const r = img?.getBoundingClientRect();
      const a = (t) => [...document.querySelectorAll("main a.btn")].find((x) => x.textContent.trim() === t);
      const h1 = document.querySelector("h1");
      return {
        h1: h1?.innerText.toLowerCase().replace(/\s+/g, " ").trim(), h1Over: h1.scrollWidth > h1.clientWidth + 1,
        img: img && { src: img.getAttribute("src"), wa: img.getAttribute("width"), ha: img.getAttribute("height"), nw: img.naturalWidth, done: img.complete, alt: img.alt, ratio: r.width / r.height, w: r.width, right: r.right },
        home: a("Home") && { href: a("Home").getAttribute("href"), h: a("Home").getBoundingClientRect().height }, proj: a("Projects") && { href: a("Projects").getAttribute("href"), h: a("Projects").getBoundingClientRect().height },
        companion: !!document.querySelector("[data-companion]"), ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth, vw: innerWidth,
        title: document.title, h1s: document.querySelectorAll("h1").length, anims: document.getAnimations().length,
      };
    });
    ok(s.h1 === HEADING && s.h1s === 1, `${tag}: one h1 with the heading ("${s.h1}")`);
    ok(!s.h1Over, `${tag}: the heading fits its box`);
    ok(s.img && s.img.src === "/avatar/desk-pool.webp" && s.img.wa === "600" && s.img.ha === "448" && s.img.nw === 600 && s.img.done, `${tag}: pool pose has width and height attributes and is loaded (${JSON.stringify(s.img)})`);
    ok(s.img && s.img.alt.length > 10 && Math.abs(s.img.ratio - 600 / 448) < 0.02 && s.img.right <= s.vw, `${tag}: pool pose has alt text, keeps its aspect ratio and stays on screen`);
    ok(s.home?.href === "/" && s.proj?.href === "/#projects" && s.home.h >= 44 && s.proj.h >= 44, `${tag}: Home and Projects buttons, both at least 44px tall (${s.home?.h}, ${s.proj?.h})`);
    ok(!s.companion, `${tag}: no corner avatar on this page`);
    ok(s.ovf <= 0, `${tag}: no horizontal overflow`);
    ok(s.anims === 0, `${tag}: nothing animates (${s.anims} running animations)`);
    await axe(p, "body", tag);
    const cls = await p.evaluate(() => window.__cls);
    ok(cls < 0.001, `${tag}: CLS ${cls.toFixed(4)}`);
    ok(p._errs.length === 0, `${tag}: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
    if (theme === "dark" && name === "desktop") {
      // Home is clicked on this page; the Projects button is tested in the "land on the section" block below, on fresh pages.
      await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click("main a.btn.btn-primary")]);
      ok(new URL(p.url()).pathname === "/" && (await p.evaluate(() => !!document.getElementById("top"))), `${tag}: Home goes to the home page`);
    }
    await p.close();
  }
}
{
  const p = await open("/this-page-does-not-exist", 1440, 900, "dark", { reduce: true });
  ok((await p.evaluate(() => document.getAnimations().length)) === 0, "404 with reduced motion: nothing animates");
  ok(await p.evaluate(() => !!document.querySelector("main img")?.complete), "404 with reduced motion: pool pose still shows");
  await p.close();
}

// ---------- About: hobbies line and pizza pose ----------
const goAbout = async (p) => { await p.evaluate(() => document.getElementById("about").scrollIntoView()); await sleep(1500); };
const poseNow = (p) => p.evaluate(() => [...document.querySelector("[data-companion]").querySelectorAll("img[data-pose]")].map((i) => [i.dataset.pose, +getComputedStyle(i).opacity]).filter((x) => x[1] > 0.5).map((x) => x[0]).join(","));
for (const [w, h, name] of [[1440, 900, "desktop"], [820, 1100, "tablet"], [390, 844, "phone"]]) {
  for (const theme of ["dark", "light"]) {
    const tag = `About ${name} ${theme}`;
    const p = await open("/", w, h, theme);
    await goAbout(p);
    const s = await p.evaluate((hob) => {
      const about = document.getElementById("about");
      const ps = [...about.querySelectorAll("p")];
      const line = ps.find((x) => x.textContent.trim() === hob);
      const img = about.querySelector("img.about-pose");
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const boxes = [...about.querySelectorAll("p, h3, li")].map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0);
      const overlaps = cs.display === "none" ? 0 : boxes.filter((b) => !(r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom)).length;
      return { line: !!line, display: cs.display, wa: img.getAttribute("width"), ha: img.getAttribute("height"), nw: img.naturalWidth, done: img.complete, w: r.width, right: r.right, vw: innerWidth, overlaps, order: ps.map((x) => x.textContent.trim().slice(0, 12)) };
    }, HOBBIES);
    ok(s.line, `${tag}: the hobbies line is in About, word for word`);
    ok(s.wa === "600" && s.ha === "448", `${tag}: inline pizza image has width and height attributes`);
    if (name === "phone") {
      ok(s.display === "block" && s.nw === 600 && s.done && s.right <= s.vw && s.overlaps === 0, `${tag}: pizza pose is shown inline, loaded, on screen and not over any text (${JSON.stringify({ d: s.display, w: Math.round(s.w), o: s.overlaps })})`);
      // the phone avatar is hidden by fading its inner wrapper, so what counts is root opacity times wrapper opacity
      ok((await p.evaluate(() => { const r = document.querySelector("[data-companion]"); return +getComputedStyle(r).opacity * +getComputedStyle(r.firstElementChild).opacity; })) === 0, `${tag}: no corner avatar here (so only one avatar shows)`);
    } else {
      ok(s.display === "none" && !s.done, `${tag}: the inline pose stays hidden and unloaded (the corner avatar shows it)`);
      ok((await poseNow(p)) === "pizza", `${tag}: the corner avatar shows the pizza pose (${await poseNow(p)})`);
    }
    await axe(p, "#about", tag);
    const cls = await p.evaluate(() => window.__cls);
    ok(cls < 0.001, `${tag}: CLS ${cls.toFixed(4)} after jumping straight to About`);
    ok(p._errs.length === 0, `${tag}: no console errors ${p._errs.slice(0, 2).join(" | ")}`);
    await p.close();
  }
}
{
  // reduced motion on a wide screen: the corner avatar stays on one static pose, so the inline pose is the one that shows
  const p = await open("/", 1440, 900, "dark", { reduce: true });
  await goAbout(p);
  const s = await p.evaluate(() => { const i = document.querySelector("#about img.about-pose"); const r = i.getBoundingClientRect(); return { d: getComputedStyle(i).display, nw: i.naturalWidth, onScreen: r.top < innerHeight && r.bottom > 0 }; });
  ok(s.d === "block" && s.nw === 600 && s.onScreen, `About with reduced motion: the inline pizza pose shows (${JSON.stringify(s)})`);
  ok((await poseNow(p)) === "typing", `About with reduced motion: the corner avatar stays on its one static pose (${await poseNow(p)})`);
  await p.close();
}

// ---------- the heading is always two lines and never overflows, in either font, from 320px up ----------
for (const [blockFonts, label] of [[false, "Anton"], [true, "fallback font"]]) {
  for (const w of [320, 360, 390, 412, 600, 768, 1024, 1440]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, isMobile: w < 500 });
    if (blockFonts) { await p.setRequestInterception(true); p.on("request", (r) => (/\.woff2?(\?|$)/.test(r.url()) ? r.abort() : r.continue())); }
    await p.goto(BASE + "/this-page-does-not-exist", { waitUntil: blockFonts ? "domcontentloaded" : "networkidle2" });
    await sleep(500);
    const m = await p.evaluate(() => {
      const spans = [...document.querySelectorAll("h1 > span")];
      const col = document.querySelector("h1").parentElement.getBoundingClientRect();
      return {
        n: spans.length,
        oneLine: spans.every((s) => { const fs = parseFloat(getComputedStyle(s).fontSize); return s.getBoundingClientRect().height < fs * 1.3; }), // a wrapped line would be about twice as tall
        fits: spans.every((s) => { const range = document.createRange(); range.selectNodeContents(s); return range.getBoundingClientRect().width <= col.width + 0.5; }),
        sizes: spans.map((s) => Math.round(parseFloat(getComputedStyle(s).fontSize))),
        ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    ok(m.n === 2 && m.oneLine && m.fits && m.ovf <= 0, `404 heading at ${w}px in ${label}: two lines, none wrapped, none wider than its column, no page overflow (font sizes ${m.sizes.join(" / ")}px)`);
    await p.close();
  }
}

// ---------- the heading's web font arriving late must not move anything ----------
// Anton is a condensed face, so in the fallback font the big heading wraps onto more lines at some widths. When Anton swaps in,
// everything below it used to move (Lighthouse caught it intermittently, CLS 0.04). The font requests are delayed here to make the
// swap happen well after first paint, at widths where the line count differs and at others.
for (const w of [320, 360, 390, 412, 768, 1024, 1440]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900, isMobile: w < 500 });
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  await p.setRequestInterception(true);
  p.on("request", (r) => { if (/\.woff2?(\?|$)/.test(r.url())) setTimeout(() => r.continue().catch(() => {}), 1500); else r.continue(); });
  await p.goto(BASE + "/this-page-does-not-exist", { waitUntil: "domcontentloaded" });
  await sleep(3500);
  const cls = await p.evaluate(() => window.__cls);
  const fontOk = await p.evaluate(() => document.fonts.check("48px Anton") || [...document.fonts].some((f) => f.status === "loaded"));
  // 0.005, not 0.001: the shared navbar and footer text nudge by a hair when fonts swap on every page (about 0.001 here). The heading, the image and the buttons must not move at all, which the two-line heading and the full-height main guarantee.
  ok(cls < 0.005 && fontOk, `404 at ${w}px: CLS ${cls.toFixed(4)} when the heading font loads 1.5 s late (font loaded: ${fontOk})`);
  await p.close();
}

// ---------- links to a home page section land on it (smooth scrolling left ON, as for a real visitor) ----------
// Before HashScroll, ScrollTrigger's start-up refresh undid the browser's scroll to the hash: on the live site a navbar link
// from a case study reached Projects 0 of 10 times and Contact 3 of 10. Each case is tried 3 times and must land every time.
for (const [label, start, sel, id] of [
  ["case-study navbar link to Projects", "/projects/foodlens", "header a[href='/#projects']", "projects"],
  ["case-study navbar link to Contact", "/projects/foodlens", "header a[href='/#contact']", "contact"],
  ["case-study 'All projects' button", "/projects/foodlens", "main a.btn[href='/#projects']", "projects"],
  ["404 'Projects' button", "/this-page-does-not-exist", "main a.btn:not(.btn-primary)", "projects"],
  ["direct visit to /#skills", "/#skills", null, "skills"],
]) {
  let landed = 0;
  for (let i = 0; i < 3; i++) {
    const p = await open(start, 1440, 900, "dark", { keepSmooth: true });
    if (sel) await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click(sel)]);
    await sleep(1800);
    const r = await p.evaluate((id) => ({ top: Math.round(document.getElementById(id).getBoundingClientRect().top), smooth: getComputedStyle(document.documentElement).scrollBehavior }), id);
    if (Math.abs(r.top) < 200 && r.smooth === "smooth") landed++;
    await p.close();
  }
  ok(landed === 3, `${label}: lands on the section ${landed} of 3 times`);
}
{
  // it must never fight the visitor: scrolling away during the first second sticks
  const p = await open("/projects/foodlens", 1440, 900, "dark", { keepSmooth: true });
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click("header a[href='/#projects']")]);
  await p.mouse.move(700, 450);
  await p.mouse.wheel({ deltaY: 1500 });
  await sleep(2800);
  const y0 = await p.evaluate(() => scrollY);
  await sleep(1000);
  ok((await p.evaluate(() => scrollY)) === y0, "HashScroll gives up as soon as the visitor scrolls (the page stays where they left it)");
  await p.close();
}

await b.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");

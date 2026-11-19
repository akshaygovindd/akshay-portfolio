// Case-study pages (/projects/[slug]): head tags, structure, diagram, no companion, back link,
// axe (both themes + phone), CLS, overflow, targets, links, sitemap, OG image.
// Usage: node casestudies.mjs [expectedSiteOrigin]
import puppeteer from "puppeteer-core"; import fs from "fs"; import { site } from "../../config/site.ts";
const B = "http://localhost:3100";
const expectBase = process.argv[2] || "https://akshaygovind.vercel.app";
const axeSrc = fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0;
const chk = (n, ok, d = "") => { if (!ok) bad++; console.log(`  ${ok ? "PASS" : "FAIL"} ${n}${d ? "  " + d : ""}`); };

async function open(path, { w = 1440, h = 900, mobile = false, theme = null } = {}) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  if (theme) await p.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push(m.text()); });
  p.on("response", (r) => { if (r.status() >= 400) errs.push(r.status() + " " + r.url()); });
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  await p.goto(B + path, { waitUntil: "networkidle2" });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await sleep(500);
  p._e = errs;
  return p;
}
const axe = async (p) => {
  await p.evaluate(axeSrc);
  return p.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0].target.join(" ")})`));
};

const sitemap = await (await fetch(B + "/sitemap.xml")).text();
const home = await open("/");
const homeLinks = await home.evaluate(() => [...document.querySelectorAll("a[href^='/projects/']")].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) })));
await home.close();

for (const cs of site.caseStudies) {
  const url = `/projects/${cs.slug}`;
  const project = site.projects.find((x) => x.caseStudy === cs.slug);
  console.log(`\n== ${url} ==`);

  // ---- head ----
  const html = await (await fetch(B + url)).text();
  const attr = (re) => { const m = html.match(re); return m ? m[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'") : null; };
  const wantTitle = `${cs.metaTitle} | ${site.name}`;
  chk("title", attr(/<title>([^<]+)<\/title>/) === wantTitle, attr(/<title>([^<]+)<\/title>/));
  chk("description from config and under 160 chars", attr(/<meta name="description" content="([^"]+)"/) === cs.description && cs.description.length < 160, `${cs.description.length} chars`);
  chk("canonical", attr(/<link rel="canonical" href="([^"]+)"/) === expectBase + url);
  chk("og:url", attr(/<meta property="og:url" content="([^"]+)"/) === expectBase + url);
  chk("og:title / twitter:title", attr(/<meta property="og:title" content="([^"]+)"/) === wantTitle && attr(/<meta name="twitter:title" content="([^"]+)"/) === wantTitle);
  const ogImg = attr(/<meta property="og:image" content="([^"]+)"/);
  chk("og:image is this page's opengraph-image", !!ogImg && ogImg.startsWith(`${expectBase}${url}/opengraph-image`), ogImg);
  chk("twitter:image is set and matches", attr(/<meta name="twitter:image" content="([^"]+)"/) === ogImg);
  if (ogImg) { const r = await fetch(B + new URL(ogImg).pathname + new URL(ogImg).search); chk("OG image serves a PNG", r.status === 200 && /image\/png/.test(r.headers.get("content-type") || ""), `${r.status} ${r.headers.get("content-type")}`); }
  chk("listed in sitemap.xml", sitemap.includes(`<loc>${expectBase}${url}</loc>`));
  chk("card on the home page links here (\"Read case study\")", homeLinks.some((l) => l.href === url && /Read case study/.test(l.text) && l.h >= 44), JSON.stringify(homeLinks.find((l) => l.href === url)));

  // ---- desktop: structure ----
  let p = await open(url);
  const s = await p.evaluate(() => {
    const text = document.body.innerText;
    const heads = [...document.querySelectorAll("h1,h2,h3")].map((h) => [h.tagName, h.textContent.trim()]);
    const svg = document.querySelector("article figure svg[role=img]");
    return {
      text, heads, h1: document.querySelectorAll("h1").length, companion: document.querySelectorAll("[data-companion]").length,
      svg: svg ? { title: svg.querySelector("title")?.textContent, desc: svg.querySelector("desc")?.textContent.length, labelled: svg.getAttribute("aria-labelledby") } : null,
      pipelineButtons: document.querySelectorAll("article figure button[aria-pressed]").length,
      back: [...document.querySelectorAll("a")].filter((a) => a.getAttribute("href") === "/#projects").map((a) => ({ t: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) })),
      skip: document.querySelector("a.skip-link")?.getAttribute("href"), main: !!document.getElementById("main"),
      navHome: [...document.querySelectorAll("header a")].map((a) => a.getAttribute("href")),
      sources: !!document.querySelector("article details summary"), tableRegions: document.querySelectorAll("article div[tabindex='0'] > table").length, tables: document.querySelectorAll("article table").length,
      gutter: !!document.querySelector("footer .gutter"),
    };
  });
  chk("one h1, equal to the project title", s.h1 === 1 && s.heads[0][1] === project.title, JSON.stringify(s.heads[0]));
  const h2 = s.heads.filter((h) => h[0] === "H2").map((h) => h[1]);
  const want = ["Problem", "Architecture", "Key decisions", "Data quality and evaluation", "Results", "What I'd do next"];
  chk("the six sections, in order", JSON.stringify(h2.slice(0, 6)) === JSON.stringify(want), JSON.stringify(h2));
  chk("heading levels never skip", s.heads.every((h, i) => i === 0 || +h[0][1] - +s.heads[i - 1][0][1] <= 1));
  if (cs.diagram === "pipeline") chk("FoodLens pipeline component reused (6 stages + metadata bar)", s.pipelineButtons === 7, String(s.pipelineButtons));
  else chk("SVG diagram has an accessible name and description", !!s.svg && !!s.svg.title && s.svg.desc > 80 && /-t .*-d$/.test(s.svg.labelled || ""), JSON.stringify(s.svg));
  chk("no corner avatar on this page", s.companion === 0);
  chk("footer has no avatar gutter", !s.gutter);
  chk("skip link targets #main and #main exists", s.skip === "#main" && s.main);
  chk("nav links point back to the home page sections", s.navHome.includes("/") && s.navHome.includes("/#projects") && s.navHome.includes("/#contact"), JSON.stringify(s.navHome));
  chk("back-to-projects link(s), at least 44px tall", s.back.length >= 2 && s.back.every((x) => x.h >= 44), JSON.stringify(s.back));
  chk("\"Where each number comes from\" is present", s.sources);
  chk("every table sits in a keyboard-scrollable region", s.tables === s.tableRegions, `${s.tables} tables`);
  chk("no placeholder / TODO text", !/TODO|\[YOUR|\[MY|lorem ipsum|placeholder/i.test(s.text));
  chk("no console errors / failed requests", p._e.length === 0, JSON.stringify(p._e));

  // sources disclosure opens
  const opened = await p.evaluate(async () => { const d = document.querySelector("article details"); d.querySelector("summary").click(); await new Promise((r) => setTimeout(r, 100)); return d.open; });
  chk("Sources disclosure opens on click", opened);

  // targets: buttons, summaries and nav links >= 44px tall; everything interactive >= 24px
  const tg = await p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[aria-hidden=true]") && !e.classList.contains("skip-link"); };
    const big = [...document.querySelectorAll(".btn, summary, header nav ul a, header button, nav[aria-label='More case studies'] a")].filter(vis).filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim().slice(0, 24) + " " + Math.round(e.getBoundingClientRect().height));
    const small = [...document.querySelectorAll("a, button, summary, [tabindex='0']")].filter(vis).filter((e) => !(e.closest("article p, article li, article td") && e.tagName === "A")).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map((e) => e.textContent.trim().slice(0, 24));
    return { big, small };
  });
  chk("buttons, summaries and nav links are at least 44px tall (the existing brand link and pipeline buttons only need 24px)", tg.big.length === 0, JSON.stringify(tg.big));
  chk("no interactive target below 24x24 (inline text links exempt)", tg.small.length === 0, JSON.stringify(tg.small));

  // links
  const links = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), target: a.target, rel: a.rel })));
  const ext = links.filter((l) => /^https?:/.test(l.href));
  chk("external links open in a new tab with noopener", ext.every((l) => l.target === "_blank" && /noopener/.test(l.rel)), `${ext.length} external`);
  const internal = [...new Set(links.filter((l) => l.href.startsWith("/") && !l.href.startsWith("/#")).map((l) => l.href))];
  const badInt = []; for (const h of internal) { const r = await fetch(B + h); if (r.status !== 200) badInt.push(h + " " + r.status); }
  chk("internal links resolve", badInt.length === 0, badInt.join(", ") || `${internal.length} checked`);
  for (const l of [...new Set(ext.map((x) => x.href))]) { try { const r = await fetch(l, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } }); if (r.status !== 200) console.log(`  WARN external ${r.status} ${l}`); } catch { console.log(`  WARN external fetch failed ${l}`); } }

  // back link lands on the Projects section of the home page
  await p.evaluate(() => scrollTo(0, 0));
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click("main a[href='/#projects']")]);
  await sleep(1500);
  const landed = await p.evaluate(() => ({ path: location.pathname, hash: location.hash, top: Math.round(document.getElementById("projects")?.getBoundingClientRect().top ?? 9999) }));
  chk("back link goes to the home page, Projects section in view", landed.path === "/" && landed.hash === "#projects" && Math.abs(landed.top) <= 110, JSON.stringify(landed));
  await p.close();

  // ---- axe in both themes (desktop) and on a phone ----
  for (const [label, opts] of [["dark desktop", { theme: "dark" }], ["light desktop", { theme: "light" }], ["dark phone", { w: 375, h: 812, mobile: true, theme: "dark" }], ["light phone", { w: 375, h: 812, mobile: true, theme: "light" }]]) {
    p = await open(url, opts);
    const v = await axe(p);
    chk(`axe, ${label}: 0 violations`, v.length === 0, JSON.stringify(v));
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    chk(`no horizontal page scroll, ${label}`, ov <= 0, `${ov}px`);
    // scroll through the whole page, then read CLS
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(60); }
    await sleep(400);
    const cls = await p.evaluate(() => +window.__cls.toFixed(4));
    chk(`CLS ${label}`, cls <= 0.01, String(cls));
    await p.close();
  }

  // theme toggle works
  p = await open(url);
  const flipped = await p.evaluate(async () => { const before = document.documentElement.className; document.querySelector("header button").click(); await new Promise((r) => setTimeout(r, 300)); return before !== document.documentElement.className; });
  chk("theme toggle works", flipped);
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} FAILED` : "\nALL PASS");
process.exit(bad ? 1 : 0);

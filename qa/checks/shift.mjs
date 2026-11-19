import puppeteer from "puppeteer-core";
import { webkit } from "playwright";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Chromium: jump straight to Contact, watch for page growth while the playground loads above it
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.evaluateOnNewDocument(()=>{window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:"layout-shift",buffered:true})});
await p.goto("http://localhost:3100",{waitUntil:"networkidle2"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"});
await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await sleep(300);
const m=()=>p.evaluate(()=>({docH:document.documentElement.scrollHeight,contactTop:Math.round(document.getElementById("contact").getBoundingClientRect().top),scrollY:Math.round(scrollY),playH:Math.round(document.getElementById("playground").getBoundingClientRect().height),cls:+window.__cls.toFixed(3)}));
const a=await m(); await sleep(7000); const z=await m();
console.log("Chromium  before:",JSON.stringify(a)); console.log("Chromium  after :",JSON.stringify(z)); console.log("  page height grew by",z.docH-a.docH,"px while user sat on Contact; contact moved on screen by",z.contactTop-a.contactTop,"px");
await b.close();
// WebKit has no scroll anchoring, so growth above the viewport pushes content down
const w=await webkit.launch(); const pg=await (await w.newContext({viewport:{width:1440,height:900}})).newPage();
await pg.goto("http://localhost:3100",{waitUntil:"networkidle"}); await pg.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";scrollTo(0,document.documentElement.scrollHeight)}); await sleep(300);
const wm=()=>pg.evaluate(()=>({docH:document.documentElement.scrollHeight,contactTop:Math.round(document.getElementById("contact").getBoundingClientRect().top)}));
const wa=await wm(); await sleep(7000); const wz=await wm();
console.log("WebKit    before:",JSON.stringify(wa),"after:",JSON.stringify(wz),"=> contact moved",wz.contactTop-wa.contactTop,"px");
await w.close();

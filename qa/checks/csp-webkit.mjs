import { webkit, devices, chromium } from "playwright";
import puppeteer from "puppeteer-core";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const evalTest=(win)=>win.evaluate(()=>new Promise(res=>{ // an inline <script> run by the PAGE itself (not by the test harness)
  window.__evalResult=null; const s=document.createElement("script");
  s.textContent="try{eval('1+1');window.__evalResult='ran'}catch(e){window.__evalResult='blocked ('+e.name+')'}"; document.head.appendChild(s); setTimeout(()=>res(window.__evalResult),200)}));
// WebKit: same suite as Chromium
for (const [name,opts] of [["WebKit desktop",{viewport:{width:1440,height:900}}],["WebKit iPhone 13",{...devices["iPhone 13"]}]]) {
  const br=await webkit.launch(); const ctx=await br.newContext(opts); const p=await ctx.newPage(); const msgs=[];
  p.on("console",m=>{if(["error","warning"].includes(m.type()))msgs.push(m.type()+": "+m.text().slice(0,160))}); p.on("pageerror",e=>msgs.push("pageerror: "+e.message)); p.on("requestfailed",r=>msgs.push("requestfailed "+r.url().slice(0,90)));
  await p.addInitScript(()=>{window.__csp=[];document.addEventListener("securitypolicyviolation",e=>window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI||"inline"}`))});
  await p.goto("http://localhost:3100",{waitUntil:"networkidle"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"}); await sleep(1500);
  console.log(`\n[${name}]`);
  const fonts=await p.evaluate(()=>[...document.fonts].filter(f=>f.status==="loaded").map(f=>f.family.replace(/['"]/g,"")).filter((v,i,a)=>a.indexOf(v)===i)); console.log("  fonts loaded:",JSON.stringify(fonts));
  await p.evaluate(()=>document.getElementById("playground").scrollIntoView());
  const ok=await p.waitForSelector("table",{timeout:60000}).then(()=>true).catch(()=>false); const stat=ok?await p.evaluate(()=>[...document.querySelectorAll("p.font-mono")].map(e=>e.textContent).find(t=>/rows?/.test(t))):null;
  console.log("  SQL playground (DuckDB-WASM):",ok?"PASS - "+stat:"FAIL");
  if(ok){ await p.click("text=Rank within department"); await sleep(1500); console.log("  window-function query ->",await p.evaluate(()=>[...document.querySelectorAll("th")].map(e=>e.textContent).join(","))); }
  await p.evaluate(()=>document.getElementById("pipeline").scrollIntoView()); await p.click("button:has-text('Silver')"); console.log("  pipeline click ->",await p.evaluate(()=>document.querySelector("[aria-live=polite] p")?.textContent));
  console.log("  CSP violations:",JSON.stringify(await p.evaluate(()=>window.__csp)),"| console errors/warnings:",msgs.length?JSON.stringify(msgs):"none");
  console.log("  external script blocked:",await p.evaluate(()=>new Promise(res=>{const s=document.createElement("script");s.src="https://example.com/x.js";s.onerror=()=>res("blocked");s.onload=()=>res("LOADED");document.head.appendChild(s);setTimeout(()=>res("blocked/timeout"),2000)})));
  await br.close(); }

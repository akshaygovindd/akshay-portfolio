import { webkit, devices } from "playwright";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
import fs from "fs"; const OUT=new URL("../out/",import.meta.url).pathname; fs.mkdirSync(OUT,{recursive:true});
const browser=await webkit.launch();
console.log("WebKit version:",browser.version());
for (const [name,ctxOpts] of [["desktop 1440",{viewport:{width:1440,height:900}}],["iPhone 13",{...devices["iPhone 13"]}]]) {
  const ctx=await browser.newContext(ctxOpts); const p=await ctx.newPage(); const errs=[];
  p.on("pageerror",e=>errs.push("pageerror: "+e.message)); p.on("console",m=>{if(["error","warning"].includes(m.type())) errs.push(m.type()+": "+m.text())}); p.on("requestfailed",r=>errs.push("requestfailed "+r.url()));
  await p.goto("http://localhost:3100",{waitUntil:"networkidle"}); await sleep(1500);
  console.log(`\n[WebKit ${name}]`);
  const hl=await p.evaluate(()=>[...document.querySelectorAll("h1 span.font-display")].filter(s=>s.parentElement.clientWidth>0).map(s=>`${Math.round(s.getBoundingClientRect().width)}/${s.parentElement.clientWidth}`));
  console.log("  headline text width / container width:",hl.join("  "));
  console.log("  horizontal overflow px:",await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
  const snap=()=>p.evaluate(()=>{const r=document.querySelector("[data-companion]");const b=r.getBoundingClientRect();return `w=${Math.round(b.width)} x=${Math.round(b.x)} y=${Math.round(b.y)} op=${getComputedStyle(r).opacity} poses=${[...r.querySelectorAll("img[data-pose]")].map(i=>[i.dataset.pose,+getComputedStyle(i).opacity]).filter(x=>x[1]>0.05).map(x=>x[0]).join(",")}`});
  console.log("  companion @top:",await snap());
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"});
  await p.screenshot({path:`${OUT}/webkit-${name.replace(/ /g,"-")}-hero.png`});
  for (const id of ["experience","projects","skills","demos","contact"]) {
    await p.evaluate(id=>{const y=document.getElementById(id).getBoundingClientRect().top+scrollY-70;scrollTo(0,y)},id); await sleep(1000);
    console.log(`  ${id.padEnd(10)} companion: ${await snap()}`);
    if(id==="experience"||id==="demos") await p.screenshot({path:`${OUT}/webkit-${name.replace(/ /g,"-")}-${id}.png`});
  }
  // DuckDB-WASM in WebKit
  await p.evaluate(()=>{const y=document.getElementById("playground").getBoundingClientRect().top+scrollY-70;scrollTo(0,y)});
  const ok=await p.waitForSelector("table",{timeout:45000}).then(()=>true).catch(()=>false);
  const rows=ok?await p.evaluate(()=>[...document.querySelectorAll("p.font-mono")].map(e=>e.textContent).find(t=>/rows?/.test(t))):null;
  const err=await p.evaluate(()=>document.querySelector("[aria-live=polite] .text-red-500")?.textContent?.slice(0,120));
  console.log("  SQL playground (DuckDB-WASM):",ok?`PASS - ${rows}`:`FAIL ${err||"no table"}`);
  if(ok){ await p.click("text=Rank within department"); await sleep(1500); console.log("  window-function query:",await p.evaluate(()=>[...document.querySelectorAll("th")].map(e=>e.textContent).join(",")));}
  // pipeline click
  await p.evaluate(()=>{document.getElementById("pipeline").scrollIntoView()}); await p.click("button:has-text('Silver')"); console.log("  pipeline click -> detail:",await p.evaluate(()=>document.querySelector("[aria-live=polite] p")?.textContent));
  // hover wave (desktop)
  if(name.startsWith("desktop")){ await p.evaluate(()=>scrollTo(0,2200)); await sleep(900); const b=await p.evaluate(()=>{const r=document.querySelector("[data-companion]").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}); await p.mouse.move(b[0],b[1]); await sleep(600); console.log("  hover ->",await snap()); }
  console.log("  console errors/warnings:",errs.length?JSON.stringify(errs):"none");
  await ctx.close();
}
await browser.close();

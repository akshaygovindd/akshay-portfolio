import puppeteer from "puppeteer-core"; import fs from "fs";
const axeSrc=fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js",import.meta.url),"utf8");
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const comp=(p)=>p.evaluate(()=>{const r=document.querySelector("[data-companion]");const b=r.getBoundingClientRect();const fl=r.firstElementChild;return{w:Math.round(b.width),x:Math.round(b.x),y:Math.round(b.y),rootOp:+getComputedStyle(r).opacity,floatOp:+getComputedStyle(fl).opacity,poses:[...r.querySelectorAll("img[data-pose]")].map(i=>[i.dataset.pose,+getComputedStyle(i).opacity]).filter(x=>x[1]>.05).map(x=>x[0]).join(",")}});
const secY=(p,id)=>p.evaluate(id=>document.getElementById(id).getBoundingClientRect().top+scrollY,id);
const go=async(p,y)=>{await p.evaluate(y=>scrollTo(0,y),y);await sleep(900)};
async function open(w,h,{mobile=false,reduce=false,theme=null}={}){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mobile,hasTouch:mobile});
 if(reduce)await p.emulateMediaFeatures([{name:"prefers-reduced-motion",value:"reduce"}]); if(theme)await p.evaluateOnNewDocument(t=>localStorage.setItem("theme",t),theme);
 const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(["error","warning"].includes(m.type()))errs.push(m.text())});p.on("response",r=>{if(r.status()>=400)errs.push(r.status()+" "+r.url())});
 await p.evaluateOnNewDocument(()=>{window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:"layout-shift",buffered:true})});
 await p.goto("http://localhost:3100",{waitUntil:"networkidle2"});await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"});await sleep(900);p._e=errs;return p}

console.log("== DESKTOP 1440: companion poses / hover ==");
let p=await open(1440,900);
for(const id of ["experience","projects","about","skills","demos","contact"]){await go(p,(await secY(p,id))-100);const c=await comp(p);console.log("  ",id.padEnd(10),c.poses,"w="+c.w,"x="+c.x)}
await p.mouse.move(1340,830);await sleep(500);console.log("   hover     ",(await comp(p)).poses);await p.mouse.move(300,300);await sleep(300);
console.log("   errors:",JSON.stringify(p._e));await p.close();

console.log("\n== PHONE 375: corner avatar must be hidden after the hero ==");
p=await open(375,812,{mobile:true});
console.log("   at top      float opacity:",(await comp(p)).floatOp);
const bad=[];for(const y of [500,800,1200,2000,4000,6000]){await go(p,y);const c=await comp(p);if(c.floatOp>0.02&&y>=500)bad.push({y,op:c.floatOp})}
console.log("   visible after hero (scrollY>=500)?",bad.length?JSON.stringify(bad):"never - hidden everywhere");
console.log("   overflowX:",await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),"| errors:",JSON.stringify(p._e));await p.close();

console.log("\n== REDUCED MOTION: everything static ==");
for(const [w,h,m] of [[1440,900,false],[375,812,true]]){p=await open(w,h,{reduce:true,mobile:m});
 const info=await p.evaluate(()=>({anims:document.getAnimations().filter(a=>a.playState==="running").length,
   fillClip:[...document.querySelectorAll(".title-fill")].map(e=>getComputedStyle(e).clipPath),
   outlineVis:[...document.querySelectorAll(".title-outline")].map(e=>getComputedStyle(e).visibility),
   dupDisplay:getComputedStyle(document.querySelector(".marquee-dup")).display, trackWrap:getComputedStyle(document.querySelector("[data-marquee]")).flexWrap, trackTransform:getComputedStyle(document.querySelector("[data-marquee]")).transform,
   stackPos:[...new Set([...document.querySelectorAll("[data-stack]")].map(e=>getComputedStyle(e).position))],
   shapeTransform:[...new Set([...document.querySelectorAll(".shape")].map(e=>getComputedStyle(e).transform))],
   rowsOpacity:[...new Set([...document.querySelectorAll("[data-reveal]")].map(e=>getComputedStyle(e).opacity))],
   curtainTransform:[...new Set([...document.querySelectorAll("[data-curtain]")].map(e=>getComputedStyle(e).transform))]}));
 // scroll everything, check nothing moved
 const total=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<total;y+=700){await go(p,y)}
 const after=await p.evaluate(()=>({tr:[...new Set([...document.querySelectorAll("[data-stack],[data-curtain],[data-reveal]")].map(e=>getComputedStyle(e).transform))],cls:+window.__cls.toFixed(3)}));
 console.log(`  [${w}] running CSS animations:`,info.anims,"| title fills:",[...new Set(info.fillClip)].join("/"),"| outlines:",[...new Set(info.outlineVis)].join("/"),"| marquee dup:",info.dupDisplay,"wrap:",info.trackWrap,"transform:",info.trackTransform);
 console.log(`        stack cards position: ${info.stackPos} | shapes transform: ${info.shapeTransform} | rows opacity: ${info.rowsOpacity} | curtain transform: ${info.curtainTransform}`);
 console.log(`        after full scroll -> transforms on cards/panels/rows: ${JSON.stringify(after.tr)} | CLS ${after.cls} | errors:`,JSON.stringify(p._e));
 const cc=await comp(p);console.log(`        companion (static): ${JSON.stringify(cc)}`);await p.close()}

console.log("\n== FULL MOTION: titles fill, marquee runs/pauses, cards stack ==");
p=await open(1440,900);
const tf=async(id)=>{const y=await secY(p,id);const get=()=>p.evaluate(id=>getComputedStyle(document.querySelector(`#${id} .title-fill`)).clipPath,id);await go(p,y-700);const a=await get();await go(p,y-300);const m=await get();await go(p,y+50);const z=await get();return [a,m,z]};
for(const id of ["experience","projects","about","contact"]) console.log("   title fill",id.padEnd(10),JSON.stringify(await tf(id)));
await go(p,0);
const mq=()=>p.evaluate(()=>getComputedStyle(document.querySelector("[data-marquee]")).transform);
const m1=await mq();await sleep(1200);const m2=await mq();console.log("   marquee moving:",m1!==m2);
const box=await p.evaluate(()=>{const r=document.querySelector("[data-marquee-root]").getBoundingClientRect();return[r.x+200,r.y+r.height/2]});
await go(p,(await p.evaluate(()=>document.querySelector("[data-marquee-root]").getBoundingClientRect().top+scrollY))-300);
const box2=await p.evaluate(()=>{const r=document.querySelector("[data-marquee-root]").getBoundingClientRect();return[r.x+300,r.y+r.height/2]});
await p.mouse.move(box2[0],box2[1]);await sleep(300);const h1=await mq();await sleep(1200);const h2=await mq();console.log("   marquee paused on hover:",h1===h2);
await p.mouse.move(100,100);await sleep(1200);const h3=await mq();console.log("   marquee resumes after hover:",h3!==h2);
const sc=await p.evaluate(()=>[...document.querySelectorAll("[data-stack]")].map(e=>getComputedStyle(e).position+" top="+getComputedStyle(e).top));console.log("   stack cards:",JSON.stringify(sc.slice(0,2)),"...x"+sc.length);
await go(p,(await secY(p,"projects"))+1900);console.log("   card scales mid-stack:",JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("[data-stack]")].map(e=>+(new DOMMatrix(getComputedStyle(e).transform).a).toFixed(3)))));
console.log("   errors:",JSON.stringify(p._e));await p.close();

console.log("\n== AXE (contrast/a11y), both themes ==");
for(const [name,theme] of [["dark",null],["light","light"]]){p=await open(1440,900,{theme});await p.evaluate(src=>{(0,eval)(src)},axeSrc);
 // scroll fully so reveal rows etc are in final state, then back to top for the run
 const total=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<total;y+=600)await go(p,y);await go(p,1500);
 const r=await p.evaluate(async()=>{const res=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa","best-practice"]}});return{v:res.violations.map(v=>({id:v.id,imp:v.impact,n:v.nodes.slice(0,5).map(n=>n.target.join(" ")+" :: "+(n.any[0]?.message||"").slice(0,120))})),inc:res.incomplete.map(i=>({id:i.id,n:i.nodes.length,t:i.nodes.slice(0,3).map(n=>n.target.join(" "))}))}});
 console.log(`  [${name}] violations: ${r.v.length}`);for(const v of r.v){console.log(`    FAIL ${v.id} (${v.imp})`);v.n.forEach(x=>console.log("       -",x))} if(r.inc.length)console.log("   needs-review:",JSON.stringify(r.inc));await p.close()}
await b.close();

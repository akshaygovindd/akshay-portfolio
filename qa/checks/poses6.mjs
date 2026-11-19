import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pose=(p)=>p.evaluate(()=>[...document.querySelector("[data-companion]").querySelectorAll("img[data-pose]")].map(i=>[i.dataset.pose,+getComputedStyle(i).opacity]).filter(x=>x[1]>0.5).map(x=>x[0]).join(","));
const Y=(p,id,off=100)=>p.evaluate((id,off)=>document.getElementById(id).getBoundingClientRect().top+scrollY-off,id,off);
const order=await (async()=>{const p=await b.newPage();await p.goto("http://localhost:3100",{waitUntil:"networkidle2"});const o=await p.evaluate(()=>[...document.querySelectorAll("main > *")].map(e=>e.id||e.tagName.toLowerCase()+(e.getAttribute("aria-label")?"("+e.getAttribute("aria-label").slice(0,5)+")":"")));await p.close();return o})();
console.log("DOM section order:",order.join(" -> "));
const expected={experience:"typing",projects:"think",demos:"point",skills:"music",about:"music (continues Skills; About has no pose of its own)",contact:"wave"};
const seq=["experience","projects","demos","skills","about","contact"];
for (const [name,w,h] of [["desktop 1440",1440,900],["tablet 1024",1024,768]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h}); await p.goto("http://localhost:3100",{waitUntil:"networkidle2"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"}); await sleep(900);
  console.log(`\n[${name}] scrolling DOWN section by section`);
  for(const id of seq){ await p.evaluate(y=>scrollTo(0,y),await Y(p,id)); await sleep(800); console.log(`   ${id.padEnd(11)} pose=${(await pose(p)).padEnd(8)} expected ${expected[id]}`); }
  console.log(`[${name}] scrolling back UP`);
  for(const id of [...seq].reverse().slice(1)){ await p.evaluate(y=>scrollTo(0,y),await Y(p,id)); await sleep(800); console.log(`   ${id.padEnd(11)} pose=${(await pose(p)).padEnd(8)} expected ${expected[id]}`); }
  console.log(`[${name}] jumping straight to a section from the top (no stepping)`);
  for(const id of ["about","skills","demos"]){ await p.evaluate(()=>scrollTo(0,0)); await sleep(700); await p.evaluate(y=>scrollTo(0,y),await Y(p,id)); await sleep(900); console.log(`   top -> ${id.padEnd(8)} pose=${await pose(p)}`); }
  await p.close(); }
await b.close();

import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.goto("http://localhost:3100",{waitUntil:"networkidle2"});
const links=await p.evaluate(()=>[...document.querySelectorAll("a[href]")].map(a=>({href:a.getAttribute("href"),text:(a.textContent||a.getAttribute("aria-label")||"").trim().slice(0,40),target:a.target,rel:a.rel,vis:!!(a.offsetWidth||a.offsetHeight)})));
const ids=await p.evaluate(()=>[...document.querySelectorAll("[id]")].map(e=>e.id));
console.log("total anchors:",links.length);
const seen=new Set();
for(const l of links){
  const key=l.href; 
  if(l.href.startsWith("#")){ const id=l.href.slice(1); console.log(ids.includes(id)||id==="top"?"PASS":"FAIL","anchor",l.href,JSON.stringify(l.text)); continue; }
  if(seen.has(key)) {continue} seen.add(key);
  if(l.href.startsWith("mailto:")){console.log("INFO mailto",l.href);continue}
  try{ const r=await fetch(new URL(l.href,"http://localhost:3100"),{redirect:"follow",headers:{"user-agent":"Mozilla/5.0"}}); console.log(r.status===200?"PASS":"FAIL",r.status,l.href,JSON.stringify(l.text),"target="+l.target,"rel="+l.rel); }catch(e){console.log("FAIL",l.href,e.message)}
}
// external links safety
const bad=links.filter(l=>/^https?:/.test(l.href)&&(l.target!=="_blank"||!/noopener/.test(l.rel)));
console.log("external links missing target=_blank/rel=noopener:",bad.length);
// hidden-until-set buttons
console.log("resume link present:",links.some(l=>/resume/i.test(l.href+l.text)),"| linkedin present:",links.some(l=>/linkedin/.test(l.href)),"| mailto present:",links.some(l=>l.href.startsWith("mailto:")));
// click tests: nav + View my work land on right section
const land=async(label,sel)=>{ await p.evaluate(()=>{scrollTo(0,0); document.documentElement.style.scrollBehavior="auto"}); await sleep(500);
  await p.click(sel); await sleep(1200);
  const r=await p.evaluate(()=>({y:Math.round(scrollY)}));
  return r.y };
for (const [label,href,id] of [["View my work","a[href='#projects'].btn","projects"],["nav Experience","header a[href='#experience']","experience"],["nav Projects","header a[href='#projects']","projects"],["nav About","header a[href='#about']","about"],["nav Skills","header a[href='#skills']","skills"],["nav Contact","header a[href='#contact']","contact"]]) {
  await p.evaluate(()=>scrollTo(0,0)); await sleep(500);
  await p.click(sel(href)); 
  function sel(s){return s}
  await sleep(1500);
  const top=await p.evaluate(id=>Math.round(document.getElementById(id).getBoundingClientRect().top),id);
  console.log(Math.abs(top)<=110?"PASS":"FAIL",label,"->",id,"section top at",top+"px (nav is 56px)");
}
// interactive buttons
await p.evaluate(()=>scrollTo(0,0)); 
const tog=await p.evaluate(()=>{const b=document.querySelector("header button");const before=document.documentElement.className;b.click();return before});
await sleep(300); console.log("theme toggle:",(await p.evaluate(()=>document.documentElement.className))!==tog?"PASS":"FAIL");
await b.close();

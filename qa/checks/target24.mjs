import puppeteer from "puppeteer-core";
const url=process.argv[2]||"http://localhost:3100";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let anyBad=false;
for (const [w,h,m] of [[1440,900,false],[768,1024,false],[375,812,true],[320,700,true]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h,isMobile:m,hasTouch:m}); await p.goto(url,{waitUntil:"networkidle2",timeout:90000}); await sleep(1500);
  // let the lazy playground render so its controls exist
  await p.evaluate(()=>document.getElementById("playground")?.scrollIntoView()); await sleep(2500);
  const r=await p.evaluate(()=>{const sel='a[href],button,input,textarea,select,summary,[role=button],[tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll(sel)].filter(e=>!e.closest("[aria-hidden=true]")&&!e.classList.contains("skip-link")).map(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return{tag:e.tagName.toLowerCase(),label:(e.getAttribute("aria-label")||e.textContent||"").trim().replace(/\s+/g," ").slice(0,28),w:Math.round(r.width),h:Math.round(r.height),hidden:cs.visibility==="hidden"||cs.display==="none"||(r.width===0&&r.height===0)}}).filter(x=>!x.hidden)});
  const bad=r.filter(x=>x.w<24||x.h<24); if(bad.length) anyBad=true;
  const min=r.reduce((a,x)=>x.w*x.h<a.w*a.h?x:a,r[0]);
  console.log(`[${w}x${h}] ${r.length} interactive elements | below 24x24: ${bad.length}${bad.length?"  -> "+JSON.stringify(bad.slice(0,8)):""} | smallest: ${min.tag} "${min.label}" ${min.w}x${min.h}`);
  if(w===1440||w===375){ const groups={nav:r.filter((x,i)=>false)}; 
    const nav=await p.evaluate(()=>[...document.querySelectorAll("header nav ul a")].map(a=>{const r=a.getBoundingClientRect();return a.textContent+" "+Math.round(r.width)+"x"+Math.round(r.height)}));
    const chips=await p.evaluate(()=>[...document.querySelectorAll("#playground button.tag")].map(a=>{const r=a.getBoundingClientRect();return a.textContent.slice(0,14)+" "+Math.round(r.width)+"x"+Math.round(r.height)}));
    console.log("     nav links:",nav.join(" | ")); console.log("     SQL example chips:",chips.join(" | ")); }
  await p.close(); }
console.log(anyBad?"\nSOME BELOW 24x24":"\nALL AT LEAST 24x24");
await b.close();

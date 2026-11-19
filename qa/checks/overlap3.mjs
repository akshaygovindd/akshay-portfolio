import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SEL="a,button,p,h1,h2,h3,h4,li,label,textarea,input,figcaption,.overflow-auto,.card,figure,.tag,.btn,.title-wrap,span.font-display";
for (const [w,h,m] of [[1440,900,false],[1280,800,false],[1100,800,false],[1024,768,false],[768,1024,false],[640,900,false]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h,isMobile:m});
  await p.goto("http://localhost:3100",{waitUntil:"networkidle2"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"}); await sleep(700);
  const total=await p.evaluate(()=>document.documentElement.scrollHeight); const hits=[]; const shapeHits=[];
  for(let y=Math.ceil(h*0.85);y<=total-h+1;y+=Math.floor(h*0.35)){
    await p.evaluate(y=>scrollTo(0,y),y); await sleep(450);
    const r=await p.evaluate((SEL)=>{
      const c=document.querySelector("[data-companion]").getBoundingClientRect();
      const bad=[];const sh=[];
      for(const el of document.querySelectorAll(SEL)){
        if(el.closest("[data-companion]")||el.closest("header")||el.closest("[aria-hidden=true]")) continue;
        const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
        const ix=Math.min(r.right,c.right)-Math.max(r.left,c.left), iy=Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top);
        if(ix>1&&iy>1) bad.push(el.tagName+"."+(el.className+"").slice(0,24)+" '"+(el.textContent||"").trim().slice(0,22)+"'");
      }
      // decorative shapes vs real text blocks
      for(const s of document.querySelectorAll(".shape")){const a=s.getBoundingClientRect(); if(!a.width) continue;
        for(const el of document.querySelectorAll("p,h3,h4,li,a,.title-wrap")){ if(el.closest("[aria-hidden=true]")||el.closest("header")) continue; const r=el.getBoundingClientRect(); if(!r.width) continue;
          const ix=Math.min(r.right,a.right)-Math.max(r.left,a.left), iy=Math.min(r.bottom,a.bottom)-Math.max(r.top,a.top); if(ix>8&&iy>8) sh.push(s.className.split(" ")[1]+" over "+el.tagName+" '"+(el.textContent||"").trim().slice(0,20)+"'") } }
      return {bad,sh:[...new Set(sh)]};
    },SEL);
    if(r.bad.length) hits.push({y,r:r.bad.slice(0,3)}); if(r.sh.length) shapeHits.push({y,r:r.sh.slice(0,3)});
  }
  console.log(`${w}x${h}: avatar overlaps content: ${hits.length?hits.length+" positions "+JSON.stringify(hits.slice(0,2)):"none"} | shapes over text: ${shapeHits.length?JSON.stringify(shapeHits.slice(0,2)):"none"}`);
  await p.close();
}
await b.close();

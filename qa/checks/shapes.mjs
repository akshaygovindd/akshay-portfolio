import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for (const [w,h] of [[1920,1080],[1440,900],[1280,800],[1100,800],[1024,768],[900,800],[768,1024],[700,900],[640,900]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h}); await p.goto("http://localhost:3100",{waitUntil:"networkidle2"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"}); await sleep(600);
  const total=await p.evaluate(()=>document.documentElement.scrollHeight); const hits=new Set(); let checked=0;
  for(let y=0;y<=total;y+=Math.floor(h*0.3)){ await p.evaluate(y=>scrollTo(0,y),y); await sleep(350);
    const r=await p.evaluate(()=>{ const out=[]; const lineRects=el=>{const rs=[];const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(n);rs.push(...rg.getClientRects())}return rs};
      const shapes=[...document.querySelectorAll(".shape")].map(s=>({k:s.className.split(" ")[1],r:s.getBoundingClientRect()})).filter(s=>s.r.width&&s.r.bottom>0&&s.r.top<innerHeight);
      for(const el of document.querySelectorAll(".title-fill,section p,section h3,section h4,section li,section a")){ if(el.closest("[aria-hidden=true]")||el.closest("header")) continue;
        for(const lr of lineRects(el)){ if(!lr.width||!lr.height) continue; for(const s of shapes){ const ix=Math.min(lr.right,s.r.right)-Math.max(lr.left,s.r.left), iy=Math.min(lr.bottom,s.r.bottom)-Math.max(lr.top,s.r.top); if(ix>4&&iy>4) out.push(s.k+" over '"+(el.textContent||"").trim().slice(0,22)+"'") } } }
      return {out:[...new Set(out)],n:shapes.length}});
    checked+=r.n; r.out.forEach(x=>hits.add(x)); }
  console.log(`${w}x${h}: shape-vs-text glyph overlaps: ${hits.size?JSON.stringify([...hits]):"none"}  (shape sightings: ${checked})`);
  await p.close();
}
await b.close();

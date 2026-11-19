import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
console.log("viewport      sticky?  worst sticky card: top+height vs viewport    -> fits?");
for (const [w,h] of [[1440,700],[1440,780],[1440,789],[1440,790],[1440,800],[1440,900],[1920,1080],[1280,800],[1200,800],[1199,900],[1100,1000]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h}); await p.goto("http://localhost:3100",{waitUntil:"networkidle2"}); await new Promise(r=>setTimeout(r,500));
  const r=await p.evaluate(()=>{const c=[...document.querySelectorAll("[data-stack]")];const rows=c.map(a=>({pos:getComputedStyle(a).position,top:parseFloat(getComputedStyle(a).top)||0,h:a.getBoundingClientRect().height,t:a.querySelector("h3").textContent.slice(0,10)}));
    const sticky=rows.filter(x=>x.pos==="sticky"); const worst=sticky.sort((a,b)=>(b.top+b.h)-(a.top+a.h))[0];
    return{nSticky:sticky.length,worst:worst?{t:worst.t,bottom:Math.round(worst.top+worst.h)}:null,vh:innerHeight}});
  console.log(`${w}x${h}`.padEnd(13),(r.nSticky?`yes (${r.nSticky})`:"no (list)").padEnd(9), r.worst?`${r.worst.t.padEnd(11)} bottom at ${r.worst.bottom}px of ${r.vh}px`.padEnd(48):"".padEnd(48), r.worst?(r.worst.bottom<=r.vh?"fits":"CUT OFF"):"n/a"); await p.close(); }
await b.close();

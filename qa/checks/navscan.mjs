import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const p=await b.newPage(); await p.goto("http://localhost:3100",{waitUntil:"networkidle2"});
const bad=[]; let n=0, scrolling=[];
for (let w=320; w<=1600; w+=10) { await p.setViewport({width:w,height:800}); await new Promise(r=>setTimeout(r,40));
  const r=await p.evaluate(()=>{const ul=document.querySelector("header nav ul");const t=document.querySelector("header button").getBoundingClientRect();const logo=document.querySelector("header nav > a");const lr=getComputedStyle(logo).display!=="none"?logo.getBoundingClientRect():null;const ur=ul.getBoundingClientRect();
    return{toggleOk:t.right<=innerWidth&&t.left>=0,overlap:lr?lr.right>ur.left+1:false,scrolls:ul.scrollWidth>ul.clientWidth+1,over:document.documentElement.scrollWidth-innerWidth}});
  n++; if(!r.toggleOk||r.overlap||r.over>0) bad.push([w,r]); if(r.scrolls) scrolling.push(w); }
console.log(`scanned ${n} widths (320-1600px): problems at ${bad.length} widths`, bad.length?JSON.stringify(bad.slice(0,5)):"");
console.log("links scroll horizontally only at widths:",scrolling.length?`${scrolling[0]}-${scrolling[scrolling.length-1]}px`:"never");
await b.close();

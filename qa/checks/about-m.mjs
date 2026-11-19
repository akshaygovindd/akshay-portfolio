import puppeteer from "puppeteer-core"; import sharp from "sharp"; import fs from "fs";
const url=process.argv[2]; const tag=process.argv[3];
const b = await puppeteer.launch({executablePath:(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),headless:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for (const [w,h] of [[1440,900],[1024,768]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h}); await p.goto(url,{waitUntil:"networkidle2"}); await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"}); await sleep(900);
  // scroll so the whole About panel is on screen, fully revealed
  const y=await p.evaluate(()=>{const a=document.getElementById("about").getBoundingClientRect();return a.top+scrollY-70}); await p.evaluate(y=>scrollTo(0,y),y); await sleep(1400);
  const g=await p.evaluate(()=>{const R=e=>{const r=e.getBoundingClientRect();return{t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right)}};
    const sec=document.getElementById("about"); const title=sec.querySelector(".title-wrap"); const pitch=[...sec.querySelectorAll("p")].find(p=>p.classList.contains("font-semibold")); const edu=sec.querySelector("h3"); const seek=[...sec.querySelectorAll("p")].find(p=>p.textContent.includes("Seeking"));
    const cards=[...sec.querySelectorAll("li.card, .card")]; const last=cards[cards.length-1]; const cardTop=R(cards[0]).t;
    return{section:R(sec),title:R(title),pitch:R(pitch),edu:R(edu),seek:R(seek),lastCard:R(last),cardTop}});
  const png=await p.screenshot({type:"png"}); const {data,info}=await sharp(png).raw().toBuffer({resolveWithObject:true});
  // first/last "ink" rows: pixels clearly darker than the light panel background
  const ink=(x0,x1,y0,y1,from="top")=>{const rows=[];for(let y=y0;y<y1;y++){let hit=false;for(let x=x0;x<x1&&!hit;x++){const i=(y*info.width+x)*info.channels;if(data[i]<110&&data[i+1]<110&&data[i+2]<130)hit=true} rows.push(hit)} if(from==="top"){const k=rows.indexOf(true);return k<0?null:y0+k} const k=rows.lastIndexOf(true);return k<0?null:y0+k};
  const titleInkBottom=ink(g.title.l,g.title.l+400,g.title.t,g.title.b+10,"bottom");
  const pitchInkTop=ink(g.pitch.l,g.pitch.l+500,titleInkBottom+3,g.pitch.b);
  const eduInkTop=ink(g.edu.l,g.edu.l+160,g.edu.t-12,g.edu.b+6);
  const contentBottom=Math.max(g.seek.b,g.lastCard.b);
  console.log(`[${tag} ${w}x${h}] gap below title: ${pitchInkTop-titleInkBottom}px | education column top edge: label ink y=${eduInkTop}, first card/box top y=${g.cardTop} vs paragraph ink top y=${pitchInkTop} -> card offset ${g.cardTop-pitchInkTop}px | lowest content bottom y=${contentBottom} -> panel bottom y=${g.section.b} = bottom padding ${g.section.b-contentBottom}px`);
  await p.screenshot({path:`${new URL("../out/",import.meta.url).pathname}about-${tag}-${w}.png`}); await p.close(); }
await b.close();

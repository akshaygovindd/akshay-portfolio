import { site } from "../../config/site.ts";
const B="http://localhost:3100"; const html=await (await fetch(B+"/")).text();
const attr=(re)=>{const m=html.match(re);return m?m[1]:null};
const expectBase=process.argv[2]||"https://akshaygovind.vercel.app";
console.log("== head tags ==");
const rows=[
 ["canonical",          attr(/<link rel="canonical" href="([^"]+)"/),               expectBase],
 ["theme-color",        attr(/<meta name="theme-color" content="([^"]+)"/),          "#101014"],
 ["manifest link",      attr(/<link rel="manifest" href="([^"]+)"/),                 "/manifest.webmanifest"],
 ["apple-touch-icon",   attr(/<link rel="apple-touch-icon" href="([^"?]+)/),          "/apple-icon.png"],
 ["apple icon sizes",   attr(/<link rel="apple-touch-icon"[^>]*sizes="([^"]+)"/),     "180x180"],
 ["og:url",             attr(/<meta property="og:url" content="([^"]+)"/),           expectBase],
 ["og:image",           attr(/<meta property="og:image" content="([^"]+)"/),         expectBase+"/og.png"],
 ["twitter:image",      attr(/<meta name="twitter:image" content="([^"]+)"/),        expectBase+"/og.png"],
 ["title",              attr(/<title>([^<]+)<\/title>/)?.replace(/&amp;/g,"&"),      `${site.name} | ${site.title}`],
];
let bad=0; for(const [n,got,want] of rows){const ok=got===want; if(!ok)bad++; console.log(`  ${ok?"PASS":"FAIL"} ${n.padEnd(17)} ${got}${ok?"":"   (expected "+want+")"}`)}
console.log("\n== Person JSON-LD ==");
const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>m[1]);
console.log("  JSON-LD blocks on the page:",blocks.length);
let ld; try{ ld=JSON.parse(blocks[0]); console.log("  PASS parses as JSON"); }catch(e){ console.log("  FAIL does not parse:",e.message); process.exit(1) }
const chk=(n,ok,detail="")=>{ if(!ok)bad++; console.log(`  ${ok?"PASS":"FAIL"} ${n}${detail?"  "+detail:""}`)};
chk("@context + @type",ld["@context"]==="https://schema.org"&&ld["@type"]==="Person");
chk("name from config",ld.name===site.name,JSON.stringify(ld.name));
chk("jobTitle from config",ld.jobTitle===site.title,JSON.stringify(ld.jobTitle));
chk("url from NEXT_PUBLIC_SITE_URL",ld.url===expectBase,ld.url);
chk("alumniOf = config education",JSON.stringify(ld.alumniOf.map(a=>a.name))===JSON.stringify(site.about.education.map(e=>e.school))&&ld.alumniOf.every(a=>a["@type"]==="CollegeOrUniversity"),JSON.stringify(ld.alumniOf.map(a=>a.name)));
chk("sameAs = LinkedIn + GitHub",JSON.stringify(ld.sameAs)===JSON.stringify([site.links.linkedin,site.links.github]),JSON.stringify(ld.sameAs));
chk("sameAs are valid https URLs",ld.sameAs.every(u=>{try{return new URL(u).protocol==="https:"}catch{return false}}));
const skills=site.skills.flatMap(g=>g.skills); // labels such as "(coursework)" are kept
chk("knowsAbout covers every skill in config",[...new Set(skills)].every(s=>ld.knowsAbout.includes(s)),`${ld.knowsAbout.length} items`);
chk("knowsAbout: no duplicates, no empty, '(coursework)' labels KEPT",new Set(ld.knowsAbout).size===ld.knowsAbout.length&&ld.knowsAbout.every(s=>s.trim())&&ld.knowsAbout.filter(s=>/\(coursework\)/.test(s)).length===3,JSON.stringify(ld.knowsAbout.filter(s=>/coursework/.test(s))));
chk("no raw '<' inside the script block",!/</.test(blocks[0]));
console.log("\n  JSON-LD:",JSON.stringify(ld).slice(0,330)+"...");
console.log(`\n${bad?bad+" FAILURES":"ALL PASS"}`);

import fs from "fs";
for (const f of ["desktop","mobile"]) {
  const r=JSON.parse(fs.readFileSync(`lh-${f}.json`));
  const c=r.categories; console.log(f.toUpperCase(),Object.entries(c).map(([k,v])=>`${k}=${Math.round(v.score*100)}`).join("  "));
  const a=r.audits; console.log("  FCP",a["first-contentful-paint"].displayValue,"LCP",a["largest-contentful-paint"].displayValue,"TBT",a["total-blocking-time"].displayValue,"CLS",a["cumulative-layout-shift"].displayValue,"SI",a["speed-index"].displayValue);
  for (const [k,v] of Object.entries(c)) for (const ref of v.auditRefs) { const au=a[ref.id]; if(au.score!==null&&au.score<1&&ref.weight>0&&au.scoreDisplayMode!=="notApplicable"&&au.scoreDisplayMode!=="manual") console.log(`  [${k}] ${ref.id} score=${au.score} ${au.displayValue??""}`); }
}

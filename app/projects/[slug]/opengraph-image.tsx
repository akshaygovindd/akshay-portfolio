import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { PALETTE } from "@/lib/palette";

export const alt = "Case study social card with the project name";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Anton (OFL, see assets/fonts/Anton-OFL.txt) for the title, so the card matches the site headings.
const anton = await readFile(join(process.cwd(), "assets/fonts/Anton-Regular.ttf"));

export function generateStaticParams() {
  return site.caseStudies.map((s) => ({ slug: s.slug }));
}

/** Social card for /projects/[slug]: the site palette, the project name and what kind of project it was. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = site.caseStudies.find((s) => s.slug === slug);
  const project = site.projects.find((p) => "caseStudy" in p && p.caseStudy === slug);
  const title = project?.title ?? site.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PALETTE.ink,
          color: PALETTE.inkFg,
          padding: "64px 72px",
          borderLeft: `16px solid ${PALETTE.accentInk}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: PALETTE.accentInk, textTransform: "uppercase" }}>
          Case study
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: title.length > 32 ? 104 : 124, lineHeight: 1.02, textTransform: "uppercase" }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: PALETTE.inkMuted }}>{study?.context}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: PALETTE.inkMuted }}>
          <div style={{ display: "flex" }}>
            {site.name} · {site.title}
          </div>
          <div style={{ display: "flex", width: 72, height: 8, borderRadius: 4, background: PALETTE.warmInk }} />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Anton", data: anton, style: "normal", weight: 400 }] },
  );
}

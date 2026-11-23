import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { site, type Project } from "../config/site";
import { splitSection } from "./chunk";

export type Chunk = { hash: string; source: string; title: string; url: string; content: string };

const ROOT = process.cwd();

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hashOf = (c: Omit<Chunk, "hash">) =>
  crypto.createHash("sha256").update([c.source, c.url, c.title, c.content].join("\u0000")).digest("hex");

function make(source: string, title: string, url: string, body: string): Chunk[] {
  // The heading path is repeated at the top of every chunk so it embeds (and reads) with its context.
  return splitSection(body).map((part) => {
    const content = `${title}\n\n${part}`;
    return { hash: hashOf({ source, title, url, content }), source, title, url, content };
  });
}

/** Case studies: split on "## " headings. <Sources> blocks and JSX-only lines (diagrams, charts) are dropped. */
function caseStudies(): Chunk[] {
  const out: Chunk[] = [];
  for (const cs of site.caseStudies) {
    const project = site.projects.find((p) => p.caseStudy === cs.slug);
    const name = project?.title ?? cs.slug;
    let text = fs.readFileSync(path.join(ROOT, "content/case-studies", `${cs.slug}.mdx`), "utf8");
    text = text.replace(/<Sources>[\s\S]*?<\/Sources>/g, "");
    text = text.replace(/^<(Diagram|Figure|ImportanceChart)\b[^>]*\/>\s*$/gm, "");
    for (const section of text.split(/^## /m).slice(1)) {
      const nl = section.indexOf("\n");
      const heading = section.slice(0, nl).trim();
      out.push(
        ...make(`case-study:${cs.slug}`, `${name} case study: ${heading}`, `/projects/${cs.slug}#${slugify(heading)}`, section.slice(nl)),
      );
    }
  }
  return out;
}

/** config/site.ts: project cards, the experience blocks, the About hobbies line, the skills groups and the tools list. */
function siteText(): Chunk[] {
  const out: Chunk[] = [];
  for (const p of site.projects as readonly Project[]) {
    const lines = [
      p.label && `Context: ${p.label}`,
      p.summary,
      p.impact,
      `Tech: ${p.tags.join(", ")}`,
      ...(p.facts ?? []).map((f) => `- ${f}`),
      ...(p.highlights ?? []).map((h) => `- ${h.title}: ${h.text}`),
      ...(p.stats ?? []).map((s) => `- ${s.value} ${s.label}`),
      p.inProgress && `In progress: ${p.inProgress}`,
    ].filter(Boolean) as string[];
    out.push(...make(`site:project:${slugify(p.title)}`, `Project: ${p.title}`, "/#projects", lines.join("\n")));
  }
  const w = site.work;
  const lines = [`${w.role} at ${w.company}, ${w.location} (${w.dates}).`];
  for (const b of w.blocks) lines.push(`- ${b.title} (${b.value}): ${b.description}${b.tag ? ` ${b.tag}.` : ""}`);
  out.push(...make("site:experience", `Experience: ${w.role}, ${w.company}`, "/#experience", lines.join("\n")));
  // About: the line about life outside work, as its own small chunk so it matches "what does Akshay do outside work?".
  out.push(...make("site:about:hobbies", "About: outside work", "/#about", site.about.hobbies));
  // Skills groups (one chunk each) and the tools list, so "has he used X" questions can be answered.
  // Entries marked "(coursework)" keep that label: the assistant must not present them as work experience.
  for (const g of site.skills)
    out.push(...make(`site:skills:${slugify(g.category)}`, `Skills: ${g.category}`, "/#skills", `${g.category}: ${g.skills.join(", ")}.`));
  out.push(...make("site:tools", "Tools and technologies", "/#skills", `Tools and technologies: ${site.tools.join(", ")}.`));
  return out;
}

/** Resume PDF text. Split on the ALL-CAPS section headings, and the PROJECTS section per project. */
async function resume(): Promise<Chunk[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(ROOT, "public/resume.pdf"))) }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    for (const it of c.items) if ("str" in it) text += it.str + (it.hasEOL ? "\n" : " ");
  }
  const lines = text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

  // Drop the header block (name + contact line + summary stays): the contact line holds a phone number
  // and e-mail, which the assistant must not repeat; the public contact links live on the site itself.
  const body = lines.filter((l) => !/\d{3}-\d{3}-\d{4}/.test(l));

  const sections: { name: string; lines: string[] }[] = [{ name: "Summary", lines: [] }];
  for (const l of body) {
    if (/^(EDUCATION|SKILLS|EXPERIENCE|PROJECTS)$/.test(l)) sections.push({ name: l[0] + l.slice(1).toLowerCase(), lines: [] });
    else sections[sections.length - 1].lines.push(l);
  }

  const out: Chunk[] = [];
  for (const s of sections) {
    if (!s.lines.length) continue;
    if (s.name === "Projects") {
      // a project starts at the line that is followed by a tech line ending in "GitHub" (or "Live Demo")
      const groups: string[][] = [];
      s.lines.forEach((l, i) => {
        if (/GitHub( \| Live Demo)?$/.test(s.lines[i + 1] ?? "")) groups.push([l]);
        else (groups[groups.length - 1] ??= []).push(l);
      });
      for (const g of groups) out.push(...make("resume", `Resume: project ${g[0]}`, "/resume.pdf", g.join("\n")));
    } else {
      out.push(...make("resume", `Resume: ${s.name}`, "/resume.pdf", s.lines.join("\n")));
    }
  }
  return out;
}

export async function buildCorpus(): Promise<Chunk[]> {
  const all = [...caseStudies(), ...siteText(), ...(await resume())];
  // identical content at the same place would collide on the primary key
  return [...new Map(all.map((c) => [c.hash, c])).values()];
}

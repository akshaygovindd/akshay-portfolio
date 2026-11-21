// Keeps the accent system to one purple and one orange (plus their light-theme twins): the tokens in app/globals.css must match
// lib/palette.ts, and no other colour literal may appear in the source.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PALETTE } from "./palette";

const css = fs.readFileSync("app/globals.css", "utf8");
const hex = (rgb: string) => "#" + rgb.trim().split(/\s+/).map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
const token = (name: string, block = ":root") => {
  const b = css.slice(css.indexOf(`${block} {`));
  const m = new RegExp(`--${name}:\\s*([0-9 ]+);`).exec(b.slice(0, b.indexOf("}")));
  assert.ok(m, `token --${name} in ${block}`);
  return m![1];
};

test("the CSS tokens and lib/palette.ts say the same thing", () => {
  assert.equal(hex(token("ink")), PALETTE.ink);
  assert.equal(hex(token("ink-fg")), PALETTE.inkFg);
  assert.equal(hex(token("ink-muted")), PALETTE.inkMuted);
  assert.equal(hex(token("ink-border")), PALETTE.inkBorder);
  assert.equal(hex(token("ink-surface")), PALETTE.inkSurface);
  assert.equal(hex(token("accent-ink")), PALETTE.accentInk);
  assert.equal(hex(token("warm-ink")), PALETTE.warmInk);
});

test("dark mode uses the same purple and orange as the always-dark surfaces", () => {
  assert.equal(token("accent", ".dark"), token("accent-ink"));
  assert.equal(token("warm", ".dark"), token("warm-ink"));
  assert.equal(token("bg", ".dark"), token("ink"));
  assert.equal(token("fg", ".dark"), token("ink-fg"));
  assert.equal(token("muted", ".dark"), token("ink-muted"));
  assert.equal(token("border", ".dark"), token("ink-border"));
  assert.equal(token("surface", ".dark"), token("ink-surface"));
});

const files: string[] = [];
const walk = (d: string) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?|css|mdx)$/.test(f.name)) files.push(p);
  }
};
["app", "components", "config", "lib", "content"].forEach(walk);
files.push("mdx-components.tsx", "tailwind.config.ts");

test("no hex colour literal outside lib/palette.ts (comments excluded)", () => {
  const bad: string[] = [];
  for (const f of files) {
    if (f === "lib/palette.ts") continue;
    const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of src.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-zA-Z-])/g)) {
      if (f === "config/site.ts" && m[0].toUpperCase() === PALETTE.ink) continue; // the meta theme-color, pinned by the next test
      if (/^#(000|fff)(000|fff)?$/i.test(m[0])) continue; // plain black and white (mask gradients, shadows) are not brand colours
      bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("the accent purple and orange are never written as raw rgb triples outside their tokens", () => {
  const bad: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of src.matchAll(/rgb\((155 122 255|255 155 85|109 66 230|168 64 10)\b/g)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test("the favicon uses the palette's colours", () => {
  const svg = fs.readFileSync("app/icon.svg", "utf8").toUpperCase();
  const colours = new Set([...svg.matchAll(/#[0-9A-F]{6}\b/g)].map((m) => m[0]));
  assert.deepEqual([...colours].sort(), [PALETTE.accentInk, PALETTE.ink].sort());
});

test("the meta theme-color in config/site.ts is the palette's ink", () => {
  const m = /themeColor:\s*"(#[0-9a-fA-F]{6})"/.exec(fs.readFileSync("config/site.ts", "utf8"));
  assert.ok(m);
  assert.equal(m![1].toUpperCase(), PALETTE.ink);
});

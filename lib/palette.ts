/**
 * The site's brand colours in hex, for the few places that cannot read CSS variables (the generated Open Graph image,
 * the theme-color meta tag). Everything else uses the CSS variables in app/globals.css (Tailwind: bg-accent,
 * text-ink-accent ...). lib/palette.test.mts checks that these match the variables and that no other colour literal
 * has crept into the source.
 */
export const PALETTE = {
  /** Always-dark surfaces: hero, nav, footer, tools chips. */
  ink: "#101014",
  inkFg: "#F3F1F7",
  inkMuted: "#B4B1BE",
  inkBorder: "#34323D",
  inkSurface: "#19191F",
  /** The one purple and the one orange, as they look on dark surfaces. */
  accentInk: "#9B7AFF",
  warmInk: "#FF9B55",
} as const;

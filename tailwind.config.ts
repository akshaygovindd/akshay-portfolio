import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
    "./mdx-components.tsx",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        warm: "rgb(var(--warm) / <alpha-value>)",
        // Always-dark surfaces (hero, nav) that stay dark in light mode too
        // (values live in app/globals.css; lib/palette.ts mirrors them for the Open Graph image)
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          fg: "rgb(var(--ink-fg) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          border: "rgb(var(--ink-border) / <alpha-value>)",
          surface: "rgb(var(--ink-surface) / <alpha-value>)",
          accent: "rgb(var(--accent-ink) / <alpha-value>)",
          warm: "rgb(var(--warm-ink) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

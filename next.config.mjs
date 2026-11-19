const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 * - script-src: 'unsafe-inline' is needed for Next.js's own bootstrap scripts and the theme script
 *   from next-themes (a nonce-based policy would force every page to render dynamically).
 *   'wasm-unsafe-eval' lets DuckDB-WASM compile its WebAssembly module, and cdn.jsdelivr.net is
 *   where the DuckDB worker script is imported from (blob workers inherit this policy).
 * - connect-src: 'self' also covers Vercel Analytics / Speed Insights (/_vercel/...);
 *   jsDelivr is where the DuckDB .wasm file is fetched from.
 * - Fonts are self-hosted by next/font; the og image and project screenshots are same-origin.
 * The CSP is production-only because `next dev` needs eval and websockets for hot reload.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Vercel serves HTTPS only, so this is a safety net there. Left out locally because Safari/WebKit
  // also upgrades http://localhost to https, which breaks testing `next start` on this machine.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The QA runner builds into its own folder so it never fights a running `next dev` over .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

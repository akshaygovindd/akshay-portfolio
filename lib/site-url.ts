/**
 * The ONE place the site's public URL is resolved. Everything that needs an absolute URL
 * (metadataBase, canonical, robots, sitemap, JSON-LD, social images) imports from here.
 *
 * To move to a custom domain later, change NEXT_PUBLIC_SITE_URL in .env.production
 * (or in the Vercel project's environment variables). Nothing else needs to change.
 */
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const SITE_URL = (fromEnv ?? fromVercel ?? "http://localhost:3000").replace(/\/+$/, "");

/** Absolute URL for a site path, e.g. absoluteUrl("/og.png"). */
/** (The root returns the bare origin, matching the canonical URL exactly.) */
export const absoluteUrl = (path = "/") =>
  path === "/" ? SITE_URL : new URL(path, `${SITE_URL}/`).toString();

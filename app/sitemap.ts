import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

// Single-page site: one URL. (lastModified is the build time.)
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}

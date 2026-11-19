import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/site-url";

// The home page plus one case-study page per project. (lastModified is the build time.)
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    ...site.caseStudies.map((s) => ({
      url: absoluteUrl(`/projects/${s.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

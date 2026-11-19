import { site } from "@/config/site";
import { SITE_URL } from "@/lib/site-url";

/**
 * schema.org Person for search engines. Everything comes from config/site.ts (so it follows
 * later positioning changes) and the site URL from NEXT_PUBLIC_SITE_URL, nothing is hard-coded.
 */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.title,
    description: site.description,
    url: SITE_URL,
    alumniOf: site.about.education.map((e) => ({
      "@type": "CollegeOrUniversity",
      name: e.school,
    })),
    sameAs: [site.links.linkedin, site.links.github].filter(Boolean),
    // Labels such as "Tableau (coursework)" are kept, so the markup is as honest as the page.
    knowsAbout: [...new Set(site.skills.flatMap((g) => g.skills))],
  };
}

export default function PersonJsonLd() {
  // "<" is escaped so no config value can ever close the script tag early.
  const json = JSON.stringify(personJsonLd()).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

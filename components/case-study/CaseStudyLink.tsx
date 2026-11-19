"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/** "Read case study" button on a project card. Records a case_study_click event. */
export default function CaseStudyLink({ slug, project }: { slug: string; project: string }) {
  return (
    <Link
      href={`/projects/${slug}`}
      className="btn"
      onClick={() => trackEvent("case_study_click", { project, slug })}
    >
      Read case study <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

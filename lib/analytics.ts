import { track } from "@vercel/analytics";

/** Custom events recorded in Vercel Web Analytics. */
export type EventName =
  | "resume_download"
  | "sql_query_run"
  | "project_github_click"
  | "live_demo_click"
  | "case_study_click";

/** Never throws, and does nothing when analytics isn't loaded (local dev, blocked by an extension). */
export function trackEvent(name: EventName, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props);
  } catch {
    /* analytics must never break the page */
  }
}

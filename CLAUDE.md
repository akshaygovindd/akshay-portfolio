# Portfolio: working notes for Claude

Akshay Govind's personal portfolio. Live at https://akshaygovind.vercel.app, auto-deployed by Vercel from `main` of github.com/akshaygovindd/akshay-portfolio. Also read `AGENTS.md`: this Next.js has breaking changes, so check `node_modules/next/dist/docs/` before writing Next code.

## Working rules (from Akshay: follow exactly)
- **Verify every fact against the repos** before putting it on the site: jobpulse, FoodLens-Databricks-Pipeline, emergency-response-agents, Wildfire-Cause-Prediction, instacart-sql-analytics (all under github.com/akshaygovindd; clone to the scratchpad to check). **Never invent numbers.** Say what could not be verified. If a claim is stronger than the evidence, weaken the wording (e.g. "Gold MERGE", not "MERGE loads").
- **Run the full regression (`npm run qa`) before asking to commit.** Report real results, including failures.
- **Never commit or push until Akshay approves** ("don't commit until I approve"). Commit messages end with the Co-Authored-By line from the session.
- Keep the dev server running on http://localhost:3000. QA builds into `.next-qa` on :3100, so it does not disturb it.
- Fix only clear bugs. List other findings for Akshay to decide. **Do not change the design without asking.**
- No visible TODO or placeholder text on the site. Unknown values stay hidden until set (e.g. `availability.dates`).

## Stack
Next.js 16.4 (App Router, Turbopack; `next lint` is gone, so `npm run lint` = `eslint .` with the ESLint 9 flat config), React 19.3, TypeScript 5.7 strict, Tailwind 3.4, next-themes (dark default, light toggle), GSAP 3.15 + ScrollTrigger, DuckDB-WASM 1.32.0 (jsDelivr bundles, blob worker), lucide-react, next/font (Anton, Inter, JetBrains Mono), Vercel Analytics + Speed Insights (rendered only when `process.env.VERCEL === "1"`).

## Where things live
- **All content: `config/site.ts`** (titles, hero, roles, experience, projects and their facts/stats, skills, tools marquee, education, links, availability, resume date). Edit content there, not in components.
- `components/sections/*` render sections in order: Hero, Tools marquee, Experience, Projects, Demos (SQL playground + FoodLens pipeline), Skills, About, Contact.
- `components/Companion.tsx` (scroll avatar), `ScrollEffects.tsx` (curtains, stacking cards), `ScrollTitle.tsx`, `FloatingShapes.tsx`, `CopyEmailButton.tsx`, `PersonJsonLd.tsx`, `TrackedLink.tsx` (+ `lib/analytics.ts` events: resume_download, sql_query_run, project_github_click, live_demo_click; keep them).
- `lib/availability.ts` (Contact availability line: dates · location, or just location), `lib/duckdb.ts`, `lib/site-url.ts`.
- `public/`: `resume.pdf`, `og.png` (1200x630; regenerate when positioning text changes), `avatar/`, `projects/`, `icons/`, `data/sample.csv`.
- `next.config.mjs`: security headers + CSP (`upgrade-insecure-requests` only on Vercel; it breaks WebKit on http://localhost) and the `NEXT_DIST_DIR` override used by QA.

## NEXT_PUBLIC_SITE_URL rule
Every absolute URL (canonical, Open Graph, Twitter, sitemap, robots, JSON-LD, manifest) must come from `NEXT_PUBLIC_SITE_URL` via `lib/site-url.ts` (value in `.env.production`). Never hardcode the domain, so a custom-domain switch changes that one value only.

## Companion / avatar rules
- One fixed avatar: large in the hero, scrubbed by GSAP into the bottom-right corner on scroll. Phones: avatar sits bottom-right in the hero (width 56vw, max 380) and is hidden after the hero.
- Pose follows the last section whose top passed 60% of the viewport: experience = typing, projects = think, demos = point, skills = music, about = music (no pose of its own), contact = wave. Hero idles; no idle coffee, no click behaviour.
- Content must never sit under the corner avatar: `.section` / `.gutter` keep a right gutter. `prefers-reduced-motion` disables the scroll animation.
- Stacking project cards are sticky only at >= 1200px wide and >= 790px tall (last card scrolls normally); otherwise a plain list. Interactive targets are >= 44px (never below 24px).
- Layout must not shift: the SQL playground reserves its result height (CLS 0, including jumping straight to Contact).

## Design
Palette: bg `#101014`, surface `#19191F`, text `#F3F1F7`, muted `#B4B1BE`, accent violet `#9B7AFF`, warm orange `#FF9B55` (sparingly), border `#34323D`. Hero and nav stay dark in light mode (`ink` tokens). Anton uppercase display headings, Inter body, JetBrains Mono for labels. Outline-to-fill scroll titles, numbered Experience, curtain panels, marquee. Clean and minimal.

## QA (`npm run qa`)
One-time: `npm run qa:install` (installs `qa/` deps and Playwright WebKit; needs Google Chrome, or set `CHROME_PATH`). Then `npm run qa` builds into `.next-qa`, serves it on :3100 and runs everything: tsc, ESLint, npm audit, Lighthouse desktop + mobile, axe in both themes, CLS incl. jump-to-Contact, avatar overlap and poses, shapes vs text, stacking fit, nav at 129 widths, 24px targets, links, SEO/JSON-LD, content + Copy email, WebKit + CSP + DuckDB. Options: `-- --skip-build`, `-- --only=lighthouse,poses`. Raw output goes to `qa/out/` (git-ignored); exit code 1 on any failure. LinkedIn (HTTP 999) and sleeping Streamlit demos show as warnings, not failures. Checks read text in the page (e.g. the pitch and seeking line), so update `qa/checks/content9.mjs` when copy changes on purpose.

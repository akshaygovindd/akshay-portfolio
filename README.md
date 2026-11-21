# Akshay Govind: portfolio

[![CI](https://github.com/akshaygovindd/akshay-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/akshaygovindd/akshay-portfolio/actions/workflows/ci.yml)
[![Link check](https://github.com/akshaygovindd/akshay-portfolio/actions/workflows/links.yml/badge.svg)](https://github.com/akshaygovindd/akshay-portfolio/actions/workflows/links.yml)

Live: **https://akshaygovind.vercel.app**. Auto-deployed by Vercel from `main`.

**Data Engineer · Data Analyst · AI Engineer.** This is the site I use to show data engineering, analytics and applied AI work: the RAG assistant and English-to-SQL, both with evals. It is a case study in itself: besides the project pages, it has two things you can use in the browser, a SQL playground and an assistant that answers questions about my work with sources. Every number on the site is checked against the project repositories, and the rule for this README is the same: each number below links to the file it comes from.

## What is on it

- A one-page portfolio (hero, experience, projects, demos, skills, about, contact) with scroll animation, a dark and a light theme, and a reduced-motion mode.
- Six project cards. Five have a case study page at `/projects/<slug>` (text in [`content/case-studies/`](content/case-studies), page metadata in [`config/site.ts`](config/site.ts)); JobPulse has none yet. "Ask my portfolio" is one of the five.
- **SQL playground** (Demos): DuckDB runs in your browser on a 873-row synthetic sample ([`public/data/sample.csv`](public/data/sample.csv)).
- **Ask my portfolio**: a retrieval assistant that answers from my own content and cites the section each sentence came from.

All content (titles, projects, facts, links) lives in [`config/site.ts`](config/site.ts), not in the components.

## Architecture

| Part | How it works | Where |
|---|---|---|
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind 3.4, GSAP + ScrollTrigger, MDX for case studies | [`app/`](app), [`components/`](components), [`content/`](content) |
| SQL playground | DuckDB-WASM 1.32.0 in a worker. The shell is in the page bundle; the engine loads when the section scrolls into view. Share links (`?q=`) only fill the editor and never run. Results of 50 rows or fewer can be shown as bar charts, with no chart library. | [`components/interactive/SqlPlayground.tsx`](components/interactive/SqlPlayground.tsx), [`lib/duckdb.ts`](lib/duckdb.ts), [`lib/share.ts`](lib/share.ts), [`lib/chart.ts`](lib/chart.ts) |
| English to SQL | The browser sends only the question to `/api/sql`. The server builds the schema prompt from the CSV, asks `gpt-5.4-mini` for one `SELECT`/`WITH` (or `REFUSE`), and a hand-written validator rejects anything else. The SQL goes into the editor as text and never runs by itself. | [`app/api/sql/route.ts`](app/api/sql/route.ts), [`sqlgen/`](sqlgen) |
| Ask my portfolio (RAG) | Corpus: the case studies, the project and experience text, and the resume. Chunks are embedded with `text-embedding-3-small` and stored in Postgres with pgvector (Neon). A question gets the top 5 chunks by cosine similarity plus a keyword fallback for exact tool names. If nothing scores at least 0.25 ([`rag/answer.ts`](rag/answer.ts)) the model is never called. `gpt-5.4-mini` answers from the chunks only and each `[n]` links to its section. | [`rag/`](rag), [`app/api/ask/route.ts`](app/api/ask/route.ts), [`scripts/ingest.mts`](scripts/ingest.mts) |
| Limits | 10 requests an hour per hashed IP and 200 a day over everything, stored in the `rate_limits` table. No question text is stored. | [`rag/ratelimit.ts`](rag/ratelimit.ts) |
| Hosting | Vercel. Analytics and Speed Insights render only on Vercel. Security headers and the CSP are set in [`next.config.mjs`](next.config.mjs). | |

The write-up of the assistant is on the site at `/projects/ask-my-portfolio`.

## Evals

Both evals are run by hand (they call OpenAI), and the raw output is saved as dated files that I never overwrite. The model's output is sampled, so the SQL eval reports the median of 3 runs.

**Ask my portfolio** ([`eval/run.mts`](eval/run.mts), questions in [`eval/questions.jsonl`](eval/questions.jsonl), 38 questions plus 6 prompts that must be refused in [`eval/refusals.jsonl`](eval/refusals.jsonl)). Latest run: [`eval/results-2026-11-20.md`](eval/results-2026-11-20.md).

| Measure | Result | File |
|---|---|---|
| Vector top-5 contains an expected source (hit@5) | 38 of 38 | [`results-2026-11-20.md`](eval/results-2026-11-20.md) |
| Answer cites an expected source | 38 of 38 | same |
| Every cited source is an expected one (strict) | 30 of 38 (79%) | same |
| Off-topic and injection prompts refused | 6 of 6 (4 stopped by the similarity gate) | same |

The questions were written by me, the expected sources are my own list, and the eval does not check whether each sentence is true to its sources. [`results-2026-11-19.md`](eval/results-2026-11-19.md) holds the first run (35 questions: hit@5 35 of 35, strict 29 of 35), the run before a keyword-fallback fix, and the index listings.

**English to SQL** ([`eval/sql-run.mts`](eval/sql-run.mts), 21 questions with reference queries in [`eval/sql-questions.jsonl`](eval/sql-questions.jsonl), of which 20 are scored, plus 5 prompts that must be refused in [`eval/sql-refusals.jsonl`](eval/sql-refusals.jsonl)). Generated and reference queries both run in DuckDB and the results are compared ([`eval/compare.mts`](eval/compare.mts), unit tested). Medians of 3 runs, from [`eval/sql-results-2026-11-20.md`](eval/sql-results-2026-11-20.md), against the same eval before one table-grain sentence was added to the prompt ([`eval/sql-results-2026-11-20-before.md`](eval/sql-results-2026-11-20-before.md)):

| Median of 3 runs | Before | After |
|---|---|---|
| Clear questions, strict | 15 of 15 | 15 of 15 |
| Hard questions, strict | 1 of 5 | 2 of 5 |
| Hard questions, lenient (extra columns allowed) | 2 of 5 | 3 of 5 |
| Overall, strict | 16 of 20 | 17 of 20 |
| Overall, lenient | 17 of 20 | 18 of 20 |
| Prompts that must be refused, stopped | 5 of 5 | 5 of 5 |

Twenty scored questions is a small sample, and the hard set is only five. Read these as a direction, not a precise rate. The questions and reference queries were drafted by Claude and reviewed by me.

## Quality checks

Two layers:

1. **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) on every push and pull request to `main`: `npm ci`, `tsc`, ESLint, the unit tests, `next build`, then Lighthouse CI (median of 3 runs, mobile and desktop) on the home page, one case study and the 404 page. The home page and the case study must score 1.00 for accessibility, best practices and SEO; performance is an error below 0.90 and a warning below 0.95 (shared runners are slower than a laptop). The 404 page is checked for performance and accessibility only. CI uses no secrets and no paid services.
2. **Local full regression**, `npm run qa` ([`qa/`](qa)): builds into `.next-qa`, serves it on port 3100 and runs one check script per area (about 20 in [`qa/checks/`](qa/checks)). Among them: Lighthouse on every page (performance at least 95), axe in both themes, layout shift including a jump straight to Contact, avatar overlap, navigation at many widths, 24 px tap targets, links, SEO and JSON-LD, case-study pages, the 404 page, hash links, the SQL playground, a mocked and one live assistant call, and WebKit with the CSP. Raw output goes to `qa/out/` (git-ignored). It needs Google Chrome, so it is not part of CI.

Server errors (the two API routes) are monitored through Vercel runtime logs; there is no browser error-tracking service.

A scheduled workflow ([`.github/workflows/links.yml`](.github/workflows/links.yml)) checks the live site and the Markdown files with lychee every Monday and opens or updates one GitHub issue if links break. It skips LinkedIn and sleeping demo apps, which answer bots with errors even when the link works.

Unit tests (`npm run test:unit`): the SQL validator, share links, the comparison logic of the SQL eval, and the palette guard that fails on a stray hex colour.

## Run it locally

Needs Node.js 22 or newer.

```bash
npm ci
npm run dev          # http://localhost:3000
```

The site, the playground and the case studies work without any keys. The assistant and English-to-SQL need the variables below.

| Command | What it does |
|---|---|
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (flat config) |
| `npm run test:unit` | Unit tests |
| `npm run qa:install`, then `npm run qa` | One-time install of the QA tools, then the full regression (needs Google Chrome, or set `CHROME_PATH`) |
| `npm run rag:schema` | Apply the pgvector schema |
| `npm run rag:ingest` | Re-embed changed chunks (run after any content change) |
| `npm run rag:eval`, `npm run sql:eval -- --runs=3` | The two evals (they call OpenAI) |

### Environment variables (names only)

| Name | Used for | Where it is set |
|---|---|---|
| `OPENAI_API_KEY` | Assistant answers, embeddings, English-to-SQL | `.env.local`; Vercel production |
| `DATABASE_URL` | Neon Postgres (vectors and rate limits) | `.env.local`; Vercel production |
| `RATE_LIMIT_SALT` | Hashing client IPs for the rate limit | `.env.local`; Vercel production |
| `NEXT_PUBLIC_SITE_URL` | Every absolute URL (canonical, Open Graph, sitemap, JSON-LD) | [`.env.production`](.env.production), committed |

## Licence and fonts

Anton (headings) is under the SIL Open Font License, see [`assets/fonts/Anton-OFL.txt`](assets/fonts/Anton-OFL.txt). The site code has no licence file yet.

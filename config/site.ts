/**
 * ============================================================
 *  ALL EDITABLE SITE CONTENT LIVES IN THIS FILE.
 *  Search for "TODO" to find everything that still needs your input.
 * ============================================================
 */

export type Project = {
  title: string;
  /** One-line description of what it is */
  summary: string;
  /** Optional second line under the summary */
  impact?: string;
  tags: string[];
  githubUrl: string;
  /** One-line verified facts shown as a short list (keep each to one line). */
  facts?: string[];
  /** Adds a "Live demo" button. */
  liveUrl?: string;
  /** Small note under the Live demo button (e.g. free-tier apps that sleep). */
  liveNote?: string;
  /** A "Try it" button that scrolls to a section of this site (instead of an external Live demo). */
  tryIt?: { href: string; label: string };
  /** Small label above the title (e.g. the course a project was built for). */
  label?: string;
  /** Things that are not built yet. Shown as "In progress: ...". */
  inProgress?: string;
  /** Short highlights shown as a strip along the bottom of the card (facts verified against the repo). */
  highlights?: { title: string; text: string }[];
  /** Big verified numbers on the card. Only use figures that appear in your resume. */
  stats?: { value: string; label: string }[];
  /** Slug of this project's case study (see `caseStudies` below). Adds a "Read case study" link. */
  caseStudy?: string;
  /**
   * Optional screenshot for the card's image area. Put the file in /public (e.g.
   * "/projects/foodlens.webp"). Until you add one, a gradient placeholder is shown.
   */
  image?: { src: string; alt: string; /** Intrinsic pixel size of the file, so the browser reserves its space before it loads (no layout shift). */ width: number; height: number };
};

/** Page-level details for /projects/[slug]. The text itself is in content/case-studies/[slug].mdx. */
export type CaseStudy = {
  slug: string;
  /** <title> of the page (the site name is added in the layout title template). */
  metaTitle: string;
  /** Meta description and social card text (under 160 characters). */
  description: string;
  /** One line under the title: what kind of project it was. */
  context: string;
  /** Which architecture diagram the page uses (see config/diagrams.ts). */
  diagram: "pipeline" | "emergency" | "instacart" | "wildfire" | "ask";
};

export type WorkBlock = {
  /** Large headline number/statement */
  value: string;
  /** Short title under it */
  title: string;
  description: string;
  /** Optional highlighted tag */
  tag?: string;
};

export type SkillGroup = { category: string; skills: string[] };

export const site = {
  name: "Akshay Govind",
  title: "Data Engineer, Data Analyst & AI Engineer",
  /** Used for the meta description, Open Graph / Twitter cards and the web manifest. */
  description:
    "Data Engineer, Data Analyst & AI Engineer building the data pipelines analytics and AI run on. MS Information Systems at Northeastern, open to co-ops.",
  /** Theme colour for the browser UI, the web manifest and splash screens. */
  themeColor: "#101014",
  pitch:
    "I make messy data reliable enough for dashboards and for LLMs: tested, documented and monitored.",

  /** Badges in the scrolling tools marquee under the hero. */
  tools: [
    "SQL",
    "Python",
    "Pandas",
    "Power BI",
    "Tableau (coursework)",
    "Databricks",
    "Snowflake (coursework)",
    "dbt",
    "AWS S3",
    "PostgreSQL",
    "OpenAI Agents SDK",
    "LLM extraction",
  ],

  hero: {
    label: "AKSHAY GOVIND / PORTFOLIO",
    badge: "OPEN TO CO-OP & INTERNSHIPS",
    subheadline: "I build the data pipelines that analytics and AI run on.",
    roles: "Data Engineer · Data Analyst · AI Engineer",
    credentials:
      "MS Information Systems @ Northeastern University · Dec\u00A02027 · 2+ yrs BI experience",
    /** Small secondary link under the credentials; scrolls to the SQL playground. */
    sqlLink: "Run SQL in your browser \u2192",
  },

  work: {
    role: "Business Intelligence Analyst",
    company: "Vaishnav Publications and Digitalization",
    location: "Pune, India",
    dates: "Jan 2023 – Apr 2025",
    blocks: [
      {
        value: "4 hrs → under 30 min",
        title: "Reporting automation",
        description:
          "Automated a manual weekly SQL/Python reporting workflow for the Operations team, cutting preparation time from 4 hours to under 30 minutes.",
        tag: "87.5%+ time reduction",
      },
      {
        value: "8+",
        title: "Power BI dashboards",
        description:
          "Designed and maintained 8+ Power BI dashboards and status reports, giving leadership stakeholders clear visibility into KPI performance and progress.",
      },
      {
        value: "10,000+ rows",
        title: "Data quality and reconciliation",
        description:
          "Performed data quality checks and reconciled report outputs against source data to resolve integrity issues across a 10,000+ row multi-client dataset.",
      },
    ] satisfies WorkBlock[],
  },

  links: {
    github: "https://github.com/akshaygovindd",
    // Leave a value as "" and its button is hidden from the site.
    linkedin: "https://www.linkedin.com/in/akshaygovind06/",
    email: "govind.ak@northeastern.edu",
    resume: "/resume.pdf", // file lives at public/resume.pdf
    /** Shown under the Download resume button (hidden if empty). The PDF was created 2026-11-17. */
    resumeUpdated: "Nov 2026",
  },

  /**
   * Availability line under the Contact heading: "<dates> · <location>".
   * While `dates` is empty only the location shows ("Boston or remote"), so no placeholder
   * ever appears on the site. Fill `dates` in when you have them, e.g. "Jan–Jun 2027".
   */
  availability: {
    dates: "",
    location: "Boston or remote",
  },

  /** "Ask my portfolio" section (RAG assistant, see rag/ and app/api/ask). */
  ask: {
    title: "Ask my portfolio",
    intro:
      "A small assistant that answers from this site's own content only: the four case studies, the project and experience text, and the resume. Answers cite their sources, and the panel under each answer shows exactly which passages were used.",
    chips: [
      "How does the FoodLens pipeline use SCD Type 2?",
      "What guardrails did the emergency response agents use?",
      "What did the reporting automation at Vaishnav achieve?",
    ],
  },

  about: {
    summary:
      "Data professional with 2+ years as a Business Intelligence Analyst, now pursuing an MS in Information Systems at Northeastern and building end-to-end data pipelines and analytics.",
    education: [
      {
        degree: "MS, Information Systems",
        school: "Northeastern University",
        when: "Expected Dec 2027",
        coursework: "Theory and Practical Applications of AI Generative Modeling (CSYE 7380)",
      },
      {
        degree: "B.E., Computer Engineering",
        school: "University of Mumbai",
        when: "May 2022",
      },
    ],
    experience: "2+ years as a Business Intelligence Analyst",
    seeking: "Seeking Data Engineer, Data Analyst and AI Engineer co-op roles.",
  },

  projects: [
    {
      title: "FoodLens ELT Pipeline",
      summary:
        "Unified 387K+ food inspection records from two structurally different city datasets using a Medallion architecture, data quality validation and Kimball dimensional modeling.",
      stats: [{ value: "1.18M", label: "fact violation rows" }],
      caseStudy: "foodlens",
      facts: ["4 Power BI dashboards", "Idempotent Gold MERGE loads"],
      highlights: [
        {
          title: "Schema harmonization",
          text: "Chicago stores each inspection's violations as one pipe-delimited string, Dallas spreads them across 25 columns. Both were reshaped to one row per violation.",
        },
        {
          title: "SCD Type 2 dimensional modeling",
          text: "dim_restaurant is a Type 2 dimension built with Delta MERGE: when a restaurant's AKA name changes, the old version is expired and a new one inserted.",
        },
        {
          title: "Data quality and reconciliation",
          text: "DQX validation at Silver removed 1,300 bad Dallas rows, and source vs. target row counts are reconciled at every Bronze load.",
        },
      ],
      tags: ["Databricks", "PySpark", "Delta Lake", "Power BI"],
      githubUrl: "https://github.com/akshaygovindd/FoodLens-Databricks-Pipeline",
      image: { src: "/projects/foodlens-crop.webp", alt: "FoodLens Power BI dashboard, cropped to the total inspections (279,603) and pass rate (79.53%) cards and the inspections-by-result bar chart", width: 548, height: 450 },
    },
    {
      title: "Emergency Response Multi-Agent System",
      label: "CSYE 7380 midterm project",
      summary:
        "Four LLM agents (OpenAI Agents SDK) negotiate over ambulances and hospital beds in a seeded city simulation. Agents only propose; Python validates every action.",
      stats: [
        { value: "794", label: "infeasible proposals blocked, 0 executed" },
        { value: "+10.9 to +23.3 pts", label: "critical service rate vs naive baseline" },
        { value: "$0.09", label: "per agent run, at list price" },
      ],
      caseStudy: "emergency-response",
      facts: [
        "4 systems + oracle ablation × 3 scenarios, 5–10 seeds; 95% CIs, paired and permutation tests",
        "306 offline tests + CI; cached LLM calls let reruns reproduce saved results",
        "Honest result: comparable to a strong greedy rule, no detectable gain",
      ],
      tags: ["OpenAI Agents SDK", "Streamlit", "Plotly", "Python"],
      githubUrl: "https://github.com/akshaygovindd/emergency-response-agents",
      liveUrl: "https://emergency-response-agents.streamlit.app",
      liveNote: "May take ~30 s to wake",
      image: { src: "/projects/emergency-crop.webp", alt: "Emergency response dashboard map at minute 6, where two incidents both want Ambulance 1 and a conflict notice is showing", width: 790, height: 410 },
    },
    {
      title: "Ask my portfolio",
      label: "Personal project",
      summary:
        "A small RAG assistant that answers questions about my projects, experience and resume from this site's own content only, and links each answer to the section it used.",
      stats: [
        { value: "35/35", label: "questions with the right source in the top 5 (my own eval)" },
        { value: "6/6", label: "off-topic and prompt-injection prompts refused" },
        { value: "$0.0013", label: "per answer on average, at list price" },
      ],
      caseStudy: "ask-my-portfolio",
      facts: [
        "Keyword fallback fixed a recruiter-style miss: 9/10 to 10/10",
        "Similarity gate skips the model for off-topic questions",
        "10 questions an hour per hashed IP, 200 a day overall; no question text stored",
      ],
      tags: ["Next.js", "pgvector", "Neon", "OpenAI embeddings", "Vercel AI SDK"],
      githubUrl: "https://github.com/akshaygovindd/akshay-portfolio",
      tryIt: { href: "/#ask", label: "Try it" },
      image: { src: "/projects/ask-crop.webp", alt: "The Ask my portfolio section after the question 'Has Akshay used dbt?': the answer says yes, with links to Skills: Data Engineering and Project: JobPulse", width: 476, height: 595 },
    },
    {
      title: "Instacart SQL Analytics Platform",
      summary: "End-to-end grocery retail analytics platform.",
      impact:
        "Analyzed 33.8M order-product rows from 3M+ real Instacart orders using advanced SQL, with a Streamlit dashboard on top.",
      stats: [{ value: "33.8M", label: "order-product rows from 3M+ real Instacart orders" }],
      caseStudy: "instacart",
      facts: ["7 indexes on the main query paths", "RFM segmentation, cohort retention, CLV tiers"],
      tags: ["SQL", "PostgreSQL", "Python", "Streamlit"],
      githubUrl: "https://github.com/akshaygovindd/instacart-sql-analytics",
      liveUrl: "https://instacart-sql-dashboard.streamlit.app",
      image: { src: "/projects/instacart-crop.webp", alt: "Instacart dashboard Overview page: bar chart of total orders by department, with produce and dairy eggs the largest, coloured by reorder percentage", width: 1100, height: 517 },
    },
    {
      title: "JobPulse",
      summary:
        "Daily pipeline ingesting postings from 38 employers (Greenhouse, Lever, Ashby) into S3 via Terraform + GitHub Actions, modeled with dbt on MotherDuck, with LLM extraction of job details.",
      facts: [
        "38 employers · 50 dbt tests",
        "LLM extraction at $0.39 per 1K postings",
        "OIDC-secured Terraform + GitHub Actions",
      ],
      inProgress: "visa evidence and resume matching",
      tags: ["Python", "AWS S3", "Terraform", "GitHub Actions", "dbt", "MotherDuck"],
      githubUrl: "https://github.com/akshaygovindd/jobpulse",
    },
    {
      title: "Wildfire Cause Prediction",
      summary: "Predicts whether a wildfire was human-caused or lightning-caused.",
      impact:
        "Compared 5 ML models on 24 years of USDA fire data, handling class imbalance. Best model: tuned Random Forest, ROC-AUC 0.958.",
      stats: [{ value: "ROC-AUC 0.958", label: "tuned Random Forest, strongest of 5 models" }],
      caseStudy: "wildfire",
      facts: ["F1 0.96 human-caused / 0.78 lightning-caused", "1.88M rows · 83.8% class imbalance handled"],
      tags: ["Python", "scikit-learn", "Pandas", "Jupyter"],
      githubUrl: "https://github.com/akshaygovindd/Wildfire-Cause-Prediction",
      image: { src: "/projects/wildfire-crop.webp", alt: "US map of wildfire locations coloured by cause, human (red) or natural (blue), with longitude and latitude axes", width: 690, height: 425 },
    },
  ] satisfies Project[],

  caseStudies: [
    {
      slug: "foodlens",
      metaTitle: "FoodLens case study",
      description:
        "How I merged Chicago and Dallas food inspection data into one Gold star schema on Databricks: Medallion layers, DQ rules, SCD Type 2 and Delta MERGE.",
      context: "Course project · DAMG 7370, Northeastern University, Spring 2026",
      diagram: "pipeline",
    },
    {
      slug: "emergency-response",
      metaTitle: "Emergency Response agents case study",
      description:
        "Four LLM agents negotiate over ambulances and hospital beds in a simulation. Python validates every action. What the experiments showed, with numbers.",
      context: "Course project · CSYE 7380 midterm, Northeastern University",
      diagram: "emergency",
    },
    {
      slug: "ask-my-portfolio",
      metaTitle: "Ask my portfolio case study",
      description:
        "A small RAG assistant over my own case studies and resume: Neon pgvector, a similarity gate, rate limits and a 35-question eval, with the numbers.",
      context: "Personal project · built in November 2026",
      diagram: "ask",
    },
    {
      slug: "instacart",
      metaTitle: "Instacart SQL analytics case study",
      description:
        "A PostgreSQL schema, seven SQL analysis files and a live Streamlit dashboard on 3.4M Instacart orders: what I built and what I could not show.",
      context: "Personal project · built in April 2026",
      diagram: "instacart",
    },
    {
      slug: "wildfire",
      metaTitle: "Wildfire cause prediction case study",
      description:
        "Classifying 1.7M US wildfires as human or lightning caused: five models, class imbalance, a tuned Random Forest and per-class results.",
      context: "Course project · INFO 6105, Northeastern University, Spring 2026 · team of two",
      diagram: "wildfire",
    },
  ] satisfies CaseStudy[],

  /**
   * FoodLens pipeline diagram stages, shown left to right.
   * Edit the text freely. Verify these against how you actually built it.
   */
  pipeline: {
    stages: [
      {
        id: "sources",
        name: "Sources",
        tech: "Chicago & Dallas open data",
        description:
          "CSV exports from the Chicago Open Data Portal (308,161 raw rows) and the Dallas Open Data Portal (78,984 raw rows). Chicago stores violations as one pipe-delimited string, Dallas across 25 columns.",
      },
      {
        id: "raw",
        name: "Raw",
        tech: "Databricks Volume · Parquet",
        description:
          "Source files are written as Parquet to timestamped paths in a Databricks Volume and are never overwritten.",
      },
      {
        id: "bronze",
        name: "Bronze",
        tech: "Delta Lake",
        description:
          "Raw data landed as-is in Delta tables with audit metadata columns. Source vs. target row counts are reconciled at every load.",
      },
      {
        id: "silver",
        name: "Silver",
        tech: "PySpark · DQX",
        description:
          "Cleaned, standardized and deduplicated to one row per violation per inspection. DQX validation rules drop bad rows before anything reaches Gold.",
      },
      {
        id: "gold",
        name: "Gold",
        tech: "Kimball star schema",
        description:
          "dim_date, dim_restaurant (SCD Type 2), dim_violation_detail, fact_inspections and fact_violations, loaded with Delta MERGE so reruns never duplicate data.",
      },
      {
        id: "bi",
        name: "Power BI",
        tech: "Semantic model",
        description:
          "The star schema feeds a Power BI semantic model and 4 dashboards: overview, violations, restaurants, and an inspection and validation report.",
      },
    ],
    // Metadata-driven runs, shown as the bar above the stages.
    orchestrator: {
      label: "Run metadata tracks every stage ↓",
      name: "Run metadata",
      description:
        "parent_metadata drives which sources run. child_metadata logs status, row counts and batch IDs for every execution. Every load is idempotent: Bronze and Silver overwrite, Gold uses MERGE.",
    },
  },

  skills: [
    {
      // Each item is evidenced in the repos: JobPulse (LLM extraction with strict structured
      // outputs, eval/ harness, versioned prompt) and emergency-response-agents (OpenAI Agents SDK).
      category: "AI Engineering",
      skills: [
        "OpenAI Agents SDK",
        "Multi-agent systems",
        "LLM extraction",
        "Structured outputs",
        "LLM evaluation",
        "Prompt engineering",
      ],
    },
    {
      category: "Programming & SQL",
      skills: ["SQL", "Python", "PySpark", "PL/pgSQL", "Oracle SQL/PL-SQL (coursework)"],
    },
    {
      category: "Analytics & BI",
      skills: ["Power BI", "Tableau (coursework)", "Excel", "Streamlit", "Plotly", "Pandas", "NumPy"],
    },
    {
      category: "Data Engineering",
      skills: ["Databricks", "Delta Lake", "Unity Catalog", "Medallion architecture", "ETL/ELT", "SCD Type 2", "dbt"],
    },
    {
      category: "Cloud & Warehousing",
      skills: ["PostgreSQL", "Neon", "MotherDuck", "AWS S3", "Snowflake (coursework)"],
    },
    {
      category: "AI & ML",
      skills: [
        "scikit-learn",
        "Random Forest",
        "GridSearchCV",
        "Feature engineering",
        "LLMs",
      ],
    },
    { category: "Tools", skills: ["Git", "GitHub", "GitHub Actions", "pytest", "Jira"] },
  ] satisfies SkillGroup[],
};

export type Site = typeof site;

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
  /** Small label above the title (e.g. the course a project was built for). */
  label?: string;
  /** Things that are not built yet. Shown as "In progress: ...". */
  inProgress?: string;
  /** Short highlights shown as a strip along the bottom of the card (facts from the README). */
  highlights?: { title: string; text: string }[];
  /** Big verified numbers on the card. Only use figures that appear in your resume. */
  stats?: { value: string; label: string }[];
  /**
   * Optional screenshot for the card's image area. Put the file in /public (e.g.
   * "/projects/foodlens.webp"). Until you add one, a gradient placeholder is shown.
   */
  image?: { src: string; alt: string };
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
  title: "Data Analyst & Data Engineer",
  pitch:
    "I build reliable data pipelines and clear analytics, from raw ingestion to dashboards that decision-makers trust.",

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
  ],

  hero: {
    label: "AKSHAY GOVIND / PORTFOLIO",
    badge: "OPEN TO CO-OP & INTERNSHIPS",
    subheadline: "I build data systems that drive decisions.",
    roles: "Data Analyst · Data Engineer · BI Developer",
    credentials:
      "MS Information Systems @ Northeastern University · Dec\u00A02027 · 2+ yrs BI experience",
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
  },

  about: {
    summary:
      "Data professional with 2+ years as a Business Intelligence Analyst, now pursuing an MS in Information Systems at Northeastern and building end-to-end data pipelines and analytics.",
    education: [
      {
        degree: "MS, Information Systems",
        school: "Northeastern University",
        when: "Expected Dec 2027",
      },
      {
        degree: "B.E., Computer Engineering",
        school: "University of Mumbai",
        when: "May 2022",
      },
    ],
    experience: "2+ years as a Business Intelligence Analyst",
    seeking: "Seeking Data Analyst / Data Engineer / BI co-op roles.",
  },

  projects: [
    {
      title: "FoodLens ELT Pipeline",
      summary:
        "Unified 387K+ food inspection records from two structurally different city datasets using a Medallion architecture, data quality validation and Kimball dimensional modeling.",
      stats: [{ value: "1.18M", label: "fact violation rows" }],
      facts: ["4 Power BI dashboards"],
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
      image: { src: "/projects/foodlens.webp", alt: "FoodLens Power BI overview dashboard: inspections, pass rate, violations by type and city" },
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
      facts: [
        "4 systems + oracle ablation × 3 scenarios, 5–10 seeds; 95% CIs, paired and permutation tests",
        "306 offline tests + CI; cached LLM calls let reruns reproduce saved results",
        "Honest result: comparable to a strong greedy rule, no detectable gain",
      ],
      tags: ["OpenAI Agents SDK", "Streamlit", "Plotly", "Python"],
      githubUrl: "https://github.com/akshaygovindd/emergency-response-agents",
      liveUrl: "https://emergency-response-agents.streamlit.app",
      liveNote: "May take ~30 s to wake",
      image: { src: "/projects/emergency.webp", alt: "Emergency response dashboard replaying a simulation where two incidents contest one ambulance" },
    },
    {
      title: "Instacart SQL Analytics Platform",
      summary: "End-to-end grocery retail analytics platform.",
      impact:
        "Analyzed 33.8M rows across 3M+ real Instacart orders using advanced SQL, with a Streamlit dashboard on top.",
      stats: [{ value: "33.8M rows", label: "analyzed across 3M+ real Instacart orders" }],
      facts: ["7 indexes tuned with EXPLAIN ANALYZE", "RFM segmentation, cohort retention, CLV tiers"],
      tags: ["SQL", "PostgreSQL", "Python", "Streamlit"],
      githubUrl: "https://github.com/akshaygovindd/instacart-sql-analytics",
      liveUrl: "https://instacart-sql-dashboard.streamlit.app",
      image: { src: "/projects/instacart.webp", alt: "Instacart Analytics Platform Streamlit dashboard home page with order, product and customer totals" },
    },
    {
      title: "JobPulse",
      summary:
        "Daily pipeline ingesting postings from 38 employers (Greenhouse, Lever, Ashby) into S3 via Terraform + GitHub Actions, modeled with dbt on MotherDuck, with LLM extraction of job details.",
      facts: ["38 employers · 50 dbt tests"],
      inProgress: "visa evidence and resume matching",
      tags: ["Python", "AWS S3", "Terraform", "GitHub Actions", "dbt", "MotherDuck"],
      githubUrl: "https://github.com/akshaygovindd/jobpulse",
    },
    {
      title: "Wildfire Cause Prediction",
      summary: "Predicts whether a wildfire was human-caused or lightning-caused.",
      impact:
        "Compared 5 ML models on 24 years of USDA fire data, handling class imbalance. Best model: tuned Random Forest, F1 = 0.9598.",
      stats: [
        { value: "F1 0.96", label: "tuned Random Forest, strongest of 5 models" },
        { value: "ROC-AUC 0.9579", label: "same tuned Random Forest" },
      ],
      facts: ["1.88M rows · 83.8% class imbalance handled"],
      tags: ["Python", "scikit-learn", "Pandas", "Jupyter"],
      githubUrl: "https://github.com/akshaygovindd/Wildfire-Cause-Prediction",
      image: { src: "/projects/wildfire.webp", alt: "Wildfire counts by state and a US map of fire locations coloured by human or natural cause" },
    },
  ] satisfies Project[],

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
          "Chicago Open Data Portal (308,161 raw rows) and Dallas Open Data Portal (78,984 raw rows). Chicago stores violations as one pipe-delimited string, Dallas across 25 columns.",
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
    // Metadata-driven runs (from the README), shown as the bar above the stages.
    orchestrator: {
      label: "Run metadata tracks every stage ↓",
      name: "Run metadata",
      description:
        "parent_metadata drives which sources run. child_metadata logs status, row counts and batch IDs for every execution, and every load is idempotent.",
    },
  },

  skills: [
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
        "Prompt engineering",
        "OpenAI Agents SDK",
        "Multi-agent systems",
      ],
    },
    { category: "Tools", skills: ["Git", "GitHub", "GitHub Actions", "pytest", "Jira"] },
  ] satisfies SkillGroup[],
};

export type Site = typeof site;

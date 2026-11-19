/**
 * ============================================================
 *  ALL EDITABLE SITE CONTENT LIVES IN THIS FILE.
 *  Search for "TODO" to find everything that still needs your input.
 * ============================================================
 */

export type MetricChartData = {
  /** Small chart title shown above the bars, e.g. "Scale" */
  title: string;
  /** Unit label shown next to values, e.g. "M rows", "%", "sec" */
  unit: string;
  /** Only real values. The card shows no chart if this is empty or the field is omitted. */
  data: { name: string; value: number }[];
};

export type Project = {
  title: string;
  /** One-line description of what it is */
  summary: string;
  /** Short impact statement */
  impact: string;
  tags: string[];
  githubUrl: string;
  /** Featured projects get large cards; the rest get compact cards. */
  featured?: boolean;
  /** Small Recharts visual on the card. Omit to hide. */
  metrics?: MetricChartData;
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

  hero: {
    label: "AKSHAY GOVIND / PORTFOLIO",
    badge: "OPEN TO CO-OP & INTERNSHIPS",
    subheadline: "I build data systems that drive decisions.",
    roles: "Data Analyst · Data Engineer · BI Developer",
    credentials:
      "MS Information Systems @ Northeastern University · Dec 2027 · 2+ yrs BI experience",
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
    linkedin: "", // TODO: e.g. "https://www.linkedin.com/in/your-handle"
    email: "", // TODO: your email address
    resume: "", // TODO: drop your PDF at public/resume.pdf, then set this to "/resume.pdf"
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
      featured: true,
      summary: "End-to-end ELT pipeline from raw data to BI dashboards.",
      impact:
        "Medallion-architecture pipeline ingesting Chicago and Dallas food inspection data into Power BI.",
      tags: ["Databricks", "PySpark", "Airflow", "Delta Lake", "Power BI"],
      githubUrl: "https://github.com/akshaygovindd/FoodLens-Databricks-Pipeline",
      // metrics: add a chart here once you have real numbers
    },
    {
      title: "Instacart SQL Analytics Platform",
      featured: true,
      summary: "End-to-end grocery retail analytics platform.",
      impact:
        "Analyzed 33.8M rows across 3M+ real Instacart orders using advanced SQL, with a Streamlit dashboard on top.",
      tags: ["SQL", "PostgreSQL", "Python", "Streamlit"],
      githubUrl: "https://github.com/akshaygovindd/instacart-sql-analytics",
      metrics: {
        title: "Data scale",
        unit: "M rows",
        data: [{ name: "Total rows", value: 33.8 }],
      },
    },
    {
      title: "JobPulse",
      featured: true,
      summary: "Daily job market intelligence platform.",
      impact:
        "Daily pipeline that extracts job postings with LLMs, surfaces visa evidence, and matches roles to a resume.",
      tags: ["Python", "AWS S3", "Terraform", "GitHub Actions", "dbt", "MotherDuck"],
      githubUrl: "https://github.com/akshaygovindd/jobpulse",
      // metrics: add a chart here once you have real numbers
    },
    {
      title: "Emergency Response Multi-Agent System",
      summary: "Multi-agent LLM system for emergency resource coordination.",
      impact:
        "Coordinates multiple AI agents to triage incidents and allocate emergency resources, visualized in a Streamlit/Plotly dashboard.",
      tags: ["OpenAI Agents SDK", "Streamlit", "Plotly", "Python"],
      githubUrl: "https://github.com/akshaygovindd/emergency-response-agents",
      // metrics: add a chart here once you have real numbers (see MetricChartData above)
    },
    {
      title: "Wildfire Cause Prediction",
      summary: "Predicts whether a wildfire was human-caused or lightning-caused.",
      impact:
        "Compared 5 ML models on 24 years of USDA fire data, handling class imbalance. Best model: tuned Random Forest, F1 = 0.9598.",
      tags: ["Python", "scikit-learn", "Pandas", "Jupyter"],
      githubUrl: "https://github.com/akshaygovindd/Wildfire-Cause-Prediction",
      metrics: {
        title: "Model performance",
        unit: "%",
        data: [{ name: "RF tuned F1", value: 95.98 }],
      },
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
          "Raw food inspection records from the Chicago and Dallas open data portals, each with its own schema and quirks.",
      },
      {
        id: "bronze",
        name: "Bronze",
        tech: "Databricks · Delta Lake",
        description:
          "Raw data lands as-is in Delta tables. Nothing is dropped or fixed here, so there is always an untouched copy to replay from.",
      },
      {
        id: "silver",
        name: "Silver",
        tech: "PySpark · Delta Lake",
        description:
          "PySpark cleans and standardizes both cities into one consistent schema: types, dates, duplicates and missing values.",
      },
      {
        id: "gold",
        name: "Gold",
        tech: "Delta Lake",
        description:
          "Business-ready tables and aggregates shaped for reporting, such as inspection outcomes by city, facility type and time.",
      },
      {
        id: "bi",
        name: "Power BI",
        tech: "Power BI",
        description:
          "Dashboards read the gold layer so analysts can explore inspection results without touching raw data.",
      },
    ],
    orchestrator: {
      name: "Airflow",
      description:
        "Airflow schedules and sequences the stages above, so each layer runs after the previous one succeeds and failures are visible and retryable.",
    },
  },

  skills: [
    { category: "Languages", skills: ["SQL", "Python", "Java", "Oracle SQL/PL-SQL"] },
    { category: "Libraries", skills: ["Pandas", "NumPy"] },
    { category: "BI & Visualization", skills: ["Power BI", "Tableau"] },
    {
      category: "Data Platforms & Pipelines",
      skills: ["Databricks", "Snowflake", "Azure Data Factory", "Airflow"],
    },
    { category: "Tools", skills: ["Git"] },
  ] satisfies SkillGroup[],
};

export type Site = typeof site;

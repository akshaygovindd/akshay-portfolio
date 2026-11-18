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
  /** Use `value: null` for numbers you haven't filled in yet (renders as a TODO placeholder). */
  data: { name: string; value: number | null }[];
};

export type Project = {
  title: string;
  /** One-line description of what it is */
  summary: string;
  /** Short impact statement */
  impact: string;
  tags: string[];
  githubUrl: string;
  /** Small Recharts visual on the card. Omit to hide. */
  metrics?: MetricChartData;
};

export type SkillGroup = { category: string; skills: string[] };

export const site = {
  name: "Akshay Govind",
  title: "Data Analyst & Data Engineer",
  pitch:
    "I build reliable data pipelines and clear analytics, from raw ingestion to dashboards that decision-makers trust.",

  links: {
    github: "https://github.com/akshaygovindd",
    linkedin: "TODO: https://www.linkedin.com/in/your-handle", // TODO
    email: "TODO@example.com", // TODO: your real email
    resume: "/resume.pdf", // TODO: drop your real PDF at public/resume.pdf (placeholder file is there now)
  },

  about: {
    summary:
      "Data professional with 2+ years of experience as a Business Intelligence Analyst, now building data engineering depth through graduate study.",
    // TODO: add 1-2 more sentences about what you enjoy / your strengths
    extra: "TODO: Add a short personal paragraph here.",
    education: [
      {
        degree: "MS, Information Systems",
        school: "Northeastern University",
        when: "Expected Dec 2027",
      },
      {
        degree: "B.E., Computer Engineering",
        school: "University of Mumbai",
        when: "TODO: graduation year",
      },
    ],
    experience: "2+ years as a Business Intelligence Analyst",
    seeking: "Seeking Data Analyst / Data Engineer / BI co-op roles.",
  },

  projects: [
    {
      title: "JobPulse",
      summary: "Daily job market intelligence platform.",
      impact:
        "Daily pipeline that extracts job postings with LLMs, surfaces visa evidence, and matches roles to a resume.",
      tags: ["Python", "AWS S3", "Terraform", "GitHub Actions", "dbt", "MotherDuck"],
      githubUrl: "https://github.com/akshaygovindd/jobpulse",
      metrics: {
        title: "Key metric (TODO)",
        unit: "TODO",
        data: [
          { name: "TODO", value: null },
          { name: "TODO", value: null },
        ],
      },
    },
    {
      title: "Instacart SQL Analytics Platform",
      summary: "End-to-end grocery retail analytics platform.",
      impact:
        "Analyzed 33.8M rows across 3M+ real Instacart orders using advanced SQL, with a Streamlit dashboard on top.",
      tags: ["SQL", "PostgreSQL", "Python", "Streamlit"],
      githubUrl: "https://github.com/akshaygovindd/instacart-sql-analytics",
      metrics: {
        title: "Data scale",
        unit: "M rows",
        data: [
          { name: "Total rows", value: 33.8 },
          { name: "TODO", value: null },
          { name: "TODO", value: null },
        ],
      },
    },
    {
      title: "FoodLens ELT Pipeline",
      summary: "End-to-end ELT pipeline from raw data to BI dashboards.",
      impact:
        "Medallion-architecture pipeline ingesting Chicago and Dallas food inspection data into Power BI.",
      tags: ["Databricks", "PySpark", "Airflow", "Delta Lake", "Power BI"],
      githubUrl: "https://github.com/akshaygovindd/FoodLens-Databricks-Pipeline",
      metrics: {
        title: "Key metric (TODO)",
        unit: "TODO",
        data: [
          { name: "TODO", value: null },
          { name: "TODO", value: null },
        ],
      },
    },
    {
      title: "Wildfire Cause Prediction",
      summary: "Predicts whether a wildfire was human-caused or lightning-caused.",
      impact:
        "Compared 5 ML models on 24 years of USDA fire data, handling class imbalance. Best model: tuned Random Forest, F1 = 0.9598.",
      tags: ["Python", "Jupyter", "Machine Learning"],
      githubUrl: "https://github.com/akshaygovindd/Wildfire-Cause-Prediction",
      metrics: {
        title: "Model performance",
        unit: "%",
        data: [
          { name: "RF tuned F1", value: 95.98 },
          { name: "TODO", value: null },
        ],
      },
    },
    {
      title: "Emergency Response Multi-Agent System",
      summary: "Multi-agent LLM system for emergency resource coordination.",
      impact: "TODO: one-line impact (e.g. scenarios simulated, response-time improvement).",
      tags: ["OpenAI Agents SDK", "Streamlit", "Plotly", "Python"],
      githubUrl: "https://github.com/akshaygovindd/emergency-response-agents",
      metrics: {
        title: "Key metric (TODO)",
        unit: "TODO",
        data: [
          { name: "TODO", value: null },
          { name: "TODO", value: null },
        ],
      },
    },
  ] satisfies Project[],

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

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
  // TODO: replace with your own one-line pitch
  pitch:
    "TODO: One-line pitch. (Placeholder: I turn messy data into reliable pipelines and dashboards people actually use.)",

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
      summary: "Job market intelligence platform.",
      impact: "TODO: one-line impact (e.g. postings analyzed, insights surfaced).",
      tags: ["TODO: tech", "TODO: tech"],
      githubUrl: "https://github.com/akshaygovindd", // TODO: link to the repo
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
      summary: "SQL analytics over the Instacart dataset at scale.",
      impact: "Analyzed 33.8M rows. TODO: add query / insight outcomes.",
      tags: ["SQL", "TODO: database", "TODO: tech"],
      githubUrl: "https://github.com/akshaygovindd", // TODO: link to the repo
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
      impact: "TODO: one-line impact (e.g. rows processed, refresh time).",
      tags: ["Databricks", "Airflow", "Delta Lake", "Power BI"],
      githubUrl: "https://github.com/akshaygovindd", // TODO: link to the repo
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
      summary: "Machine learning model that predicts wildfire causes.",
      impact: "TODO: one-line impact (e.g. accuracy / F1 achieved).",
      tags: ["Python", "Pandas", "TODO: ML library"],
      githubUrl: "https://github.com/akshaygovindd", // TODO: link to the repo
      metrics: {
        title: "Model performance (TODO)",
        unit: "%",
        data: [
          { name: "Accuracy", value: null },
          { name: "F1", value: null },
        ],
      },
    },
    {
      title: "Emergency Response Multi-Agent System",
      summary: "Multi-agent system that coordinates emergency response workflows.",
      impact: "TODO: one-line impact.",
      tags: ["OpenAI Agents SDK", "Streamlit", "Plotly", "Python"],
      githubUrl: "https://github.com/akshaygovindd", // TODO: link to the repo
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

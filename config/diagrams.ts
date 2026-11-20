/**
 * Architecture diagrams for the case-study pages (FoodLens reuses the interactive pipeline
 * component instead). Coordinates are in SVG units inside a 480-wide box, so the diagram scales
 * with its container. Every label matches the case-study text.
 */
export type Side = "t" | "b" | "l" | "r";
export type DNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** One or two small lines under the title. */
  sub?: string | string[];
  /** accent = the result or the piece that matters most. */
  tone?: "plain" | "accent";
};
export type DGroup = { id: string; x: number; y: number; w: number; h: number; label: string };
export type DEdge = {
  from: string;
  to: string;
  /** Side of the "from" box the line leaves, and side of the "to" box it enters. */
  fs: Side;
  ts: Side;
  /** Where along those sides (0 to 1, default the middle). */
  fa?: number;
  ta?: number;
  label?: string;
  dashed?: boolean;
};
export type DiagramSpec = {
  w: number;
  h: number;
  /** Accessible name and a description of the flow in words. */
  title: string;
  desc: string;
  groups?: DGroup[];
  nodes: DNode[];
  edges: DEdge[];
};

export const diagrams: Record<"emergency" | "instacart" | "wildfire" | "ask", DiagramSpec> = {
  emergency: {
    w: 480,
    h: 600,
    title: "Emergency Response system architecture",
    desc:
      "A seeded scenario generator produces ground truth and LLM-written 911 reports. Four LLM agents read the reports and propose actions. A Python conflict detector and validator check every proposal, and the Python simulation engine executes the accepted ones and writes event logs, which the dashboard replays.",
    groups: [
      { id: "ag", x: 0, y: 92, w: 480, h: 196, label: "LLM agents: propose only" },
      { id: "py", x: 0, y: 324, w: 480, h: 268, label: "Python: validates and executes" },
    ],
    nodes: [
      { id: "gen", x: 10, y: 8, w: 215, h: 52, title: "Scenario generator", sub: "seeded, holds ground truth" },
      { id: "rep", x: 255, y: 8, w: 215, h: 52, title: "911 reports", sub: "written by an LLM, cached" },
      { id: "assess", x: 14, y: 124, w: 222, h: 52, title: "Incident Assessment", sub: "reads the 911 reports" },
      { id: "disp", x: 254, y: 124, w: 212, h: 52, title: "Dispatch", sub: "proposes ambulances, teams" },
      { id: "alloc", x: 14, y: 206, w: 222, h: 66, title: "Resource Allocation", sub: ["settles conflicts, max 3 rounds,", "then a fixed fallback rule"] },
      { id: "hosp", x: 254, y: 206, w: 212, h: 66, title: "Hospital Coordination", sub: ["admissions; v3 lends staff", "between hospitals"] },
      { id: "conf", x: 14, y: 356, w: 222, h: 52, title: "Conflict detector", sub: "one resource, two claims?" },
      { id: "val", x: 254, y: 356, w: 212, h: 52, title: "Validator", sub: "checks every action", tone: "accent" },
      { id: "eng", x: 254, y: 438, w: 212, h: 52, title: "Simulation engine", sub: "seeded 120-minute city" },
      { id: "logs", x: 14, y: 438, w: 222, h: 52, title: "Event logs", sub: "every proposal and result" },
      { id: "dash", x: 14, y: 520, w: 222, h: 52, title: "Dashboard", sub: "replays saved runs" },
    ],
    edges: [
      { from: "gen", to: "rep", fs: "r", ts: "l" },
      { from: "rep", to: "ag", fs: "b", ts: "t", fa: 0.5, ta: 0.754 },
      { from: "assess", to: "disp", fs: "r", ts: "l" },
      { from: "disp", to: "hosp", fs: "b", ts: "t" },
      { from: "ag", to: "conf", fs: "b", ts: "t", fa: 0.25, ta: 0.477, label: "proposals" },
      { from: "conf", to: "val", fs: "r", ts: "l" },
      { from: "val", to: "eng", fs: "b", ts: "t", label: "accepted" },
      { from: "eng", to: "logs", fs: "l", ts: "r" },
      { from: "logs", to: "dash", fs: "b", ts: "t" },
    ],
  },
  instacart: {
    w: 480,
    h: 560,
    title: "Instacart analytics architecture",
    desc:
      "Kaggle CSV files are loaded by a Python script into PostgreSQL, which holds five tables, seven indexes, three views, two materialized views, three functions and an audit trigger. A Streamlit dashboard queries a Neon cloud Postgres database.",
    groups: [{ id: "pg", x: 0, y: 92, w: 480, h: 262, label: "PostgreSQL: schema and SQL files" }],
    nodes: [
      { id: "csv", x: 10, y: 8, w: 215, h: 52, title: "Kaggle CSV files", sub: "Instacart Market Basket" },
      { id: "load", x: 255, y: 8, w: 215, h: 52, title: "Python loader", sub: "100,000-row chunks" },
      { id: "tab", x: 14, y: 124, w: 222, h: 66, title: "5 tables", sub: ["orders, order_products,", "products, aisles, departments"] },
      { id: "idx", x: 254, y: 124, w: 212, h: 66, title: "7 indexes", sub: ["including a composite and a", "partial one (reordered = 1)"] },
      { id: "vw", x: 14, y: 206, w: 222, h: 52, title: "3 views", sub: "daily, product, customer 360" },
      { id: "mv", x: 254, y: 206, w: 212, h: 52, title: "2 materialized views", sub: "department and product stats" },
      { id: "fn", x: 14, y: 274, w: 452, h: 52, title: "3 functions and an audit trigger", sub: "customer summary, top products, department report" },
      { id: "neon", x: 130, y: 386, w: 220, h: 52, title: "Neon cloud Postgres", sub: "what the live app queries" },
      { id: "st", x: 10, y: 470, w: 460, h: 66, title: "Streamlit dashboard", sub: ["5 pages, Plotly charts, 10-minute cache", "Query Explorer runs typed SQL"], tone: "accent" },
    ],
    edges: [
      { from: "csv", to: "load", fs: "r", ts: "l" },
      { from: "load", to: "pg", fs: "b", ts: "t", fa: 0.5, ta: 0.754 },
      { from: "tab", to: "vw", fs: "b", ts: "t" },
      { from: "neon", to: "st", fs: "b", ts: "t" },
    ],
  },
  wildfire: {
    w: 480,
    h: 744,
    title: "Wildfire cause prediction workflow",
    desc:
      "USDA fire records are cleaned and given a human-or-lightning target, turned into 12 features and split 80/20. Five models are trained and compared on the same test set. The Random Forest is tuned with GridSearchCV and checked with 5-fold cross-validation.",
    groups: [{ id: "models", x: 0, y: 350, w: 480, h: 198, label: "Five models, same test set" }],
    nodes: [
      { id: "n1", x: 90, y: 8, w: 300, h: 52, title: "USDA fire records", sub: "1,880,465 rows, 1992-2015" },
      { id: "n2", x: 90, y: 90, w: 300, h: 66, title: "Clean and build the target", sub: ["drop undefined causes: 1,713,742 rows", "lightning = 0, every other cause = 1"] },
      { id: "n3", x: 90, y: 186, w: 300, h: 52, title: "12 features, 5 engineered", sub: "label-encoded, scaled on train only" },
      { id: "n4", x: 90, y: 268, w: 300, h: 52, title: "Stratified 80/20 split", sub: "1,370,993 train, 342,749 test" },
      { id: "lr", x: 14, y: 380, w: 222, h: 44, title: "Logistic Regression" },
      { id: "svm", x: 254, y: 380, w: 212, h: 44, title: "LinearSVC" },
      { id: "knn", x: 14, y: 436, w: 222, h: 44, title: "KNN, 100K sample" },
      { id: "dt", x: 254, y: 436, w: 212, h: 44, title: "Decision Tree, depth 5" },
      { id: "rf", x: 134, y: 492, w: 212, h: 44, title: "Random Forest", tone: "accent" },
      { id: "n6", x: 90, y: 580, w: 300, h: 52, title: "Tune the Random Forest", sub: "GridSearchCV (81 fits), 5-fold CV" },
      { id: "n7", x: 90, y: 664, w: 300, h: 66, title: "Final test results", sub: ["ROC-AUC 0.958", "F1 0.96 human, 0.78 lightning"], tone: "accent" },
    ],
    edges: [
      { from: "n1", to: "n2", fs: "b", ts: "t" },
      { from: "n2", to: "n3", fs: "b", ts: "t" },
      { from: "n3", to: "n4", fs: "b", ts: "t" },
      { from: "n4", to: "models", fs: "b", ts: "t" },
      { from: "models", to: "n6", fs: "b", ts: "t", label: "best F1 and AUC" },
      { from: "n6", to: "n7", fs: "b", ts: "t" },
    ],
  },
  ask: {
    w: 480,
    h: 556,
    title: "Ask my portfolio architecture",
    desc:
      "Ingestion, run by hand: my content is split into heading chunks, embedded with text-embedding-3-small (only chunks whose hash is new) and stored in pgvector on Neon. For each question: rate limits are checked, retrieval takes the top 5 chunks by cosine similarity plus a keyword fallback, a similarity gate skips the model when nothing is relevant, and gpt-5.4-mini answers from the chunks only. The answer streams to the page with citations.",
    groups: [
      { id: "ing", x: 0, y: 0, w: 480, h: 206, label: "Ingestion: npm run rag:ingest" },
      { id: "ask", x: 0, y: 234, w: 480, h: 314, label: "Each question: /api/ask" },
    ],
    nodes: [
      { id: "corpus", x: 14, y: 32, w: 222, h: 66, title: "My content", sub: ["case studies, project, experience", "and skills text, resume"] },
      { id: "chunks", x: 254, y: 32, w: 212, h: 66, title: "Heading chunks", sub: ["one per section,", "about 400 tokens"] },
      { id: "store", x: 14, y: 124, w: 222, h: 66, title: "pgvector on Neon", sub: ["chunks table with", "a cosine index"] },
      { id: "embed", x: 254, y: 124, w: 212, h: 66, title: "Embeddings", sub: ["text-embedding-3-small,", "new content hashes only"] },
      { id: "limit", x: 14, y: 266, w: 222, h: 66, title: "Rate limits", sub: ["10 an hour per hashed IP,", "200 a day for the site"] },
      { id: "retr", x: 254, y: 266, w: 212, h: 66, title: "Retrieval", sub: ["top 5 by cosine plus", "a keyword fallback"] },
      { id: "gate", x: 14, y: 354, w: 222, h: 66, title: "Similarity gate", sub: ["nothing relevant:", "no model call"] },
      { id: "llm", x: 254, y: 354, w: 212, h: 66, title: "gpt-5.4-mini", sub: ["answers from the chunks", "only, 500 tokens at most"] },
      { id: "out", x: 10, y: 460, w: 460, h: 66, title: "Streamed answer with citations", sub: ["[n] links to the section it came from;", "a panel shows chunks, scores, tokens"], tone: "accent" },
    ],
    edges: [
      { from: "corpus", to: "chunks", fs: "r", ts: "l" },
      { from: "chunks", to: "embed", fs: "b", ts: "t" },
      { from: "embed", to: "store", fs: "l", ts: "r" },
      { from: "store", to: "retr", fs: "b", ts: "t", label: "nearest chunks" },
      { from: "limit", to: "retr", fs: "r", ts: "l" },
      { from: "retr", to: "gate", fs: "b", ts: "t" },
      { from: "gate", to: "llm", fs: "r", ts: "l" },
      { from: "llm", to: "out", fs: "b", ts: "t", ta: 0.761 },
    ],
  },
};

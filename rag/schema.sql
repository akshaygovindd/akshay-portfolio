-- Schema for the "Ask my portfolio" assistant (Neon project "portfolio-rag").
-- Apply with: npm run rag:schema   (idempotent)
create extension if not exists vector;

create table if not exists chunks (
  hash       text primary key,            -- sha256 of source|url|title|content
  source     text not null,               -- e.g. case-study:foodlens, site:projects, resume
  title      text not null,
  url        text not null,               -- where a citation links to
  content    text not null,
  embedding  vector(1536) not null,       -- text-embedding-3-small
  tsv        tsvector generated always as (to_tsvector('english', title || ' ' || content)) stored
);
create index if not exists chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);
create index if not exists chunks_tsv_idx on chunks using gin (tsv);

-- Rate limiting: only a hashed IP (HMAC with a server-side salt), a time bucket and a counter.
-- The special ip_hash '__global__' with a day bucket is the site-wide daily cap. No question text is stored.
create table if not exists rate_limits (
  ip_hash       text not null,
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (ip_hash, window_start)
);

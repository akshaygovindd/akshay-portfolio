"use client";

import { useState } from "react";
import type { ChartSpec } from "@/lib/chart";

const ROW = 28;
const TOP = 28;
const GAP = 16;

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000));

/**
 * Horizontal bars for a query result, in the same style as the Wildfire case study chart (SVG, mono labels,
 * accent bars, theme colours). One panel per numeric column, each on its own scale, so two columns with
 * different units are never drawn on one axis. On a wide screen two panels sit side by side; on a phone they
 * are stacked in a narrower drawing, so the text stays readable and nothing needs a sideways scroll. The Table
 * view is the accessible alternative, and the data is also in the image description. Loaded lazily, the first
 * time someone opens the Chart view (so reading the screen width here is safe: this never renders on the server).
 */
export default function SqlResultChart({ spec }: { spec: ChartSpec }) {
  const [narrow] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const W = narrow ? 340 : 560;
  const LABEL_W = narrow ? 118 : 150;
  const LABEL_CHARS = narrow ? 15 : 19;
  const n = spec.labels.length;
  const count = spec.series.length;
  const stacked = narrow && count > 1;
  const blockH = TOP + n * ROW + 6;
  const h = stacked ? count * blockH + (count - 1) * 8 : blockH;
  const panelW = stacked || count === 1 ? W - LABEL_W - 10 : (W - LABEL_W - 10 - GAP * (count - 1)) / count;
  const barMax = panelW - 58; // room for the value after the bar
  const desc = spec.labels
    .map((l, i) => `${l}: ${spec.series.map((s) => `${s.name} ${fmt(s.values[i])}`).join(", ")}`)
    .join("; ");

  // where each series is drawn
  const panels = spec.series.map((s, si) => ({
    s,
    si,
    x0: LABEL_W + 10 + (stacked ? 0 : si * (panelW + GAP)),
    y0: stacked ? si * (blockH + 8) : 0,
    labels: stacked || si === 0,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      role="img"
      aria-labelledby="sqlchart-t sqlchart-d"
      className="mx-auto block h-auto w-full max-w-[36rem] p-2"
    >
      <title id="sqlchart-t">{`Bar chart of ${spec.series.map((s) => s.name).join(" and ")} by ${spec.categoryName}`}</title>
      <desc id="sqlchart-d">{desc}</desc>
      {panels.map(({ s, si, x0, y0, labels }) => {
        const max = Math.max(...s.values, 0) || 1;
        return (
          <g key={s.name} transform={`translate(0 ${y0})`}>
            <text x={x0} y={16} className="fill-muted font-mono" fontSize={12} fontWeight={600}>
              {s.name}
            </text>
            {s.values.map((v, i) => {
              const y = TOP + i * ROW;
              const w = (v / max) * barMax;
              return (
                <g key={i}>
                  <rect x={x0} y={y + 4} width={Math.max(w, v > 0 ? 1 : 0)} height={ROW - 10} rx={4} className={si === 0 ? "fill-accent" : "fill-warm"} />
                  <text x={x0 + w + 6} y={y + 18} className="fill-fg font-mono" fontSize={12}>
                    {fmt(v)}
                  </text>
                </g>
              );
            })}
            {labels &&
              spec.labels.map((l, i) => (
                <text key={i} x={LABEL_W} y={TOP + i * ROW + 18} textAnchor="end" className="fill-muted font-mono" fontSize={12}>
                  <title>{l}</title>
                  {l.length > LABEL_CHARS ? `${l.slice(0, LABEL_CHARS - 1)}…` : l}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
}

"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { MetricChartData } from "@/config/site";

/**
 * Small horizontal bar chart for a project card.
 * Entries with `value: null` render as a faint placeholder bar so the layout
 * stays stable until you fill in real numbers.
 */
export default function MetricChart({ metrics }: { metrics: MetricChartData }) {
  const known = metrics.data.filter((d) => d.value !== null) as { name: string; value: number }[];
  const max = known.length ? Math.max(...known.map((d) => d.value)) : 1;
  const hasTodo = metrics.data.some((d) => d.value === null);

  // Placeholder bars take ~35% of the max so they're visible but clearly "empty".
  const rows = metrics.data.map((d) => ({
    name: d.name,
    value: d.value ?? max * 0.35,
    isTodo: d.value === null,
    label: d.value === null ? "TODO" : `${d.value}${metrics.unit ? " " + metrics.unit : ""}`,
  }));

  return (
    <figure
      className="mt-4 rounded-md border border-border bg-bg p-3"
      aria-label={`${metrics.title} chart`}
    >
      <figcaption className="mb-1 font-mono text-xs text-muted">{metrics.title}</figcaption>
      <div style={{ height: rows.length * 34 + 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, max * 1.05]} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgb(var(--muted))", fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            <Bar dataKey="value" radius={3} barSize={14} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell
                  key={i}
                  fill="rgb(var(--accent))"
                  fillOpacity={r.isTodo ? 0.18 : 1}
                  stroke={r.isTodo ? "rgb(var(--accent))" : "none"}
                  strokeDasharray={r.isTodo ? "3 3" : undefined}
                />
              ))}
              <LabelList
                dataKey="label"
                position="right"
                style={{ fill: "rgb(var(--fg))", fontSize: 11, fontFamily: "var(--font-mono)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {hasTodo && (
        <p className="mt-1 font-mono text-[10px] text-muted">
          TODO: fill in values in config/site.ts
        </p>
      )}
    </figure>
  );
}

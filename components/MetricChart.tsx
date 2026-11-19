"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { MetricChartData } from "@/config/site";

/** Small horizontal bar chart for a project card. Renders nothing without real values. */
export default function MetricChart({ metrics }: { metrics: MetricChartData }) {
  if (metrics.data.length === 0) return null;

  const max = Math.max(...metrics.data.map((d) => d.value));
  const rows = metrics.data.map((d) => ({
    name: d.name,
    value: d.value,
    label: `${d.value}${metrics.unit ? " " + metrics.unit : ""}`,
  }));

  return (
    <figure
      className="mt-4 rounded-xl border border-border bg-bg p-3"
      aria-label={`${metrics.title} chart`}
    >
      <figcaption className="mb-1 font-mono text-xs text-muted">{metrics.title}</figcaption>
      <div style={{ height: rows.length * 34 + 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, max * 1.05]} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgb(var(--muted))", fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            <Bar
              dataKey="value"
              fill="rgb(var(--accent))"
              radius={3}
              barSize={14}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="label"
                position="right"
                style={{ fill: "rgb(var(--fg))", fontSize: 11, fontFamily: "var(--font-mono)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

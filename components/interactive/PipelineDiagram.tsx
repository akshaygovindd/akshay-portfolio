"use client";

import { Fragment, useState } from "react";
import { site } from "@/config/site";

const { stages, orchestrator } = site.pipeline;
const ORCH = "orchestrator";

export default function PipelineDiagram() {
  const [activeId, setActiveId] = useState<string>(stages[0].id);

  const active =
    activeId === ORCH
      ? { name: orchestrator.name, tech: "Orchestration", description: orchestrator.description }
      : stages.find((s) => s.id === activeId) ?? stages[0];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      {/* Orchestrator spans all stages */}
      <button
        type="button"
        onClick={() => setActiveId(ORCH)}
        aria-pressed={activeId === ORCH}
        className={`mb-5 w-full rounded-xl border border-dashed px-3 py-2 text-center font-mono text-xs transition-colors ${
          activeId === ORCH
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-muted hover:border-accent hover:text-accent"
        }`}
      >
        {orchestrator.name} orchestrates every stage ↓
      </button>

      <div className="flex flex-col items-stretch lg:flex-row lg:items-center">
        {stages.map((s, i) => (
          <Fragment key={s.id}>
            <button
              type="button"
              onClick={() => setActiveId(s.id)}
              aria-pressed={activeId === s.id}
              className={`flex-1 rounded-xl border px-3 py-3 text-left font-mono transition-colors lg:text-center ${
                activeId === s.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-bg hover:border-accent"
              }`}
            >
              <span className="block text-sm font-semibold">{s.name}</span>
              <span className="block text-[11px] text-muted">{s.tech}</span>
            </button>
            {i < stages.length - 1 && (
              <div
                aria-hidden="true"
                className="flow-line mx-auto h-6 w-0.5 lg:mx-0 lg:h-0.5 lg:w-10 lg:flex-none"
              />
            )}
          </Fragment>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-bg p-4" aria-live="polite">
        <p className="font-mono text-sm font-semibold text-accent">{active.name}</p>
        <p className="font-mono text-xs text-muted">{active.tech}</p>
        <p className="mt-2 text-sm">{active.description}</p>
      </div>
    </div>
  );
}

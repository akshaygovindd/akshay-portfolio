"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

const BOX = "h-[34rem] sm:h-[31rem]";

/** Same height as the loaded panel, so nothing moves when the chunk arrives. */
function Placeholder() {
  return <div className={`${BOX} rounded-2xl border border-border bg-surface`} aria-hidden="true" />;
}

const AskPanel = dynamic(() => import("./AskPanel"), { ssr: false, loading: Placeholder });

export const UNAVAILABLE = "The assistant is unavailable right now. The rest of the site works as usual.";

/** If the panel (or its chunk) fails for any reason, show the friendly message and leave the page alone. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className={`${BOX} rounded-2xl border border-border bg-surface p-5`} role="status">
        <p className="text-muted">{UNAVAILABLE}</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function AskLoader({ chips }: { chips: string[] }) {
  return (
    <Boundary>
      <AskPanel chips={chips} boxClass={BOX} />
    </Boundary>
  );
}

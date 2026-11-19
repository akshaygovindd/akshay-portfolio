"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";

type State = "idle" | "copied" | "failed";

/** Copies the email address. Shows "Copied" for a moment (or "Copy failed"); announces it too. */
export default function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      // Fallback for browsers/contexts where the async clipboard API is unavailable or denied
      // The helper textarea takes focus while it copies; hand focus back afterwards so keyboard
      // users stay on the button.
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      } finally {
        document.body.removeChild(ta);
        previouslyFocused?.focus({ preventScroll: true });
      }
    }
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <>
      <button type="button" onClick={copy} className="btn min-w-[9.5rem] justify-center">
        {state === "copied" ? <Check size={16} /> : state === "failed" ? <X size={16} /> : <Copy size={16} />}
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy email"}
      </button>
      {/* Screen readers hear the result; nothing visible */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? "Email address copied to clipboard" : state === "failed" ? "Could not copy the email address" : ""}
      </span>
    </>
  );
}

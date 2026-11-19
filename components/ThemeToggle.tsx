"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const subscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // false on the server and during hydration, true afterwards (avoids a hydration mismatch
  // without calling setState inside an effect).
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark/light mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-border text-ink-muted transition-colors hover:border-ink-fg hover:text-ink-fg"
    >
      {/* Fixed-size placeholder until mounted */}
      {mounted ? isDark ? <Sun size={18} /> : <Moon size={18} /> : <span className="block h-[18px] w-[18px]" />}
    </button>
  );
}

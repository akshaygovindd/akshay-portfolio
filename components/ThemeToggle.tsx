"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark/light mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {/* Render a fixed-size placeholder until mounted to avoid hydration mismatch */}
      {mounted ? isDark ? <Sun size={16} /> : <Moon size={16} /> : <span className="block h-4 w-4" />}
    </button>
  );
}

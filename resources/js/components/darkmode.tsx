"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppearance, type Appearance } from "@/hooks/use-appearance";

export default function DarkModeToggle() {
  const { appearance, updateAppearance, isDark } = useAppearance();

  const toggle = () => {
    const next: Appearance = isDark ? "light" : "dark";
    updateAppearance(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">{appearance}</span>
    </Button>
  );
}

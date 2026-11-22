import { useEffect, useState } from "react";

export type Theme = "bright" | "night";

const KEY = "drew-theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "night" ? "night" : "bright";
  } catch {
    return "bright";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "night" ? "#12100e" : "#f3efe6");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("bright");

  useEffect(() => {
    const next = readTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex rounded-full border border-line bg-elevated p-0.5 text-xs">
      <button
        type="button"
        aria-pressed={theme === "bright"}
        onClick={() => choose("bright")}
        className={`h-7 rounded-full px-2.5 ${theme === "bright" ? "bg-fg text-bg" : "text-muted"}`}
      >
        Bright
      </button>
      <button
        type="button"
        aria-pressed={theme === "night"}
        onClick={() => choose("night")}
        className={`h-7 rounded-full px-2.5 ${theme === "night" ? "bg-fg text-bg" : "text-muted"}`}
      >
        Night
      </button>
    </div>
  );
}

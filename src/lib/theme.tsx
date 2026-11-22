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

const LAYOUT_KEY = "drew-layout";

export function readWide(): boolean {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved === "desktop") return true;
    if (saved === "phone") return false;
  } catch {
    /* private mode */
  }
  return typeof window !== "undefined" && window.innerWidth >= 1100;
}

export function writeWide(next: boolean) {
  try {
    localStorage.setItem(LAYOUT_KEY, next ? "desktop" : "phone");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("drew-layout"));
}

export function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const sync = () => setWide(readWide());
    sync();
    window.addEventListener("drew-layout", sync);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("drew-layout", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return wide;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("bright");
  const wide = useWide();

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
        className={`h-9 rounded-full px-3 ${theme === "bright" ? "bg-fg text-bg" : "text-muted"}`}
      >
        Day
      </button>
      <button
        type="button"
        aria-pressed={theme === "night"}
        onClick={() => choose("night")}
        className={`h-9 rounded-full px-3 ${theme === "night" ? "bg-fg text-bg" : "text-muted"}`}
      >
        Night
      </button>
      <button
        type="button"
        aria-pressed={wide}
        onClick={() => writeWide(!readWide())}
        className={`h-9 rounded-full px-3 ${wide ? "bg-fg text-bg" : "text-muted"}`}
      >
        Desktop
      </button>
    </div>
  );
}

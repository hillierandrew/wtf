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

const HORIZ_KEY = "drew-horizontal";

function isPhoneLandscape() {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 700 && window.innerHeight <= 520 && window.innerWidth > window.innerHeight;
}

export function readHorizontal(): boolean | null {
  try {
    const saved = localStorage.getItem(HORIZ_KEY);
    if (saved === "on") return true;
    if (saved === "off") return false;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeHorizontal(next: boolean) {
  try {
    localStorage.setItem(HORIZ_KEY, next ? "on" : "off");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("drew-layout"));
}

export function horizontalOn() {
  const saved = readHorizontal();
  if (saved === true) return true;
  if (saved === false) return false;
  return isPhoneLandscape();
}

export function readPane(): boolean {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  if (readWide() && width >= 768) return true;
  if (readHorizontal() === true && width >= 640) return true;
  if (readHorizontal() !== false && isPhoneLandscape()) return true;
  return false;
}

export function usePane() {
  const [pane, setPane] = useState(false);
  useEffect(() => {
    const sync = () => setPane(readPane());
    sync();
    window.addEventListener("drew-layout", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("drew-layout", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);
  return pane;
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
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const next = readTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    const sync = () => setFlat(horizontalOn());
    sync();
    window.addEventListener("drew-layout", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("drew-layout", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  const on = "h-9 min-w-9 rounded-full px-2 text-lg bg-fg";
  const off = "h-9 min-w-9 rounded-full px-2 text-lg";

  return (
    <div className="flex rounded-full border border-line bg-elevated p-0.5">
      <button type="button" aria-label="Day" aria-pressed={theme === "bright"} onClick={() => choose("bright")} className={theme === "bright" ? on : off}>
        ☀️
      </button>
      <button type="button" aria-label="Night" aria-pressed={theme === "night"} onClick={() => choose("night")} className={theme === "night" ? on : off}>
        🌙
      </button>
      <button type="button" aria-label="Desktop" aria-pressed={wide} onClick={() => writeWide(!readWide())} className={wide ? on : off}>
        🖥️
      </button>
      <button type="button" aria-label="Horizontal" aria-pressed={flat} onClick={() => writeHorizontal(!horizontalOn())} className={flat ? on : off}>
        <span className="inline-block -rotate-90 text-base leading-none">📱</span>
      </button>
    </div>
  );
}

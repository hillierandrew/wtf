import { useState } from "react";
import { CATS, type Build, type Part } from "@/lib/catalog";

export function partLine(part: { brand?: string; name: string }) {
  const name = part.name.replace(/\(open\s?box\)/i, "").trim();
  const brand = part.brand?.trim();
  if (!brand || name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  return `${brand} ${name}`;
}

export function buildNames(build: Build) {
  const names: string[] = [];
  for (const cat of CATS) {
    const part = build[cat];
    if (part) names.push(partLine(part));
  }
  return names;
}

export function listText(title: string, names: string[]) {
  return [title, ...names.map((name, index) => `${index + 1}. ${name}`)].join("\n");
}

export function CopyList({ title, names, className }: { title: string; names: string[]; className?: string }) {
  const [done, setDone] = useState(false);
  if (!names.length) return null;
  return (
    <button
      type="button"
      className={className ?? "mt-3 h-11 w-full rounded-xl border border-line text-sm"}
      onClick={async (event) => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(listText(title, names));
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied" : "Copy list"}
    </button>
  );
}

export function named(parts: Array<Part | undefined>) {
  return parts.filter((part): part is Part => Boolean(part)).map(partLine);
}

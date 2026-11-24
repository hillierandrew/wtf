import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CAT_LABEL, PARTS, money, type Category } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

export type ColourFilter = "white" | "black" | "all";

const KINDS: Category[] = ["case", "cooler", "gpu"];

const SWATCH: Record<ColourFilter, string> = {
  white: "#f7f4ee",
  black: "#1c1612",
  all: "linear-gradient(135deg, #f7f4ee 50%, #1c1612 50%)",
};

const FILTERS: { id: ColourFilter; label: string; line: string }[] = [
  { id: "white", label: "White", line: "Cases, coolers, and graphics cards with white in the name." },
  { id: "black", label: "Black", line: "Cases, coolers, and graphics cards with black in the name." },
  { id: "all", label: "Both", line: "Every white or black case, cooler, and card." },
];

function colourOf(name: string): "white" | "black" | "" {
  if (/\bwhite\b/i.test(name)) return "white";
  if (/\bblack\b/i.test(name)) return "black";
  return "";
}

export function Colour({ onLeave, start = "white" }: { onLeave: () => void; start?: ColourFilter }) {
  const [filter, setFilter] = useState<ColourFilter>(start);
  const [query, setQuery] = useState("");
  const wide = usePane();

  useEffect(() => {
    setFilter(start);
  }, [start]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARTS.filter((part) => {
      if (!KINDS.includes(part.cat)) return false;
      if (/open box/i.test(part.name)) return false;
      const colour = colourOf(part.name);
      if (!colour) return false;
      if (filter !== "all" && colour !== filter) return false;
      if (q && !`${part.brand} ${part.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.cat.localeCompare(b.cat) || a.price - b.price);
  }, [filter, query]);

  const meta = FILTERS.find((item) => item.id === filter)!;

  return (
    <div className={`mx-auto flex h-full w-full overflow-hidden bg-bg text-fg ${wide ? "max-w-6xl flex-row" : "max-w-xl flex-col"}`}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="safe-top shrink-0 border-b border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onLeave} className="text-base text-muted">
              Welcome
            </button>
            <ThemeToggle />
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Colour</h1>
          <p className="mt-2 text-base text-muted">White or black. The name has to say the colour.</p>
        </header>
        <div className="grid shrink-0 grid-cols-3 gap-2 px-4 pt-3">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-base sm:h-14 sm:flex-row sm:gap-2 sm:text-lg ${filter === item.id ? "border-accent bg-subtle" : "border-line"}`}
            >
              <span className="size-5 rounded-full border border-line" style={{ background: SWATCH[item.id] }} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <p className="text-base text-muted">{meta.line}</p>
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
            <Search className="size-4 text-muted" strokeWidth={1.75} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-base outline-none" />
          </label>
          <ul className={wide ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
            {shown.length === 0 ? (
              <li className="rounded-2xl border border-line bg-elevated px-3 py-4 text-base text-muted">Nothing matches.</li>
            ) : (
              shown.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-elevated">
                  <div className="flex w-full items-start justify-between gap-3 px-3 py-4 text-left">
                    <span className="min-w-0">
                      <span className="block text-sm text-muted">{CAT_LABEL[item.cat]} · {item.brand}</span>
                      <span className="mt-1 block text-base font-medium leading-snug">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tabular block text-base font-medium">{money(item.price)}</span>
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

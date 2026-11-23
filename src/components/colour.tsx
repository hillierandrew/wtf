import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import rawLaptops from "@/data/laptops.json";
import { PARTS, money } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

type Laptop = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  kind: string;
  specs: string;
};

const LAPTOPS = rawLaptops as Laptop[];
const PREBUILDS = PARTS.filter((part) => part.cat === "prebuilt");

type ColourFilter = "white-laptop" | "black-laptop" | "all-laptop" | "white-build";

const FILTERS: { id: ColourFilter; label: string; line: string }[] = [
  { id: "white-laptop", label: "White Laptops", line: "Laptops with white in the name." },
  { id: "black-laptop", label: "Black Laptops", line: "Laptops with black in the name." },
  { id: "all-laptop", label: "Laptops", line: "Every laptop." },
  { id: "white-build", label: "All White Builds", line: "Prebuilt PCs with white in the name." },
];

function matches(name: string, colour: string) {
  return name.toLowerCase().includes(colour);
}

export function Colour({ onLeave }: { onLeave: () => void }) {
  const [filter, setFilter] = useState<ColourFilter>("white-laptop");
  const [query, setQuery] = useState("");
  const wide = usePane();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter === "white-build") {
      return PREBUILDS.filter((part) => {
        if (!matches(part.name, "white")) return false;
        if (q && !`${part.brand} ${part.name}`.toLowerCase().includes(q)) return false;
        return true;
      }).map((part) => ({
        id: part.id,
        brand: part.brand,
        name: part.name,
        price: part.price,
        specs: part.name,
        kind: "prebuilt",
      }));
    }
    const colour = filter === "white-laptop" ? "white" : filter === "black-laptop" ? "black" : "";
    return LAPTOPS.filter((item) => {
      if (colour && !matches(item.name, colour)) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
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
          <p className="mt-2 text-base text-muted">White laptops, black laptops, all laptops, or all white builds.</p>
        </header>
        <div className="grid shrink-0 grid-cols-2 gap-2 px-4 pt-3">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-14 rounded-2xl border text-lg ${filter === item.id ? "border-accent bg-subtle" : "border-line"}`}
            >
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
          <ul className="flex flex-col gap-2">
            {shown.length === 0 ? (
              <li className="rounded-2xl border border-line bg-elevated px-3 py-4 text-base text-muted">Nothing matches yet. Names do not list colours much.</li>
            ) : (
              shown.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-elevated">
                  <div className="flex w-full items-start justify-between gap-3 px-3 py-4 text-left">
                    <span className="min-w-0">
                      <span className="block text-sm text-muted">{item.brand}</span>
                      <span className="mt-1 block text-base font-medium leading-snug">{item.name}</span>
                      {"specs" in item && item.specs ? <span className="mt-1 block text-sm text-muted">{item.specs}</span> : null}
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

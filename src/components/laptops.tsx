import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import raw from "@/data/laptops.json";
import { ThemeToggle } from "@/lib/theme";

type Kind = "game" | "home" | "work" | "tablet" | "chrome";
type Filter = "deal" | "games" | "work" | "school" | "create" | "tablet" | "chrome";

type Laptop = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  kind: Kind;
  renewed: boolean;
  open: boolean;
  gpu: number;
  score: number;
  deal: number;
  specs: string;
};

const ITEMS = raw as Laptop[];
const KEY = "drew-laptop";

const FILTERS: { id: Filter; label: string; line: string }[] = [
  { id: "deal", label: "Best deal", line: "Most computer for the money. A higher deal number is better." },
  { id: "games", label: "Games", line: "Strongest for games first. The deal number shows if the price is fair." },
  { id: "work", label: "Work", line: "Email, office, and class. These are the work laptops." },
  { id: "school", label: "School", line: "Home and school. Not a gaming laptop." },
  { id: "create", label: "Create", line: "Photos, video, and big files. Lots of memory, or a graphics chip." },
  { id: "tablet", label: "Tablet", line: "A tablet. It is not a laptop." },
  { id: "chrome", label: "Chromebook", line: "For the web and school. Not for heavy games." },
];

function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function fits(item: Laptop, filter: Filter) {
  if (filter === "deal") return item.kind !== "tablet" && item.kind !== "chrome";
  if (filter === "games") return item.kind === "game" || item.gpu >= 45;
  if (filter === "work") return item.kind === "work";
  if (filter === "school") return (item.kind === "home" || item.kind === "chrome") && item.gpu < 45;
  if (filter === "create") return item.kind !== "tablet" && item.kind !== "chrome" && (item.gpu > 0 || item.specs.includes("32GB") || item.specs.includes("64GB"));
  if (filter === "tablet") return item.kind === "tablet";
  return item.kind === "chrome";
}

export function Laptops({ onLeave }: { onLeave: () => void }) {
  const [filter, setFilter] = useState<Filter>("deal");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [renewed, setRenewed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setPicked(saved);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, picked);
  }, [picked]);

  const brands = useMemo(() => {
    const names = new Set(ITEMS.filter((item) => fits(item, filter)).map((item) => item.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [filter]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (!fits(item, filter)) return false;
      if (!openBox && item.open) return false;
      if (!renewed && item.renewed) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      if (filter === "games" || filter === "work" || filter === "create") {
        return b.score - a.score || b.deal - a.deal;
      }
      return b.deal - a.deal || b.score - a.score;
    });
  }, [filter, query, brand, openBox, renewed]);

  const choice = ITEMS.find((item) => item.id === picked);
  const meta = FILTERS.find((item) => item.id === filter)!;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Pick a laptop</h1>
        <p className="mt-2 text-base text-muted">One laptop. Games, work, or the best price.</p>
      </header>
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setBrand("all");
              setQuery("");
            }}
            className={`h-12 shrink-0 rounded-full border px-4 text-base ${filter === item.id ? "border-accent bg-subtle" : "border-line"}`}
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpenBox((value) => !value)} className={`h-11 rounded-full border px-4 text-base ${openBox ? "border-accent bg-subtle" : "border-line"}`}>
            {openBox ? "Open box on" : "Open box off"}
          </button>
          <button type="button" onClick={() => setRenewed((value) => !value)} className={`h-11 rounded-full border px-4 text-base ${renewed ? "border-accent bg-subtle" : "border-line"}`}>
            {renewed ? "Renewed on" : "Renewed off"}
          </button>
        </div>
        <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-elevated px-3 text-base">
          <option value="all">Every brand</option>
          {brands.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <ul className="flex flex-col gap-2">
          {shown.map((item) => {
            const selected = picked === item.id;
            return (
              <li key={item.id}>
                <button type="button" onClick={() => setPicked(item.id)} className={`press flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-4 text-left ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {item.brand}
                      {selected ? <Check className="size-4 text-accent" /> : null}
                    </span>
                    <span className="mt-1 block text-base font-medium leading-snug">{item.name.replace(" (Open box)", "")}</span>
                    <span className="mt-1 block text-sm text-muted">{item.specs}</span>
                    <span className="mt-1 block text-sm text-muted">Deal {item.deal} · higher is more for the money</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-base font-medium">{money(item.price)}</span>
                    {item.was ? <span className="block text-sm text-ok">Down {money(item.was - item.price)}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="safe-bottom shrink-0 border-t border-line bg-elevated px-4 py-3">
        <p className="text-base font-medium">{choice ? money(choice.price) : "No laptop yet"}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-base">{choice ? choice.name.replace(" (Open box)", "") : "Tap one laptop."}</span>
          {choice ? (
            <button type="button" onClick={() => setPicked("")} aria-label="Remove" className="flex size-11 items-center justify-center rounded-full border border-line">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

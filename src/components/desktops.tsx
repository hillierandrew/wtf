import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { PARTS, machineScore, money, tagsOf, type Part } from "@/lib/catalog";
import { RankBadge } from "@/components/rank";
import { ThemeToggle } from "@/lib/theme";

type Filter = "all" | "gaming" | "desk" | "mini" | "aio";

const FILTERS: { id: Filter; label: string; line: string }[] = [
  { id: "all", label: "All", line: "Every finished PC. Score is 0 to 100. Higher is a stronger computer." },
  { id: "gaming", label: "Gaming", line: "These have a graphics card. Score is 0 to 100." },
  { id: "desk", label: "Desk", line: "Office and home. No big graphics card." },
  { id: "mini", label: "Mini", line: "A small box. Easy to hide." },
  { id: "aio", label: "All-in-one", line: "The screen is built in." },
];

const KEY = "drew-desktop";

function fits(part: Part, filter: Filter) {
  if (filter === "gaming") return part.form === "gaming" || /RTX|RX\s?\d|GEFORCE|RADEON/i.test(part.name);
  if (filter === "mini") return part.form === "mini";
  if (filter === "aio") return part.form === "aio";
  if (filter === "desk") return part.form === "desk" || part.form === "aio";
  return true;
}

export function Desktops({ onLeave }: { onLeave: () => void }) {
  const items = useMemo(() => PARTS.filter((part) => part.cat === "prebuilt"), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [byDeal, setByDeal] = useState(false);

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
    const names = new Set(items.filter((part) => fits(part, filter)).map((part) => part.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [items, filter]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((part) => {
        if (!fits(part, filter)) return false;
        if (!openBox && /open\s?box/i.test(part.name)) return false;
        if (brand !== "all" && part.brand !== brand) return false;
        if (q && !`${part.brand} ${part.name}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const aScore = machineScore(a.name);
        const bScore = machineScore(b.name);
        if (byDeal) return bScore / b.price - aScore / a.price || bScore - aScore;
        return bScore - aScore || a.price - b.price;
      });
  }, [items, filter, query, brand, openBox, byDeal]);

  const choice = items.find((part) => part.id === picked);
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
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Prebuilds</h1>
        <p className="mt-2 text-base text-muted">One finished PC. Score is 0 to 100. Renewed ones are included.</p>
      </header>
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setBrand("all");
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
          <button type="button" onClick={() => setByDeal((value) => !value)} className={`h-11 rounded-full border px-4 text-base ${byDeal ? "border-accent bg-subtle" : "border-line"}`}>
            {byDeal ? "Best deal" : "Best score"}
          </button>
          <button type="button" onClick={() => setOpenBox((value) => !value)} className={`h-11 rounded-full border px-4 text-base ${openBox ? "border-accent bg-subtle" : "border-line"}`}>
            {openBox ? "Open box on" : "Open box off"}
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
          {shown.map((part) => {
            const selected = picked === part.id;
            const score = machineScore(part.name);
            return (
              <li key={part.id}>
                <button type="button" onClick={() => setPicked(part.id)} className={`press flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-4 text-left ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {part.brand}
                      {selected ? <Check className="size-4 text-accent" /> : null}
                    </span>
                    <span className="mt-1 block text-base font-medium leading-snug">{part.name.replace(/\(Open Box\)/i, "").trim()}</span>
                    <span className="mt-1 block text-sm text-muted">{tagsOf(part).join(" · ")}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <RankBadge score={score} />
                      {money(part.price / score)} per point
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-2xl font-medium">{score}</span>
                    <span className="tabular block text-base font-medium">{money(part.price)}</span>
                    {part.was ? <span className="block text-sm text-ok">Down {money(part.was - part.price)}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="safe-bottom shrink-0 border-t border-line bg-elevated px-4 py-3">
        <p className="text-base font-medium">{choice ? `${money(choice.price)} · Score ${machineScore(choice.name)}/100` : "No PC yet"}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-base">{choice ? choice.name.replace(/\(Open Box\)/i, "").trim() : "Tap one PC."}</span>
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

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import raw from "@/data/desk.json";
import { ThemeToggle } from "@/lib/theme";

type Kind = "keyboard" | "mouse" | "pad" | "combo";

type DeskItem = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  kind: Kind;
  open: boolean;
  tags: string[];
};

const ITEMS = raw as DeskItem[];
const KEY = "drew-desk";

const STEPS: { id: Kind; label: string; line: string }[] = [
  { id: "keyboard", label: "Keyboard", line: "One keyboard. A combo is a keyboard and a mouse together." },
  { id: "mouse", label: "Mouse", line: "One mouse. Skip this if the keyboard is a combo." },
  { id: "pad", label: "Mouse pad", line: "Optional. The mouse works without one." },
];

function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function short(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

export function Desk({ onLeave }: { onLeave: () => void }) {
  const [step, setStep] = useState<Kind>("keyboard");
  const [ids, setIds] = useState<Partial<Record<Kind, string>>>({});
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [filter, setFilter] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [limit, setLimit] = useState(24);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const rawIds = localStorage.getItem(KEY);
      if (rawIds) setIds(JSON.parse(rawIds) as Partial<Record<Kind, string>>);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* private mode */
    }
  }, [ids]);

  const picked = useMemo(() => {
    const out: Partial<Record<Kind, DeskItem>> = {};
    for (const item of ITEMS) {
      if (ids[item.kind] === item.id) out[item.kind] = item;
    }
    return out;
  }, [ids]);

  const brands = useMemo(() => {
    const names = new Set(ITEMS.filter((item) => item.kind === step || (step === "keyboard" && item.kind === "combo")).map((item) => item.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [step]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (step === "keyboard") {
        if (item.kind !== "keyboard" && item.kind !== "combo") return false;
      } else if (item.kind !== step) return false;
      if (!openBox && item.open) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (filter === "gaming" && !item.tags.includes("Gaming")) return false;
      if (filter === "office" && !item.tags.includes("Office")) return false;
      if (filter === "wireless" && !item.tags.includes("Wireless")) return false;
      if (filter === "small" && !item.tags.includes("Small")) return false;
      if (filter === "full" && !item.tags.includes("Full size")) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.price - b.price);
  }, [step, query, brand, filter, openBox]);

  function choose(item: DeskItem) {
    setIds((current) => {
      const next = { ...current };
      if (item.kind === "combo") {
        delete next.keyboard;
        delete next.mouse;
        next.combo = item.id;
      } else if (item.kind === "keyboard") {
        delete next.combo;
        next.keyboard = item.id;
      } else if (item.kind === "mouse") {
        delete next.combo;
        next.mouse = item.id;
      } else next.pad = item.id;
      return next;
    });
    setNotice(item.kind === "combo" ? "Combo added. That is the keyboard and the mouse." : "Added. You still have one.");
  }

  function remove(kind: Kind) {
    setIds((current) => {
      const next = { ...current };
      delete next[kind];
      return next;
    });
  }

  const rows = (["keyboard", "combo", "mouse", "pad"] as Kind[]).map((kind) => picked[kind]).filter(Boolean) as DeskItem[];
  const total = rows.reduce((sum, item) => sum + item.price, 0);
  const stepMeta = STEPS.find((item) => item.id === step)!;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Build a keyboard</h1>
        <p className="mt-2 text-base text-muted">These work with any PC. You cannot pick two keyboards.</p>
      </header>
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setStep(item.id);
              setQuery("");
              setBrand("all");
              setFilter("all");
              setLimit(24);
            }}
            className={`h-12 shrink-0 rounded-full border px-4 text-base ${step === item.id ? "border-accent bg-accent text-accent-fg" : "border-line bg-elevated"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        <p className="text-base text-muted">{stepMeta.line}</p>
        {notice ? <p className="rounded-2xl border border-line bg-elevated px-4 py-3 text-base">{notice}</p> : null}
        <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
          <Search className="size-4 text-muted" strokeWidth={1.75} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-base outline-none" />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["gaming", "Gaming"],
            ["office", "Office"],
            ["wireless", "Wireless"],
            ["small", "Small"],
            ["full", "Full size"],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`h-11 rounded-full border px-4 text-base ${filter === id ? "border-accent bg-subtle" : "border-line"}`}>
              {label}
            </button>
          ))}
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
          {shown.slice(0, limit).map((item) => {
            const selected = ids[item.kind] === item.id;
            return (
              <li key={item.id}>
                <button type="button" onClick={() => choose(item)} className={`press flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-4 text-left ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {item.brand}
                      {selected ? <Check className="size-4 text-accent" /> : null}
                    </span>
                    <span className="mt-1 block text-base font-medium leading-snug">{short(item.name)}</span>
                    {item.tags.length ? <span className="mt-1 block text-sm text-muted">{item.tags.join(" · ")}</span> : null}
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
        {shown.length > limit ? (
          <button type="button" onClick={() => setLimit((value) => value + 24)} className="h-12 w-full rounded-2xl border border-line text-base">
            Show more
          </button>
        ) : null}
      </div>
      <aside className="safe-bottom shrink-0 border-t border-line bg-elevated px-4 py-3">
        <p className="text-base font-medium">
          {rows.length} {rows.length === 1 ? "thing" : "things"} · {money(total)}
        </p>
        <ul className="mt-2 space-y-2">
          {rows.length === 0 ? <li className="text-base text-muted">Nothing yet. Tap a keyboard.</li> : null}
          {rows.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-base">{short(item.name)}</span>
              <button type="button" onClick={() => remove(item.kind)} aria-label="Remove" className="flex size-11 items-center justify-center rounded-full border border-line">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

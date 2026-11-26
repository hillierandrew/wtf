import { useEffect, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import laptopsRaw from "@/data/laptops.json";
import { CAT_LABEL, PARTS, byId, explainLaptop, explainPart, isJunk, laptopBits, money, partScore, tagsOf, type Category } from "@/lib/catalog";
import { RankBadge } from "@/components/rank";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { HistoryRoot, latest, usePath } from "@/components/history";

type Card = { id: string; name: string; brand: string; price: number };
type Shelf = { id: string; title: string; line: string };

const SHELVES: Shelf[] = [
  { id: "prebuilt", title: "Desktops", line: "Whole computers" },
  { id: "laptop", title: "Laptops", line: "Screens you carry" },
  { id: "cpu", title: "Processors", line: "The chip" },
  { id: "gpu", title: "Graphics", line: "The picture" },
  { id: "memory", title: "Memory", line: "Short memory" },
  { id: "motherboard", title: "Boards", line: "What it plugs into" },
  { id: "storage", title: "Drives", line: "Where files live" },
  { id: "case", title: "Cases", line: "The box" },
  { id: "cooler", title: "Coolers", line: "Keeps it quiet" },
  { id: "psu", title: "Power", line: "The supply" },
  { id: "monitor", title: "Screens", line: "The glass you look at" },
];

const LAPS = laptopsRaw as { id: string; name: string; price: number; brand: string; kind?: string; gpu: number; specs: string }[];

function blip() {
  try {
    const ctx = new AudioContext();
    const note = ctx.createOscillator();
    const gain = ctx.createGain();
    note.type = "triangle";
    note.frequency.setValueAtTime(640, ctx.currentTime);
    note.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    note.connect(gain);
    gain.connect(ctx.destination);
    note.start();
    note.stop(ctx.currentTime + 0.13);
    note.onended = () => void ctx.close();
  } catch {
    /* a quiet tap is fine */
  }
}

function linesOf(item: Card): string[] {
  const part = byId.get(item.id);
  if (part) return explainPart(part);
  const lap = LAPS.find((row) => row.id === item.id);
  if (lap) return explainLaptop(lap);
  return ["No formula for this one."];
}

function scoreOf(item: Card) {
  const part = byId.get(item.id);
  if (part) return partScore(part);
  const lap = LAPS.find((row) => row.id === item.id);
  return lap ? laptopBits(lap).score : 0;
}

function cardsFor(id: string): Card[] {
  if (id === "laptop") {
    return LAPS.filter((item) => item.kind !== "tablet" && item.price > 0)
      .map((item) => ({ id: item.id, name: item.name.replace(/\(open box\)/i, "").trim(), brand: item.brand, price: item.price }))
      .sort((a, b) => a.price - b.price);
  }
  return PARTS.filter((part) => part.cat === (id as Category) && !isJunk(part, true))
    .map((part) => ({ id: part.id, name: part.name.replace(/\(open box\)/i, "").trim(), brand: part.brand, price: part.price }))
    .sort((a, b) => a.price - b.price);
}

export function GlassStore({ onLock }: { onLock: () => void }) {
  return (
    <HistoryRoot home="Liquid">
      <GlassBody onLock={onLock} />
    </HistoryRoot>
  );
}

function GlassBody({ onLock }: { onLock: () => void }) {
  const [shelf, setShelf] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Card | null>(null);
  const [limit, setLimit] = useState(24);
  const [panel, setPanel] = useState<"shop" | "build" | "keys" | "sim">("shop");
  const [sort, setSort] = useState<"low" | "high" | "score" | "score-low">("low");
  const [grid, setGrid] = useState(false);
  const path = usePath();

  useEffect(() => {
    if (!path) return;
    const panelId = latest(path.log, path.at, (id) => id === "build" || id === "keys" || id === "sim" || id === "home");
    setPanel(panelId === "build" || panelId === "keys" || panelId === "sim" ? panelId : "shop");
    const shelfId = latest(path.log, path.at, (id) => id.startsWith("shelf-"));
    setShelf(shelfId ? shelfId.slice(6) : null);
  }, [path?.at]);

  const rows = useMemo(() => {
    if (!shelf) return [];
    const q = query.trim().toLowerCase();
    return cardsFor(shelf)
      .filter((item) => !q || `${item.brand} ${item.name}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "high") return b.price - a.price;
        if (sort === "score") return scoreOf(b) - scoreOf(a);
        if (sort === "score-low") return scoreOf(a) - scoreOf(b);
        return a.price - b.price;
      });
  }, [shelf, query, sort]);

  const current = SHELVES.find((item) => item.id === shelf);

  function chooseShelf(id: string) {
    blip();
    setShelf(id);
    setQuery("");
    setPicked(null);
    setHot(null);
    setLimit(24);
    path?.note(`shelf-${id}`, SHELVES.find((item) => item.id === id)?.title ?? id);
  }

  function chooseItem(item: Card) {
    blip();
    setPicked(item);
    path?.note(`pick:${item.id}`, item.name.slice(0, 22));
  }

  if (panel === "build") return <Counter onClose={() => setPanel("shop")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("shop")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("shop")} />;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(168,85,247,0.55),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.4),transparent_46%),radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.18),transparent_40%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.55) 4px)" }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.42em] text-[#e9d5ff]">RETRO COUNTER</p>
            <h1 className="font-display bg-gradient-to-b from-white via-[#f5d0fe] to-[#c084fc] bg-clip-text text-4xl font-medium tracking-tight text-transparent">Liquid</h1>
          </div>
          <button type="button" onClick={() => { blip(); onLock(); }} aria-label="Lock" className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl">
            <Lock className="size-4" />
          </button>
        </header>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => { blip(); path?.note("build", "Build"); setPanel("build"); }} className="h-11 rounded-full bg-white/15 px-4 text-sm">Build with them</button>
          <button type="button" onClick={() => { blip(); path?.note("keys", "Keyboards"); setPanel("keys"); }} className="h-11 rounded-full bg-white/15 px-4 text-sm">Keyboards</button>
          <button type="button" onClick={() => { blip(); path?.note("sim", "Sims"); setPanel("sim"); }} className="h-11 rounded-full bg-white/15 px-4 text-sm">Sims</button>
        </div>

        {!shelf ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ perspective: "900px" }} onMouseLeave={() => setHot(null)}>
            {SHELVES.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHot(item.id)}
                onFocus={() => setHot(item.id)}
                onClick={() => chooseShelf(item.id)}
                className={`min-h-28 rounded-3xl border border-white/35 bg-white/10 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-300 ${hot === item.id ? "z-10 -translate-y-3 scale-105 shadow-[0_30px_50px_rgba(168,85,247,0.35)]" : hot ? "scale-95 opacity-45" : ""}`}
              >
                <span className="block text-xl font-medium">{item.title}</span>
                <span className="mt-1 block text-sm text-[#e9d5ff]">{item.line}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 min-h-0 flex-1">
            <button type="button" onClick={() => { blip(); setShelf(null); setPicked(null); }} className="text-sm text-[#e9d5ff]">
              All shelves
            </button>
            <h2 className="mt-1 text-3xl font-medium">{current?.title ?? CAT_LABEL.cpu}</h2>
            <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-3 backdrop-blur-xl">
              <Search className="size-4 text-[#e9d5ff]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this shelf" className="h-full w-full bg-transparent text-base outline-none placeholder:text-white/40" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["low", "Price low"],
                  ["high", "Price high"],
                  ["score", "Score high"],
                  ["score-low", "Score low"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" onClick={() => { blip(); setSort(id); }} className={`h-10 rounded-full px-3 text-sm ${sort === id ? "bg-white text-black" : "bg-white/15 text-white"}`}>
                  {label}
                </button>
              ))}
              <button type="button" onClick={() => { blip(); setGrid((value) => !value); }} className="h-10 rounded-full bg-white/15 px-3 text-sm">{grid ? "List" : "Grid"}</button>
            </div>
            <ul className={`mt-3 ${grid ? "grid grid-cols-2 gap-2" : "space-y-2"}`} style={{ perspective: "900px" }} onMouseLeave={() => setHot(null)}>
              {rows.slice(0, limit).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHot(item.id)}
                    onFocus={() => setHot(item.id)}
                    onClick={() => chooseItem(item)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-left backdrop-blur-xl transition duration-300 ${hot === item.id ? "z-10 -translate-y-1 scale-[1.03] shadow-[0_16px_40px_rgba(168,85,247,0.35)]" : hot ? "opacity-50" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.16em] text-[#e9d5ff]">{item.brand}</span>
                      <span className="mt-0.5 block text-base leading-snug">{item.name}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {(byId.get(item.id) ? tagsOf(byId.get(item.id)!) : []).slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#e9d5ff]">{tag}</span>
                        ))}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-medium">{money(item.price)}</span>
                      <span className="mt-1 block">
                        <RankBadge score={scoreOf(item)} lines={linesOf(item)} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {rows.length > limit ? (
              <button type="button" onClick={() => { blip(); setLimit((value) => value + 24); }} className="mt-3 h-12 w-full rounded-full border border-white/30 bg-white/10 text-base backdrop-blur-xl">
                Show more
              </button>
            ) : null}
            {rows.length === 0 ? <p className="mt-6 text-center text-white/70">Nothing on this shelf.</p> : null}
          </div>
        )}
      </div>

      {picked ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setPicked(null)}>
          <div className="glass-in w-full max-w-md rounded-3xl border border-white/40 bg-white/15 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl" onClick={(event) => event.stopPropagation()} style={{ transform: "translateZ(40px)" }}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#f5d0fe]">{picked.brand}</p>
            <p className="mt-2 text-2xl font-medium leading-tight">{picked.name}</p>
            <p className="mt-4 text-3xl">{money(picked.price)}</p>
            <button type="button" onClick={() => { blip(); setPicked(null); }} className="mt-5 h-12 w-full rounded-full bg-[#7c3aed] text-base font-medium text-white">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

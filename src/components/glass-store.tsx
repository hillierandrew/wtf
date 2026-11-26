import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import laptopsRaw from "@/data/laptops.json";
import { PARTS, byId, dealFrom, explainLaptop, explainPart, isJunk, laptopBits, money, partScore, tagsOf, type Category } from "@/lib/catalog";
import { laptopBlob, laptopFace, releaseYear, tagPaint } from "@/lib/facts";
import { RankBadge } from "@/components/rank";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { Bundles } from "@/components/bundles";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { AddButton, BagDock, ThreeSearch } from "@/components/bag";
import { Five } from "@/components/five";
import { lapBag, partBag } from "@/lib/bag";

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
  { id: "mount", title: "Mounts", line: "Arms and stands" },
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
    <HistoryRoot home="6767" onLock={onLock}>
      <GlassBody onLock={onLock} />
      <BagDock />
    </HistoryRoot>
  );
}

function GlassBody({ onLock }: { onLock: () => void }) {
  const [shelf, setShelf] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Card | null>(null);
  const [limit, setLimit] = useState(24);
  const [panel, setPanel] = useState<"shop" | "build" | "keys" | "sim" | "deals">("shop");
  const [sort, setSort] = useState<"low" | "high" | "score" | "score-low">("low");
  const [grid, setGrid] = useState(false);
  const [five, setFive] = useState(false);
  const path = usePath();

  useEffect(() => {
    if (!path) return;
    const panelId = latest(path.log, path.at, (id) => id === "build" || id === "keys" || id === "sim" || id === "deals" || id === "home");
    const nextPanel = panelId === "build" || panelId === "keys" || panelId === "sim" || panelId === "deals" ? panelId : "shop";
    setPanel(nextPanel);
    const shelfId = latest(path.log, path.at, (id) => id.startsWith("shelf-"));
    const nextShelf = shelfId ? shelfId.slice(6) : null;
    setShelf(nextShelf);
    setFive(Boolean(latest(path.log, path.at, (id) => id === "five")));
    const pickId = latest(path.log, path.at, (id) => id.startsWith("pick:"));
    if (pickId && nextShelf) {
      const id = pickId.slice(5);
      setPicked(cardsFor(nextShelf).find((item) => item.id === id) ?? null);
    } else {
      setPicked(null);
    }
  }, [path?.at]);

  const rows = useMemo(() => {
    if (!shelf) return [];
    const q = query.trim().toLowerCase();
    return cardsFor(shelf)
      .filter((item) => {
        if (!q) return true;
        if (shelf === "laptop") {
          const lap = LAPS.find((row) => row.id === item.id);
          return lap ? laptopBlob(lap).includes(q) : `${item.brand} ${item.name}`.toLowerCase().includes(q);
        }
        return `${item.brand} ${item.name}`.toLowerCase().includes(q);
      })
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
    setLimit(24);
    path?.note(`shelf-${id}`, SHELVES.find((item) => item.id === id)?.title ?? id);
  }

  function chooseItem(item: Card) {
    blip();
    setPicked(item);
    path?.note(`pick:${item.id}`, item.name.slice(0, 22));
  }

  function leaveTo(test: (id: string) => boolean, fallback: () => void) {
    if (path && test(path.log[path.at]?.id ?? "")) path.back();
    else fallback();
  }

  if (five) return <Five onClose={() => leaveTo((id) => id === "five", () => setFive(false))} />;
  if (panel === "build") return <Counter onClose={() => leaveTo((id) => id === "build", () => setPanel("shop"))} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => leaveTo((id) => id === "keys", () => setPanel("shop"))} />;
  if (panel === "sim") return <Sim onLeave={() => leaveTo((id) => id === "sim", () => setPanel("shop"))} />;
  if (panel === "deals") return <Bundles onLeave={() => leaveTo((id) => id === "deals", () => setPanel("shop"))} />;

  return (
    <div className="h-full overflow-y-auto bg-[#f2f2f7] text-[#1c1c1e]">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-28 pt-3">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">6767</p>
            <h1 className="text-[34px] font-semibold leading-none tracking-tight">Store</h1>
          </div>
          <button type="button" onClick={onLock} className="mb-1 text-[17px] font-medium text-[#007aff]">
            Lock
          </button>
        </header>
        <p className="mt-2 text-[17px] leading-snug text-[#8e8e93]">Tap a shelf. The price is what they pay today, once.</p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(
            [
              ["five", "Five minutes", () => { path?.note("five", "Five minutes"); setFive(true); }],
              ["build", "Build", () => { path?.note("build", "Build"); setPanel("build"); }],
              ["keys", "Keyboards", () => { path?.note("keys", "Keyboards"); setPanel("keys"); }],
              ["sim", "Sims", () => { path?.note("sim", "Sims"); setPanel("sim"); }],
              ["deals", "Bundles", () => { path?.note("deals", "Bundles"); setPanel("deals"); }],
            ] as const
          ).map(([id, label, go]) => (
            <button key={id} type="button" onClick={() => { blip(); go(); }} className="h-9 shrink-0 rounded-full bg-white px-4 text-[15px] font-medium text-[#007aff] shadow-sm">
              {label}
            </button>
          ))}
        </div>

        {!shelf ? (
          <ul className="mt-5 overflow-hidden rounded-2xl bg-white">
            {SHELVES.map((item) => (
              <li key={item.id} className="border-b border-[#e5e5ea] last:border-b-0">
                <button type="button" onClick={() => chooseShelf(item.id)} className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left">
                  <span>
                    <span className="block text-[17px]">{item.title}</span>
                    <span className="mt-0.5 block text-[13px] text-[#8e8e93]">{item.line}</span>
                  </span>
                  <span className="text-[22px] leading-none text-[#c7c7cc]" aria-hidden>›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5">
            <button type="button" onClick={() => { blip(); leaveTo((id) => id.startsWith("shelf-"), () => setShelf(null)); }} className="text-[17px] font-medium text-[#007aff]">
              All shelves
            </button>
            <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{current?.title ?? "Shelf"}</h2>
            <p className="text-[15px] text-[#8e8e93]">{current?.line}. {rows.length} on the shelf.</p>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">
              <Search className="size-4 text-[#8e8e93]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={shelf === "laptop" ? "OLED, 16 inch, 32GB, school, 2025" : "Search this shelf"} className="h-full w-full bg-transparent text-[17px] outline-none placeholder:text-[#8e8e93]" />
            </label>
            <div className="mt-3 flex gap-2">
              <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl bg-white px-3 shadow-sm">
                <span className="shrink-0 text-[15px] text-[#8e8e93]">Sort</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-full min-w-0 flex-1 bg-transparent px-2 text-[17px] outline-none">
                  <option value="low">Price, low to high</option>
                  <option value="high">Price, high to low</option>
                  <option value="score">Strongest first</option>
                  <option value="score-low">Lightest score first</option>
                </select>
              </label>
              <button type="button" onClick={() => setGrid((value) => !value)} className="h-11 shrink-0 rounded-xl bg-white px-4 text-[15px] font-medium text-[#007aff] shadow-sm">
                {grid ? "List" : "Grid"}
              </button>
            </div>
            {query.trim() && (shelf === "prebuilt" || shelf === "laptop") ? (
              <div className="mt-4">
                <ThreeSearch
                  rows={rows.map((item) => ({ ...item, score: scoreOf(item) }))}
                  who={query.trim()}
                  lineFor={(item, how) => (shelf === "laptop" ? lapBag(item, how) : partBag(item, how))}
                />
              </div>
            ) : (
              <>
                <ul className={`mt-4 ${grid ? "grid grid-cols-2 gap-2" : "overflow-hidden rounded-2xl bg-white"}`}>
                  {rows.slice(0, limit).map((item) => {
                    const lap = shelf === "laptop" ? LAPS.find((row) => row.id === item.id) : undefined;
                    const tags = lap ? laptopFace(lap.name, lap.specs, lap.kind).slice(0, 6) : (byId.get(item.id) ? tagsOf(byId.get(item.id)!).slice(0, 4) : []);
                    const score = scoreOf(item);
                    const ink = dealFrom(item.price, Math.max(1, score)).fg;
                    return (
                      <li key={item.id} className={grid ? "overflow-hidden rounded-2xl bg-white" : "border-b border-[#e5e5ea] last:border-b-0"}>
                        <button type="button" onClick={() => chooseItem(item)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
                          <span className="min-w-0">
                            <span className="block text-[12px] font-medium uppercase tracking-wide text-[#8e8e93]">{item.brand}</span>
                            <span className="mt-0.5 block text-[17px] leading-snug">{item.name}</span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              {tags.map((tag) => {
                                const paint = tagPaint(tag);
                                return (
                                  <span key={tag} role="presentation" onClick={(event) => { event.stopPropagation(); setQuery(tag); }} className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: paint.bg, color: paint.fg }}>{tag}</span>
                                );
                              })}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[17px] font-semibold" style={{ color: ink }}>{money(item.price)}</span>
                            <span className="mt-0.5 block max-w-[8.5rem] text-[12px] leading-snug text-[#8e8e93]">Pay once</span>
                            {lap ? <span className="mt-1 block max-w-[8.5rem] text-[12px] font-semibold leading-snug" style={{ color: ink }}>{money(item.price / Math.max(1, score))} per point of speed · {releaseYear(lap.name)}</span> : null}
                          </span>
                        </button>
                        <div className="px-4 pb-3">
                          <RankBadge score={score} lines={lap ? explainLaptop(lap) : linesOf(item)} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {rows.length > limit ? (
                  <button type="button" onClick={() => { blip(); setLimit((value) => value + 24); }} className="mt-3 h-12 w-full rounded-xl bg-white text-[17px] font-medium text-[#007aff] shadow-sm">
                    Show more
                  </button>
                ) : null}
                {rows.length === 0 ? <p className="mt-8 text-center text-[17px] text-[#8e8e93]">Nothing on this shelf.</p> : null}
              </>
            )}
          </div>
        )}
      </div>

      {picked ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={() => leaveTo((id) => id.startsWith("pick:"), () => setPicked(null))}>
          <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f2f2f7] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#c7c7cc]" />
            <p className="text-[13px] font-medium uppercase tracking-wide text-[#8e8e93]">{picked.brand}</p>
            <p className="mt-1 text-[22px] font-semibold leading-tight">{picked.name}</p>
            <p className="mt-4 text-[34px] font-semibold tracking-tight">{money(picked.price)}</p>
            <p className="text-[15px] text-[#8e8e93]">On the tag. They pay this once, not monthly.</p>
            <AddButton
              line={shelf === "laptop" ? lapBag(picked, `Store. Budget ${money(picked.price)}. Score ${Math.round(scoreOf(picked))}.`) : partBag(picked, `Store. Budget ${money(picked.price)}. Score ${Math.round(scoreOf(picked))}.`)}
              className="mt-4 h-12 w-full rounded-xl bg-[#007aff] text-[17px] font-semibold text-white"
            />
            <button type="button" onClick={() => { blip(); leaveTo((id) => id.startsWith("pick:"), () => setPicked(null)); }} className="mt-2 h-12 w-full rounded-xl bg-white text-[17px] font-medium text-[#007aff]">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

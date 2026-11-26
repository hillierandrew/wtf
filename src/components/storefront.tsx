import { useMemo, useState } from "react";
import { Lock, Search, Sparkles, X } from "lucide-react";
import laptopsRaw from "@/data/laptops.json";
import { CopyList, partLine } from "@/components/copy-list";
import { laptopMarks, deskMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { CAT_LABEL, PARTS, explainPart, explainLaptop, laptopBits, isJunk, machineScore, money, partScore, rankFrom, tagsOf, type Category, type Part } from "@/lib/catalog";

type View = "ai" | "desktops" | "laptops" | "parts";
type Sort = "ppp" | "score" | "price-asc" | "price-desc";
type Kind = "game" | "home" | "work" | "tablet" | "chrome";

type Laptop = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  kind: Kind;
  open: boolean;
  gpu: number;
  specs: string;
};

type Card = {
  id: string;
  name: string;
  brand: string;
  price: number;
  was: number | null;
  score: number;
  tags: string[];
  why: string[];
  open: boolean;
  shelf: string;
  where: "desktops" | "laptops" | "parts";
};

const PART_CATS: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "case", "cooler", "psu", "monitor", "bundle"];

const SHORT: Record<Category, string> = {
  prebuilt: "Desktops",
  bundle: "Bundles",
  cpu: "CPUs",
  motherboard: "Motherboards",
  memory: "Memory",
  gpu: "Graphics",
  storage: "Storage",
  case: "Cases",
  cooler: "Coolers",
  psu: "Power",
  monitor: "Monitors",
};

const LAPTOPS = laptopsRaw as Laptop[];

function ramOf(item: Laptop) {
  const match = item.specs.match(/(\d+)GB memory/);
  return match ? Number(match[1]) : 0;
}

function hundred(item: Laptop) {
  return laptopBits(item).score;
}

function laptopWhy(item: Laptop) {
  return explainLaptop(item);
}

function fromPart(part: Part): Card {
  const score = part.cat === "prebuilt" ? machineScore(part.name) : partScore(part);
  return {
    id: part.id,
    name: part.name.replace(/\(open\s?box\)/i, "").trim(),
    brand: part.brand,
    price: part.price,
    was: part.was,
    score,
    tags: tagsOf(part).slice(0, 4),
    why: explainPart(part),
    open: /open\s?box/i.test(part.name),
    shelf: part.cat === "prebuilt" ? "Desktop" : CAT_LABEL[part.cat],
    where: part.cat === "prebuilt" ? "desktops" : "parts",
  };
}

function fromLaptop(item: Laptop): Card {
  const score = hundred(item);
  const kind = item.kind === "game" ? "Gaming" : item.kind === "work" ? "Work" : item.kind === "tablet" ? "Tablet" : item.kind === "chrome" ? "Chrome" : "Home";
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    was: item.was,
    score,
    tags: [kind, item.specs].filter(Boolean).slice(0, 3),
    why: laptopWhy(item),
    open: item.open,
    shelf: "Laptop",
    where: "laptops",
  };
}

function ppp(card: Card) {
  return card.score > 0 ? card.price / card.score : 999999;
}

type Recipe = {
  id: string;
  name: string;
  line: string;
  where: "desktops" | "laptops";
  pick: (desks: Part[], laps: Laptop[], used: Set<string>) => Part | Laptop | undefined;
};

function freshPart(parts: Part[], used: Set<string>, ok: (part: Part) => boolean, better: (a: Part, b: Part) => number) {
  return parts.filter((part) => !used.has(part.id) && !/open\s?box/i.test(part.name) && ok(part)).sort(better)[0];
}

function freshLap(laps: Laptop[], used: Set<string>, ok: (item: Laptop) => boolean, better: (a: Laptop, b: Laptop) => number) {
  return laps.filter((item) => !used.has(item.id) && !item.open && ok(item)).sort(better)[0];
}

const byScore = (a: Part, b: Part) => machineScore(b.name) - machineScore(a.name);
const byValue = (a: Part, b: Part) => a.price / machineScore(a.name) - b.price / machineScore(b.name);
const lapValue = (a: Laptop, b: Laptop) => a.price / hundred(a) - b.price / hundred(b);
const lapScore = (a: Laptop, b: Laptop) => hundred(b) - hundred(a);

const RECIPES: Recipe[] = [
  {
    id: "cyber",
    name: "Cyberpunk Neon",
    line: "The strongest gaming tower. A fast card, for 1440p and up.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => part.form === "gaming" && /5080|5090/.test(part.name), byScore) ?? freshPart(desks, used, (part) => part.form === "gaming", byScore),
  },
  {
    id: "silent",
    name: "Silent Scholar",
    line: "A quiet laptop. No big graphics chip. Notes, class, and a browser.",
    where: "laptops",
    pick: (_desks, laps, used) => freshLap(laps, used, (item) => (item.kind === "work" || item.kind === "home") && item.gpu < 28, lapValue),
  },
  {
    id: "budget",
    name: "Budget Beast",
    line: "The cheapest tower with a current card. 1080p, not a leftover 3050.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => part.form === "gaming" && /5060|9060/.test(part.name) && !/TI/.test(part.name), (a, b) => a.price - b.price),
  },
  {
    id: "creator",
    name: "Creator Studio",
    line: "32GB and an RTX 5070. Enough to edit and to play. Not the halo card.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => /32GB|64GB/.test(part.name) && /\b5070\b/.test(part.name) && !/TI|5080|5090/i.test(part.name), byScore),
  },
  {
    id: "future",
    name: "Future Proof",
    line: "An RTX 5070 Ti tower. A step under the 5080, still years of headroom.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => /5070\s?TI/i.test(part.name), byScore),
  },
  {
    id: "tiny",
    name: "Tiny Titan",
    line: "The strongest small box. It sits on a desk, not under it.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => part.form === "mini", byScore),
  },
  {
    id: "pocket",
    name: "Pocket Arcade",
    line: "A gaming laptop. The best frames for the money you carry.",
    where: "laptops",
    pick: (_desks, laps, used) => freshLap(laps, used, (item) => item.kind === "game", lapValue),
  },
  {
    id: "library",
    name: "Night Library",
    line: "The cheap laptop for reading, mail, and homework.",
    where: "laptops",
    pick: (_desks, laps, used) => freshLap(laps, used, (item) => item.kind !== "game" && item.kind !== "tablet" && item.price <= 900, (a, b) => a.price - b.price),
  },
  {
    id: "ghost",
    name: "Office Ghost",
    line: "A normal office tower. No gaming card. Mail and a spreadsheet.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => part.form === "desk" && !/RTX|RX\s?\d|GEFORCE|RADEON/i.test(part.name), byValue),
  },
  {
    id: "glass",
    name: "Glass House",
    line: "An all-in-one. The computer is inside the screen.",
    where: "desktops",
    pick: (desks, _laps, used) => freshPart(desks, used, (part) => part.form === "aio", byScore),
  },
  {
    id: "nightshift",
    name: "Night Shift",
    line: "A gaming laptop with 32GB. Edit at night, play after.",
    where: "laptops",
    pick: (_desks, laps, used) => freshLap(laps, used, (item) => item.kind === "game" && /32GB|64GB/.test(item.specs), lapScore),
  },
  {
    id: "lantern",
    name: "Lantern",
    line: "A work laptop with a real chip and 16GB or more. Carry the office.",
    where: "laptops",
    pick: (_desks, laps, used) => freshLap(laps, used, (item) => item.kind === "work" && ramOf(item) >= 16, lapScore),
  },
];

function sortCards(list: Card[], sort: Sort) {
  return [...list].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "score") return b.score - a.score;
    return ppp(a) - ppp(b);
  });
}

export function Storefront({ onLock }: { onLock: () => void }) {
  const [view, setView] = useState<View>("ai");
  const [partCat, setPartCat] = useState<Category>("cpu");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("ppp");
  const [openBox, setOpenBox] = useState(false);
  const [more, setMore] = useState(24);
  const [scoreId, setScoreId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"shop" | "build" | "keys">("shop");
  const [spot, setSpot] = useState<string | null>(null);

  const stock = useMemo(() => PARTS.filter((part) => !isJunk(part, true)), []);
  const desks = useMemo(() => stock.filter((part) => part.cat === "prebuilt"), [stock]);

  const ideas = useMemo(() => {
    const used = new Set<string>();
    return RECIPES.flatMap((recipe) => {
      const found = recipe.pick(desks, LAPTOPS, used);
      if (!found) return [];
      used.add(found.id);
      const card = "cat" in found ? fromPart(found) : fromLaptop(found);
      return [{ ...recipe, card }];
    });
  }, [desks]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: Card[] = [];
    if (view === "desktops") list = desks.map(fromPart);
    else if (view === "laptops") list = LAPTOPS.filter((item) => item.kind !== "tablet").map(fromLaptop);
    else if (view === "parts") list = stock.filter((part) => part.cat === partCat).map(fromPart);
    if (!openBox) list = list.filter((item) => !item.open);
    if (q) list = list.filter((item) => `${item.brand} ${item.name} ${item.shelf}`.toLowerCase().includes(q));
    return sortCards(list, sort);
  }, [view, partCat, query, sort, openBox, desks, stock]);

  const page = shown.slice(0, more);
  const scoreCard = scoreId ? shown.find((item) => item.id === scoreId) ?? ideas.find((item) => item.card.id === scoreId)?.card : undefined;
  const spotCard = ideas.find((item) => item.id === spot);

  function go(next: View) {
    setView(next);
    setMore(24);
    setQuery("");
    setSpot(null);
  }

  if (panel === "build") return <Counter onClose={() => setPanel("shop")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("shop")} />;

  return (
    <div className="min-h-dvh bg-[#fafafa] text-[#111] antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <span className="text-lg font-semibold tracking-tight">AI Store</span>
          </div>
          <button type="button" onClick={onLock} className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100" aria-label="Lock">
            <Lock className="size-4" />
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
          <button type="button" onClick={() => setPanel("build")} className="h-11 rounded-full bg-black px-4 text-sm font-medium text-white">Build with them</button>
          <button type="button" onClick={() => setPanel("keys")} className="h-11 rounded-full bg-neutral-100 px-4 text-sm font-medium">Keyboards</button>
        </div>
      </header>

      <div className="sticky top-[57px] z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          {(
            [
              ["ai", "AI Builds"],
              ["desktops", "Desktops"],
              ["laptops", "Laptops"],
              ["parts", "Parts"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => go(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${view === id ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
              {label}
            </button>
          ))}
        </div>
        {view === "parts" ? (
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
            {PART_CATS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setPartCat(cat);
                  setMore(24);
                }}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium ${partCat === cat ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}
              >
                {SHORT[cat]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {view === "ai" ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI pre-builds</h1>
          <p className="mt-2 max-w-xl text-neutral-500">Each name is a different machine from the shelf. Not the same list twice.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <article key={idea.id} className={`rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ${spot === idea.id ? "ring-black" : "ring-black/5"}`}>
                <button type="button" onClick={() => setSpot(idea.id)} className="w-full text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">AI · {idea.card.shelf}</p>
                  <h3 className="mt-2 text-xl font-semibold">{idea.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{idea.line}</p>
                  <p className="mt-4 text-sm font-medium leading-snug">{idea.card.name}</p>
                  <p className="mt-1 text-2xl font-bold">{money(idea.card.price)}</p>
                </button>
                <div className="mt-3 flex items-center justify-between">
                  <button type="button" onClick={() => setScoreId(idea.card.id)} className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rankFrom(idea.card.score).bg, color: rankFrom(idea.card.score).fg }}>
                    {rankFrom(idea.card.score).name} {Math.round(idea.card.score)}
                  </button>
                  <button type="button" onClick={() => go(idea.where)} className="text-sm font-medium text-blue-600">
                    See the shelf
                  </button>
                </div>
                <CopyList title={idea.name} names={[partLine(idea.card)]} className="mt-3 h-10 w-full rounded-full bg-neutral-100 text-sm font-medium" />
              </article>
            ))}
          </div>
          {spotCard ? (
            <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{spotCard.name}</p>
              <p className="mt-2 text-lg font-semibold">{spotCard.card.name}</p>
              <p className="mt-1 text-sm text-neutral-500">{spotCard.line}</p>
              <p className="mt-3 text-sm text-neutral-600">{money(spotCard.card.price)} · {money(ppp(spotCard.card))} per point</p>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setMore(24); }} placeholder={view === "parts" ? `Search ${SHORT[partCat].toLowerCase()}` : "Search"} className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-9 pr-4 text-sm outline-none ring-blue-500/20 focus:ring-2" />
              </div>
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option value="ppp">Best price / performance</option>
                <option value="score">Highest score</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={openBox} onChange={(event) => setOpenBox(event.target.checked)} />
                Open box
              </label>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              {shown.length} {view === "parts" ? SHORT[partCat].toLowerCase() : view}
            </p>
          </div>
          <main className="mx-auto max-w-6xl px-4 pb-16">
            {page.length === 0 ? (
              <p className="py-20 text-center text-neutral-400">Nothing in this shelf matches.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {page.map((item) => {
                  const rank = rankFrom(item.score);
                  const value = ppp(item);
                  return (
                    <article key={item.id} className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{item.brand} · {item.shelf}</p>
                          <h3 className="mt-1 text-base font-semibold leading-snug">{item.name}</h3>
                        </div>
                        <button type="button" onClick={() => setScoreId(item.id)} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rank.bg, color: rank.fg }} aria-label={`${rank.name} score ${Math.round(item.score)}. See how it was scored.`}>
                          {rank.name}
                        </button>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{money(item.price)}</span>
                        {item.was ? <span className="text-sm text-neutral-400 line-through">{money(item.was)}</span> : null}
                      </div>
                      <button type="button" onClick={() => setScoreId(item.id)} className="mt-2 text-left text-xs text-neutral-500">
                        Score {Math.round(item.score)} · {money(value)} / point
                      </button>
                      {item.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span key={tag} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tag === "iGPU" ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-600"}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {item.where === "laptops" && LAPTOPS.some((row) => row.id === item.id) ? laptopMarks(LAPTOPS.find((row) => row.id === item.id)!) : null}
                      {item.where === "desktops" && PARTS.some((row) => row.id === item.id) ? deskMarks(PARTS.find((row) => row.id === item.id)!) : null}
                    </article>
                  );
                })}
              </div>
            )}
            {more < shown.length ? (
              <button type="button" onClick={() => setMore((count) => count + 24)} className="mx-auto mt-6 block rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white">
                Show more
              </button>
            ) : null}
          </main>
        </>
      )}

      {scoreCard ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setScoreId(null)}>
          <div role="dialog" aria-label="How this score was made" className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">How this score was made</p>
              <button type="button" onClick={() => setScoreId(null)} aria-label="Close" className="flex size-8 items-center justify-center rounded-full bg-neutral-100">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-sm font-semibold">
              {rankFrom(scoreCard.score).name} {Math.round(scoreCard.score)}. {rankFrom(scoreCard.score).name === "Crystal" ? "90 or higher." : rankFrom(scoreCard.score).name === "Gold" ? "75 to 89." : rankFrom(scoreCard.score).name === "Silver" ? "55 to 74." : rankFrom(scoreCard.score).name === "Bronze" ? "35 to 54." : "Under 35."}
            </p>
            <p className="mt-1 text-sm leading-snug text-neutral-600">{scoreCard.name}</p>
            <ul className="mt-3 space-y-2 text-sm leading-snug text-neutral-700">
              {scoreCard.why.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

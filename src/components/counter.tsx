import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QRCode from "qrcode";
import { CAT_LABEL, PARTS, explainPart, fitWhy, includedParts, isJunk, money, partScore, rankFrom, reconcile, spendOf, tagsOf, type Build, type Category, type Part } from "@/lib/catalog";
import { listText, partLine } from "@/components/copy-list";
import { RankBadge } from "@/components/rank";

const FROM_CPU: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "psu", "case", "monitor"];
const FROM_GPU: Category[] = ["gpu", "cpu", "motherboard", "memory", "storage", "cooler", "psu", "case", "monitor"];
const FROM_BUNDLE: Category[] = ["bundle", "case", "psu", "storage", "cooler", "monitor"];

const SAY: Partial<Record<Category, string>> = {
  bundle: "Pick one chip deal. Then a card deal or a case deal only if it is a different piece. A second chip deal replaces the first. Next is the case.",
  gpu: "Start with the graphics card if the picture matters most. The power supply has to keep up.",
  motherboard: "Only boards that match this chip. The memory type is decided here.",
  memory: "DDR5 stays with a DDR5 board. DDR4 stays with DDR4. The wrong kind is not in this list.",
  storage: "One drive is enough to leave the shop. A bigger one is for photos and games.",
  cooler: "Skip this if the chip already comes with a cooler.",
  psu: "This has to feed the graphics card. Bigger cards want more watts.",
  case: "The case has to fit the board. ATX does not go in a tiny box.",
  monitor: "Skip this if they already have a screen.",
};

function dealCats(part: Part) {
  return new Set(includedParts(part).map((item) => item.cat));
}

function clashes(left: Part, right: Part) {
  const have = dealCats(left);
  for (const cat of dealCats(right)) if (have.has(cat)) return true;
  return false;
}

function keptOut(part: Part, others: Build) {
  const why = fitWhy(part, others);
  if (!why) return false;
  if (part.cat === "cooler" && /already includes a cooler/i.test(why)) return false;
  return true;
}

function saveOf(part: Part) {
  const sum = includedParts(part).reduce((total, item) => total + item.price, 0);
  return Math.round((sum - part.price) * 100) / 100;
}

function paintDeals(nextDeals: Part[], loose: Build): Build {
  const next: Build = {};
  for (const deal of nextDeals) {
    for (const piece of includedParts(deal)) next[piece.cat] = piece;
  }
  if (nextDeals.length === 1) next.bundle = nextDeals[0];
  for (const cat of ["storage", "cooler", "psu", "case", "monitor", "gpu", "cpu", "motherboard", "memory"] as const) {
    if (next[cat]) continue;
    const extra = loose[cat];
    if (extra && !fitWhy(extra, next)) next[cat] = extra;
  }
  return next;
}

const BUNDLE_GROUPS: { title: string; line: string; test: (part: Part) => boolean }[] = [
  {
    title: "Chip, board, and memory",
    line: "Pick one. This is the money-saving deal. A second chip deal replaces it.",
    test: (part) => dealCats(part).has("cpu") && !dealCats(part).has("gpu"),
  },
  {
    title: "Graphics card deal",
    line: "Add one only if they need a card. If this box also has a chip, it replaces the chip deal.",
    test: (part) => dealCats(part).has("gpu"),
  },
  {
    title: "Case deal",
    line: "Optional. The case comes with a cooler or a power supply.",
    test: (part) => dealCats(part).has("case") && !dealCats(part).has("cpu") && !dealCats(part).has("gpu"),
  },
];

function glow(score: number) {
  const name = rankFrom(score).name;
  if (name === "Crystal") return "ring-2 ring-cyan-300 shadow-[0_0_18px_rgba(125,211,252,0.85)]";
  if (name === "Gold") return "ring-2 ring-amber-300 shadow-[0_0_16px_rgba(246,217,138,0.9)]";
  return "";
}

export function Counter({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState<"cpu" | "gpu" | "bundle" | null>(null);
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1500);
  const [build, setBuild] = useState<Build>({});
  const [deals, setDeals] = useState<Part[]>([]);
  const [loose, setLoose] = useState<Build>({});
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const [openCart, setOpenCart] = useState(false);
  const [sort, setSort] = useState<"score-desc" | "score-asc" | "price-asc" | "price-desc">("score-desc");
  const [grid, setGrid] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);

  const order = from === "bundle" ? FROM_BUNDLE : from === "gpu" ? FROM_GPU : FROM_CPU;
  const cat = order[Math.min(step, order.length - 1)];
  const shelf = useMemo(() => {
    const others: Build = { ...build };
    delete others[cat];
    const dealSpent = deals.reduce((sum, deal) => sum + deal.price, 0) + Object.values(loose).reduce((sum, part) => sum + (part && part.cat !== cat ? part.price : 0), 0);
    const spent = cat === "bundle" ? 0 : from === "bundle" ? dealSpent : spendOf(others);
    const room = Math.max(80, budget - spent);
    const q = query.trim().toLowerCase();
    const fitting = PARTS.filter((part) => {
      if (part.cat !== cat || isJunk(part, false) || keptOut(part, others)) return false;
      if (!q) return true;
      return `${part.brand} ${part.name}`.toLowerCase().includes(q);
    });
    const priced = fitting.filter((part) => part.price <= room);
    const over = fitting.filter((part) => part.price > room);
    const list = (priced.length ? [...priced, ...over] : fitting).slice();
    list.sort((a, b) => {
      const budgetRank = (part: Part) => (priced.length && part.price > room ? 1 : 0);
      const rank = budgetRank(a) - budgetRank(b);
      if (rank) return rank;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "score-asc") return partScore(a) - partScore(b) || a.price - b.price;
      return partScore(b) - partScore(a) || a.price - b.price;
    });
    return { list, room, split: priced.length > 0 && over.length > 0 };
  }, [build, cat, budget, sort, from, deals, loose, query]);
  const parts = shelf.list;
  const room = shelf.room;
  const splitBudget = shelf.split;
  const shown = cat === "bundle" ? parts : parts.slice(0, limit);
  const stockCooler = cat === "cooler" && Boolean(build.cpu && /with cooler|wraith/i.test(build.cpu.name));

  const chosen = (["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "psu", "case", "monitor"] as const)
    .map((item) => build[item])
    .filter((part): part is Part => Boolean(part));
  const covered = useMemo(() => {
    const set = new Set<Category>();
    for (const deal of deals) for (const piece of dealCats(deal)) set.add(piece);
    return set;
  }, [deals]);
  const extras = chosen.filter((part) => !covered.has(part.cat));
  const lines = [...deals.map((deal) => `${deal.name} — bundle ${money(deal.price)}`), ...extras.map(partLine)];
  const total = deals.length ? Math.round((deals.reduce((sum, deal) => sum + deal.price, 0) + extras.reduce((sum, part) => sum + part.price, 0)) * 100) / 100 : spendOf(build);
  const text = listText("Shelf list", lines);
  const ideas = (["monitor", "cooler", "storage"] as const).filter((item) => !build[item] && !covered.has(item));

  useEffect(() => {
    if (from !== "bundle") return;
    setBuild(paintDeals(deals, loose));
  }, [deals, loose, from]);

  useEffect(() => {
    if (!openCart || !lines.length) return;
    let stop = false;
    QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#1a0a24", light: "#fff7ed" } })
      .then((url) => {
        if (!stop) setQr(url);
      })
      .catch(() => setQr(""));
    return () => {
      stop = true;
    };
  }, [openCart, text, lines.length]);

  useEffect(() => {
    setQuery("");
    setLimit(40);
  }, [cat, from]);

  function take(part: Part) {
    if (part.cat === "bundle") {
      setDeals((current) => [...current.filter((deal) => deal.id !== part.id && !clashes(deal, part)), part]);
      setOpenCart(true);
      return;
    }
    if (from === "bundle") {
      setLoose((current) => {
        const base = paintDeals(deals, current);
        const next = reconcile(part.cat, { ...base, [part.cat]: part });
        const have = new Set<Category>();
        for (const deal of deals) for (const cat of dealCats(deal)) have.add(cat);
        const kept: Build = {};
        for (const cat of Object.keys(next) as Category[]) {
          if (cat === "bundle" || have.has(cat) || !next[cat]) continue;
          kept[cat] = next[cat]!;
        }
        return kept;
      });
      const next = Math.min(order.length - 1, step + 1);
      setStep(next);
      setOpenCart(true);
      return;
    }
    setBuild(reconcile(part.cat, { ...build, [part.cat]: part }));
    const next = Math.min(order.length - 1, step + 1);
    setStep(next);
    setOpenCart(true);
  }

  function drop(part: Part) {
    const owner = deals.find((deal) => deal.id === part.id || includedParts(deal).some((piece) => piece.id === part.id));
    if (owner) {
      setDeals((current) => current.filter((deal) => deal.id !== owner.id));
      return;
    }
    if (from === "bundle") {
      setLoose((current) => {
        const next = { ...current };
        delete next[part.cat];
        return next;
      });
      return;
    }
    setBuild((current) => {
      const next = { ...current };
      delete next[part.cat];
      return next;
    });
  }

  function jump(index: number) {
    setStep(index);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (!from) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f6f3ec] px-4 pb-28 pt-4 text-[#161616]">
        <button type="button" onClick={onClose} className="flex h-11 items-center gap-1 text-base">
          <ChevronLeft className="size-5" /> Back
        </button>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f6b4c]">Build</p>
        <h1 className="mt-1 text-4xl font-semibold leading-none">Where do we start?</h1>
        <p className="mt-3 max-w-xl text-lg text-[#333]">One choice. After that, only parts that fit stay on the screen.</p>
        <ol className="mt-5 space-y-3">
          <li>
            <button type="button" onClick={() => { setBuild({}); setDeals([]); setLoose({}); setSort("price-asc"); setFrom("bundle"); setStep(0); }} className="flex min-h-28 w-full gap-4 rounded-3xl bg-[#161616] px-5 py-4 text-left text-white">
              <span className="text-3xl font-semibold leading-none">1</span>
              <span>
                <span className="block text-2xl font-semibold">Start with a bundle</span>
                <span className="mt-1 block text-base text-white/80">The sale price for a chip, a board, and memory. Add a card deal or a case deal only if it is a different piece. Then the case.</span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { setBuild({}); setDeals([]); setLoose({}); setFrom("cpu"); setStep(0); }} className="flex min-h-28 w-full gap-4 rounded-3xl border-2 border-[#161616] bg-white px-5 py-4 text-left">
              <span className="text-3xl font-semibold leading-none">2</span>
              <span>
                <span className="block text-2xl font-semibold">Start with the chip</span>
                <span className="mt-1 block text-base text-[#333]">They named AMD or Intel. The board has to match. Then memory, then the graphics card.</span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { setBuild({}); setDeals([]); setLoose({}); setFrom("gpu"); setStep(0); }} className="flex min-h-28 w-full gap-4 rounded-3xl bg-[#e7f6ee] px-5 py-4 text-left">
              <span className="text-3xl font-semibold leading-none text-[#0f6b4c]">3</span>
              <span>
                <span className="block text-2xl font-semibold">Start with the graphics card</span>
                <span className="mt-1 block text-base text-[#333]">They named a game or a card. The power supply has to be big enough to run it.</span>
              </span>
            </button>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f3ec] text-[#161616]">
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="flex h-11 items-center gap-1 text-[#161616]">
            <ChevronLeft className="size-5" /> Close
          </button>
          <p className="text-sm text-[#333]">{step + 1} of {order.length}</p>
        </div>
        <h1 className="mt-1 text-3xl font-semibold leading-none">{CAT_LABEL[cat]}</h1>
        <p className="mt-2 text-sm leading-snug text-[#333]">{SAY[cat]}</p>
        <label className="mt-3 block text-sm text-[#161616]">
          Budget {money(budget)}
          <input type="range" min={400} max={4500} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 h-8 w-full accent-[#161616]" />
        </label>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {order.map((item, index) => (
            <button key={item} type="button" onClick={() => jump(index)} className={`h-10 shrink-0 rounded-full px-3 text-sm ${index === step ? "bg-[#161616] text-white" : build[item] || (item === "bundle" && deals.length) || covered.has(item) ? "bg-[#d9f5d6] text-[#145214]" : "bg-white text-[#161616] border border-[#ddd]"}`}>
              {CAT_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 pb-2">
          {(
            [
              ["score-desc", "Score high"],
              ["score-asc", "Score low"],
              ["price-asc", "Price low"],
              ["price-desc", "Price high"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSort(id)} className={`h-10 rounded-full px-3 text-sm ${sort === id ? "bg-[#161616] text-white" : "bg-white text-[#161616] border border-[#ddd]"}`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => setGrid((value) => !value)} className="h-10 rounded-full border border-[#ddd] bg-white px-3 text-sm">
            {grid ? "List" : "Grid"}
          </button>
        </div>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(40); }} placeholder="Search this shelf" className="mb-2 h-11 w-full rounded-full border border-[#ddd] bg-white px-4 text-base outline-none" />
      </header>
      {cat === "bundle" ? (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-3">
          {deals.length ? <p className="rounded-2xl bg-[#e7f6ee] px-3 py-2 text-sm text-[#145214]">{deals.length} deal{deals.length === 1 ? "" : "s"} picked. A deal only stacks when it is a different piece. Then press Next for the case.</p> : null}
          {parts.length === 0 ? <p className="py-8 text-center text-[#333]">{query.trim() ? "Nothing matches that search." : "No bundles on the shelf."}</p> : null}
          {BUNDLE_GROUPS.map((group) => {
            const rows = parts.filter(group.test);
            if (!rows.length) return null;
            return (
              <section key={group.title}>
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <p className="mt-1 text-sm text-[#333]">{group.line}</p>
                <ul className="mt-2 space-y-2">
                  {rows.map((part) => {
                    const on = deals.some((deal) => deal.id === part.id);
                    const save = saveOf(part);
                    const bits = includedParts(part);
                    return (
                      <li key={part.id} className={`rounded-2xl border bg-white ${on ? "border-[#161616]" : "border-[#ddd]"}`}>
                        <button type="button" onClick={() => take(part)} className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left">
                          <span className="min-w-0">
                            <span className="block text-base font-medium leading-snug">{part.name}</span>
                            <span className="mt-1 block text-sm text-[#333]">{bits.map((piece) => piece.name).join(" + ")}</span>
                            {save > 1 ? <span className="mt-1 block text-sm font-semibold text-[#145214]">Save {money(save)} versus the pieces apart</span> : null}
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-base font-semibold">{money(part.price)}</span>
                            {splitBudget && part.price > room ? <span className="block text-xs text-[#9b3a32]">Over budget</span> : null}
                            <span className="block text-xs">{on ? "Picked" : "Pick"}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : covered.has(cat) ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <p className="rounded-2xl bg-[#e7f6ee] px-4 py-6 text-base text-[#145214]">Already in the deal. Do not add a second {CAT_LABEL[cat].toLowerCase()}. Press Next.</p>
        </div>
      ) : (
      <ul className={`min-h-0 flex-1 overflow-y-auto px-4 pb-3 ${grid ? "grid grid-cols-2 content-start gap-2" : "space-y-2"}`}>
        {stockCooler ? <li className={grid ? "col-span-2 rounded-2xl bg-[#e7f6ee] px-4 py-3 text-sm text-[#145214]" : "rounded-2xl bg-[#e7f6ee] px-4 py-3 text-sm text-[#145214]"}>This chip comes with a cooler. Skip this step, or pick a bigger one.</li> : null}
        {shown.map((part) => {
          const score = partScore(part);
          const on = build[cat]?.id === part.id || loose[cat]?.id === part.id;
          const over = splitBudget && part.price > room;
          return (
            <li key={part.id} className={`rounded-2xl border border-[#ddd] bg-white ${glow(score)} ${on ? "outline outline-2 outline-[#161616]" : ""}`}>
              <button type="button" onClick={() => take(part)} className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left">
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-[#555]">{part.brand}</span>
                  <span className="mt-0.5 block text-base leading-snug">{part.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {tagsOf(part).slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#efeae2] px-2 py-0.5 text-[11px] text-[#161616]">{tag}</span>
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-semibold">
                  {money(part.price)}
                  {over ? <span className="mt-1 block text-xs font-medium text-[#9b3a32]">Over budget</span> : null}
                </span>
              </button>
              <div className="px-3 pb-3">
                <RankBadge score={score} lines={explainPart(part)} />
              </div>
            </li>
          );
        })}
        {parts.length > shown.length ? (
          <li className={grid ? "col-span-2" : ""}>
            <button type="button" onClick={() => setLimit((value) => value + 40)} className="h-12 w-full rounded-full border border-[#161616] bg-white text-base">
              Show more ({parts.length - shown.length} left)
            </button>
          </li>
        ) : null}
        {parts.length === 0 ? <li className="py-8 text-center text-[#333]">{query.trim() ? "Nothing matches that search." : "Nothing on the shelf fits. Go back and change the last part."}</li> : null}
      </ul>
      )}
      <footer className="shrink-0 border-t border-[#ddd] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setOpenCart((value) => !value)} className="flex w-full items-center justify-between text-left">
          <span className="text-base">{deals.length ? `${deals.length} deal${deals.length === 1 ? "" : "s"}` : `${chosen.length} parts`} in the cart</span>
          <span className="text-lg font-semibold">{money(total)}</span>
        </button>
        {openCart ? (
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            <ol className="space-y-1 text-sm">
              {deals.map((deal, index) => (
                <li key={deal.id} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">{index + 1}. {deal.name} — {money(deal.price)}{saveOf(deal) > 1 ? ` · save ${money(saveOf(deal))}` : ""}</span>
                  <button type="button" onClick={() => drop(deal)} className="shrink-0 rounded-full border border-[#161616] px-2 py-1 text-xs">
                    Remove
                  </button>
                </li>
              ))}
              {extras.map((part, index) => (
                <li key={part.id} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">{deals.length + index + 1}. {partLine(part)}</span>
                  <button type="button" onClick={() => drop(part)} className="shrink-0 rounded-full border border-[#161616] px-2 py-1 text-xs">
                    Remove
                  </button>
                </li>
              ))}
            </ol>
            {qr ? <img src={qr} alt="QR code for this parts list" className="mx-auto mt-2 size-40 rounded-xl bg-[#fff7ed] p-2" /> : null}
            <button type="button" onClick={copy} className="h-11 w-full rounded-full bg-[#161616] text-base font-semibold text-white">
              {copied ? "Copied" : "Copy build"}
            </button>
            {ideas.length ? <p className="text-sm text-[#333]">Still easy to add: {ideas.map((item) => CAT_LABEL[item].toLowerCase()).join(", ")}.</p> : <p className="text-sm text-[#333]">That is a whole computer. A keyboard is the next thing they will ask for.</p>}
          </div>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full border border-[#161616]">
            <ChevronLeft className="size-4" /> Back
          </button>
          <button type="button" onClick={() => setStep((value) => Math.min(order.length - 1, value + 1))} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-[#161616] font-semibold text-white">
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

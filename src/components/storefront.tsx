import { useMemo, useState } from "react";
import { Lock, Sparkles, Monitor, Laptop, Cpu, Zap, Search, ChevronRight } from "lucide-react";
import { PARTS, money, partScore, rankFrom, tagsOf, machineScore, isJunk, type Part } from "@/lib/catalog";

type View = "ai" | "desktops" | "laptops" | "parts";
type Sort = "ppp" | "score" | "price-asc" | "price-desc";

const AI_BUILDS = [
  { id: "cyber", name: "Cyberpunk Neon", tagline: "Max FPS, RGB everything, 1440p Ultra", style: "from-purple-500 to-pink-500" },
  { id: "silent", name: "Silent Scholar", tagline: "Whisper quiet, all-day battery, pure focus", style: "from-slate-400 to-blue-300" },
  { id: "budget", name: "Budget Beast", tagline: "Insane value, 1080p high settings", style: "from-emerald-400 to-cyan-400" },
  { id: "creator", name: "Creator Studio", tagline: "Render + game + stream without compromise", style: "from-amber-400 to-orange-500" },
  { id: "future", name: "Future Proof", tagline: "DDR5, PCIe 5, ready for 2027", style: "from-indigo-500 to-violet-500" },
  { id: "tiny", name: "Tiny Titan", tagline: "Mini-ITX that punches way above its size", style: "from-rose-400 to-red-500" },
];

function hasIGPU(part: Part): boolean {
  if (part.cat !== "cpu") return false;
  const n = part.name.toUpperCase();
  return /RYZEN\s?[3579]|ULTRA|I[3579]-|CORE\s?(I[3579]|ULTRA)|F\b/.test(n) && !/\bF\b|KF\b/.test(n);
}

function ppp(part: Part): number {
  const score = part.cat === "prebuilt" ? machineScore(part.name) : partScore(part);
  return score > 0 ? part.price / score : 999999;
}

export function Storefront({ onLock }: { onLock: () => void }) {
  const [view, setView] = useState<View>("ai");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("ppp");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const inventory = useMemo(() => PARTS.filter((p) => !isJunk(p, true)), []);

  const desktops = useMemo(() => inventory.filter((p) => p.cat === "prebuilt"), [inventory]);
  const laptops = useMemo(() => {
    // Approximate from name or use phone catalog logic; for now filter by name patterns
    return inventory.filter((p) => /LAPTOP|NOTEBOOK|ASPIRE|THINKPAD|ZENBOOK|VIVOBOOK|IDEAPAD|LEGION|OMEN|ROG|ALIENWARE|MACBOOK/i.test(p.name) || p.cat === "prebuilt" && /mini|aio|desk/i.test(p.form || ""));
  }, [inventory]);

  const shown = useMemo(() => {
    let list = view === "desktops" ? desktops : view === "laptops" ? laptops : inventory.filter((p) => ["cpu", "gpu", "memory", "storage"].includes(p.cat));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(q));
    }
    if (!onlyOpen) list = list.filter((p) => !/open\s?box/i.test(p.name));
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "score") return (b.cat === "prebuilt" ? machineScore(b.name) : partScore(b)) - (a.cat === "prebuilt" ? machineScore(a.name) : partScore(a));
      return ppp(a) - ppp(b);
    });
    return list.slice(0, 48);
  }, [view, query, sort, onlyOpen, desktops, laptops, inventory]);

  return (
    <div className="min-h-dvh bg-[#fafafa] text-[#111] antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <span className="text-lg font-semibold tracking-tight">AI Store</span>
          </div>
          <button onClick={onLock} className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100" aria-label="Lock">
            <Lock className="size-4" />
          </button>
        </div>
      </header>

      {/* Hero AI Pre-builds */}
      {view === "ai" && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Creative Pre-builds</h1>
            <p className="mt-2 text-neutral-500">Hand-tuned by AI for real people. Ranked by price-per-performance.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AI_BUILDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setView("desktops")}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-black/10"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${b.style} transition`} />
                <div className="relative">
                  <div className={`inline-flex rounded-full bg-gradient-to-r ${b.style} px-3 py-1 text-xs font-semibold text-white`}>AI</div>
                  <h3 className="mt-3 text-xl font-semibold">{b.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{b.tagline}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                    Browse matching <ChevronRight className="ml-1 size-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="sticky top-[57px] z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          {(["ai", "desktops", "laptops", "parts"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${view === v ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
            >
              {v === "ai" ? "AI Builds" : v === "desktops" ? "Desktops" : v === "laptops" ? "Laptops" : "Parts"}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-9 pr-4 text-sm outline-none ring-blue-500/20 focus:ring-2"
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm">
            <option value="ppp">Price / Performance</option>
            <option value="score">Highest Score</option>
            <option value="price-asc">Price low → high</option>
            <option value="price-desc">Price high → low</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="rounded" />
            Open box
          </label>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        {view === "ai" ? null : shown.length === 0 ? (
          <p className="py-20 text-center text-neutral-400">Nothing matches. Try a different search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((part) => {
              const score = part.cat === "prebuilt" ? machineScore(part.name) : partScore(part);
              const rank = rankFrom(score);
              const tags = tagsOf(part);
              if (hasIGPU(part)) tags.unshift("iGPU");
              const value = ppp(part);
              return (
                <article key={part.id} className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{part.brand}</p>
                      <h3 className="mt-1 text-base font-semibold leading-snug">{part.name.replace(/\(open box\)/i, "").trim()}</h3>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rank.bg, color: rank.fg }}>
                      {rank.name}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{money(part.price)}</span>
                    {part.was && <span className="text-sm text-neutral-400 line-through">{money(part.was)}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span>Score {Math.round(score)}</span>
                    <span>·</span>
                    <span>${value < 100 ? value.toFixed(1) : Math.round(value)} / pt</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 4).map((t) => (
                        <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${t === "iGPU" ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-600"}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

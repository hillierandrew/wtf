import { useMemo, useState } from "react";
import { rankFrom } from "@/lib/catalog";
import { compareStock, stockFacts, stockSummary, sortsFor, STOCK, type PriceSort, type StockItem } from "@/lib/stock";

function moneyLabelSafe(item: StockItem) {
  return item.missingPrice ? "No price" : item.price.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

const SUMMARY = stockSummary();
const CATS = SUMMARY.cats;

export function Prices({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>(CATS.map((cat) => cat.id));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PriceSort>("price-asc");
  const [budget, setBudget] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [rank, setRank] = useState("all");
  const [deal, setDeal] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [onlyStale, setOnlyStale] = useState(false);
  const [cmr, setCmr] = useState(false);
  const [table, setTable] = useState(false);
  const [limit, setLimit] = useState(40);
  const [openId, setOpenId] = useState<string | null>(null);
  const [countsOpen, setCountsOpen] = useState(false);

  const sorts = sortsFor(picked);
  const sortId = sorts.some((item) => item.id === sort) ? sort : "price-asc";
  const narrowed = Boolean(query.trim() || budget || rank !== "all" || deal !== "all" || onlyMissing || onlyStale || cmr || picked.length !== CATS.length);
  const matches = useMemo(() => {
    if (!narrowed) return [];
    const chosen = new Set(picked);
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const max = Number(budget);
    return STOCK.filter((item) => {
      if (!chosen.has(item.cat)) return false;
      if (hideOpen && item.open) return false;
      if (onlyMissing && !item.missingPrice) return false;
      if (onlyStale && !item.stale) return false;
      if (cmr && item.cmr !== true) return false;
      if (Number.isFinite(max) && max > 0 && (item.missingPrice || item.price > max)) return false;
      if (rank !== "all") {
        if (item.power == null || rankFrom(item.power).name !== rank) return false;
      }
      if (deal !== "all" && item.deal.name !== deal) return false;
      if (words.length && !words.every((word) => item.blob.includes(word))) return false;
      return true;
    }).sort((a, b) => compareStock(a, b, sortId));
  }, [picked, query, sortId, budget, hideOpen, rank, deal, onlyMissing, onlyStale, cmr, narrowed]);

  const shown = matches.slice(0, limit);
  const current = STOCK.find((item) => item.id === openId) ?? null;

  function toggle(id: string) {
    setLimit(40);
    setOpenId(null);
    setPicked((currentIds) => (currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]));
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <header className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="text-base text-muted">
            Back
          </button>
          <p className="text-sm text-muted">{picked.length} categories · {matches.length} matches</p>
        </div>
        <h1 className="font-display mt-2 text-4xl font-medium leading-none">Prices</h1>
        <p className="mt-2 text-sm text-muted">One search for the whole shelf. Power is speed. Deal is the price. They are not the same number.</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(40);
            }}
            placeholder="RTX 4070, 2TB NVMe, DDR5 6000, 7200RPM"
            className="h-12 w-full rounded-2xl border border-line bg-elevated px-3 text-base outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="shrink-0 text-sm text-muted">Budget</span>
              <input value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="Any" className="h-full w-full bg-transparent text-base outline-none" />
            </label>
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="shrink-0 text-sm text-muted">Sort</span>
              <select value={sortId} onChange={(event) => setSort(event.target.value as PriceSort)} className="h-full min-w-0 flex-1 bg-transparent text-base outline-none">
                {sorts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCatsOpen((value) => !value)} className="h-10 rounded-full bg-accent px-4 text-sm text-accent-fg">
              Categories ({picked.length}/{CATS.length})
            </button>
            <button type="button" onClick={() => setMoreOpen((value) => !value)} className="h-10 rounded-full border border-line px-4 text-sm">
              {moreOpen ? "Hide filters" : "More filters"}
            </button>
            <button type="button" onClick={() => setTable((value) => !value)} className="h-10 rounded-full border border-line px-4 text-sm">
              {table ? "Cards" : "Table"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setBudget("");
                setRank("all");
                setDeal("all");
                setHideOpen(false);
                setOnlyMissing(false);
                setOnlyStale(false);
                setCmr(false);
                setPicked(CATS.map((cat) => cat.id));
                setSort("price-asc");
                setLimit(40);
              }}
              className="h-10 rounded-full border border-line px-4 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {catsOpen ? (
          <div className="mt-3 rounded-2xl border border-line bg-elevated p-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setPicked(CATS.map((cat) => cat.id))} className="h-10 rounded-full bg-accent px-3 text-sm text-accent-fg">
                Select all
              </button>
              <button type="button" onClick={() => setPicked([])} className="h-10 rounded-full border border-line px-3 text-sm">
                Clear all
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {CATS.map((cat) => (
                <label key={cat.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={picked.includes(cat.id)} onChange={() => toggle(cat.id)} />
                  <span>
                    {cat.title} <span className="text-muted">({cat.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {moreOpen ? (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="text-sm text-muted">Power</span>
              <select value={rank} onChange={(event) => setRank(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent outline-none">
                <option value="all">Any</option>
                {["Crystal", "Gold", "Silver", "Bronze", "Brown"].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="text-sm text-muted">Deal</span>
              <select value={deal} onChange={(event) => setDeal(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent outline-none">
                <option value="all">Any</option>
                {["Steal", "Fair", "Full", "Stretch", "INSUFFICIENT PRICE DATA"].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setHideOpen((value) => !value)} className={`h-12 rounded-2xl border px-3 text-left text-sm ${hideOpen ? "border-accent bg-subtle" : "border-line"}`}>
              {hideOpen ? "Open box hidden" : "Open box shown"}
            </button>
            <button type="button" onClick={() => setOnlyMissing((value) => !value)} className={`h-12 rounded-2xl border px-3 text-left text-sm ${onlyMissing ? "border-accent bg-subtle" : "border-line"}`}>
              {onlyMissing ? "Only missing prices" : "Missing prices too"}
            </button>
            <button type="button" onClick={() => setOnlyStale((value) => !value)} className={`h-12 rounded-2xl border px-3 text-left text-sm ${onlyStale ? "border-accent bg-subtle" : "border-line"}`}>
              {onlyStale ? "Only stale prices" : "Stale prices too"}
            </button>
            {picked.length === 1 && picked[0] === "hdd" ? (
              <button type="button" onClick={() => setCmr((value) => !value)} className={`h-12 rounded-2xl border px-3 text-left text-sm ${cmr ? "border-accent bg-subtle" : "border-line"}`}>
                {cmr ? "CMR only" : "CMR filter off"}
              </button>
            ) : null}
          </div>
        ) : null}

        <button type="button" onClick={() => setCountsOpen((value) => !value)} className="mt-4 text-left text-sm text-muted">
          {SUMMARY.total} products · {SUMMARY.priced} with a price · {SUMMARY.missing} missing · {SUMMARY.stale} stale · newest price check {SUMMARY.newest}
        </button>
        {countsOpen ? (
          <ul className="mt-2 space-y-1 text-sm">
            <li>Inventory import {SUMMARY.inventoryImport}. Duplicate rows hidden: {SUMMARY.duplicatesRemoved}. Unknown date: {SUMMARY.unknownDate}.</li>
            <li>A price is stale when the check is before {SUMMARY.oldest === "Unknown" ? "a known date" : "2026-11-12"}.</li>
            {SUMMARY.cats.map((cat) => (
              <li key={cat.id}>
                {cat.title}: {cat.count}
              </li>
            ))}
          </ul>
        ) : null}

        {current ? (
          <article className="mt-4 rounded-3xl border border-line bg-elevated p-4">
            <button type="button" onClick={() => setOpenId(null)} className="text-sm text-muted">
              Close
            </button>
            <p className="mt-2 text-sm text-muted">{current.brand}</p>
            <h2 className="text-2xl font-semibold leading-tight">{current.name}</h2>
            <p className="mt-3 text-3xl font-semibold">{moneyLabelSafe(current)}</p>
            <p className="mt-1 text-sm text-muted">{current.powerNote}</p>
            <p className="mt-2 text-sm">{current.deal.say}</p>
            <dl className="mt-3 space-y-1 text-sm">
              {stockFacts(current).map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ) : null}

        {table ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-elevated text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">
                    <button type="button" onClick={() => setSort("price-asc")}>Price</button>
                  </th>
                  <th className="px-3 py-2 font-medium">Per unit</th>
                  <th className="px-3 py-2 font-medium">
                    <button type="button" onClick={() => setSort("power-desc")}>Power</button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button type="button" onClick={() => setSort("deal")}>Deal</button>
                  </th>
                  <th className="px-3 py-2 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setOpenId(item.id)} className="text-left font-medium">
                        {item.name}
                      </button>
                      {item.stale ? <span className="ml-2 text-xs text-red-700">Stale</span> : null}
                    </td>
                    <td className="px-3 py-2">{item.title}</td>
                    <td className="px-3 py-2 tabular-nums">{moneyLabelSafe(item)}</td>
                    <td className="px-3 py-2">{item.unitAmount == null ? "—" : `${moneyLabel(item.unitAmount)} ${item.unitLabel}`}</td>
                    <td className="px-3 py-2">{item.power == null ? "—" : `${rankFrom(item.power).name} ${item.power}`}</td>
                    <td className="px-3 py-2">{item.deal.name}</td>
                    <td className="px-3 py-2">{item.updated ?? "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {shown.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => setOpenId(item.id)} className="w-full rounded-2xl border border-line bg-elevated px-4 py-3 text-left">
                  <span className="text-xs text-muted">{item.title}{item.open ? " · Open box" : ""}{item.stale ? " · Stale price" : ""}</span>
                  <span className="mt-1 block text-lg font-medium leading-snug">{item.name}</span>
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    <span className="font-semibold">{moneyLabelSafe(item)}</span>
                    {item.unitAmount != null ? <span>{moneyLabel(item.unitAmount)} {item.unitLabel}</span> : null}
                    <span>{item.power == null ? "No power score" : `${rankFrom(item.power).name} ${item.power}`}</span>
                    <span>{item.deal.name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {matches.length === 0 ? <p className="mt-6 text-base text-muted">{narrowed ? "Nothing matches. Clear a filter or pick more categories." : `Search a name, set a budget, or turn a category off. All ${SUMMARY.total} products stay in the search.`}</p> : null}
        {limit < matches.length ? (
          <button type="button" onClick={() => setLimit((value) => value + 40)} className="mt-4 h-12 w-full rounded-2xl border border-line text-base">
            Show more ({matches.length - limit} left)
          </button>
        ) : null}
      </div>
    </div>
  );
}

function moneyLabel(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

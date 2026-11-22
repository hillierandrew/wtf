import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Search, X } from "lucide-react";
import {
  BUDGETS,
  CATS,
  CAT_LABEL,
  CAT_TAB,
  PARTS,
  AI_FILTERS,
  aiPicks,
  coveredByBundle,
  fitWhy,
  formLabel,
  formOf,
  includedParts,
  isJunk,
  money,
  needWatts,
  shelfNote,
  shortName,
  spendOf,
  suggest,
  tagsOf,
  warnings,
  wattOf,
  type Category,
} from "@/lib/catalog";
import { partsFrom, useBench } from "@/lib/store";

const REVIEW = CATS.length;

export function Builder({ onLeave }: { onLeave: () => void }) {
  const ids = useBench((state) => state.ids);
  const openBox = useBench((state) => state.openBox);
  const notice = useBench((state) => state.notice);
  const saved = useBench((state) => state.saved);
  const pick = useBench((state) => state.pick);
  const clear = useBench((state) => state.clear);
  const apply = useBench((state) => state.apply);
  const save = useBench((state) => state.save);
  const loadSaved = useBench((state) => state.loadSaved);
  const removeSaved = useBench((state) => state.removeSaved);
  const setOpenBox = useBench((state) => state.setOpenBox);
  const dismiss = useBench((state) => state.dismiss);

  const build = useMemo(() => partsFrom(ids), [ids]);
  const [step, setStep] = useState(0);
  const [panel, setPanel] = useState<"shelf" | "ai">("shelf");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [priceDesc, setPriceDesc] = useState(false);
  const [limit, setLimit] = useState(36);
  const [blocked, setBlocked] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const reviewing = panel === "shelf" && step === REVIEW;
  const ai = panel === "ai";
  const cat: Category = CATS[Math.min(step, CATS.length - 1)] ?? "cpu";

  useEffect(() => {
    setQuery("");
    setBrand("all");
    setLimit(36);
    setBlocked(false);
    scroller.current?.scrollTo(0, 0);
  }, [step]);

  const pool = useMemo(() => PARTS.filter((part) => part.cat === cat && !isJunk(part, openBox)), [cat, openBox]);
  const fitting = useMemo(() => pool.filter((part) => fitWhy(part, build) === ""), [pool, build]);
  const rejected = useMemo(() => pool.filter((part) => fitWhy(part, build) !== ""), [pool, build]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const part of fitting) counts.set(part.brand, (counts.get(part.brand) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [fitting]);

  const visible = useMemo(() => {
    const source = blocked ? rejected : fitting;
    const q = query.trim().toLowerCase();
    const list = source.filter((part) => {
      if (!blocked && brand !== "all" && part.brand !== brand) return false;
      if (!q) return true;
      return `${part.brand} ${part.name}`.toLowerCase().includes(q);
    });
    list.sort((a, b) => (priceDesc ? b.price - a.price : a.price - b.price));
    const chosen = build[cat];
    if (!blocked && chosen && list.some((part) => part.id === chosen.id)) {
      return [chosen, ...list.filter((part) => part.id !== chosen.id)];
    }
    return list;
  }, [blocked, rejected, fitting, brand, query, priceDesc, build, cat]);

  const total = spendOf(build);
  const filled = CATS.filter((item) => build[item]).length;
  const shown = visible.slice(0, limit);

  function go(next: number) {
    setPanel("shelf");
    setStep(Math.max(0, Math.min(REVIEW, next)));
  }

  function choose(part: (typeof PARTS)[number]) {
    pick(part);
    if (part.cat === "prebuilt") {
      go(REVIEW);
      return;
    }
    if (part.cat !== "bundle") return;
    const next = partsFrom(useBench.getState().ids);
    if (!next.bundle) return;
    const idx = CATS.findIndex((item) => item !== "bundle" && !next[item]);
    go(idx === -1 ? REVIEW : idx);
  }

  async function copy() {
    const covered = coveredByBundle(build);
    const lines = build.prebuilt
      ? [
          "drew.wtf build",
          `Prebuilt: ${build.prebuilt.brand} ${shortName(build.prebuilt)} (${money(build.prebuilt.price)})`,
          build.monitor
            ? `Monitor: ${build.monitor.brand} ${shortName(build.monitor)} (${money(build.monitor.price)})`
            : "Monitor: —",
          `Total: ${money(total)} CAD`,
        ]
      : [
          "drew.wtf build",
          ...CATS.map((item) => {
            const part = build[item];
            if (!part) return `${CAT_LABEL[item]}: —`;
            if (item !== "bundle" && covered.has(item)) return `${CAT_LABEL[item]}: ${part.brand} ${shortName(part)} (included)`;
            return `${CAT_LABEL[item]}: ${part.brand} ${shortName(part)} (${money(part.price)})`;
          }),
          `Total: ${money(total)} CAD`,
        ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl min-w-0 flex-col overflow-x-hidden bg-bg text-fg">
      <header className="safe-top min-w-0 shrink-0 border-b border-line px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-sm text-muted">
            Welcome
          </button>
          <p className="tabular text-sm font-medium">{money(total)}</p>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-medium leading-none tracking-tight">
            {ai ? "Build by AI" : reviewing ? "Your build" : CAT_LABEL[cat]}
          </h1>
          <p className="shrink-0 text-xs text-faint">
            {ai ? (
              "Ready builds"
            ) : reviewing ? (
              <>
                <span className="tabular">{filled}</span> of {CATS.length}
              </>
            ) : (
              <>
                <span className="tabular">{step + 1}</span> of {CATS.length}
              </>
            )}
          </p>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {CATS.map((item, index) => {
            const tone = ai
              ? "bg-subtle"
              : reviewing
              ? build[item]
                ? "bg-fg"
                : "bg-subtle"
              : index === step
                ? "bg-accent"
                : index < step
                  ? "bg-fg"
                  : "bg-subtle";
            return <span key={item} className={`h-1 flex-1 rounded-full ${tone}`} />;
          })}
        </div>
        <div className="mt-3 flex w-full min-w-0 gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setPanel("ai")}
            aria-pressed={ai}
            className={`h-8 shrink-0 rounded-full px-3 text-xs ${ai ? "bg-fg text-bg" : "border border-line text-muted"}`}
          >
            BUILD BY AI
          </button>
          {CATS.map((item, index) => {
            const on = !reviewing && index === step;
            const picked = Boolean(build[item]);
            return (
              <button
                key={item}
                type="button"
                onClick={() => go(index)}
                aria-pressed={on}
                className={`h-8 shrink-0 rounded-full px-3 text-xs ${on ? "bg-fg text-bg" : picked ? "bg-subtle text-fg" : "border border-line text-muted"}`}
              >
                {CAT_TAB[item]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => go(REVIEW)}
            aria-pressed={reviewing}
            className={`h-8 shrink-0 rounded-full px-3 text-xs ${reviewing ? "bg-fg text-bg" : "border border-line text-muted"}`}
          >
            Review
          </button>
        </div>
      </header>

      {notice ? (
        <div className="flex items-start justify-between gap-3 border-b border-line bg-subtle px-4 py-2 text-sm text-muted">
          <p>{notice}</p>
          <button type="button" onClick={dismiss} aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {ai ? (
          <AiPanel
            onUse={(pick) => {
              apply(pick.build, `${pick.name}. Change any part after.`);
              go(REVIEW);
            }}
          />
        ) : reviewing ? (
          <Review
            build={build}
            name={name}
            setName={setName}
            copied={copied}
            saved={saved}
            onJump={go}
            onCopy={copy}
            onClear={() => {
              clear();
              go(0);
            }}
            onApply={(budget) => {
              apply(suggest(budget.value), `${budget.label} filled from the shelf.`);
            }}
            onSave={() => {
              save(name);
              setName("");
            }}
            onLoad={(id) => {
              loadSaved(id);
              go(REVIEW);
            }}
            onDelete={removeSaved}
          />
        ) : (
          <div className="space-y-3 px-4 py-3">
            {cat === "bundle" ? (
              <div className="rounded-xl border border-line bg-elevated p-3">
                <p className="font-display text-2xl font-medium leading-none tracking-tight">Build a whole PC</p>
                <p className="mt-2 text-sm text-muted">Fills a compatible PC from the shelf. Change any part after.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {BUDGETS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        apply(suggest(item.value), `${item.label} filled from the shelf.`);
                        go(REVIEW);
                      }}
                      className="h-11 rounded-lg bg-accent text-sm font-medium text-accent-fg"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-elevated px-3">
              <Search className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setLimit(36);
                }}
                placeholder={`Search ${CAT_LABEL[cat].toLowerCase()}`}
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-faint"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPriceDesc((value) => !value)}
                className="h-10 shrink-0 rounded-lg border border-line bg-elevated px-3 text-sm text-muted"
              >
                {priceDesc ? "Price high" : "Price low"}
              </button>
              <button
                type="button"
                aria-pressed={openBox}
                onClick={() => setOpenBox(!openBox)}
                className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${openBox ? "border-accent bg-subtle text-fg" : "border-line bg-elevated text-muted"}`}
              >
                Open box
              </button>
              <button
                type="button"
                aria-pressed={blocked}
                onClick={() => {
                  setBlocked((value) => !value);
                  setLimit(36);
                }}
                className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${blocked ? "border-danger text-danger" : "border-line bg-elevated text-muted"} ${cat === "bundle" || cat === "monitor" || cat === "prebuilt" ? "hidden" : ""}`}
              >
                Won't fit ({rejected.length})
              </button>
              {!blocked ? (
                <label className="h-10 shrink-0">
                  <span className="sr-only">Brand</span>
                  <select
                    value={brand}
                    onChange={(event) => {
                      setBrand(event.target.value);
                      setLimit(36);
                    }}
                    className="h-10 rounded-lg border border-line bg-elevated px-3 text-sm text-muted"
                  >
                    <option value="all">All brands</option>
                    {brands.map(([label, count]) => (
                      <option key={label} value={label}>
                        {label} ({count})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <p className="text-xs text-faint">
              {blocked ? (
                <>
                  <span className="tabular">{visible.length}</span> blocked
                </>
              ) : (
                <>
                  <span className="tabular">{visible.length}</span> fit · {shelfNote(cat, build)}
                </>
              )}
              {" · Prices checked Nov 21, 2026"}
            </p>
            {shown.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">
                {query ? "Nothing matches that." : blocked ? "Everything here fits." : "Nothing fits. Check what won't."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shown.map((part) => {
                  const selected = !blocked && build[cat]?.id === part.id;
                  const reason = blocked ? fitWhy(part, build) : "";
                  const tags = part.cat === "bundle" ? includedParts(part).map((item) => shortName(item)) : tagsOf(part);
                  return (
                    <li key={part.id}>
                      <button
                        type="button"
                        onClick={() => choose(part)}
                        aria-pressed={selected}
                        className={`press flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-xs text-faint">
                            {part.brand}
                            {selected ? <Check className="size-3.5 text-accent" strokeWidth={2} /> : null}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-sm font-medium leading-snug">{shortName(part)}</span>
                          {reason ? <span className="mt-1 block text-xs text-danger">{reason}</span> : null}
                          {!reason && tags.length ? (
                            <span className={`mt-1 block text-xs text-muted ${part.cat === "bundle" ? "line-clamp-3" : ""}`}>{tags.join(part.cat === "bundle" ? " + " : " · ")}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="tabular block text-sm font-medium">{money(part.price)}</span>
                          {part.was && part.was > part.price ? (
                            <span className="tabular block text-xs text-faint line-through">{money(part.was)}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {visible.length > limit ? (
              <button
                type="button"
                onClick={() => setLimit((value) => value + 36)}
                className="h-11 w-full rounded-lg border border-line text-sm text-muted"
              >
                Show more
              </button>
            ) : null}
          </div>
        )}
      </div>

      <footer className="safe-bottom shrink-0 flex gap-2 border-t border-line px-4 pt-3">
        <button
          type="button"
          onClick={() => (ai ? setPanel("shelf") : step === 0 ? onLeave() : go(step - 1))}
          className="h-12 flex-1 rounded-lg border border-line text-sm"
        >
          Back
        </button>
        {ai ? (
          <button type="button" onClick={() => go(REVIEW)} className="h-12 flex-[2] rounded-lg bg-accent text-sm font-medium text-accent-fg">
            Review
          </button>
        ) : reviewing ? (
          <button type="button" onClick={copy} className="h-12 flex-[2] rounded-lg bg-accent text-sm font-medium text-accent-fg">
            {copied ? "Copied" : "Copy list"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(step + 1)}
            className="h-12 flex-[2] rounded-lg bg-accent text-sm font-medium text-accent-fg"
          >
            {step === CATS.length - 1 ? "Review" : "Next"}
          </button>
        )}
      </footer>
    </div>
  );
}

function AiPanel({ onUse }: { onUse: (pick: ReturnType<typeof aiPicks>[number]) => void }) {
  const picks = aiPicks();
  const [filter, setFilter] = useState<(typeof AI_FILTERS)[number]>("All");
  const shown = picks.filter((pick) => {
    if (filter === "All") return true;
    if (filter === "Value") return pick.tags.includes("value");
    if (filter === "1080p") return pick.tags.includes("1080");
    if (filter === "1440p") return pick.tags.includes("1440");
    if (filter === "Newer socket") return pick.tags.includes("am5");
    if (filter === "NVIDIA") return pick.tags.includes("nvidia");
    if (filter === "No card") return pick.tags.includes("desk");
    if (filter === "Screen") return pick.tags.includes("screen");
    return pick.tags.includes("work");
  });
  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-sm text-muted">
        {picks.length} full PCs from this shelf, ranked by what the money buys. A few include a screen. The rest do not.
      </p>
      <div className="flex gap-2 overflow-x-auto">
        {AI_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${filter === item ? "border-accent bg-subtle text-fg" : "border-line bg-elevated text-muted"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {shown.map((pick) => {
          const covered = coveredByBundle(pick.build);
          return (
            <li key={pick.id} className={`rounded-xl border p-3 ${pick.best ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-faint">{pick.kicker}</p>
                  <h2 className="font-display text-2xl font-medium leading-none tracking-tight">{pick.name}</h2>
                </div>
                <p className="tabular shrink-0 text-sm font-medium">{money(spendOf(pick.build))}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{pick.why}</p>
              <ul className="mt-3 space-y-1">
                {CATS.map((cat) => {
                  const part = pick.build[cat];
                  if (!part || cat === "bundle") return null;
                  const included = covered.has(cat);
                  return (
                    <li key={cat} className="flex justify-between gap-3 text-xs text-muted">
                      <span className="min-w-0 truncate">
                        {CAT_LABEL[cat]} · {shortName(part)}
                      </span>
                      <span className="shrink-0">{included ? "In deal" : money(part.price)}</span>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => onUse(pick)}
                className="mt-3 h-11 w-full rounded-lg bg-accent text-sm font-medium text-accent-fg"
              >
                Use this build
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Review({
  build,
  name,
  setName,
  copied,
  saved,
  onJump,
  onCopy,
  onClear,
  onApply,
  onSave,
  onLoad,
  onDelete,
}: {
  build: ReturnType<typeof partsFrom>;
  name: string;
  setName: (value: string) => void;
  copied: boolean;
  saved: { id: string; name: string }[];
  onJump: (step: number) => void;
  onCopy: () => void;
  onClear: () => void;
  onApply: (budget: (typeof BUDGETS)[number]) => void;
  onSave: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const ready = Boolean(build.prebuilt);
  const notes = warnings(build);
  const total = spendOf(build);
  const need = needWatts(build);
  const supply = wattOf(build.psu);
  const board = formOf(build.motherboard);
  const filled = CATS.some((cat) => build[cat]);
  const covered = coveredByBundle(build);
  const rows = ready ? CATS.filter((cat) => cat === "prebuilt" || cat === "monitor") : CATS;

  return (
    <div className="space-y-5 px-4 py-4">
      <ul className="flex flex-col gap-2">
        {rows.map((cat) => {
          const index = CATS.indexOf(cat);
          const part = build[cat];
          const included = part && cat !== "bundle" && covered.has(cat);
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onJump(index)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-elevated px-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-faint">{CAT_LABEL[cat]}</span>
                  <span className="block truncate text-sm">{part ? shortName(part) : "Skip for now"}</span>
                </span>
                <span className={`shrink-0 text-sm ${included ? "text-faint" : "tabular"}`}>
                  {part ? (included ? "Included" : money(part.price)) : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {ready ? (
        <div className="rounded-xl border border-line bg-elevated p-4">
          <p className="text-xs text-faint">Total</p>
          <p className="tabular text-lg font-medium">{money(total)}</p>
          <p className="mt-2 text-sm text-muted">{tagsOf(build.prebuilt!).join(" · ") || "Finished PC."}</p>
        </div>
      ) : (
      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-elevated p-4 text-sm">
        <div>
          <dt className="text-xs text-faint">Total</dt>
          <dd className="tabular text-lg font-medium">{money(total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Power</dt>
          <dd className="tabular text-lg font-medium">{supply ? `${supply}W` : "None"}</dd>
          <p className="text-xs text-faint">About {need}W needed</p>
        </div>
        <div>
          <dt className="text-xs text-faint">Socket</dt>
          <dd>{build.cpu?.socket || build.motherboard?.socket || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Board</dt>
          <dd>{board ? formLabel(board) : "—"}</dd>
        </div>
      </dl>
      )}

      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : ready ? (
        <p className="flex items-center gap-2 text-sm text-ok">
          <Check className="size-4" strokeWidth={1.75} />
          Finished PC. The price is the whole system.
        </p>
      ) : filled ? (
        <p className="flex items-center gap-2 text-sm text-ok">
          <Check className="size-4" strokeWidth={1.75} />
          These parts fit each other.
        </p>
      ) : (
        <p className="text-sm text-muted">Nothing picked yet. Open Build by AI, or start with a prebuilt.</p>
      )}
      {!build.monitor && ready && build.prebuilt?.form !== "aio" ? (
        <button type="button" onClick={() => onJump(CATS.indexOf("monitor"))} className="text-left text-sm text-muted">
          No monitor yet. Add a screen if you need one.
        </button>
      ) : null}
      {!build.monitor && !ready && (build.cpu || build.gpu || build.bundle) ? (
        <button type="button" onClick={() => onJump(CATS.indexOf("monitor"))} className="text-left text-sm text-muted">
          No monitor yet. Add a screen if you need one.
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {BUDGETS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onApply(item)}
            className="h-11 rounded-lg border border-line bg-elevated text-sm"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCopy} className="h-11 flex-1 rounded-lg border border-line text-sm">
          {copied ? "Copied" : "Copy list"}
        </button>
        <button type="button" onClick={onClear} className="h-11 rounded-lg border border-line px-3 text-sm text-muted">
          Clear
        </button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name this build"
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-elevated px-3 text-sm outline-none placeholder:text-faint"
        />
        <button type="submit" className="h-11 rounded-lg border border-line px-3 text-sm">
          Save
        </button>
      </form>

      {saved.length ? (
        <ul className="space-y-2">
          {saved.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLoad(item.id)}
                className="h-11 min-w-0 flex-1 truncate rounded-lg border border-line px-3 text-left text-sm"
              >
                {item.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="flex size-11 items-center justify-center rounded-lg border border-line text-faint"
                aria-label={`Delete ${item.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-faint">Prices in CAD. A part only stays if it fits the rest of the build.</p>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AlertTriangle, Check, Search, X } from "lucide-react";
import {
  BUDGETS,
  CATS,
  CAT_LABEL,
  CAT_TAB,
  PARTS,
  AI_FILTERS,
  aiPicks,
  buildSpeed,
  compareShelf,
  coveredByBundle,
  extraFilters,
  fitWhy,
  formLabel,
  formOf,
  gbOf,
  includedParts,
  isJunk,
  money,
  m2Slots,
  needWatts,
  partImage,
  partRank,
  priceChange,
  PRICE_CHECKED,
  machineScore,
  aiScore,
  scoreBuild,
  shelfNote,
  type ShelfSort,
  shortName,
  spendOf,
  suggest,
  tagsOf,
  unitCost,
  explainBuild,
  explainPart,
  extraWhy,
  slotLine,
  warnings,
  wattOf,
  type Category,
  type Part,
} from "@/lib/catalog";
import { extrasFromIds, partsFrom, useBench } from "@/lib/store";
import { RankBadge } from "@/components/rank";
import { SortRow } from "@/components/sorts";
import { ThemeToggle } from "@/lib/theme";

const REVIEW = CATS.length;
const ORDER: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "psu", "case", "cooler", "monitor"];
const NEED: Category[] = ["cpu", "motherboard", "memory", "storage", "case", "psu"];

function nextIndex(build: ReturnType<typeof partsFrom>, from: Category): number {
  const start = Math.max(0, ORDER.indexOf(from));
  const later = ORDER.slice(start + 1).find((item) => !build[item]);
  if (later) return CATS.indexOf(later);
  const earlier = ORDER.find((item) => !build[item]);
  if (earlier) return CATS.indexOf(earlier);
  return REVIEW;
}

export function Builder({ onLeave, start = "play" }: { onLeave: () => void; start?: "play" | "review" }) {
  const ids = useBench((state) => state.ids);
  const extraIds = useBench((state) => state.extraIds);
  const addExtra = useBench((state) => state.addExtra);
  const removeExtra = useBench((state) => state.removeExtra);
  const openBox = useBench((state) => state.openBox);
  const notice = useBench((state) => state.notice);
  const saved = useBench((state) => state.saved);
  const pick = useBench((state) => state.pick);
  const remove = useBench((state) => state.remove);
  const clear = useBench((state) => state.clear);
  const apply = useBench((state) => state.apply);
  const save = useBench((state) => state.save);
  const loadSaved = useBench((state) => state.loadSaved);
  const removeSaved = useBench((state) => state.removeSaved);
  const setOpenBox = useBench((state) => state.setOpenBox);
  const dismiss = useBench((state) => state.dismiss);

  const build = useMemo(() => partsFrom(ids), [ids]);
  const extras = useMemo(() => extrasFromIds(extraIds), [extraIds]);
  const [step, setStep] = useState(start === "review" ? REVIEW : 0);
  const [panel, setPanel] = useState<"play" | "shelf" | "ai">(start === "review" ? "shelf" : "play");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [sortBy, setSortBy] = useState<ShelfSort>("price-asc");
  const [limit, setLimit] = useState(36);
  const [blocked, setBlocked] = useState(false);
  const [tag, setTag] = useState("all");
  const [facet, setFacet] = useState("all");
  const [wide, setWide] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [badge, setBadge] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const reviewing = panel === "shelf" && step === REVIEW;
  const ai = panel === "ai";
  const play = panel === "play";
  const cat: Category = CATS[Math.min(step, CATS.length - 1)] ?? "cpu";

  useEffect(() => {
    setQuery("");
    setBrand("all");
    setLimit(36);
    setBlocked(false);
    setTag("all");
    setFacet("all");
    scroller.current?.scrollTo(0, 0);
  }, [step]);

  const pool = useMemo(() => PARTS.filter((part) => part.cat === cat && !isJunk(part, openBox)), [cat, openBox]);
  const fitting = useMemo(() => pool.filter((part) => fitWhy(part, build) === ""), [pool, build]);
  const rejected = useMemo(() => pool.filter((part) => fitWhy(part, build) !== ""), [pool, build]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const part of fitting) counts.set(part.brand, (counts.get(part.brand) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [fitting]);

  const tagChoices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const part of fitting) {
      for (const label of tagsOf(part)) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 14);
  }, [fitting]);

  const visible = useMemo(() => {
    const source = blocked ? rejected : fitting;
    const q = query.trim().toLowerCase();
    const list = source.filter((part) => {
      if (!blocked && brand !== "all" && part.brand !== brand) return false;
      if (!blocked && tag !== "all" && !tagsOf(part).includes(tag)) return false;
      if (!blocked && facet !== "all") {
        const rule = extraFilters(cat).find((item) => item.label === facet);
        if (rule && !rule.test(part)) return false;
      }
      if (!q) return true;
      return `${part.brand} ${part.name}`.toLowerCase().includes(q);
    });
    list.sort((a, b) => compareShelf(a, b, sortBy));
    const chosen = build[cat];
    if (!blocked && chosen && list.some((part) => part.id === chosen.id)) {
      return [chosen, ...list.filter((part) => part.id !== chosen.id)];
    }
    return list;
  }, [blocked, rejected, fitting, brand, query, sortBy, build, cat, tag, facet]);

  const score = scoreBuild(build);
  const filled = CATS.filter((item) => build[item]).length;
  const shown = visible.slice(0, limit);
  const total = spendOf(build, extras);
  const ready = Boolean(build.prebuilt) || NEED.every((item) => build[item]);
  const xp = filled * 10 + (ready ? 30 : 0);
  const level = xp >= 100 ? "Legend" : xp >= 70 ? "Engineer" : xp >= 40 ? "Builder" : xp >= 10 ? "Apprentice" : "Recruit";
  const seen = useRef(new Set<string>());

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
    if (part.cat !== "bundle") {
      const next = partsFrom(useBench.getState().ids);
      const count = CATS.filter((item) => next[item]).length;
      const online = Boolean(next.prebuilt) || NEED.every((item) => next[item]);
      const prize = online ? "PC online" : count === 1 ? "First part" : count === 3 ? "Combo x3" : count === 6 ? "Halfway" : "";
      if (prize && !seen.current.has(prize)) {
        seen.current.add(prize);
        setBadge(prize);
        window.setTimeout(() => setBadge(""), 2200);
      }
      go(nextIndex(next, part.cat));
      return;
    }
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
          ...extras.monitor.map((part, index) => `Extra screen ${index + 1}: ${part.brand} ${shortName(part)} (${money(part.price)})`),
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
          ...extras.memory.map((part, index) => `Extra memory ${index + 1}: ${part.brand} ${shortName(part)} (${money(part.price)})`),
          ...extras.storage.map((part, index) => `Extra drive ${index + 1}: ${part.brand} ${shortName(part)} (${money(part.price)})`),
          ...extras.monitor.map((part, index) => `Extra screen ${index + 1}: ${part.brand} ${shortName(part)} (${money(part.price)})`),
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
    <div className={`mx-auto flex h-dvh w-full min-w-0 overflow-hidden bg-bg text-fg ${wide ? "max-w-6xl flex-col md:flex-row" : "max-w-xl flex-col"}`}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="safe-top min-w-0 shrink-0 border-b border-line px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-sm text-muted">
            Welcome
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={wide}
              onClick={() => setWide((value) => !value)}
              className={`h-8 rounded-full border px-3 text-xs ${wide ? "border-accent bg-subtle text-fg" : "border-line text-muted"}`}
            >
              {wide ? "Phone" : "Desktop"}
            </button>
            <ThemeToggle />
            <p className="tabular text-sm font-medium">{money(total)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-medium leading-none tracking-tight">
            {play ? "Pick a PC" : ai ? "Build by AI" : reviewing ? "Chosen parts" : CAT_LABEL[cat]}
          </h1>
          {play ? null : (
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
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="font-medium">{score.rank}</p>
            <p className="tabular text-faint">{score.points}/100</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
            <div className="h-full bg-accent" style={{ width: `${score.points}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{score.next}</p>
          <p className="mt-1 text-xs text-faint">
            {level} · {xp} XP
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
        {showTabs && !play ? (
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
        ) : null}
        {!play ? (
          <button type="button" onClick={() => setShowTabs((value) => !value)} className="mt-2 text-xs text-muted">
            {showTabs ? "Hide the part list" : "See every part"}
          </button>
        ) : null}
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
        {play ? (
          <Quest
            onUse={(pick) => {
              apply(pick.build, `${pick.name}. You can change a part later.`);
              setPanel("shelf");
              go(REVIEW);
              setBadge(pick.kicker || pick.name);
              window.setTimeout(() => setBadge(""), 3200);
            }}
            onManual={() => {
              setPanel("shelf");
              go(CATS.indexOf("cpu"));
            }}
            onMore={() => setPanel("ai")}
          />
        ) : ai ? (
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
            extras={extras}
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
            <p className="text-sm text-muted">{LESSON[cat]}</p>
            {cat === "prebuilt" ? (
              <p className="rounded-xl border border-line bg-elevated p-3 text-sm text-muted">
                Finished computers. Pick one and you are done. You do not add parts after this, except a screen.
              </p>
            ) : null}
            {cat === "bundle" ? (
              <p className="rounded-xl border border-line bg-elevated p-3 text-sm text-muted">
                A bundle is a discount on parts, not a second computer. It fills the processor, board, or case it names.
              </p>
            ) : null}
            {cat === "memory" || cat === "storage" || cat === "monitor" ? (
              <div className="rounded-2xl border border-line bg-elevated p-4 text-base">
                <p className="font-medium">{cat === "memory" ? "You can add more memory." : cat === "storage" ? "You can add more drives." : "You can add more screens."}</p>
                <p className="mt-1 text-muted">{slotLine(cat, build, extras)}</p>
              </div>
            ) : build[cat] ? (
              <p className="rounded-2xl border border-line bg-elevated p-4 text-base text-muted">{slotLine(cat, build, extras)}</p>
            ) : null}
            {cat === "cooler" && build.cpu && /with cooler|wraith/i.test(build.cpu.name) ? (
              <div className="rounded-xl border border-line bg-elevated p-3 text-sm">
                <p className="font-medium">Skip the cooler.</p>
                <p className="mt-1 text-muted">This processor already includes one. Another cooler is an extra part.</p>
              </div>
            ) : null}
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
                className="h-full w-full bg-transparent text-base outline-none placeholder:text-faint"
              />
            </label>
            <SortRow
              value={sortBy}
              onChange={(next) => {
                setSortBy(next);
                setLimit(36);
              }}
            />
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                aria-pressed={openBox}
                onClick={() => setOpenBox(!openBox)}
                className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${openBox ? "border-accent bg-subtle text-fg" : "border-line bg-elevated text-muted"}`}
              >
                Open box
              </button>
              {extraFilters(cat).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={facet === item.label}
                  onClick={() => {
                    setFacet(facet === item.label ? "all" : item.label);
                    setLimit(36);
                  }}
                  className={`h-10 shrink-0 rounded-lg border px-3 text-sm ${facet === item.label ? "border-accent bg-subtle text-fg" : "border-line bg-elevated text-muted"} ${blocked ? "hidden" : ""}`}
                >
                  {item.label}
                </button>
              ))}
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
            {!blocked && tagChoices.length ? (
              <div className="flex gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  aria-pressed={tag === "all"}
                  onClick={() => setTag("all")}
                  className={`h-8 shrink-0 rounded-full border px-3 text-xs ${tag === "all" ? "border-accent bg-subtle text-fg" : "border-line text-muted"}`}
                >
                  Any tag
                </button>
                {tagChoices.map(([label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={tag === label}
                    onClick={() => {
                      setTag(label);
                      setLimit(36);
                    }}
                    className={`h-8 shrink-0 rounded-full border px-3 text-xs ${tag === label ? "border-accent bg-subtle text-fg" : "border-line text-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
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
              {" · Prices checked "}
              {PRICE_CHECKED}
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
                  const addNote = !blocked && (part.cat === "memory" || part.cat === "storage" || part.cat === "monitor") ? extraWhy(part, build, extras) : "no";
                  const canAdd = addNote === "";
                  return (
                    <li key={part.id} className={`overflow-hidden rounded-2xl border ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                      <button
                        type="button"
                        onClick={() => choose(part)}
                        aria-pressed={selected}
                        className="press flex w-full items-start justify-between gap-3 px-3 py-4 text-left"
                      >
                        <PartMark part={part} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-sm text-muted">
                            {part.brand}
                            {selected ? <Check className="size-4 text-accent" strokeWidth={2} /> : null}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-base font-medium leading-snug">{shortName(part)}</span>
                          {reason ? <span className="mt-1 block text-sm text-danger">{reason}</span> : null}
                          {!reason && part.cat === "prebuilt" ? <span className="mt-1 block text-sm text-muted">Score {machineScore(part.name)}/100</span> : null}
                          {!reason && part.cat === "gpu" && buildSpeed({ gpu: part }) ? (
                            <span className="mt-1 block text-sm text-muted">Roughly {buildSpeed({ gpu: part })}% of an RX 9070</span>
                          ) : null}
                          {!reason && tags.length ? (
                            <span className={`mt-1 block text-sm text-muted ${part.cat === "bundle" ? "line-clamp-3" : ""}`}>
                              {tags.join(part.cat === "bundle" ? " + " : " · ")}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="tabular block text-base font-medium">{money(part.price)}</span>
                          <span className="mt-1 block text-sm leading-tight text-muted">Updated {PRICE_CHECKED}</span>
                          {priceChange(part) ? (
                            <span className={`block text-sm leading-tight ${priceChange(part)!.kind === "down" ? "text-ok" : "text-danger"}`}>
                              {priceChange(part)!.kind === "down" ? "Down" : "Up"} {money(priceChange(part)!.diff)}
                            </span>
                          ) : null}
                          {unitCost(part) ? <span className="mt-1 block text-sm leading-tight text-muted">{unitCost(part)!.text}</span> : null}
                        </span>
                      </button>
                      <div className="px-3 pb-3">
                        <RankBadge score={partRank(part).score} lines={explainPart(part)} />
                      </div>
                      {canAdd ? (
                        <button type="button" onClick={() => addExtra(part)} className="h-14 w-full border-t border-line text-base font-medium text-accent">
                          Add another
                        </button>
                      ) : null}
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

      {play ? null : (
      <footer className="safe-bottom shrink-0 flex gap-2 border-t border-line px-4 pt-3">
        <button
          type="button"
          onClick={() => (ai ? setPanel("shelf") : step === 0 ? onLeave() : go(step - 1))}
          className="h-14 flex-1 rounded-2xl border border-line text-base"
        >
          Back
        </button>
          <button
            type="button"
            onClick={() => (reviewing ? copy() : go(ai ? REVIEW : nextIndex(build, cat)))}
            className="h-14 flex-[2] rounded-2xl bg-accent text-base font-medium text-accent-fg"
          >
            {reviewing ? (copied ? "Copied" : "Copy the list") : ai || nextIndex(build, cat) === REVIEW ? "See chosen parts" : `Next: ${CAT_TAB[CATS[nextIndex(build, cat)] ?? "cpu"]}`}
          </button>
      </footer>
      )}
      </div>
      <Checkout
        build={build}
        extras={extras}
        wide={wide}
        onRemove={remove}
        onRemoveExtra={removeExtra}
        onOpen={(item) => {
          setPanel("shelf");
          go(CATS.indexOf(item));
        }}
      />
      {badge ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-40 mx-auto w-[min(100%,24rem)] px-4">
          <div className="rounded-2xl border border-accent bg-elevated px-4 py-4">
            <p className="text-base font-medium text-accent">Achievement unlocked</p>
            <p className="font-display mt-1 text-2xl leading-none">{badge}</p>
            <p className="mt-1 text-sm text-muted">{badge === "PC online" ? "The computer can turn on." : badge === "Combo x3" ? "Three parts in a row." : "Keep going."}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const LESSON: Record<Category, string> = {
  prebuilt: "A finished computer. You do not put this one together.",
  bundle: "A sale on a few parts. Skip it if you are picking one by one.",
  cpu: "The brain. The board has to match it.",
  motherboard: "Everything plugs into this. It must fit the processor.",
  memory: "The first kit is the main one. Add another only if the sticks fit.",
  gpu: "This draws the games. Skip it only if the processor already has pictures.",
  storage: "The first drive is the main one. Add another only if a slot is free.",
  case: "The box. It has to be big enough for the board.",
  cooler: "Keeps the brain cool. Skip it if one came in the processor box.",
  psu: "Power for the whole PC. Too small and it will not turn on.",
  monitor: "The screen. The computer still works if you skip this.",
};

const GAME_LIST: { kicker: string; title: string; year: string }[] = [
  { kicker: "Call of Duty", title: "Call of Duty: Modern Warfare 4", year: "2026" },
  { kicker: "Battlefield", title: "Battlefield 6", year: "2025" },
  { kicker: "Fortnite", title: "Fortnite", year: "2017" },
  { kicker: "Valorant", title: "Valorant", year: "2020" },
  { kicker: "League", title: "League of Legends", year: "2009" },
  { kicker: "GTA VI", title: "Grand Theft Auto VI", year: "2026" },
  { kicker: "GTA V", title: "Grand Theft Auto V", year: "2013" },
  { kicker: "Counter-Strike 2", title: "Counter-Strike 2", year: "2023" },
  { kicker: "Elden Ring", title: "Elden Ring", year: "2022" },
  { kicker: "Cyberpunk 2077", title: "Cyberpunk 2077", year: "2020" },
  { kicker: "Helldivers 2", title: "Helldivers 2", year: "2024" },
  { kicker: "Monster Hunter Wilds", title: "Monster Hunter Wilds", year: "2025" },
  { kicker: "Black Myth: Wukong", title: "Black Myth: Wukong", year: "2024" },
  { kicker: "Baldur's Gate 3", title: "Baldur's Gate 3", year: "2023" },
  { kicker: "Red Dead Redemption 2", title: "Red Dead Redemption 2", year: "2018" },
  { kicker: "The Witcher 3", title: "The Witcher 3: Wild Hunt", year: "2015" },
  { kicker: "Harry Potter", title: "Hogwarts Legacy", year: "2023" },
  { kicker: "Skyrim", title: "The Elder Scrolls V: Skyrim", year: "2011" },
  { kicker: "Apex Legends", title: "Apex Legends", year: "2019" },
  { kicker: "Overwatch 2", title: "Overwatch 2", year: "2022" },
  { kicker: "Rocket League", title: "Rocket League", year: "2015" },
  { kicker: "Minecraft", title: "Minecraft", year: "2011" },
  { kicker: "Roblox", title: "Roblox", year: "2006" },
  { kicker: "Palworld", title: "Palworld", year: "2024" },
  { kicker: "Diablo IV", title: "Diablo IV", year: "2023" },
  { kicker: "Rust", title: "Rust", year: "2018" },
  { kicker: "Destiny 2", title: "Destiny 2", year: "2017" },
  { kicker: "Starfield", title: "Starfield", year: "2023" },
  { kicker: "Flight Simulator", title: "Microsoft Flight Simulator", year: "2020" },
  { kicker: "Farming Simulator", title: "Farming Simulator 25", year: "2024" },
  { kicker: "Euro Truck", title: "Euro Truck Simulator 2", year: "2012" },
  { kicker: "Cities Skylines 2", title: "Cities: Skylines II", year: "2023" },
  { kicker: "The Finals", title: "The Finals", year: "2023" },
  { kicker: "Lethal Company", title: "Lethal Company", year: "2023" },
  { kicker: "Stardew Valley", title: "Stardew Valley", year: "2016" },
  { kicker: "World of Warcraft", title: "World of Warcraft", year: "2004" },
  { kicker: "Final Fantasy XIV", title: "Final Fantasy XIV", year: "2013" },
  { kicker: "Spider-Man", title: "Marvel's Spider-Man", year: "2022" },
  { kicker: "God of War", title: "God of War", year: "2022" },
  { kicker: "Alan Wake 2", title: "Alan Wake 2", year: "2023" },
  { kicker: "Sea of Thieves", title: "Sea of Thieves", year: "2018" },
  { kicker: "No Man's Sky", title: "No Man's Sky", year: "2016" },
  { kicker: "Tarkov", title: "Escape from Tarkov", year: "2017" },
  { kicker: "Forza", title: "Forza Horizon 5", year: "2021" },
  { kicker: "Sims", title: "The Sims 4", year: "2014" },
  { kicker: "Warframe", title: "Warframe", year: "2013" },
  { kicker: "Path of Exile 2", title: "Path of Exile 2", year: "2024" },
  { kicker: "Marvel Rivals", title: "Marvel Rivals", year: "2024" },
];
const SIZES = [
  { id: "basic", label: "Basic" },
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "medium", label: "Medium" },
  { id: "ultra", label: "Ultra" },
];
const JOBS = [
  { id: "office", title: "Office", line: "Email and a calendar." },
  { id: "zoom", title: "Zoom", line: "Video calls." },
  { id: "meet", title: "Conference", line: "A meeting-room PC." },
  { id: "podcast", title: "Podcast", line: "Quiet, with room for episodes." },
  { id: "radio", title: "Radio", line: "A long show, without a hot graphics card." },
  { id: "vlog", title: "Vlog", line: "Phone clips and titles." },
  { id: "edit", title: "Video editing", line: "The bigger editing PC." },
  { id: "college", title: "School", line: "Class, notes, and a browser." },
  { id: "photo", title: "Photoshop", line: "Pictures and class projects." },
  { id: "cad", title: "AutoCAD", line: "Drawings for class." },
  { id: "blender", title: "Blender", line: "3D models." },
  { id: "code", title: "Programming", line: "Code, tabs, and a browser." },
  { id: "music", title: "Music", line: "A quiet desk for tracks." },
  { id: "stream", title: "Streaming", line: "A game and a camera." },
  { id: "excel", title: "Spreadsheets", line: "Excel, numbers, and mail." },
  { id: "davinci", title: "DaVinci", line: "Color and a finished cut." },
  { id: "unity", title: "Unity", line: "A small game you are making." },
  { id: "unreal", title: "Unreal", line: "A heavier game engine." },
  { id: "obs", title: "OBS", line: "Record the screen." },
  { id: "ableton", title: "Ableton", line: "Music software and plugins." },
];

function Quest({
  onUse,
  onManual,
  onMore,
}: {
  onUse: (pick: ReturnType<typeof aiPicks>[number]) => void;
  onManual: () => void;
  onMore: () => void;
}) {
  const picks = aiPicks();
  const [screen, setScreen] = useState<"menu" | "games" | "jobs" | "sizes" | "consoles" | "emu">("menu");
  const [game, setGame] = useState("");
  const [cooking, setCooking] = useState("");
  const [pct, setPct] = useState(0);

  function order(pick: ReturnType<typeof aiPicks>[number]) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onUse(pick);
      return;
    }
    setCooking(pick.kicker || pick.name);
    setPct(6);
    const start = performance.now();
    const tick = () => {
      const next = Math.min(100, ((performance.now() - start) / 1500) * 100);
      setPct(next);
      if (next < 100) requestAnimationFrame(tick);
      else onUse(pick);
    };
    requestAnimationFrame(tick);
  }

  if (cooking) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-10">
        <p className="text-base text-muted">Building</p>
        <h2 className="font-display mt-2 text-4xl font-medium leading-none tracking-tight">{cooking}</h2>
        <div className="mt-6 h-4 overflow-hidden rounded-full bg-subtle">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-4 text-base text-muted">Putting the parts in the box. Wrong sizes stay out.</p>
      </div>
    );
  }

  if (screen === "sizes") {
    const cards = SIZES.map((size) => picks.find((item) => item.kicker === game && item.tags.includes(size.id))).filter(Boolean);
    return (
      <div className="space-y-3 px-4 py-4">
        <button type="button" onClick={() => setScreen("games")} className="h-11 text-base text-muted">
          Back
        </button>
        <h2 className="font-display text-4xl font-medium leading-none tracking-tight">{GAME_LIST.find((item) => item.kicker === game)?.title ?? game}</h2>
        <p className="text-base text-muted">{GAME_LIST.find((item) => item.kicker === game)?.year}. Pick a size. Basic is the smallest. Ultra is the fancy one.</p>
        {cards.map((pick) => {
          if (!pick) return null;
          const size = SIZES.find((item) => pick.tags.includes(item.id));
          return (
            <button key={pick.id} type="button" onClick={() => order(pick)} className="press flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
              <span>
                <span className="block text-xl font-medium">{size?.label ?? pick.name}</span>
                <span className="mt-1 block text-base text-muted">{pick.why}</span>
              </span>
              <span className="tabular shrink-0 text-lg font-medium">{money(spendOf(pick.build))}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (screen === "games") {
    return (
      <div className="space-y-3 px-4 py-4">
        <button type="button" onClick={() => setScreen("menu")} className="h-11 text-base text-muted">
          Back
        </button>
        <h2 className="font-display text-4xl font-medium leading-none tracking-tight">Games</h2>
        <div className="grid grid-cols-1 gap-3">
          {GAME_LIST.map((item) => (
            <button
              key={item.kicker}
              type="button"
              onClick={() => {
                setGame(item.kicker);
                setScreen("sizes");
              }}
              className="press min-h-16 rounded-2xl border border-line bg-elevated px-4 py-3 text-left"
            >
              <span className="block text-xl font-medium">{item.title}</span>
              <span className="mt-1 block text-base text-muted">{item.year}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "consoles" || screen === "emu") {
    const ids = screen === "consoles" ? ["xss", "xsx", "ps5", "ps5pro"] : ["emu-old", "emu-switch", "emu-ps3", "emu-all"];
    const heading = screen === "consoles" ? "Like a console" : "Old consoles";
    return (
      <div className="space-y-3 px-4 py-4">
        <button type="button" onClick={() => setScreen("menu")} className="h-11 text-base text-muted">
          Back
        </button>
        <h2 className="font-display text-4xl font-medium leading-none tracking-tight">{heading}</h2>
        <p className="text-base text-muted">
          {screen === "emu" ? "These play games you already own. They do not come with those games." : "About as strong as the console. Not the same box."}
        </p>
        {ids.map((id) => {
          const pick = picks.find((item) => item.id === id);
          if (!pick) return null;
          return (
            <button key={id} type="button" onClick={() => order(pick)} className="press flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
              <span>
                <span className="block text-xl font-medium">{pick.kicker}</span>
                <span className="mt-1 block text-base text-muted">{pick.why}</span>
              </span>
              <span className="tabular shrink-0 text-lg font-medium">{money(spendOf(pick.build))}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (screen === "jobs") {
    return (
      <div className="space-y-3 px-4 py-4">
        <button type="button" onClick={() => setScreen("menu")} className="h-11 text-base text-muted">
          Back
        </button>
        <h2 className="font-display text-4xl font-medium leading-none tracking-tight">Work</h2>
        {JOBS.map((job) => {
          const pick = picks.find((item) => item.id === job.id);
          if (!pick) return null;
          return (
            <button key={job.id} type="button" onClick={() => order(pick)} className="press flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
              <span>
                <span className="block text-xl font-medium">{job.title}</span>
                <span className="mt-1 block text-base text-muted">{job.line}</span>
              </span>
              <span className="tabular shrink-0 text-lg font-medium">{money(spendOf(pick.build))}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <p className="text-base text-muted">One tap fills a whole computer. Or pick a game. The chosen parts stay at the bottom.</p>
      {(() => {
        const best = picks.find((item) => item.best) ?? picks[0];
        return best ? (
          <button type="button" onClick={() => order(best)} className="press min-h-24 w-full rounded-2xl bg-accent px-4 py-4 text-left text-accent-fg">
            <span className="block text-sm">Fastest way</span>
            <span className="mt-1 block text-3xl font-medium leading-none">Give me a PC</span>
            <span className="mt-2 block text-base">{best.name} · {money(spendOf(best.build))}</span>
          </button>
        ) : null;
      })()}
      <button type="button" onClick={() => setScreen("games")} className="press min-h-20 w-full rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
        <span className="block text-2xl font-medium">Games</span>
        <span className="mt-1 block text-base text-muted">Real names and the year they came out.</span>
      </button>
      <button type="button" onClick={() => setScreen("consoles")} className="press min-h-20 w-full rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
        <span className="block text-2xl font-medium">Like a console</span>
        <span className="mt-1 block text-base text-muted">PS5, PS5 Pro, Xbox Series X, Xbox Series S.</span>
      </button>
      <button type="button" onClick={() => setScreen("emu")} className="press min-h-20 w-full rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
        <span className="block text-2xl font-medium">Old consoles</span>
        <span className="mt-1 block text-base text-muted">Switch, PS3, Xbox 360, and older. Games you already own.</span>
      </button>
      <button type="button" onClick={() => setScreen("jobs")} className="press min-h-20 w-full rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
        <span className="block text-2xl font-medium">School and work</span>
        <span className="mt-1 block text-base text-muted">Zoom, office mail, podcasts, radio, video.</span>
      </button>
      <button type="button" onClick={onManual} className="press min-h-16 w-full rounded-2xl border border-line px-4 text-left text-xl font-medium">
        Pick the parts myself
      </button>
      <button type="button" onClick={onMore} className="h-12 w-full text-base text-muted">
        See the long list
      </button>
    </div>
  );
}

function PartMark({ part }: { part: Part }) {
  return <img src={partImage(part)} alt="" className="size-14 shrink-0 rounded-lg bg-subtle object-cover" />;
}

function Checkout({
  build,
  extras,
  wide,
  onRemove,
  onRemoveExtra,
  onOpen,
}: {
  build: ReturnType<typeof partsFrom>;
  extras: ReturnType<typeof extrasFromIds>;
  wide: boolean;
  onRemove: (cat: Category) => void;
  onRemoveExtra: (cat: "memory" | "storage" | "monitor", index: number) => void;
  onOpen: (cat: Category) => void;
}) {
  const rows = CATS.filter((cat) => build[cat]);
  const extraRows = [
    ...extras.memory.map((part, index) => ({ cat: "memory" as const, part, index })),
    ...extras.storage.map((part, index) => ({ cat: "storage" as const, part, index })),
    ...extras.monitor.map((part, index) => ({ cat: "monitor" as const, part, index })),
  ];
  const count = rows.length + extraRows.length;
  const ready = Boolean(build.prebuilt) || NEED.every((item) => build[item]);
  const missing = build.prebuilt ? ORDER.filter((item) => item === "monitor" && !build.monitor) : ORDER.filter((item) => !build[item]);
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState(360);
  const [width, setWidth] = useState(360);
  const [side, setSide] = useState(false);
  const drag = useRef<{ axis: "x" | "y"; start: number; size: number } | null>(null);

  useEffect(() => {
    const savedH = Number(localStorage.getItem("drew-checkout-h"));
    const savedW = Number(localStorage.getItem("drew-checkout-w"));
    if (savedH >= 120) setHeight(savedH);
    else setHeight(Math.round(window.innerHeight * 0.42));
    if (savedW >= 220) setWidth(savedW);
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setSide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const heightRef = useRef(height);
  const widthRef = useRef(width);
  heightRef.current = height;
  widthRef.current = width;

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    const axis = wide && side ? "x" : "y";
    drag.current = { axis, start: axis === "y" ? event.clientY : event.clientX, size: axis === "y" ? height : width };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    if (drag.current.axis === "y") {
      const next = drag.current.size + (drag.current.start - event.clientY);
      const max = Math.max(160, window.innerHeight - 88);
      if (next < 96) {
        setOpen(false);
        return;
      }
      setOpen(true);
      setHeight(Math.min(max, next));
      heightRef.current = Math.min(max, next);
    } else {
      const next = drag.current.size + (drag.current.start - event.clientX);
      const sized = Math.max(220, Math.min(window.innerWidth - 240, next));
      setWidth(sized);
      widthRef.current = sized;
    }
  }

  function onPointerUp() {
    if (!drag.current) return;
    const axis = drag.current.axis;
    drag.current = null;
    if (axis === "y") localStorage.setItem("drew-checkout-h", String(heightRef.current));
    else localStorage.setItem("drew-checkout-w", String(widthRef.current));
  }

  const docked = wide && side;
  return (
    <aside
      className={`relative flex min-h-0 flex-col border-line bg-elevated ${docked ? "h-full shrink-0 border-l" : "shrink-0 border-t"}`}
      style={docked ? { width } : { height: open ? height : 108 }}
    >
      <button
        type="button"
        aria-label="Drag to resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`flex h-11 w-full touch-none items-center justify-center gap-2 text-sm text-muted ${docked ? "md:hidden" : ""}`}
      >
        <span className="h-1 w-8 rounded-full bg-line" />
        Drag
      </button>
      {docked ? (
        <button
          type="button"
          aria-label="Drag to resize chosen parts"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute top-12 hidden -translate-x-1/2 cursor-ew-resize touch-none px-1 text-xs text-muted md:block"
        >
          Drag
        </button>
      ) : null}
      <div className="flex items-center gap-2 px-3 pb-2">
        <p className="min-w-0 flex-1">
          <span className="block text-xs text-faint">Chosen parts</span>
          <span className="tabular text-sm font-medium">
            {count} {count === 1 ? "part" : "parts"} · {money(spendOf(build, extras))}
          </span>
          <span className="block text-xs text-muted">{ready ? "This computer can turn on." : "Add the blank rows to finish it."}</span>
        </p>
        <button type="button" onClick={() => setOpen((value) => !value)} className="h-8 rounded-full border border-line px-3 text-xs text-muted">
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open ? (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {rows.map((cat) => {
            const part = build[cat];
            if (!part) return null;
            const others: ReturnType<typeof partsFrom> = { ...build };
            delete others[cat];
            const ok = fitWhy(part, others) === "";
            return (
              <li key={cat} className="flex items-center gap-2 rounded-xl border border-line px-2 py-2">
                <PartMark part={part} />
                <button type="button" onClick={() => onOpen(cat)} className="min-w-0 flex-1 text-left">
                  <span className="block text-xs text-faint">{CAT_LABEL[cat]}</span>
                  <span className="block truncate text-base">{shortName(part)}</span>
                  <span className="tabular block text-sm text-muted">{money(part.price)}</span>
                </button>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm ${ok ? "bg-subtle text-ok" : "bg-subtle text-danger"}`}>
                  {ok ? "✓" : "✕"}
                </span>
                <button type="button" onClick={() => onRemove(cat)} aria-label={`Remove ${CAT_LABEL[cat]}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted">
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
          {extraRows.map(({ cat, part, index }) => (
            <li key={`${cat}-extra-${index}`} className="flex items-center gap-2 rounded-xl border border-line px-2 py-2">
              <PartMark part={part} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-faint">Extra {CAT_LABEL[cat].toLowerCase()}</span>
                <span className="block truncate text-base">{shortName(part)}</span>
              </span>
              <button type="button" onClick={() => onRemoveExtra(cat, index)} aria-label={`Remove extra ${CAT_LABEL[cat]}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted">
                <X className="size-4" />
              </button>
            </li>
          ))}
          {missing.map((cat) => (
            <li key={`need-${cat}`}>
              <button type="button" onClick={() => onOpen(cat)} className="flex h-14 w-full items-center justify-between rounded-xl border border-dashed border-line px-3 text-left">
                <span>
                  <span className="block text-xs text-faint">Not chosen</span>
                  <span className="block text-base">{CAT_LABEL[cat]}</span>
                </span>
                <span className="text-base text-accent">Add</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function AiPanel({ onUse }: { onUse: (pick: ReturnType<typeof aiPicks>[number]) => void }) {
  const picks = aiPicks();
  const [filter, setFilter] = useState<(typeof AI_FILTERS)[number]>("All");
  const [sort, setSort] = useState<ShelfSort>("deal-asc");
  const [query, setQuery] = useState("");
  const shown = picks.filter((pick) => {
    const q = query.trim().toLowerCase();
    if (q && !`${pick.name} ${pick.kicker} ${pick.why}`.toLowerCase().includes(q)) return false;
    if (filter === "All") return true;
    const tag = {
      Value: "value",
      Steam: "steam",
      "1080p": "1080",
      "1440p": "1440",
      "Newer socket": "am5",
      NVIDIA: "nvidia",
      "No card": "desk",
      Screen: "screen",
      League: "league",
      Valorant: "valorant",
      Fortnite: "fortnite",
      "Call of Duty": "cod",
      Battlefield: "battlefield",
      Skyrim: "skyrim",
      "Harry Potter": "potter",
      Minecraft: "minecraft",
      Office: "office",
      Work: "work",
      Cheap: "cheap",
      College: "college",
      Games: "games",
      "Per frame": "perf",
      Top: "max",
    }[filter];
    return tag ? pick.tags.includes(tag) : false;
  });
  const ranked = [...shown].sort((a, b) => {
    const aScore = aiScore(a.build) || 1;
    const bScore = aiScore(b.build) || 1;
    const aSpend = spendOf(a.build);
    const bSpend = spendOf(b.build);
    const aDeal = aSpend / aScore;
    const bDeal = bSpend / bScore;
    const aGig = a.build.storage ? (unitCost(a.build.storage)?.amount ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
    const bGig = b.build.storage ? (unitCost(b.build.storage)?.amount ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
    if (sort === "price-desc") return bSpend - aSpend;
    if (sort === "score-desc") return bScore - aScore;
    if (sort === "score-asc") return aScore - bScore;
    if (sort === "deal-desc") return bDeal - aDeal;
    if (sort === "deal-asc") return aDeal - bDeal;
    if (sort === "gig-asc") return aGig - bGig;
    if (sort === "gig-desc") return bGig - aGig;
    return aSpend - bSpend;
  });
  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-sm text-muted">
        {picks.length} full PCs. Crystal is the strongest, then gold, silver, bronze, and brown. A lower price per point is more computer for the money.
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
      <SortRow value={sort} onChange={setSort} />
      <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-elevated px-3">
        <Search className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a game or a job" className="h-full w-full bg-transparent text-base outline-none placeholder:text-faint" />
      </label>
      <ul className="flex flex-col gap-3">
        {ranked.map((pick) => {
          const covered = coveredByBundle(pick.build);
          const score = aiScore(pick.build);
          const spend = spendOf(pick.build);
          const drive = pick.build.storage ? unitCost(pick.build.storage) : null;
          const memory = pick.build.memory ? unitCost(pick.build.memory) : null;
          return (
            <li key={pick.id} className={`rounded-xl border p-3 ${pick.best ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-faint">{pick.kicker}</p>
                  <h2 className="font-display text-2xl font-medium leading-none tracking-tight">{pick.name}</h2>
                  <div className="mt-2">
                    <RankBadge score={score} lines={explainBuild(pick.build)} />
                  </div>
                </div>
                <p className="tabular shrink-0 text-right text-sm font-medium">
                  <span className="block">{score}/100</span>
                  <span className="block">{money(spend)}</span>
                  <span className="block text-muted">{money(spend / score)}/point</span>
                  {drive ? <span className="block text-muted">Drive {drive.text}</span> : null}
                  {memory ? <span className="block text-muted">Memory {memory.text}</span> : null}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">{pick.why}</p>
              <BuildStats build={pick.build} />
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

function BuildStats({ build }: { build: ReturnType<typeof partsFrom> }) {
  const speed = buildSpeed(build);
  const spend = spendOf(build);
  const per = speed ? spend / speed : 0;
  const need = needWatts(build);
  const supply = wattOf(build.psu);
  const used = supply ? Math.min(100, Math.round((need / supply) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-faint">Rough speed</p>
          <p className="tabular font-medium">{speed ? `${speed}%` : "—"}</p>
        </div>
        <div>
          <p className="text-faint">$ per point</p>
          <p className="tabular font-medium">{speed ? money(per) : "—"}</p>
        </div>
        <div>
          <p className="text-faint">Power used</p>
          <p className="tabular font-medium">{supply ? `${used}%` : "—"}</p>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.round((speed / 148) * 100))}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-faint">100% speed is an RX 9070. Rough, not a lab test.</p>
    </div>
  );
}

function Review({
  build,
  name,
  setName,
  copied,
  saved,
  extras,
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
  extras: ReturnType<typeof extrasFromIds>;
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
  const total = spendOf(build, extras);
  const score = scoreBuild(build);
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
                  <span className="block truncate text-sm">
                    {part ? shortName(part) : cat === "storage" ? "Choose a drive" : "Skip for now"}
                  </span>
                  {part && priceChange(part) ? (
                    <span className={`block text-xs ${priceChange(part)!.kind === "down" ? "text-ok" : "text-danger"}`}>
                      {priceChange(part)!.kind === "down" ? "Down" : "Up"} {money(priceChange(part)!.diff)} since {PRICE_CHECKED}
                    </span>
                  ) : null}
                </span>
                <span className={`shrink-0 text-sm ${included ? "text-faint" : "tabular"}`}>
                  {part ? (included ? "Included" : money(part.price)) : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {extras.memory.length + extras.storage.length + extras.monitor.length > 0 ? (
        <div className="rounded-2xl border border-line bg-elevated p-4 text-base">
          <p className="font-medium">Added on top</p>
          <ul className="mt-2 space-y-2">
            {[...extras.memory.map((part) => ({ label: "Memory", part })), ...extras.storage.map((part) => ({ label: "Drive", part })), ...extras.monitor.map((part) => ({ label: "Screen", part }))].map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex justify-between gap-3">
                <span className="min-w-0">{item.label} · {shortName(item.part)}</span>
                <span className="tabular shrink-0">{money(item.part.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ready ? (
        <div className="rounded-xl border border-line bg-elevated p-4">
          <p className="text-xs text-faint">Total</p>
          <p className="tabular text-lg font-medium">{money(total)}</p>
          <p className="mt-2 text-sm text-muted">Score {machineScore(build.prebuilt!.name)}/100. {tagsOf(build.prebuilt!).join(" · ") || "Finished PC."}</p>
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
          <dt className="text-xs text-faint">Board size</dt>
          <dd>{board ? formLabel(board) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Power used</dt>
          <dd className="tabular text-lg font-medium">{supply ? `${Math.min(100, Math.round((need / supply) * 100))}%` : "—"}</dd>
          <p className="text-xs text-faint">{supply ? `${need}W of ${supply}W` : `About ${need}W needed`}</p>
        </div>
        <div>
          <dt className="text-xs text-faint">Rough speed</dt>
          <dd className="tabular text-lg font-medium">{buildSpeed(build) ? `${buildSpeed(build)}%` : "—"}</dd>
          <p className="text-xs text-faint">100 is an RX 9070</p>
        </div>
        <div>
          <dt className="text-xs text-faint">Drive slots</dt>
          <dd className="tabular text-lg font-medium">
            {build.storage ? "1" : "0"} of {m2Slots(build.motherboard)}
          </dd>
          <p className="text-xs text-faint">Buy one. Leave the rest empty</p>
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
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ok">
            <Check className="size-4" strokeWidth={1.75} />
            {score.points === 100 ? "It turns on." : score.rank} {score.points}/100. {score.next}
          </p>
          {score.badges.length ? (
            <ul className="flex flex-wrap gap-2">
              {score.badges.map((badge) => (
                <li key={badge.name} className="rounded-full border border-line bg-elevated px-3 py-1 text-xs">
                  <span className="font-medium">{badge.name}</span>
                  <span className="text-muted"> · {badge.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
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

      <p className="text-xs text-faint">Prices in CAD. Updated {PRICE_CHECKED}. A part only stays if it fits. One drive, even if the board has empty slots.</p>
    </div>
  );
}

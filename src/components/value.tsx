import { useMemo, useState } from "react";
import { PARTS, CAT_LABEL, fitWhy, isJunk, money, shortName, spendOf, unitCost, type Category, type Part } from "@/lib/catalog";
import { extrasFromIds, partsFrom, useBench } from "@/lib/store";
import { ThemeToggle } from "@/lib/theme";

const STEPS: { cat: Category; title: string; line: string; scored: boolean }[] = [
  { cat: "cpu", title: "Processor", line: "Dollars per point of speed. Lower is more computer for the money.", scored: true },
  { cat: "motherboard", title: "Board", line: "Cheapest board that fits. Boards do not have a speed score.", scored: false },
  { cat: "memory", title: "Memory", line: "Dollars per gigabyte. Lower is more memory for the money.", scored: true },
  { cat: "gpu", title: "Graphics", line: "Dollars per point of speed. Lower is more graphics for the money.", scored: true },
  { cat: "storage", title: "Drive", line: "Dollars per gigabyte. Lower is more space for the money.", scored: true },
  { cat: "psu", title: "Power", line: "Dollars per watt. Lower is more power for the money.", scored: true },
  { cat: "case", title: "Case", line: "Cheapest case that fits the board.", scored: false },
  { cat: "cooler", title: "Cooler", line: "Cheapest cooler that fits the processor.", scored: false },
  { cat: "monitor", title: "Screen", line: "Cheapest screen. Screens do not have a speed score.", scored: false },
  { cat: "prebuilt", title: "Finished PC", line: "A whole computer. Dollars per point. Lower is the better deal.", scored: true },
];

export function Value({ onLeave, onBuild }: { onLeave: () => void; onBuild: () => void }) {
  const ids = useBench((state) => state.ids);
  const extraIds = useBench((state) => state.extraIds);
  const notice = useBench((state) => state.notice);
  const pick = useBench((state) => state.pick);
  const remove = useBench((state) => state.remove);
  const clear = useBench((state) => state.clear);
  const [cat, setCat] = useState<Category>("cpu");
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const build = partsFrom(ids);
  const extras = extrasFromIds(extraIds);
  const total = spendOf(build, extras);
  const step = STEPS.find((item) => item.cat === cat) ?? STEPS[0];
  const chosen = build[cat];
  const filled = STEPS.filter((item) => build[item.cat]).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARTS.filter((part) => {
      if (part.cat !== cat) return false;
      if (isJunk(part, false)) return false;
      if (fitWhy(part, build)) return false;
      if (step.scored && !unitCost(part)) return false;
      if (q && !`${part.brand} ${part.name}`.toLowerCase().includes(q)) return false;
      return true;
    })
      .sort((a, b) => {
        const left = unitCost(a)?.amount ?? Number.POSITIVE_INFINITY;
        const right = unitCost(b)?.amount ?? Number.POSITIVE_INFINITY;
        if (left !== right) return left - right;
        return a.price - b.price;
      })
      .slice(0, 16);
  }, [cat, query, build, step.scored]);

  const blocked = useMemo(() => {
    if (shown.length) return "";
    const sample = PARTS.find((part) => part.cat === cat && !isJunk(part, false));
    return sample ? fitWhy(sample, build) : "";
  }, [shown.length, cat, build]);

  function add(part: Part) {
    setConfirmClear(false);
    pick(part);
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setConfirmClear(true)} className="h-10 rounded-full border border-line px-3 text-sm text-muted">
              New customer
            </button>
            <ThemeToggle />
          </div>
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Price check</h1>
        <p className="mt-2 text-base leading-snug text-muted">{step.line}</p>
      </header>

      {confirmClear ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-subtle px-4 py-3">
          <p className="text-base">Clear this computer?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmClear(false)} className="h-11 rounded-full border border-line px-4 text-base">
              Keep
            </button>
            <button
              type="button"
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
              className="h-11 rounded-full bg-accent px-4 text-base text-accent-fg"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {notice ? <p className="shrink-0 border-b border-line px-4 py-3 text-base text-muted">{notice}</p> : null}

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {STEPS.map((item) => (
          <button
            key={item.cat}
            type="button"
            onClick={() => {
              setCat(item.cat);
              setQuery("");
            }}
            className={`h-12 shrink-0 rounded-full border px-4 text-base ${cat === item.cat ? "border-accent bg-subtle" : "border-line"}`}
          >
            {item.title}
            {build[item.cat] ? " ✓" : ""}
          </button>
        ))}
      </div>

      <label className="mx-4 mb-3 flex h-12 shrink-0 items-center rounded-xl border border-line bg-elevated px-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${step.title.toLowerCase()}`}
          className="h-full w-full bg-transparent text-base outline-none placeholder:text-faint"
        />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-line bg-elevated px-4 py-6 text-lg leading-snug text-muted">
            {blocked || "Nothing in this list matches."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((part, index) => {
              const deal = unitCost(part);
              const on = chosen?.id === part.id;
              return (
                <li key={part.id}>
                  <button
                    type="button"
                    onClick={() => (on ? remove(part.cat) : add(part))}
                    className={`press w-full rounded-3xl border px-4 py-4 text-left ${on ? "border-accent bg-subtle" : "border-line bg-elevated"}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm tracking-wide text-muted">{index === 0 ? "Best price" : CAT_LABEL[part.cat]}</span>
                        <span className="font-display mt-1 block text-4xl leading-none tracking-tight">{deal ? deal.text : money(part.price)}</span>
                      </span>
                      <span className={`mt-1 shrink-0 rounded-full px-3 py-2 text-sm ${on ? "bg-accent text-accent-fg" : "bg-subtle text-fg"}`}>
                        {on ? "In the PC" : "Add"}
                      </span>
                    </span>
                    <span className="mt-3 block text-lg leading-snug">{part.brand} {shortName(part)}</span>
                    <span className="mt-1 block text-base text-muted">{deal ? `${money(part.price)} total` : "No speed score. Sorted by price."}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="safe-bottom shrink-0 border-t border-line bg-elevated px-4 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{filled} parts in this computer</p>
            <p className="font-display text-4xl leading-none tracking-tight">{money(total)}</p>
          </div>
          <button type="button" onClick={onBuild} className="h-14 rounded-2xl bg-accent px-5 text-lg text-accent-fg">
            Open the build
          </button>
        </div>
      </div>
    </div>
  );
}

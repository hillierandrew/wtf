import { useMemo, useState } from "react";
import { CAT_LABEL, CATS, ideaPicks, money, shortName, spendOf, type AiPick } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "cheap", label: "Cheap" },
  { id: "school", label: "School" },
  { id: "games", label: "Games" },
  { id: "white", label: "White" },
  { id: "strong", label: "Strong" },
  { id: "small", label: "Small" },
];

export function Ideas({ onLeave, onUse }: { onLeave: () => void; onUse: (pick: AiPick) => void }) {
  const pane = usePane();
  const picks = useMemo(() => ideaPicks(), []);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const shown = picks.filter((pick) => filter === "all" || pick.tags.includes(filter));
  const current = picks.find((pick) => pick.id === open) ?? null;

  return (
    <div className={`mx-auto flex h-full w-full flex-col overflow-hidden bg-bg text-fg ${pane ? "max-w-5xl" : "max-w-xl"}`}>
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">AI created builds</h1>
        <p className="mt-2 text-base text-muted">{shown.length} computers. Tap one. Then tap Use this PC.</p>
      </header>
      <div className="shrink-0 px-4 py-3">
        <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
          <span className="shrink-0 text-sm text-muted">Show</span>
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setOpen(null);
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
          >
            {FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={`min-h-0 flex-1 overflow-y-auto px-4 pb-4 ${pane && !current ? "grid grid-cols-2 gap-3 content-start" : "space-y-3"}`}>
        {current ? (
          <div>
            <button type="button" onClick={() => setOpen(null)} className="h-12 rounded-full border border-line px-5 text-base">
              All builds
            </button>
            <h2 className="font-display mt-4 text-3xl font-medium leading-tight">{current.name}</h2>
            <p className="mt-2 text-lg text-muted">{current.why}</p>
            <ul className="mt-4 space-y-2">
              {CATS.map((cat) => {
                const part = current.build[cat];
                if (!part) return null;
                return (
                  <li key={cat} className="rounded-2xl border border-line bg-elevated px-4 py-3">
                    <p className="text-sm text-muted">{CAT_LABEL[cat]}</p>
                    <p className="text-lg font-medium leading-snug">{shortName(part)}</p>
                    <p className="text-base">{money(part.price)}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-3xl font-medium">Total {money(spendOf(current.build))}</p>
            <button type="button" onClick={() => onUse(current)} className="mt-4 h-16 w-full rounded-2xl bg-accent text-xl text-accent-fg">
              Use this PC
            </button>
          </div>
        ) : (
          shown.map((pick) => (
            <button key={pick.id} type="button" onClick={() => setOpen(pick.id)} className="press flex min-h-28 w-full flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-5 py-4 text-left">
              <span className="text-sm text-muted">{pick.kicker}</span>
              <span className="mt-1 font-display text-2xl font-medium leading-tight">{pick.name}</span>
              <span className="mt-2 text-base text-muted">{pick.why}</span>
              <span className="mt-3 text-lg font-medium">{money(spendOf(pick.build))}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

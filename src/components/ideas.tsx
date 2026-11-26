import { useMemo, useState } from "react";
import { CopyList, buildNames } from "@/components/copy-list";
import { CAT_LABEL, CATS, aiScore, buildCheck, dealFrom, ideaPicks, money, rankFrom, shortName, spendOf, type AiPick } from "@/lib/catalog";
import { usePath } from "@/components/history";
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
  const path = usePath();
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {current ? (
          <div>
            <button type="button" onClick={() => setOpen(null)} className="h-12 rounded-full border border-line px-5 text-base">
              All builds
            </button>
            <h2 className="font-display mt-4 text-3xl font-medium leading-tight">{current.name}</h2>
            <p className="mt-1 text-xs tracking-wide text-neutral-500">CUSTOM BUILD — PARTS LIST</p>
            <p className="text-xs text-neutral-500">Assembled by {current.by ?? "Grok"}</p>
            <p className="mt-2 text-sm text-muted">Why this computer was assembled</p>
            <p className="text-lg text-muted">{current.why}</p>
            <p className="mt-4 text-4xl font-semibold">{money(spendOf(current.build))}</p>
            <p className="text-sm text-muted">Parts together. Pay this once. Not a store-assembled computer.</p>
            <BuildMarks pick={current} />
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
            <CopyList title={current.name} names={buildNames(current.build)} />
            <button type="button" onClick={() => { path?.note("use-pc", "Use this PC"); onUse(current); }} className="mt-4 h-16 w-full rounded-2xl bg-accent text-xl text-accent-fg">
              Use this PC
            </button>
          </div>
        ) : (
          <div className={`grid auto-rows-auto items-stretch gap-3 ${pane ? "grid-cols-2" : "grid-cols-1"}`}>
            {shown.map((pick) => (
              <button key={pick.id} type="button" onClick={() => { setOpen(pick.id); path?.note(`idea:${pick.id}`, pick.name); }} className="flex h-auto min-h-0 w-full min-w-0 flex-col items-start overflow-hidden rounded-3xl border border-line bg-elevated p-5 text-left">
                <span className="text-sm text-muted">{pick.kicker}</span>
                <span className="mt-1 text-2xl font-semibold leading-snug">{pick.name}</span>
                <span className="mt-1 text-xs text-neutral-500">Assembled by {pick.by ?? "Grok"}</span>
                <span className="mt-2 text-base leading-snug text-muted">{pick.why}</span>
                <span className="mt-4 text-2xl font-semibold tabular-nums">{money(spendOf(pick.build))}</span>
                <span className="mt-1 text-sm text-muted">Parts together. Pay this once.</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BuildMarks({ pick }: { pick: AiPick }) {
  const score = aiScore(pick.build);
  const rank = rankFrom(score);
  const spend = spendOf(pick.build);
  const deal = dealFrom(spend, score);
  const fit = buildCheck(pick.build);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full px-3 py-1 font-semibold" style={{ background: rank.bg, color: rank.fg }}>
          {rank.name} {rank.score}
        </span>
        <span className="rounded-full px-3 py-1 font-semibold" style={{ background: deal.bg, color: deal.fg }}>
          {deal.name} {money(deal.per)}/pt
        </span>
        <span className="rounded-full border border-line px-3 py-1">{fit.status}</span>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {fit.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

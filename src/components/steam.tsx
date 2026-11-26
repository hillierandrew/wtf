import { useState } from "react";
import { aiScore, explainBuild, machineScore, microPicks, money, spendOf, steamPicks, type AiPick } from "@/lib/catalog";
import { CopyList, buildNames } from "@/components/copy-list";
import { RankBadge } from "@/components/rank";
import { ThemeToggle } from "@/lib/theme";

export function Steam({ onLeave, onUse }: { onLeave: () => void; onUse: (pick: AiPick) => void }) {
  const built = steamPicks();
  const micros = microPicks();
  const [tab, setTab] = useState<"built" | "micro">("built");
  const shown = tab === "built" ? built : micros;
  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Steam Machine</h1>
        <p className="mt-2 text-base text-muted">A tiny PC for the living room. The first list is assembled from small parts. The second list is a mini PC that is already done.</p>
      </header>
      <div className="flex shrink-0 gap-2 px-4 py-3">
        <button type="button" onClick={() => setTab("built")} className={`h-12 flex-1 rounded-full border text-base ${tab === "built" ? "border-accent bg-subtle" : "border-line"}`}>
          I built these
        </button>
        <button type="button" onClick={() => setTab("micro")} className={`h-12 flex-1 rounded-full border text-base ${tab === "micro" ? "border-accent bg-subtle" : "border-line"}`}>
          Micro PCs
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {shown.map((pick) => {
          const score = pick.build.prebuilt ? machineScore(pick.build.prebuilt.name) : aiScore(pick.build);
          return (
            <li key={pick.id} className="rounded-2xl border border-line bg-elevated p-4">
              <p className="text-xs text-faint">{pick.kicker}</p>
              <h2 className="font-display mt-1 text-2xl font-medium leading-none tracking-tight">{pick.name}</h2>
              <div className="mt-2 flex items-center justify-between gap-3">
                <RankBadge score={score} lines={explainBuild(pick.build)} />
                <p className="tabular text-lg font-medium">{money(spendOf(pick.build))}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{pick.why}</p>
              <CopyList title={pick.name} names={buildNames(pick.build)} />
              <button type="button" onClick={() => onUse(pick)} className="mt-3 h-12 w-full rounded-xl bg-accent text-base font-medium text-accent-fg">
                Use this machine
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

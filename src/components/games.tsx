import { useMemo, useState } from "react";
import raw from "@/data/laptops.json";
import { CopyList, buildNames, partLine } from "@/components/copy-list";
import { RankBadge } from "@/components/rank";
import { usePath } from "@/components/history";
import { aiPicks, explainPart, machineScore, money, PARTS, shortName, spendOf, type AiPick, type Part } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

type Laptop = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open: boolean };

const LAPTOPS = raw as Laptop[];
const SIZE = ["basic", "low", "normal", "medium", "ultra"];

function ramOf(item: Laptop) {
  const match = item.specs.match(/(\d+)GB memory/);
  return match ? Number(match[1]) : 0;
}

function groups(kind: "game" | "program") {
  const map = new Map<string, AiPick[]>();
  for (const pick of aiPicks()) {
    const game = pick.tags.includes("games");
    const program = pick.tags.includes("work") || pick.tags.includes("college");
    if (kind === "game" ? !game : !program) continue;
    const key = pick.kicker === "Career" || pick.kicker === "Best" ? pick.name : pick.kicker || pick.name;
    const list = map.get(key) ?? [];
    list.push(pick);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function sizeRank(pick: AiPick) {
  const index = SIZE.findIndex((size) => pick.tags.includes(size));
  return index < 0 ? 2 : index;
}

export function Games({ onLeave, onUse }: { onLeave: () => void; onUse: (pick: AiPick) => void }) {
  const path = usePath();
  const pane = usePane();
  const [kind, setKind] = useState<"game" | "program">("game");
  const [name, setName] = useState<string | null>(null);
  const list = useMemo(() => groups(kind), [kind]);
  const chosen = list.find((item) => item[0] === name);
  const builds = chosen ? [...chosen[1]].sort((a, b) => sizeRank(a) - sizeRank(b)) : [];
  const laptops = useMemo(() => {
    const floor = kind === "game" ? 45 : 0;
    return LAPTOPS.filter((item) => !item.open && item.kind !== "tablet" && item.kind !== "chrome" && item.gpu >= floor && (kind === "program" || item.kind === "game" || item.gpu >= 45))
      .sort((a, b) => a.price / Math.max(itemScore(a), 1) - b.price / Math.max(itemScore(b), 1))
      .slice(0, 6);
  }, [kind]);
  const boxes = useMemo(() => {
    return PARTS.filter((part) => part.cat === "prebuilt" && !/open box/i.test(part.name) && (kind === "game" ? part.form === "gaming" || /RTX|RX\s?\d/i.test(part.name) : part.form === "desk" || part.form === "mini"))
      .sort((a, b) => machineScore(b.name) - machineScore(a.name))
      .slice(0, 4);
  }, [kind]);

  return (
    <div className={`mx-auto flex h-full w-full flex-col overflow-hidden bg-bg text-fg ${pane ? "max-w-6xl" : "max-w-xl"}`}>
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Games</h1>
        <p className="mt-2 text-base text-muted">Pick a game or a program. The computers and laptops that fit it show up.</p>
      </header>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-4 py-3">
        <button type="button" onClick={() => { setKind("game"); setName(null); }} className={`h-14 rounded-2xl border text-lg ${kind === "game" ? "border-accent bg-subtle" : "border-line"}`}>
          Games
        </button>
        <button type="button" onClick={() => { setKind("program"); setName(null); }} className={`h-14 rounded-2xl border text-lg ${kind === "program" ? "border-accent bg-subtle" : "border-line"}`}>
          Programs
        </button>
      </div>
      <div className={`min-h-0 flex-1 ${pane && name ? "grid grid-cols-2" : "flex flex-col"}`}>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {list.map(([title]) => (
            <li key={title}>
              <button type="button" onClick={() => { setName(title); path?.note(`played:${title}`, title); }} className={`press h-16 w-full rounded-2xl border px-4 text-left text-xl ${name === title ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                {title}
              </button>
            </li>
          ))}
        </ul>
        {name ? (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto border-line px-4 pb-6 pt-1 max-sm:border-t sm:border-l">
            <p className="text-lg font-medium">{name}</p>
            {builds.map((pick) => (
              <article key={pick.id} className="rounded-2xl border border-line bg-elevated p-3">
                <p className="text-lg font-medium">{pick.name}</p>
                <p className="mt-1 text-sm text-muted">{pick.why}</p>
                <p className="mt-2 text-base font-medium">{money(spendOf(pick.build))}</p>
                <CopyList title={pick.name} names={buildNames(pick.build)} />
                <button type="button" onClick={() => { path?.note("use-pc", "Use this computer"); onUse(pick); }} className="mt-3 h-12 w-full rounded-xl bg-accent text-base text-accent-fg">
                  Use this computer
                </button>
              </article>
            ))}
            <p className="pt-2 text-lg font-medium">Laptops</p>
            {laptops.map((item) => (
              <article key={item.id} className="rounded-2xl border border-line p-3">
                <p className="text-base font-medium">{item.name.replace(" (Open box)", "")}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.brand} · {ramOf(item) || "?"} GB · {money(item.price)}
                </p>
              </article>
            ))}
            <p className="pt-2 text-lg font-medium">Already built</p>
            {boxes.map((part) => (
              <Ready key={part.id} part={part} onUse={onUse} />
            ))}
          </div>
        ) : (
          <p className="px-4 pb-6 text-base text-muted">Tap one name.</p>
        )}
      </div>
    </div>
  );
}

function itemScore(item: Laptop) {
  return Math.max(1, Math.min(100, item.gpu + (ramOf(item) >= 32 ? 12 : ramOf(item) >= 16 ? 6 : 0)));
}

function Ready({ part, onUse }: { part: Part; onUse: (pick: AiPick) => void }) {
  const pick: AiPick = {
    id: part.id,
    name: shortName(part),
    kicker: "Ready",
    why: "This one is already built. You do not put it together.",
    tags: [],
    build: { prebuilt: part },
  };
  return (
    <article className="rounded-2xl border border-line p-3">
      <p className="text-base font-medium">{pick.name}</p>
      <RankBadge score={machineScore(part.name)} lines={explainPart(part)} />
      <p className="mt-1 text-sm text-muted">{money(part.price)}</p>
      <CopyList title={part.name} names={[partLine(part)]} />
      <button type="button" onClick={() => onUse(pick)} className="mt-3 h-12 w-full rounded-xl border border-line text-base">
        Use this computer
      </button>
    </article>
  );
}

import { useMemo, useState } from "react";
import raw from "@/data/laptops.json";
import simRaw from "@/data/sim.json";
import { PARTS, explainLaptop, explainPart, laptopBits, machineScore, money } from "@/lib/catalog";
import { RankBadge } from "@/components/rank";
import { AddButton, AddPack, RuleLine } from "@/components/bag";
import { keyBag, lapBag, partBag, simBag, type BagLine } from "@/lib/bag";
import { KEYS } from "@/lib/keyboard";
import { guide, type GuideLine } from "@/lib/five-pick";

const JOBS = [
  { id: "games", label: "Games", line: "Playing is the main thing." },
  { id: "school", label: "School", line: "Class, notes, and a browser." },
  { id: "work", label: "Work", line: "The desk. Mail, sheets, and calls." },
  { id: "grandma", label: "Grandma", line: "Email, photos, and a video call." },
  { id: "zoom", label: "Zoom", line: "Meetings. Nothing else." },
  { id: "think", label: "A model at home", line: "A small model on the machine." },
] as const;

const GAMES = [
  { id: "shooters", label: "Shooters" },
  { id: "fortnite", label: "Fortnite" },
  { id: "minecraft", label: "Minecraft" },
  { id: "racing", label: "Racing" },
  { id: "farming", label: "Farming" },
  { id: "flight", label: "Flight" },
  { id: "any", label: "Not a specific game" },
] as const;

const BUDGETS = [700, 1100, 1600, 2500, 4000];

type Job = (typeof JOBS)[number]["id"];
type Game = (typeof GAMES)[number]["id"];
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean; renewed?: boolean };
const LAPS = raw as Lap[];
type Gear = { id: string; name: string; price: number; brand: string; game: string; slot: string; also?: string[]; open?: boolean };

function resetTo(set: {
  job: (value: Job | null) => void;
  game: (value: Game | null) => void;
  budget: (value: number | null) => void;
  desk: (value: boolean | null) => void;
}) {
  set.job(null);
  set.game(null);
  set.budget(null);
  set.desk(null);
}

function toBag(line: GuideLine, rule: string): BagLine {
  if (line.kind === "lap") return lapBag(line, rule);
  if (line.kind === "key" || line.kind === "mouse") return keyBag(line, rule);
  if (line.kind === "gear") return simBag(line, rule);
  return partBag(line, rule);
}

export function Five({ onClose }: { onClose: () => void }) {
  const [job, setJob] = useState<Job | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [desk, setDesk] = useState<boolean | null>(null);
  const askGame = job === "games" && !game;
  const askBudget = job && !askGame && budget == null;
  const askDesk = budget != null && desk == null;
  const done = job && budget != null && desk != null && (job !== "games" || game);

  const result = useMemo(() => {
    if (!done || !job || budget == null || desk == null) return null;
    const picked = guide(job, job === "games" ? game : null, budget, desk, {
      towers: PARTS.filter((part) => part.cat === "prebuilt"),
      laptops: LAPS,
      monitors: PARTS.filter((part) => part.cat === "monitor"),
      keys: KEYS,
      gear: simRaw as Gear[],
    });
    const main = picked.lines.find((line) => line.kind === "pc" || line.kind === "lap");
    const lap = main?.kind === "lap" ? LAPS.find((item) => item.id === main.id) : undefined;
    const score = main?.kind === "pc" ? machineScore(main.name) : lap ? Math.round(laptopBits(lap).score) : 0;
    const part = main?.kind === "pc" ? PARTS.find((item) => item.id === main.id || item.name === main.name) : undefined;
    const scoreLines = part ? explainPart(part) : lap ? explainLaptop(lap) : [`Score ${score}.`];
    const rule = `${picked.why} Budget ${money(budget)}. Score ${score || "n/a"}.`;
    return { ...picked, score, scoreLines, bags: picked.lines.map((line) => toBag(line, rule)) };
  }, [done, job, game, budget, desk]);

  const step = !job ? "What do you want to do?" : askGame ? "Which games?" : askBudget ? "What can they spend?" : askDesk ? "The whole desk?" : result?.over ? "Nothing in that budget." : "This is the one.";

  return (
    <div className="min-h-full overflow-y-auto bg-bg px-4 py-4 pb-28 text-fg">
      <button type="button" onClick={onClose} className="text-base text-muted">
        Close
      </button>
      {job ? (
        <button type="button" onClick={() => resetTo({ job: setJob, game: setGame, budget: setBudget, desk: setDesk })} className="ml-4 text-base text-muted">
          Start over
        </button>
      ) : null}
      <h1 className="font-display mt-3 text-4xl font-medium leading-none">{step}</h1>
      <p className="mt-2 text-base text-muted">Big buttons. One tap each.</p>
      {!job ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {JOBS.map((item) => (
            <button key={item.id} type="button" onClick={() => setJob(item.id)} className="min-h-24 rounded-3xl border border-line bg-elevated px-5 py-4 text-left">
              <span className="block text-3xl font-medium">{item.label}</span>
              <span className="mt-1 block text-base text-muted">{item.line}</span>
            </button>
          ))}
        </div>
      ) : null}
      {askGame ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GAMES.map((item) => (
            <button key={item.id} type="button" onClick={() => setGame(item.id)} className="min-h-20 rounded-3xl border border-line bg-elevated px-5 text-left text-2xl font-medium">
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {askBudget ? (
        <div className="mt-4 grid gap-3">
          {BUDGETS.map((amount) => (
            <button key={amount} type="button" onClick={() => setBudget(amount)} className="min-h-20 rounded-3xl border border-line bg-elevated px-5 text-left text-3xl font-medium">
              {money(amount)}
            </button>
          ))}
        </div>
      ) : null}
      {askDesk ? (
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={() => setDesk(false)} className="min-h-24 rounded-3xl border border-line bg-elevated px-5 text-left">
            <span className="block text-3xl font-medium">Just the computer</span>
            <span className="mt-1 block text-base text-muted">Nothing else on the list.</span>
          </button>
          <button type="button" onClick={() => setDesk(true)} className="min-h-24 rounded-3xl border border-line bg-elevated px-5 text-left">
            <span className="block text-3xl font-medium">The whole desk</span>
            <span className="mt-1 block text-base text-muted">Computer, screen, keyboard, and mouse.</span>
          </button>
        </div>
      ) : null}
      {done && result ? (
        <div className="mt-4 rounded-3xl border border-line bg-elevated p-4">
          <p className="text-2xl font-medium leading-snug">{result.why}</p>
          {result.over ? <p className="mt-3 rounded-2xl bg-[#fff1cc] px-4 py-3 text-base text-[#5a3b00]">{result.over}</p> : null}
          <p className="mt-3 text-3xl font-semibold">{money(result.lines.reduce((sum, line) => sum + line.price, 0))}</p>
          <ol className="mt-3 space-y-2 text-base">
            {result.lines.map((line, index) => (
              <li key={`${line.kind}-${line.id}`}>
                {index + 1}. {line.name} · {money(line.price)}
              </li>
            ))}
          </ol>
          <RuleLine how="Five-minute guide" who={JOBS.find((item) => item.id === job)?.label ?? ""} budget={money(budget!)} score={result.score ? String(result.score) : "n/a"} />
          {result.score ? <RankBadge score={result.score} lines={result.scoreLines} /> : null}
          {result.bags.length === 1 && result.bags[0] ? <AddButton line={result.bags[0]} /> : <AddPack lines={result.bags} />}
        </div>
      ) : null}
    </div>
  );
}

import { useMemo, useState } from "react";
import raw from "@/data/laptops.json";
import { PARTS, isJunk, laptopBits, machineScore, money } from "@/lib/catalog";
import { AddButton, AddPack, RuleLine } from "@/components/bag";
import { lapBag, partBag } from "@/lib/bag";
import { deskPack, farmingPack, flightPack, racingPack } from "@/lib/packs";

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
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean };
const LAPS = raw as Lap[];

export function Five({ onClose }: { onClose: () => void }) {
  const [job, setJob] = useState<Job | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [desk, setDesk] = useState<boolean | null>(null);
  const askGame = job === "games" && !game;
  const askBudget = job && !askGame && budget == null;
  const askDesk = budget != null && desk == null;
  const done = job && budget != null && desk != null && (!askGame || game);

  const result = useMemo(() => {
    if (!done || !job || budget == null || desk == null) return null;
    const who = JOBS.find((item) => item.id === job)?.label ?? job;
    const gameName = GAMES.find((item) => item.id === game)?.label;
    const person = gameName && game !== "any" ? `${who}, ${gameName}` : who;
    if (game === "racing" || game === "farming" || game === "flight") {
      const pack = game === "racing" ? racingPack() : game === "farming" ? farmingPack() : flightPack();
      const extra = desk ? deskPack().slice(1) : [];
      return { person, pack: [...pack, ...extra.filter((line) => !pack.some((item) => item.id === line.id))], one: null as null | { name: string; price: number; score: number; line: ReturnType<typeof partBag> } };
    }
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, false) && part.price > 0 && part.price <= budget);
    const laps = LAPS.filter((item) => !item.open && item.price > 0 && item.price <= budget && item.kind !== "tablet");
    const wantDesk = desk || job === "games" || job === "think";
    if (wantDesk) {
      const pool = desks.length ? desks : PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, false) && part.price > 0);
      const ranked = [...pool].sort((a, b) => {
        if (job === "grandma" || job === "zoom") return a.price - b.price;
        if (job === "think") return machineScore(b.name) - machineScore(a.name);
        return a.price / Math.max(1, machineScore(a.name)) - b.price / Math.max(1, machineScore(b.name));
      });
      const pick = ranked[0];
      if (!pick) return { person, pack: [] as ReturnType<typeof deskPack>, one: null };
      const score = machineScore(pick.name);
      const rule = `Five-minute guide. For ${person}. Budget ${money(budget)}. Score ${score}.`;
      const line = partBag(pick, rule);
      return { person, pack: desk ? deskPack(pick).map((item, index) => (index === 0 ? line : item)) : [], one: desk ? null : { name: pick.name, price: pick.price, score, line } };
    }
    const pool = laps.length ? laps : LAPS.filter((item) => !item.open && item.price > 0);
    const ranked = [...pool].sort((a, b) => {
      if (job === "grandma" || job === "zoom") return a.price - b.price;
      return a.price / Math.max(1, laptopBits(a).score) - b.price / Math.max(1, laptopBits(b).score);
    });
    const pick = ranked[0];
    if (!pick) return { person, pack: [], one: null };
    const score = Math.round(laptopBits(pick).score);
    const rule = `Five-minute guide. For ${person}. Budget ${money(budget)}. Score ${score}.`;
    return { person, pack: [], one: { name: pick.name, price: pick.price, score, line: lapBag(pick, rule) } };
  }, [done, job, game, budget, desk]);

  const step = !job ? "What do you want to do?" : askGame ? "Which games?" : askBudget ? "What can they spend?" : askDesk ? "The whole desk?" : "This is the one.";

  return (
    <div className="min-h-full overflow-y-auto bg-bg px-4 py-4 pb-28 text-fg">
      <button type="button" onClick={onClose} className="text-base text-muted">
        Close
      </button>
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
          {result.one ? (
            <>
              <h2 className="text-xl font-medium leading-snug">{result.one.name}</h2>
              <p className="mt-2 text-3xl font-semibold">{money(result.one.price)}</p>
              <RuleLine how="Five-minute guide" who={result.person} budget={money(budget!)} score={String(result.one.score)} />
              <AddButton line={result.one.line} />
            </>
          ) : (
            <>
              <h2 className="text-xl font-medium">The list</h2>
              <ol className="mt-3 space-y-2 text-base">
                {result.pack.map((line, index) => (
                  <li key={line.id}>
                    {index + 1}. {line.name} · {money(line.price)}
                  </li>
                ))}
              </ol>
              <RuleLine how={result.pack[0]?.rule.split(".")[0] ?? "Package"} who={result.person} budget={money(budget!)} score={result.pack[0]?.rule.match(/Score (\d+)/)?.[1] ?? "on the computer"} />
              <AddPack lines={result.pack} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

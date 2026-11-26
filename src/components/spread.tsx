import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { PARTS, isJunk, machineParts, machineScore, money } from "@/lib/catalog";
import { KEYS } from "@/lib/keyboard";
import { deskMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { CopyList, partLine } from "@/components/copy-list";

const WHO = [
  { id: "grandma", title: "Grandma" },
  { id: "school", title: "School" },
  { id: "work", title: "Work" },
  { id: "games", title: "Games" },
  { id: "think", title: "A model at home" },
] as const;

export function Spread({ onLock }: { onLock: () => void }) {
  const [panel, setPanel] = useState<"home" | "build" | "keys" | "sim">("home");
  const [who, setWho] = useState<(typeof WHO)[number]["id"]>("school");
  const [budget, setBudget] = useState(1400);

  const pick = useMemo(() => {
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget);
    if (who === "grandma") return desks.filter((part) => machineScore(part.name) < 40).sort((a, b) => a.price - b.price)[0] ?? desks.sort((a, b) => a.price - b.price)[0];
    if (who === "school") return desks.filter((part) => machineScore(part.name) < 58).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "work") return desks.filter((part) => machineParts(part.name).ram >= 16).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "games") return desks.slice().sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
    return desks.filter((part) => machineParts(part.name).ram >= 32).sort((a, b) => machineScore(b.name) - machineScore(a.name))[0] ?? desks.sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
  }, [budget, who]);

  const feel = useMemo(
    () =>
      KEYS.filter((item) => item.shelf === "board" && ["linear", "tactile", "silent"].includes(item.feel) && item.price <= 180 && !item.open).sort(
        (a, b) => (a.estimated ?? 99) - (b.estimated ?? 99),
      )[0],
    [],
  );
  const grandma = useMemo(
    () => KEYS.filter((item) => item.shelf === "board" && (item.feel === "membrane" || item.feel === "silent") && item.price <= 80).sort((a, b) => a.price - b.price)[0],
    [],
  );

  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-dvh bg-[#f3ecdf] text-[#1a120c]">
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a5a32]">6666</p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-[0.95] sm:text-6xl">I would put this one in their hands.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#1a120c]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mx-4 mt-4 max-w-2xl text-lg text-[#4a3b2a]">One computer, one keyboard, and a rig if they ask. The cart opens while you build. Remove a part if they change their mind. Copy the list, or let the QR sit on the counter.</p>
      <div className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {WHO.map((item) => (
          <button key={item.id} type="button" onClick={() => setWho(item.id)} className={`h-11 shrink-0 rounded-full px-4 text-sm ${who === item.id ? "bg-[#1a120c] text-[#f3ecdf]" : "border border-[#1a120c] bg-transparent"}`}>
            {item.title}
          </button>
        ))}
      </div>
      <label className="mx-4 mt-4 block text-sm">
        Their budget {money(budget)}
        <input type="range" min={500} max={4000} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#9a3412]" />
      </label>
      <div className="mt-6 grid gap-4 px-4 pb-12 lg:grid-cols-3">
        <article className="rounded-[1.6rem] bg-[#1a120c] p-5 text-[#f3ecdf] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#e7c2a0]">The computer</p>
          {pick ? (
            <>
              <h2 className="mt-2 text-2xl font-medium leading-snug">{pick.name}</h2>
              <p className="mt-3 text-4xl font-medium">{money(pick.price)}</p>
              <div className="mt-3 text-[#1a120c]">
                {deskMarks(pick)}
              </div>
              <CopyList title={pick.name} names={[partLine(pick)]} className="mt-4 h-12 w-full rounded-full bg-[#f3ecdf] text-base font-medium text-[#1a120c]" />
            </>
          ) : (
            <p className="mt-3 text-lg">Nothing finished is under that. Build it.</p>
          )}
          <button type="button" onClick={() => setPanel("build")} className="mt-4 h-12 w-full rounded-full bg-[#9a3412] text-base font-medium text-white">
            Build it in five minutes
          </button>
        </article>
        <div className="grid gap-4">
          <article className="rounded-[1.6rem] bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a5a32]">The keyboard</p>
            {feel ? (
              <>
                <h3 className="mt-2 text-xl font-medium leading-snug">{feel.name}</h3>
                <p className="mt-2 text-sm text-[#4a3b2a]">For someone who feels every key. {feel.feel}. About {feel.estimated ?? feel.measured ?? "—"} dB. {money(feel.price)}.</p>
              </>
            ) : null}
            {grandma ? <p className="mt-3 text-sm text-[#4a3b2a]">If they just need to type: {grandma.name}. {money(grandma.price)}.</p> : null}
            <button type="button" onClick={() => setPanel("keys")} className="mt-4 h-11 w-full rounded-full border border-[#1a120c] text-sm">
              Open the keyboard store
            </button>
          </article>
          <article className="rounded-[1.6rem] bg-[#efe2cf] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a5a32]">The rig</p>
            <h3 className="mt-2 text-xl font-medium">Forza, trucks, a farm, or a cockpit.</h3>
            <p className="mt-2 text-sm text-[#4a3b2a]">Pick the game. I show the gear, a rating, and a computer that can run it. The cart closes until you need the list.</p>
            <button type="button" onClick={() => setPanel("sim")} className="mt-4 h-11 w-full rounded-full bg-[#1a120c] text-sm text-[#f3ecdf]">
              Open the sim shelf
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}

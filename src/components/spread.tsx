import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { PARTS, isJunk, machineParts, machineScore, money } from "@/lib/catalog";
import { deskMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { CopyList, partLine } from "@/components/copy-list";

const WHO = [
  { id: "grandma", title: "Grandma", line: "Email, photos, a video call. I will not hand her a gaming tower." },
  { id: "school", title: "School", line: "Class, essays, and a browser. Room to last a few years." },
  { id: "work", title: "Work", line: "The desk machine. Quiet enough, and enough memory." },
  { id: "games", title: "Games", line: "The card does the work. I say which games it runs." },
  { id: "think", title: "Thinks here", line: "A model on the machine, not only in a browser tab." },
] as const;

export function Spread({ onLock }: { onLock: () => void }) {
  const [panel, setPanel] = useState<"home" | "build" | "keys">("home");
  const [who, setWho] = useState<(typeof WHO)[number]["id"]>("school");
  const [budget, setBudget] = useState(1200);
  const desks = useMemo(() => PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget), [budget]);

  const pick = useMemo(() => {
    const list = desks.slice();
    if (who === "grandma") return list.filter((part) => machineScore(part.name) < 40).sort((a, b) => a.price - b.price)[0] ?? list.sort((a, b) => a.price - b.price)[0];
    if (who === "school") return list.filter((part) => machineScore(part.name) < 55).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "work") return list.filter((part) => machineParts(part.name).ram >= 16).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "games") return list.slice().sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
    return list.filter((part) => machineParts(part.name).ram >= 32).sort((a, b) => machineScore(b.name) - machineScore(a.name))[0] ?? list.sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
  }, [desks, who]);

  const say = WHO.find((item) => item.id === who)!;

  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-dvh bg-[#f4efe6] px-4 pb-12 pt-[max(0.75rem,env(safe-area-inset-top))] text-[#1c1612]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a5a32]">6666 · the counter</p>
          <h1 className="font-display mt-1 max-w-xl text-4xl font-medium leading-none">I pick one computer. Then I show the math.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#1c1612]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mt-3 max-w-xl text-base text-[#4e463c]">Two ranks. The coloured stone is power. Steal, Fair, Full, or Stretch is only the price. Games and apps stay hidden until you ask.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {WHO.map((item) => (
          <button key={item.id} type="button" onClick={() => setWho(item.id)} className={`h-11 shrink-0 rounded-full px-4 text-sm ${who === item.id ? "bg-[#1c1612] text-[#f4efe6]" : "border border-[#1c1612] bg-white"}`}>
            {item.title}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm">
        Budget {money(budget)}
        <input type="range" min={500} max={4000} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#b8431f]" />
      </label>
      <p className="mt-3 text-base">{say.line}</p>
      {pick ? (
        <article className="mt-4 rounded-3xl border border-[#1c1612] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[#8a5a32]">{pick.brand}</p>
          <h2 className="mt-1 text-xl font-medium leading-snug">{pick.name}</h2>
          <p className="mt-2 text-3xl font-semibold">{money(pick.price)}</p>
          <p className="mt-2 text-sm text-[#4e463c]">I would say: this is the {say.title.toLowerCase()} one under {money(budget)}. Tap the stone for the formula. Tap the price rank for dollars per point.</p>
          {deskMarks(pick)}
          <CopyList title={pick.name} names={[partLine(pick)]} className="mt-3 h-11 w-full rounded-full bg-[#1c1612] text-sm font-medium text-white" />
        </article>
      ) : (
        <p className="mt-4 text-base">Nothing finished is under that budget. Build it from parts.</p>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setPanel("build")} className="h-14 rounded-full bg-[#b8431f] text-lg font-medium text-white">Build it from parts</button>
        <button type="button" onClick={() => setPanel("keys")} className="h-14 rounded-full border border-[#1c1612] bg-white text-lg">Keyboards</button>
      </div>
    </div>
  );
}

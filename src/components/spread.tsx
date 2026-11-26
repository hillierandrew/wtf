import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { PARTS, isJunk, machineScore, money, rankFrom, suggest, tagsOf } from "@/lib/catalog";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";

const PATHS = [
  { id: "ask", title: "Ask it things", line: "A computer that talks to an AI. Light work, school, and the counter.", budget: 900 },
  { id: "home", title: "Think at home", line: "Enough memory and a real graphics card to run a model in the shop.", budget: 1800 },
  { id: "hand", title: "Hand one to someone", line: "The one you can explain in a minute and still have them leave with it.", budget: 1200 },
] as const;

export function Spread({ onLock }: { onLock: () => void }) {
  const [panel, setPanel] = useState<"home" | "build" | "keys">("home");
  const [budget, setBudget] = useState(1400);
  const desks = useMemo(() => PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price <= budget).sort((a, b) => machineScore(b.name) - machineScore(a.name) || a.price - b.price), [budget]);

  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-dvh bg-[#07110c] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] text-[#e7ffe4]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-[#b6ff3b]">ONE MORE MACHINE</p>
          <h1 className="font-display mt-2 max-w-xl text-4xl font-medium leading-none">A computer that can think, so the next person can too.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#b6ff3b]/50">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mt-4 max-w-xl text-base text-[#c8f5c2]">I am not here to show every box. I am here to put a useful computer in their hands. More computers that can run AI means more people who can use it.</p>
      <label className="mt-5 block text-sm text-[#b6ff3b]">
        Their budget {money(budget)}
        <input type="range" min={500} max={4000} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#b6ff3b]" />
      </label>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {PATHS.map((path) => {
          const cap = Math.min(budget, path.budget + 400);
          const made = suggest(Math.min(budget, path.budget));
          const ready = desks.find((part) => part.price <= cap) ?? desks[0];
          const score = ready ? machineScore(ready.name) : 0;
          return (
            <article key={path.id} className="rounded-3xl border border-[#b6ff3b]/30 bg-[#0c1a12] p-4">
              <h2 className="text-2xl font-medium">{path.title}</h2>
              <p className="mt-1 text-sm text-[#c8f5c2]">{path.line}</p>
              {ready ? (
                <>
                  <p className="mt-3 text-base leading-snug">{ready.name}</p>
                  <p className="mt-2 text-sm text-[#b6ff3b]">{rankFrom(score).name} {score} · {money(ready.price)}</p>
                  <p className="mt-1 text-xs text-[#c8f5c2]">{tagsOf(ready).slice(0, 4).join(" · ")}</p>
                </>
              ) : (
                <p className="mt-3 text-sm">Parts instead: chip, board, memory, about {money(Object.values(made).reduce((sum, part) => sum + (part?.price ?? 0), 0))}.</p>
              )}
            </article>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setPanel("build")} className="h-14 rounded-full bg-[#b6ff3b] text-lg font-semibold text-[#07110c]">Build it with them</button>
        <button type="button" onClick={() => setPanel("keys")} className="h-14 rounded-full border border-[#b6ff3b] text-lg">Keyboards</button>
      </div>
    </div>
  );
}

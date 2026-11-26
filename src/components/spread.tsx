import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import rawLaptops from "@/data/laptops.json";
import { PARTS, isJunk, machineParts, machineScore, money } from "@/lib/catalog";
import { KEYS } from "@/lib/keyboard";
import { deskMarks, laptopMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { Bundles } from "@/components/bundles";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { AddButton, BagDock } from "@/components/bag";
import { Five } from "@/components/five";
import { keyBag, lapBag, partBag } from "@/lib/bag";
import { Packs } from "@/components/packs";
import boxPc from "@/assets/box-pc.jpg";
import boxKeys from "@/assets/box-keys.jpg";

const WHO = [
  { id: "grandma", title: "Grandma", say: "Email, photos, a video call. Nothing she has to learn." },
  { id: "school", title: "School", say: "Class and a browser, with room to last." },
  { id: "work", title: "Work", say: "The desk. Enough memory, and it is not a toy." },
  { id: "games", title: "Games", say: "The picture is the reason they walked in." },
  { id: "think", title: "A model at home", say: "A small model on the machine, not only in a tab." },
] as const;

type Who = (typeof WHO)[number]["id"];
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean };
const LAPS = rawLaptops as Lap[];

const PLAN = [
  { n: "1", title: "The chip", line: "Who they are decides the chip. A grandma does not get a gaming chip." },
  { n: "2", title: "The board", line: "Only the socket that matches. This is where the memory type gets decided." },
  { n: "3", title: "The memory", line: "DDR5 stays with a DDR5 board. The wrong kind never appears." },
  { n: "4", title: "The graphics", line: "Skip it if the chip already draws the screen. Otherwise this is the picture." },
  { n: "5", title: "Power, case, drive", line: "The supply has to feed the card. The case has to fit the board. Then we copy the list." },
];

function BoxShot({ src, brand, name, price }: { src: string; brand: string; name: string; price: number }) {
  return (
    <figure className="relative mt-3 overflow-hidden rounded-2xl">
      <img src={src} alt="" className="h-48 w-full object-cover" />
      <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-[#07151c]/90 p-3 text-[#f4efe6]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#e7ff4a]">{brand}</p>
        <p className="mt-1 text-sm leading-snug">{name}</p>
        <p className="mt-1 text-lg font-semibold">{money(price)}</p>
      </figcaption>
    </figure>
  );
}

export function Spread({ onLock }: { onLock: () => void }) {
  return (
    <HistoryRoot home="Counter">
      <Floor onLock={onLock} />
      <BagDock />
    </HistoryRoot>
  );
}

function Floor({ onLock }: { onLock: () => void }) {
  const path = usePath();
  const [panel, setPanel] = useState<"home" | "build" | "keys" | "sim" | "deals">("home");
  const [who, setWho] = useState<Who>("school");
  const [budget, setBudget] = useState(1400);
  const [five, setFive] = useState(false);

  useEffect(() => {
    if (!path) return;
    const panelId = latest(path.log, path.at, (id) => id === "build" || id === "keys" || id === "sim" || id === "deals" || id === "home");
    setPanel(panelId === "build" || panelId === "keys" || panelId === "sim" || panelId === "deals" ? panelId : "home");
    const whoId = latest(path.log, path.at, (id) => id.startsWith("who:"));
    if (whoId) setWho(whoId.slice(4) as Who);
  }, [path?.at]);

  const person = WHO.find((item) => item.id === who) ?? WHO[1];

  const pick = useMemo(() => {
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget);
    if (who === "grandma") return desks.filter((part) => machineScore(part.name) < 40).sort((a, b) => a.price - b.price)[0] ?? desks.sort((a, b) => a.price - b.price)[0];
    if (who === "school") return desks.filter((part) => machineScore(part.name) < 58).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "work") return desks.filter((part) => machineParts(part.name).ram >= 16).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "games") return desks.slice().sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
    return desks.filter((part) => machineParts(part.name).ram >= 32).sort((a, b) => machineScore(b.name) - machineScore(a.name))[0] ?? desks.sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
  }, [budget, who]);

  const laptop = useMemo(() => {
    const rows = LAPS.filter((item) => !item.open && item.price > 0 && item.price <= budget && item.kind !== "tablet");
    if (who === "grandma") return rows.filter((item) => item.gpu < 28).sort((a, b) => a.price - b.price)[0];
    if (who === "work") return rows.filter((item) => item.kind === "work").sort((a, b) => a.price - b.price)[0] ?? rows.sort((a, b) => a.price - b.price)[0];
    if (who === "games") return rows.filter((item) => item.kind === "game").sort((a, b) => b.gpu - a.gpu)[0];
    if (who === "think") return rows.filter((item) => /32GB|64GB/.test(item.specs)).sort((a, b) => b.gpu - a.gpu)[0];
    return rows.filter((item) => item.kind === "home" || item.kind === "chrome").sort((a, b) => a.price - b.price)[0];
  }, [budget, who]);

  const feel = useMemo(
    () => KEYS.filter((item) => item.shelf === "board" && ["linear", "tactile", "silent"].includes(item.feel) && item.price <= 180 && !item.open).sort((a, b) => (a.estimated ?? 99) - (b.estimated ?? 99))[0],
    [],
  );
  const grandma = useMemo(
    () => KEYS.filter((item) => item.shelf === "board" && (item.feel === "membrane" || item.feel === "silent") && item.price <= 80).sort((a, b) => a.price - b.price)[0],
    [],
  );

  if (five) return <Five onClose={() => setFive(false)} />;
  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("home")} />;
  if (panel === "deals") return <Bundles onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-full overflow-y-auto bg-[#07151c] pb-28 text-[#f4efe6]">
      <header className="flex items-start justify-between gap-4 px-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e7ff4a]">6666</p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-[0.95] sm:text-6xl">Three things. Then we build if they want more.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e7ff4a] text-[#e7ff4a]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mx-4 mt-4 max-w-2xl text-lg text-[#d5cbbd]">{person.say} I will say the name and the price out loud. The trail at the top is every step we tapped.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {WHO.map((item) => (
          <button key={item.id} type="button" onClick={() => { setWho(item.id); path?.note(`who:${item.id}`, item.title); }} className={`h-11 shrink-0 rounded-full px-4 text-sm ${who === item.id ? "bg-[#e7ff4a] font-semibold text-[#07151c]" : "border border-[#e7ff4a]/50 text-[#e7ff4a]"}`}>
            {item.title}
          </button>
        ))}
      </div>
      <label className="mx-4 mt-4 block text-sm text-[#d5cbbd]">
        Their budget {money(budget)}
        <input type="range" min={500} max={4000} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#e7ff4a]" />
      </label>

      <div className="mt-5 grid gap-4 px-4 lg:grid-cols-3">
        <article className="rounded-[1.6rem] bg-[#102833] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#e7ff4a]">Desktop</p>
          {pick ? (
            <>
              <h2 className="mt-2 text-xl font-medium leading-snug">{pick.name}</h2>
              <p className="mt-2 text-3xl font-semibold text-[#e7ff4a]">{money(pick.price)}</p>
              <BoxShot src={boxPc} brand={pick.brand} name={pick.name} price={pick.price} />
              <p className="mt-3 text-sm leading-snug text-[#d5cbbd]">Say this. This is the desktop. {pick.name}. {money(pick.price)}. {person.say}</p>
              {deskMarks(pick)}
              <AddButton line={partBag(pick, `6666. For ${person.title}. Budget ${money(budget)}. Score ${machineScore(pick.name)}. Desktop.`)} className="mt-3 h-11 w-full rounded-full bg-[#e7ff4a] text-sm font-semibold text-[#07151c]" />
            </>
          ) : (
            <p className="mt-3">Nothing finished is under that. We build it.</p>
          )}
        </article>
        <article className="rounded-[1.6rem] bg-[#f4efe6] p-4 text-[#07151c]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#0f6b4c]">Laptop</p>
          {laptop ? (
            <>
              <h2 className="mt-2 text-xl font-medium leading-snug">{laptop.name}</h2>
              <p className="mt-2 text-3xl font-semibold">{money(laptop.price)}</p>
              <p className="mt-3 text-sm leading-snug text-[#3d4a46]">Say this. If they need to carry it, this is the one. {laptop.specs}. {money(laptop.price)}.</p>
              {laptopMarks(laptop)}
              <AddButton line={lapBag(laptop, `6666. For ${person.title}. Budget ${money(budget)}. Laptop.`)} className="mt-3 h-11 w-full rounded-full bg-[#07151c] text-sm font-semibold text-[#e7ff4a]" />
            </>
          ) : (
            <p className="mt-3">No laptop under that budget. Raise it, or we build a desktop.</p>
          )}
        </article>
        <article className="rounded-[1.6rem] border border-[#e7ff4a]/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#e7ff4a]">Keyboard</p>
          {feel ? (
            <>
              <h2 className="mt-2 text-lg font-medium leading-snug">{feel.name}</h2>
              <p className="mt-2 text-sm text-[#d5cbbd]">For someone who feels every key. {feel.feel}. About {feel.estimated ?? "—"} dB.</p>
              <BoxShot src={boxKeys} brand={feel.brand} name={feel.name} price={feel.price} />
              <AddButton line={keyBag(feel, `6666. For someone who feels every key. Budget ${money(feel.price)}. About ${feel.estimated ?? "—"} dB.`)} className="mt-3 h-11 w-full rounded-full bg-[#e7ff4a] text-sm font-semibold text-[#07151c]" />
            </>
          ) : null}
          {grandma ? (
            <AddButton line={keyBag(grandma, `6666. Simple keyboard. For ${person.title}. Budget ${money(grandma.price)}.`)} className="mt-2 h-11 w-full rounded-full border border-white/30 text-sm text-[#f4efe6]" />
          ) : null}
          <button type="button" onClick={() => { path?.note("keys", "Keyboards"); setPanel("keys"); }} className="mt-2 h-11 w-full rounded-full text-sm text-[#d5cbbd] underline">
            The whole keyboard store
          </button>
        </article>
      </div>

      <section className="mx-4 mt-4 rounded-[1.6rem] bg-[#e7ff4a] p-5 text-[#07151c]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">From scratch</p>
        <h2 className="font-display mt-1 text-3xl font-medium leading-none">Five steps. About five minutes.</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-5">
          {PLAN.map((step) => (
            <li key={step.n}>
              <p className="text-2xl font-semibold">{step.n}</p>
              <p className="mt-1 font-medium">{step.title}</p>
              <p className="mt-1 text-sm leading-snug">{step.line}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => { path?.note("five", "Five minutes"); setFive(true); }} className="h-12 rounded-full bg-[#07151c] text-base font-semibold text-[#e7ff4a]">
            Five minutes
          </button>
          <button type="button" onClick={() => { path?.note("build", "From scratch"); setPanel("build"); }} className="h-12 rounded-full border border-[#07151c] text-base font-semibold">
            Start from the chip
          </button>
          <button type="button" onClick={() => { path?.note("deals", "Bundles"); setPanel("deals"); }} className="h-12 rounded-full border border-[#07151c] text-base font-semibold">
            Bundles
          </button>
        </div>
      </section>
      <section className="mx-4 mt-4 pb-28">
        <Packs />
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import rawLaptops from "@/data/laptops.json";
import { PARTS, dealFrom, explainLaptop, explainPart, gbOf, isJunk, laptopBits, machineParts, machineScore, money, partScore, type Part } from "@/lib/catalog";
import { laptopBlob, laptopFace, releaseYear, tagPaint } from "@/lib/facts";
import { RankBadge } from "@/components/rank";
import { KEYS, FEEL_LABEL, type KeyItem } from "@/lib/keyboard";
import { deskMarks, laptopMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { Bundles } from "@/components/bundles";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { AddButton, AddPack, BagDock } from "@/components/bag";
import { Five } from "@/components/five";
import { keyBag, lapBag, partBag, threeOf } from "@/lib/bag";
import { Packs } from "@/components/packs";
import { Prices } from "@/components/prices";
import { designFloor, machineRows, type FloorMachine } from "@/lib/floor-builds";

const WHO = [
  { id: "grandma", title: "Grandma", say: "Email, photos, a video call. Nothing she has to learn." },
  { id: "school", title: "School", say: "Class and a browser, with room to last." },
  { id: "work", title: "Work", say: "The desk. Enough memory, and it is not a toy." },
  { id: "games", title: "Games", say: "The picture is the reason they walked in." },
  { id: "think", title: "A model at home", say: "A small model on the machine, not only in a tab." },
] as const;

type Who = (typeof WHO)[number]["id"];
type Order = "low" | "high" | "score";
type Shelf = "prebuilt" | "laptop" | "cpu" | "motherboard" | "memory" | "gpu" | "storage" | "case" | "cooler" | "psu" | "monitor" | "mount";
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean };
const LAPS = rawLaptops as Lap[];

const SHELVES: { id: Shelf; title: string }[] = [
  { id: "prebuilt", title: "Desktops" },
  { id: "laptop", title: "Laptops" },
  { id: "cpu", title: "CPUs" },
  { id: "motherboard", title: "Boards" },
  { id: "memory", title: "Memory" },
  { id: "gpu", title: "Graphics" },
  { id: "storage", title: "Drives" },
  { id: "case", title: "Cases" },
  { id: "cooler", title: "Coolers" },
  { id: "psu", title: "Power" },
  { id: "monitor", title: "Screens" },
  { id: "mount", title: "Mounts" },
];

function byMoney<T extends { price: number; score: number }>(rows: T[], order: Order): T[] {
  return rows.slice().sort((a, b) => (order === "high" ? b.price - a.price : order === "score" ? b.score - a.score || a.price - b.price : a.price - b.price));
}

export function Spread({ onLock }: { onLock: () => void }) {
  return (
    <HistoryRoot home="6666" onLock={onLock}>
      <Floor onLock={onLock} />
      <BagDock />
    </HistoryRoot>
  );
}

function Floor({ onLock }: { onLock: () => void }) {
  const path = usePath();
  const [panel, setPanel] = useState<"home" | "build" | "keys" | "sim" | "deals" | "prices">("home");
  const [who, setWho] = useState<Who>("school");
  const [budget, setBudget] = useState(1400);
  const [order, setOrder] = useState<Order>("low");
  const [shelf, setShelf] = useState<Shelf>("prebuilt");
  const [more, setMore] = useState(12);
  const [seek, setSeek] = useState("");
  const [five, setFive] = useState(false);
  const [ask, setAsk] = useState<null | "laptop" | "desktop" | "keys" | "sim">(null);
  const [shelfOpen, setShelfOpen] = useState(false);

  useEffect(() => {
    if (!path) return;
    const panelId = latest(path.log, path.at, (id) => id === "build" || id === "keys" || id === "sim" || id === "deals" || id === "prices" || id === "home");
    setPanel(panelId === "build" || panelId === "keys" || panelId === "sim" || panelId === "deals" || panelId === "prices" ? panelId : "home");
    const whoId = latest(path.log, path.at, (id) => id.startsWith("who:"));
    if (whoId) setWho(whoId.slice(4) as Who);
  }, [path?.at]);

  const person = WHO.find((item) => item.id === who) ?? WHO[1];

  const deskRows = useMemo(() => {
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget).map((part) => ({ id: part.id, name: part.name, brand: part.brand, price: part.price, score: machineScore(part.name), part }));
    const narrow =
      who === "grandma" ? desks.filter((row) => row.score < 40) : who === "school" ? desks.filter((row) => row.score < 58) : who === "work" ? desks.filter((row) => machineParts(row.part.name).ram >= 16) : who === "think" ? desks.filter((row) => machineParts(row.part.name).ram >= 32) : desks;
    return narrow.length ? narrow : desks;
  }, [budget, who]);

  const lapRows = useMemo(() => {
    const rows = LAPS.filter((item) => !item.open && item.price > 0 && item.price <= budget && item.kind !== "tablet").map((item) => ({ id: item.id, name: item.name, brand: item.brand, price: item.price, score: laptopBits(item).score, item }));
    const narrow =
      who === "grandma" ? rows.filter((row) => row.item.gpu < 28) : who === "work" ? rows.filter((row) => row.item.kind === "work") : who === "games" ? rows.filter((row) => row.item.kind === "game") : who === "think" ? rows.filter((row) => /32GB|64GB/.test(row.item.specs)) : rows.filter((row) => row.item.kind === "home" || row.item.kind === "chrome");
    return narrow.length ? narrow : rows;
  }, [budget, who]);

  const shelfRows = useMemo(() => {
    if (shelf === "laptop") {
      const q = seek.trim().toLowerCase();
      return byMoney(
        LAPS.filter((item) => !item.open && item.kind !== "tablet" && item.price > 0 && item.price <= budget && (!q || laptopBlob(item).includes(q))).map((item) => ({ id: item.id, name: item.name, brand: item.brand, price: item.price, score: laptopBits(item).score, kind: "laptop" as const })),
        order,
      );
    }
    return byMoney(
      PARTS.filter((part) => part.cat === shelf && !isJunk(part, false) && part.price > 0 && part.price <= budget).map((part) => ({
        id: part.id,
        name: part.name,
        brand: part.brand,
        price: part.price,
        score: shelf === "prebuilt" ? machineScore(part.name) : partScore(part),
        kind: "part" as const,
        part,
      })),
      order,
    );
  }, [shelf, budget, order, seek]);

  function go(next: "home" | "build" | "keys" | "sim" | "deals" | "prices", label: string) {
    path?.note(next, label);
    setPanel(next);
  }

  if (five) return <Five onClose={() => setFive(false)} />;
  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("home")} />;
  if (panel === "deals") return <Bundles onLeave={() => setPanel("home")} />;
  if (panel === "prices") return <Prices onClose={() => { if (path?.log[path.at]?.id === "prices") path.back(); else setPanel("home"); }} />;

  return (
    <div className="h-full overflow-y-auto bg-[#f4f1ea] pb-28 text-[#161616]">
      <header className="flex items-start justify-between gap-4 px-4 pt-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#0f6b4c]">6666</p>
          <h1 className="mt-1 max-w-3xl font-display text-4xl font-medium leading-none tracking-tight sm:text-6xl">Built from what is on the shelf.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#161616]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mx-4 mt-3 max-w-2xl text-lg leading-snug text-[#333]">Six computers from boxes on the shelf. Read the line, then the price. Nothing here is a finished PC with a mystery inside.</p>
      <Designed budget={budget} onBudget={setBudget} />
      <p className="mx-4 mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#333]">Or they named the thing</p>
      <div className="mt-2 grid gap-2 px-4 sm:grid-cols-4">
        {(
          [
            ["laptop", "A laptop"],
            ["desktop", "A desktop"],
            ["keys", "A keyboard"],
            ["sim", "A sim"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setAsk(id); path?.note(`ask:${id}`, label); }} className={`min-h-16 rounded-2xl px-4 text-left text-lg font-semibold ${ask === id ? "bg-[#161616] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {ask === "laptop" || ask === "desktop" ? (
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto px-4">
            {WHO.map((item) => (
              <button key={item.id} type="button" onClick={() => { setWho(item.id); path?.note(`who:${item.id}`, item.title); }} className={`h-12 shrink-0 rounded-full px-4 text-base ${who === item.id ? "bg-[#161616] font-semibold text-white" : "border border-[#161616] bg-white"}`}>
                {item.title}
              </button>
            ))}
          </div>
          <label className="mx-4 mt-4 block rounded-3xl bg-white p-4">
            <span className="text-sm text-[#333]">Their budget</span>
            <span className="mt-1 block text-4xl font-semibold tabular-nums">{money(budget)}</span>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setBudget((value) => Math.max(400, value - 100))} className="h-12 flex-1 rounded-full border border-[#161616] text-base font-semibold">− $100</button>
              <button type="button" onClick={() => setBudget((value) => Math.min(4500, value + 100))} className="h-12 flex-1 rounded-full border border-[#161616] text-base font-semibold">+ $100</button>
            </div>
            <input type="range" min={400} max={4500} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-3 h-8 w-full accent-[#0f6b4c]" />
          </label>
        </div>
      ) : null}
      {ask === "desktop" ? <Offers rows={threeOf(deskRows)} empty={`Nothing under ${money(budget)}. Move the budget up.`} say={(kind) => scriptLine(kind, person.say)} add={(row) => partBag(row.part, `6666. ${scriptLine(row.kind, person.title)} Budget ${money(budget)}. Score ${row.score}. Desktop.`)} marks={(row) => deskMarks(row.part)} /> : null}
      {ask === "laptop" ? <Offers rows={threeOf(lapRows)} empty={`No laptop under ${money(budget)}. Move the budget up.`} say={(kind) => scriptLine(kind, person.say)} add={(row) => lapBag(row.item, `6666. ${scriptLine(row.kind, person.title)} Budget ${money(budget)}. Laptop.`)} marks={(row) => laptopMarks(row.item)} priceNote={(row) => `${money(row.price / Math.max(1, row.score))} / point · ${releaseYear(row.item.name)}`} /> : null}
      {ask === "keys" ? <KeyScript onAll={() => go("keys", "Keyboards")} /> : null}
      {ask === "sim" ? <div className="mx-4 mt-4"><Packs /></div> : null}

      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => go("prices", "Prices")} className="h-12 rounded-full bg-[#161616] px-4 text-base font-semibold text-white">Prices</button>
        <button type="button" onClick={() => { path?.note("five", "Five minutes"); setFive(true); }} className="h-12 rounded-full bg-[#0f6b4c] px-4 text-base font-semibold text-white">Five minutes</button>
        <button type="button" onClick={() => go("build", "Build")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Build from a bundle</button>
        <button type="button" onClick={() => go("sim", "Sims")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Full sim builder</button>
        <button type="button" onClick={() => go("deals", "Bundles")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Bundle list</button>
      </div>

      <section className="mx-4 mt-6">
        <button type="button" onClick={() => setShelfOpen((value) => !value)} className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#161616] bg-white px-4 text-left text-lg font-semibold">
          The shelf, under {money(budget)}
          <span className="text-sm font-medium">{shelfOpen ? "Hide" : "Open"}</span>
        </button>
        {shelfOpen ? (
          <>
        {shelf === "laptop" ? (
          <input value={seek} onChange={(event) => { setSeek(event.target.value); setMore(12); }} placeholder="OLED, 16 inch, 32GB, school, 2025" className="mt-3 h-12 w-full rounded-2xl border border-[#161616] bg-white px-3 text-base outline-none" />
        ) : null}
        <label className="mt-3 flex h-12 items-center gap-3 rounded-2xl border border-[#161616] bg-white px-3">
          <span className="shrink-0 text-sm font-semibold">Sort</span>
          <select value={order} onChange={(event) => { setOrder(event.target.value as Order); setMore(12); }} className="h-full w-full bg-white text-base outline-none">
            <option value="low">Price, low to high</option>
            <option value="high">Price, high to low</option>
            <option value="score">Best score first</option>
          </select>
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {SHELVES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setShelf(item.id); setMore(12); path?.note(`shelf:${item.id}`, item.title); }} className={`h-11 shrink-0 rounded-full px-3 text-sm ${shelf === item.id ? "bg-[#161616] font-semibold text-white" : "bg-white"}`}>
              {item.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#333]">{shelfRows.length} shown, {order === "high" ? "dearest first" : order === "score" ? "best score first" : "cheapest first"}.</p>
        <ul className="mt-2 space-y-2">
          {shelfRows.slice(0, more).map((row) => {
            const lap = row.kind === "laptop" ? LAPS.find((item) => item.id === row.id) : undefined;
            const ink = dealFrom(row.price, Math.max(1, row.score)).fg;
            const tags = lap ? laptopFace(lap.name, lap.specs, lap.kind).slice(0, 6) : [];
            return (
            <li key={row.id} className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-[#0f6b4c]">{row.brand}</p>
                  <p className="text-base font-medium leading-snug">{row.name}</p>
                  <div className="mt-2">
                    <RankBadge score={row.score} lines={lap ? explainLaptop(lap) : row.kind === "part" ? explainPart(row.part) : [`Score ${Math.round(row.score)}.`]} />
                  </div>
                  {tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.map((tag) => {
                        const paint = tagPaint(tag);
                        return (
                          <button key={tag} type="button" onClick={() => { setSeek(tag); setShelf("laptop"); setMore(12); }} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: paint.bg, color: paint.fg }}>
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold tabular-nums" style={{ color: ink }}>{money(row.price)}</p>
                  {lap ? <p className="text-xs font-semibold" style={{ color: ink }}>{money(row.price / Math.max(1, row.score))}/pt · {releaseYear(lap.name)}</p> : null}
                </div>
              </div>
              {lap ? (
                <AddButton line={lapBag(lap, `6666 shelf. ${person.title}. ${money(row.price)}.`)} />
              ) : (
                <AddButton line={partBag(row.kind === "part" ? row.part : { id: row.id, name: row.name, price: row.price, brand: row.brand }, `6666 shelf. ${person.title}. ${money(row.price)}. Score ${Math.round(row.score)}.`)} />
              )}
            </li>
            );
          })}
        </ul>
        {shelfRows.length === 0 ? <p className="mt-3 rounded-2xl bg-white px-4 py-8 text-center">Nothing on this shelf under {money(budget)}.</p> : null}
        {more < shelfRows.length ? (
          <button type="button" onClick={() => setMore((count) => count + 24)} className="mt-3 h-12 w-full rounded-full border border-[#161616] bg-white text-base">
            Show more
          </button>
        ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

function Designed({ budget, onBudget }: { budget: number; onBudget: (next: number) => void }) {
  const machines = useMemo(() => designFloor(), []);
  const [id, setId] = useState(machines[3]?.id ?? machines[0]?.id ?? "");
  const machine = machines.find((item) => item.id === id) ?? machines[0];
  if (!machine) return <p className="mx-4 mt-4 rounded-3xl bg-white px-4 py-6">No complete computer could be built from the shelf.</p>;
  const index = Math.max(0, machines.findIndex((item) => item.id === machine.id));
  const over = machine.total > budget;
  const rows = machineRows(machine);
  const tower = ORDER_PARTS(machine).map((part) => partBag(part, `6666 ${machine.name}. Tower. ${money(machine.total)}.`));
  const withScreen = machine.screen ? [...tower, partBag(machine.screen, `6666 ${machine.name}. Screen.`)] : tower;
  const stamp = machine.status !== "PASS" ? "Check" : over ? "Over" : "Fits";
  return (
    <section className="mt-4">
      <div className="sticky top-0 z-10 border-y border-[#161616] bg-[#f4f1ea]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-[#333]">They can spend</p>
          <p className="font-display text-3xl font-medium tabular-nums leading-none">{money(budget)}</p>
        </div>
        <input aria-label="Their budget" type="range" min={500} max={4500} step={50} value={budget} onChange={(event) => onBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#0f6b4c]" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 px-4">
        {machines.map((item, itemIndex) => {
          const on = item.id === machine.id;
          const high = item.total > budget;
          return (
            <button key={item.id} type="button" onClick={() => setId(item.id)} className={`min-h-24 rounded-2xl px-3 py-2 text-left ${on ? "bg-[#161616] text-white" : "border border-[#161616] bg-white"}`}>
              <span className={`block text-[11px] font-semibold uppercase tracking-wide ${on ? "text-[#b7f7c8]" : high ? "text-[#9b3a32]" : "text-[#0f6b4c]"}`}>{String(itemIndex + 1).padStart(2, "0")} {high ? "Over" : "Fits"}</span>
              <span className="mt-1 block font-display text-3xl font-medium leading-none tabular-nums">{money(item.total)}</span>
              <span className="mt-1 block text-sm leading-tight">{item.name}</span>
            </button>
          );
        })}
      </div>
      <article className="relative mx-4 mt-4 overflow-hidden rounded-[1.75rem] border-2 border-[#161616] bg-white shadow-[0_6px_0_#161616]">
        <div className="relative bg-[#161616] px-5 pb-5 pt-5 text-white">
          <p className={`pointer-events-none absolute right-4 top-4 grid size-16 rotate-[-12deg] place-items-center rounded-full border-2 text-[11px] font-semibold uppercase tracking-wide ${stamp === "Fits" ? "border-[#b7f7c8] text-[#b7f7c8]" : "border-[#f0b4a8] text-[#f0b4a8]"}`}>{stamp}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b7f7c8]">Say this first · {String(index + 1).padStart(2, "0")}</p>
          <p className="mt-2 pr-16 text-xl font-semibold leading-snug sm:text-2xl">{machine.say}</p>
          <p className="mt-4 font-display text-[clamp(2.6rem,12vw,4.25rem)] font-medium leading-none tabular-nums tracking-tight">{money(machine.total)}</p>
          <p className="mt-2 text-sm text-white/75">{over ? `${money(machine.total - budget)} over what they said. The parts are still on the shelf.` : "Inside what they said. Tower only, before the screen."} {stepUp(machines[index - 1], machine)}</p>
        </div>
        <div aria-hidden className="h-4 bg-[radial-gradient(circle_at_12px_0,#f4f1ea_8px,transparent_8.5px)] bg-[length:24px_16px]" />
        <ol className="divide-y divide-dashed divide-[#d8d0c4]">
          {rows.map((row) => (
            <li key={row.key} className="grid grid-cols-[4.75rem_1fr_auto] items-start gap-2 px-4 py-3">
              <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0f6b4c]">{row.label}</span>
              <span className="text-sm leading-snug">{row.name}</span>
              <span className="text-sm font-semibold tabular-nums">{row.price == null ? "—" : money(row.price)}</span>
            </li>
          ))}
          {machine.screen ? (
            <li className="grid grid-cols-[4.75rem_1fr_auto] items-start gap-2 bg-[#f6f3ec] px-4 py-3">
              <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0f6b4c]">Screen</span>
              <span className="text-sm leading-snug">{shortScreen(machine.screen)}</span>
              <span className="text-sm font-semibold tabular-nums">{money(machine.screen.price)}</span>
            </li>
          ) : null}
        </ol>
        <div className="border-t border-[#161616] px-4 py-4">
          <p className="text-sm text-[#333]">{machine.note} {machine.screen ? `With the screen, ${money(machine.withScreen)}.` : ""}</p>
          <AddPack lines={tower} label="Add the tower" className="mt-3 h-12 w-full rounded-full bg-[#0f6b4c] text-base font-semibold text-white" />
          {machine.screen ? <AddPack lines={withScreen} label={`Add tower and screen · ${money(machine.withScreen)}`} className="mt-2 min-h-12 w-full rounded-full border border-[#161616] bg-white px-3 py-3 text-base font-semibold leading-snug text-[#161616]" /> : null}
          <p className="mt-2 text-center text-xs text-[#333]">{tower.length} boxes into the cart. Not a mystery prebuilt.</p>
        </div>
      </article>
    </section>
  );
}

function shortScreen(part: Part) {
  return part.name.replace(/\s+/g, " ").replace(new RegExp(`^${part.brand}\\s+`, "i"), "").trim();
}

function stepUp(prev: FloorMachine | undefined, cur: FloorMachine) {
  if (!prev) return "Start here if they only need a desk.";
  if (!prev.build.gpu && cur.build.gpu) return "This is the first one with a graphics card.";
  if (prev.build.gpu && cur.build.gpu && prev.build.gpu.id !== cur.build.gpu.id) return "The card steps up from the one before.";
  const prevRam = prev.build.memory ? gbOf(prev.build.memory) : 0;
  const ram = cur.build.memory ? gbOf(cur.build.memory) : 0;
  if (ram > prevRam) return `Memory steps up from ${prevRam}GB to ${ram}GB.`;
  return "A stronger chip than the one before it.";
}

function ORDER_PARTS(machine: FloorMachine): Part[] {
  const order = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "case", "psu"] as const;
  return order.map((cat) => machine.build[cat]).filter((part): part is Part => Boolean(part));
}

function scriptLine(kind: string, extra: string) {
  if (kind.startsWith("Cheap")) return `If they say it costs too much. ${extra}`;
  if (kind.startsWith("Premium")) return `If they want it nicer and the money is there. ${extra}`;
  return `Hand them this one first. ${extra}`;
}

function Offers<T extends { id: string; name: string; price: number; score: number }>({
  rows,
  empty,
  say,
  add,
  marks,
  priceNote,
}: {
  rows: { kind: string; item: T }[];
  empty: string;
  say: (kind: string) => string;
  add: (row: T & { kind: string }) => ReturnType<typeof partBag>;
  marks: (row: T) => React.ReactNode;
  priceNote?: (row: T) => string;
}) {
  if (!rows.length) return <p className="mx-4 mt-4 rounded-3xl bg-white px-4 py-6 text-base">{empty}</p>;
  const rank = ["Best value", "Cheapest that matches", "Premium"];
  const shown = rows.slice().sort((a, b) => rank.indexOf(a.kind) - rank.indexOf(b.kind));
  return (
    <div className="mx-4 mt-4 space-y-3">
      {shown.map((row) => {
        const first = row.kind === "Best value" || (shown.length === 1 && row === shown[0]);
        const ink = dealFrom(row.item.price, Math.max(1, row.item.score)).fg;
        return (
          <article key={row.item.id} className={`rounded-3xl p-5 ${first ? "bg-[#161616] text-white" : "bg-white"}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${first ? "text-[#b7f7c8]" : "text-[#0f6b4c]"}`}>{first && row.kind === "Best value" ? "Say this first" : row.kind}</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums" style={first ? undefined : { color: ink }}>{money(row.item.price)}</p>
            <p className="mt-2 text-lg font-medium leading-snug">{say(row.kind)}</p>
            <p className={`mt-2 text-sm leading-snug ${first ? "text-white/80" : "text-[#333]"}`}>{row.item.name}</p>
            {priceNote ? <p className="mt-2 text-sm font-semibold" style={{ color: first ? "#b7f7c8" : ink }}>{priceNote(row.item)}</p> : null}
            <div className={first ? "mt-3 text-[#161616]" : "mt-3"}>{marks(row.item)}</div>
            <AddButton line={add({ ...row.item, kind: row.kind })} className={`mt-3 h-12 w-full rounded-full text-base font-semibold ${first ? "bg-white text-[#161616]" : "bg-[#0f6b4c] text-white"}`} />
          </article>
        );
      })}
    </div>
  );
}

function KeyScript({ onAll }: { onAll: () => void }) {
  const boards: { title: string; say: string; item?: KeyItem }[] = [
    ["Touch typing", "Quiet. A bump, or a silent pad. For someone who writes.", (item: KeyItem) => item.shelf === "board" && !item.open && ["tactile", "silent"].includes(item.feel)],
    ["League", "Fast, and quiet enough for a call.", (item: KeyItem) => item.shelf === "board" && !item.open && ["linear", "magnetic"].includes(item.feel) && (item.estimated ?? 99) <= 56],
    ["Games", "The finger gets there fast.", (item: KeyItem) => item.shelf === "board" && !item.open && ["linear", "clicky", "magnetic"].includes(item.feel)],
  ].map(([title, say, test]) => {
    const item = KEYS.filter(test as (item: KeyItem) => boolean).sort((a, b) => (title === "Touch typing" ? (a.estimated ?? 99) - (b.estimated ?? 99) : a.price - b.price))[0];
    return { title: title as string, say: say as string, item };
  });
  const switches = KEYS.filter((item) => item.shelf === "switch" && !item.open).sort((a, b) => (a.estimated ?? 99) - (b.estimated ?? 99) || a.price - b.price).slice(0, 8);
  return (
    <div className="mx-4 mt-4 space-y-3">
      <p className="text-base text-[#333]">Ask what they do with it. Then say the line. Switches are loose. A finished keyboard already has switches in it.</p>
      {boards.map((job) => (
        <article key={job.title} className="rounded-3xl bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6b4c]">{job.title}</p>
          <p className="mt-2 text-lg font-medium leading-snug">{job.say}</p>
          {job.item ? (
            <>
              <p className="mt-2 text-sm leading-snug text-[#333]">{job.item.name}</p>
              <p className="mt-1 text-sm font-semibold">{FEEL_LABEL[job.item.feel]}{job.item.estimated ? ` · about ${job.item.estimated} dB` : ""} · {money(job.item.price)}</p>
              <AddButton line={keyBag(job.item, `6666 keyboard. ${job.title}. ${job.item.feel}. ${job.item.estimated ? `${job.item.estimated} dB.` : ""}`)} className="mt-3 h-12 w-full rounded-full bg-[#161616] text-base font-semibold text-white" />
            </>
          ) : (
            <p className="mt-2 text-sm">Nothing on that shelf.</p>
          )}
        </article>
      ))}
      <section className="rounded-3xl bg-white p-4">
        <h2 className="text-xl font-semibold">Loose switches</h2>
        <p className="mt-1 text-sm text-[#333]">No board in the box. Quietest first. They still need a hot-swap keyboard if they want to put these in.</p>
        <ul className="mt-3 space-y-2">
          {switches.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 border-t border-[#eee] pt-2">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{item.name}</p>
                <p className="text-xs text-[#333]">{FEEL_LABEL[item.feel]}{item.estimated ? ` · about ${item.estimated} dB` : ""}</p>
                <AddButton line={keyBag(item, `6666 switch. ${item.feel}. ${item.estimated ? `${item.estimated} dB.` : ""}`)} className="mt-2 h-10 rounded-full border border-[#161616] px-3 text-sm" />
              </div>
              <p className="shrink-0 font-semibold">{money(item.price)}</p>
            </li>
          ))}
        </ul>
      </section>
      <button type="button" onClick={onAll} className="h-12 w-full rounded-full border border-[#161616] bg-white text-base font-semibold">
        All keyboards and switches
      </button>
    </div>
  );
}

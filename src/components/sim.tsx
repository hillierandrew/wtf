import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import raw from "@/data/sim.json";
import monitors from "@/data/monitors.json";
import { CopyList, listText, partLine } from "@/components/copy-list";
import { ThemeToggle } from "@/lib/theme";
import { PARTS, isJunk, machineScore, money as partMoney } from "@/lib/catalog";
import QRCode from "qrcode";

type Game = "racing" | "flight" | "farm" | "pads" | "consoles" | "extras";
type Level = "all" | "entry" | "novice" | "mid" | "pro" | "real";
type Slot = "seat" | "wheel" | "rim" | "pedals" | "shifter" | "brake" | "controls" | "throttle" | "rudder" | "farm" | "pad" | "console" | "headset" | "extra" | "screen";

type SimItem = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  game: Game;
  slot: Slot;
  also: Slot[];
  base: boolean;
  open: boolean;
};

const ITEMS = raw as SimItem[];

type ShelfMon = { id: string; name: string; price: number; was?: number | null; brand?: string; kind?: string; open?: boolean };

const SCREENS: SimItem[] = (monitors as ShelfMon[])
  .filter((item) => item.kind === "gaming" && /27"/.test(item.name) && item.price >= 180 && item.price <= 600 && !item.open)
  .slice(0, 8)
  .map((item) => ({
    id: `screen-mon-${item.id}`,
    name: `Three of these: ${item.name}`,
    price: Math.round(item.price * 300) / 100,
    was: item.was ? Math.round(item.was * 300) / 100 : null,
    brand: item.brand || "Monitor",
    game: "racing" as const,
    slot: "screen" as const,
    also: [] as Slot[],
    base: false,
    open: false,
  }));

const MOUNTS: SimItem[] = ITEMS.filter((item) => /triple monitor|monitor stand/i.test(item.name)).map((item) => ({
  ...item,
  id: `screen-${item.id}`,
  slot: "screen" as const,
  game: "racing" as const,
  also: [] as Slot[],
}));

const STOCK = [...ITEMS, ...MOUNTS, ...SCREENS];
const KEY = "drew-sim";
const byId = Object.fromEntries(STOCK.map((item) => [item.id, item]));

const LEVELS: { id: Level; label: string; line: string; target: number }[] = [
  { id: "all", label: "All", line: "Every part for this step.", target: 0.5 },
  { id: "entry", label: "Entry", line: "The cheap start. It works.", target: 0 },
  { id: "novice", label: "Novice", line: "A step up from the cheapest.", target: 0.25 },
  { id: "mid", label: "Mid", line: "The normal pick.", target: 0.5 },
  { id: "pro", label: "Pro", line: "Serious gear.", target: 0.75 },
  { id: "real", label: "Real deal", line: "The top. It costs the most.", target: 1 },
];

const peersOf = new Map<string, number[]>();
for (const item of STOCK) {
  const key = `${item.game}:${item.slot}`;
  const list = peersOf.get(key) ?? [];
  list.push(item.price);
  peersOf.set(key, list);
}
for (const list of peersOf.values()) list.sort((a, b) => a - b);

function rankOf(item: SimItem) {
  const list = peersOf.get(`${item.game}:${item.slot}`) ?? [item.price];
  if (list.length <= 1) return 0.5;
  const index = list.indexOf(item.price);
  return index / (list.length - 1);
}

function levelName(item: SimItem) {
  const rank = rankOf(item);
  if (rank <= 0.15) return "Entry";
  if (rank <= 0.35) return "Novice";
  if (rank <= 0.6) return "Mid";
  if (rank <= 0.82) return "Pro";
  return "Real deal";
}

function fitsLevel(item: SimItem, level: Level) {
  if (level === "all") return true;
  const rank = rankOf(item);
  const target = LEVELS.find((entry) => entry.id === level)?.target ?? 0.5;
  const list = peersOf.get(`${item.game}:${item.slot}`) ?? [item.price];
  const width = list.length <= 2 ? 0.51 : 0.3;
  if (level === "entry" && rank === 0) return true;
  if (level === "real" && rank === 1) return true;
  return Math.abs(rank - target) <= width;
}

const GAMES: { id: Game; label: string; line: string }[] = [
  { id: "racing", label: "Racing gear", line: "A seat or a stand, a wheel, and pedals." },
  { id: "flight", label: "Pilot gear", line: "A stick or a yoke for Flight Simulator." },
  { id: "farm", label: "Farm gear", line: "A farm stick, plus a wheel if you drive the tractor." },
  { id: "pads", label: "Controllers", line: "One gamepad. Xbox, PlayStation, Switch, or PC." },
  { id: "consoles", label: "Consoles", line: "A Switch, a handheld, or a PlayStation Portal." },
  { id: "extras", label: "Extras", line: "A headset, a mount, or a button box." },
];

const TITLES: { id: string; label: string; rig: Game; triple: boolean; pc: string }[] = [
  { id: "forza", label: "Forza Horizon 5", rig: "racing", triple: true, pc: "One screen: 16GB and a mid graphics card. Three screens: 32GB and a stronger card." },
  { id: "nfs", label: "Need for Speed", rig: "racing", triple: false, pc: "One screen. 16GB and a mid card. A wheel is optional. A pad is fine." },
  { id: "iracing", label: "iRacing", rig: "racing", triple: true, pc: "iRacing likes a fast processor. One screen: 16GB and a mid card. Three screens: 32GB and a stronger card." },
  { id: "acc", label: "Assetto Corsa", rig: "racing", triple: true, pc: "One screen: 16GB and a mid card. Three screens: 32GB and a stronger card." },
  { id: "f1", label: "F1", rig: "racing", triple: true, pc: "One screen: 16GB and a mid card. Three screens: 32GB and a stronger card." },
  { id: "flight", label: "Flight Simulator", rig: "flight", triple: false, pc: "32GB and a strong card. This one is heavy even on a single screen." },
  { id: "farm", label: "Farming Simulator 25", rig: "farm", triple: false, pc: "16GB and a mid card. Use a wheel, then add the farm stick." },
  { id: "truck", label: "Euro Truck Simulator 2", rig: "racing", triple: false, pc: "16GB and a mid card. A wheel and pedals. One screen is enough." },
];

const TRIPLE: { id: Slot; label: string; line: string }[] = [
  { id: "seat", label: "Stand", line: "A wheel stand or a cockpit. The screens sit with this." },
  { id: "screen", label: "Three screens", line: "A triple mount, or three of the same 27 inch monitor. The monitor price is for three." },
  { id: "wheel", label: "Wheel", line: "A wheel kit, or a wheel base." },
  { id: "pedals", label: "Pedals", line: "Skip this if the kit already has pedals." },
  { id: "shifter", label: "Shifter", line: "Optional." },
];

const STEPS: Record<Game, { id: Slot; label: string; line: string }[]> = {
  racing: [
    { id: "seat", label: "Seat", line: "One cockpit or one wheel stand. Not both." },
    { id: "wheel", label: "Wheel", line: "A complete kit, or a wheel base. Not two wheels." },
    { id: "rim", label: "Rim", line: "Only if you picked a wheel base. A kit already has a rim." },
    { id: "pedals", label: "Pedals", line: "One set. Skip this if the kit already has pedals." },
    { id: "shifter", label: "Shifter", line: "Optional. One shifter." },
    { id: "brake", label: "Handbrake", line: "Optional. One handbrake." },
  ],
  flight: [
    { id: "controls", label: "Stick", line: "One stick, one yoke, or one stick-and-throttle set." },
    { id: "throttle", label: "Throttle", line: "Skip this if the stick already has a throttle." },
    { id: "rudder", label: "Rudder", line: "Optional. One set of rudder pedals." },
  ],
  farm: [
    { id: "farm", label: "Farm stick", line: "One farm stick. This is the extra lever for the tractor." },
    { id: "wheel", label: "Wheel", line: "Optional. Most farm games also want a wheel." },
    { id: "pedals", label: "Pedals", line: "One set, unless the wheel kit already has them." },
    { id: "seat", label: "Seat", line: "Optional. One cockpit or one stand." },
  ],
  pads: [{ id: "pad", label: "Controller", line: "One gamepad." }],
  consoles: [{ id: "console", label: "Console", line: "One console or one handheld." }],
  extras: [
    { id: "headset", label: "Headset", line: "One headset." },
    { id: "extra", label: "Extra", line: "A mount, a clutch add-on, a button box, or a stand." },
  ],
};

function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function Sim({ onLeave, look = "paper" }: { onLeave?: () => void; look?: "paper" | "phone" }) {
  const [game, setGame] = useState<Game | null>(null);
  const [triple, setTriple] = useState(false);
  const [blurb, setBlurb] = useState("");
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<Slot>("seat");
  const [ids, setIds] = useState<Partial<Record<Slot, string>>>({});
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [level, setLevel] = useState<Level>("all");
  const [notice, setNotice] = useState("");
  const [sort, setSort] = useState<"low" | "high" | "rank">("low");
  const [grid, setGrid] = useState(false);
  const [cart, setCart] = useState(false);
  const [qr, setQr] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { game: Game | null; ids: Partial<Record<Slot, string>> };
      setGame(parsed.game);
      setIds(parsed.ids ?? {});
      if (parsed.game) setStep(STEPS[parsed.game][0].id);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ game, ids }));
  }, [game, ids]);

  const picked = useMemo(() => {
    const out: SimItem[] = [];
    for (const id of Object.values(ids)) {
      const item = id ? byId[id] : undefined;
      if (item) out.push(item);
    }
    return out;
  }, [ids]);

  function covers(slot: Slot) {
    return picked.find((item) => item.slot === slot || item.also.includes(slot));
  }

  const brands = useMemo(() => {
    if (!game) return [];
    const names = new Set(STOCK.filter((item) => item.slot === step && (item.game === game || game === "farm" || item.slot === "screen")).map((item) => item.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [game, step]);

  const shown = useMemo(() => {
    if (!game) return [];
    const q = query.trim().toLowerCase();
    return STOCK.filter((item) => {
      if (item.slot !== step) return false;
      if (step === "screen") return true;
      if (game === "farm") {
        if (item.game !== "farm" && item.game !== "racing") return false;
        if (step === "farm" && item.game !== "farm") return false;
      } else if (item.game !== game) return false;
      if (!openBox && item.open) return false;
      if (!fitsLevel(item, level)) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "high") return b.price - a.price;
      if (sort === "rank") return rankOf(b) - rankOf(a);
      return a.price - b.price;
    });
  }, [game, step, query, brand, openBox, level, sort]);

  function choose(item: SimItem) {
    if (item.base === false && item.slot === "rim") {
      const wheel = ids.wheel ? byId[ids.wheel] : undefined;
      if (!wheel?.base) {
        setNotice(wheel ? "That kit already has a rim. You do not need another." : "Pick a wheel base first. A rim does not work alone.");
        return;
      }
    }
    const owner = covers(item.slot);
    if (owner && owner.slot !== item.slot && owner.also.includes(item.slot)) {
      setNotice("Already included. You do not need a second one.");
      return;
    }
    setIds((current) => {
      const next = { ...current };
      const incoming = new Set([item.slot, ...item.also]);
      for (const [slot, id] of Object.entries(next) as [Slot, string][]) {
        const other = byId[id];
        if (!other) continue;
        const slots = [other.slot, ...other.also];
        const clashes = slots.some((slotName) => incoming.has(slotName));
        const kitReplaced = item.slot === "wheel" && !item.base && other.slot === "rim";
        const baseReplaced = item.base && other.slot === "rim";
        if (clashes || kitReplaced || baseReplaced) delete next[slot];
      }
      next[item.slot] = item.id;
      return next;
    });
    setNotice(item.also.length ? "Added. The extra pieces in that kit are already counted." : "Added. You still have one.");
  }

  function remove(slot: Slot) {
    setIds((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
  }

  function pickGame(nextGame: Game, next?: { triple?: boolean; blurb?: string; title?: string }) {
    setGame(nextGame);
    setTriple(Boolean(next?.triple));
    setBlurb(next?.blurb ?? "");
    setTitle(next?.title ?? "");
    setStep(next?.triple ? TRIPLE[0].id : STEPS[nextGame][0].id);
    setIds({});
    setQuery("");
    setBrand("all");
    setNotice("");
  }

  const steps = game ? (triple ? TRIPLE : STEPS[game]) : [];
  const stepMeta = steps.find((item) => item.id === step) ?? steps[0];
  const included = stepMeta ? covers(stepMeta.id) : undefined;
  const blocked = Boolean(included && included.slot !== stepMeta?.id);
  const total = picked.reduce((sum, item) => sum + item.price, 0);
  const shelfText = listText(title || "Sim", picked.map((item) => partLine(item)));
  const pc = useMemo(() => {
    const floor = /Flight/.test(title) || triple ? 55 : 40;
    return PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && machineScore(part.name) >= floor).sort((a, b) => a.price - b.price)[0];
  }, [title, triple]);

  useEffect(() => {
    if (!cart || !picked.length) return;
    let stop = false;
    QRCode.toDataURL(shelfText, { margin: 1, width: 220 })
      .then((url) => {
        if (!stop) setQr(url);
      })
      .catch(() => setQr(""));
    return () => {
      stop = true;
    };
  }, [cart, shelfText, picked.length]);

  const phone = look === "phone";
  return (
    <div className={phone ? "text-[#1c1c1e]" : "mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg"}>
      {phone ? (
        <p className="mb-3 text-[15px] leading-snug text-[#8e8e93]">Forza, iRacing, a pilot seat, or a farm. Then the gear.</p>
      ) : (
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Build a sim</h1>
        <p className="mt-2 text-base text-muted">Forza, iRacing, a pilot seat, or a farm. Then the gear.</p>
      </header>
      )}
      {!game ? (
        <div className={phone ? "flex flex-col gap-3" : "flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"}>
          <p className="text-sm text-muted">Games</p>
          {TITLES.map((item) => (
            <button key={item.id} type="button" onClick={() => pickGame(item.rig, { triple: item.triple, blurb: item.pc, title: item.label })} className="press flex min-h-24 flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-5 py-4 text-left">
              <span className="font-display text-3xl font-medium tracking-tight">{item.label}</span>
              <span className="mt-2 text-base text-muted">{item.triple ? "Triple screens, a stand, and a wheel." : item.pc}</span>
            </button>
          ))}
          <p className="pt-2 text-sm text-muted">Or just the gear</p>
          {GAMES.map((item) => (
            <button key={item.id} type="button" onClick={() => pickGame(item.id)} className="press flex min-h-28 flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-5 py-4 text-left">
              <span className="font-display text-3xl font-medium tracking-tight">{item.label}</span>
              <span className="mt-2 text-base text-muted">{item.line}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-2 px-4 py-3">
            <label className="flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="shrink-0 text-sm text-muted">Rig</span>
              <select value={game} onChange={(event) => pickGame(event.target.value as Game)} className="h-full min-w-0 flex-1 bg-transparent text-base outline-none">
                {GAMES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
              <span className="shrink-0 text-sm text-muted">Part</span>
              <select
                value={step}
                onChange={(event) => {
                  setStep(event.target.value as Slot);
                  setBrand("all");
                  setQuery("");
                  setNotice("");
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
              >
                {steps.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={phone ? "space-y-3" : "min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4"}>
            {title ? <p className="text-base font-medium">{title}</p> : null}
            {blurb ? <p className="rounded-2xl border border-line bg-subtle px-4 py-3 text-base">{blurb}</p> : null}
            {pc ? <p className="rounded-2xl border border-line bg-elevated px-4 py-3 text-base">Computer for this: {pc.name}. {partMoney(pc.price)}. Score {machineScore(pc.name)}.</p> : null}
            <p className="text-base text-muted">{LEVELS.find((item) => item.id === level)?.line} {stepMeta?.line}</p>
            {notice ? <p className="rounded-2xl border border-line bg-elevated px-4 py-3 text-base">{notice}</p> : null}
            {blocked ? (
              <p className="rounded-2xl border border-line bg-subtle px-4 py-4 text-base">Included with {included?.name}. You do not buy it twice.</p>
            ) : (
              <>
                <label className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
                  <Search className="size-4 text-muted" strokeWidth={1.75} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-base outline-none" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((item) => (
                    <button key={item.id} type="button" onClick={() => setLevel(item.id)} className={`h-11 rounded-full border px-4 text-base ${level === item.id ? "border-accent bg-subtle" : "border-line"}`}>
                      {item.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setOpenBox((value) => !value)} className={`h-11 rounded-full border px-4 text-base ${openBox ? "border-accent bg-subtle" : "border-line"}`}>
                    {openBox ? "Open box on" : "Open box off"}
                  </button>
                  <button type="button" onClick={() => setSort("low")} className={`h-11 rounded-full border px-4 text-base ${sort === "low" ? "border-accent bg-subtle" : "border-line"}`}>Price low</button>
                  <button type="button" onClick={() => setSort("high")} className={`h-11 rounded-full border px-4 text-base ${sort === "high" ? "border-accent bg-subtle" : "border-line"}`}>Price high</button>
                  <button type="button" onClick={() => setSort("rank")} className={`h-11 rounded-full border px-4 text-base ${sort === "rank" ? "border-accent bg-subtle" : "border-line"}`}>Rating high</button>
                  <button type="button" onClick={() => setGrid((value) => !value)} className="h-11 rounded-full border border-line px-4 text-base">{grid ? "List" : "Grid"}</button>
                </div>
                <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-elevated px-3 text-base">
                  <option value="all">Every brand</option>
                  {brands.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ul className={grid ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
                  {shown.length === 0 ? <li className="rounded-2xl border border-line px-4 py-4 text-base">Nothing at this level. Try All.</li> : null}
                  {shown.map((item) => {
                    const selected = ids[item.slot] === item.id;
                    return (
                      <li key={item.id}>
                        <button type="button" onClick={() => choose(item)} className={`press flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-4 text-left ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-sm text-muted">
                              {item.brand}
                              {selected ? <Check className="size-4 text-accent" /> : null}
                            </span>
                            <span className="mt-1 block text-base font-medium leading-snug">{item.name}</span>
                            {item.also.length ? <span className="mt-1 block text-sm text-muted">Includes {item.also.join(", ")}</span> : null}
                            <span className="mt-1 block text-sm text-muted">{levelName(item)}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="tabular block text-base font-medium">{money(item.price)}</span>
                            {item.was ? <span className="block text-sm text-ok">Down {money(item.was - item.price)}</span> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </>
      )}
      <aside className="safe-bottom shrink-0 border-t border-line bg-elevated px-4 py-3">
        <button type="button" onClick={() => setCart((value) => !value)} className="flex w-full items-center justify-between text-left">
          <span className="text-base font-medium">{picked.length} {picked.length === 1 ? "thing" : "things"} · {money(total)}</span>
          <span className="text-sm">{cart ? "Close cart" : "Open cart"}</span>
        </button>
        {cart ? (
          <>
            <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto">
              {picked.length === 0 ? <li className="text-base text-muted">Nothing yet. Pick a game.</li> : null}
              {picked.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-base">{item.name}</span>
                  <button type="button" onClick={() => remove(item.slot)} aria-label="Remove" className="flex size-11 items-center justify-center rounded-full border border-line">
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {qr ? <img src={qr} alt="QR code for this sim list" className="mx-auto mt-2 size-36 rounded-xl bg-white p-2" /> : null}
            <CopyList title={title || "Sim"} names={picked.map((item) => partLine(item))} />
          </>
        ) : null}
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import raw from "@/data/sim.json";
import { ThemeToggle } from "@/lib/theme";

type Game = "racing" | "flight" | "farm" | "pads" | "consoles" | "extras";
type Level = "all" | "entry" | "novice" | "mid" | "pro" | "real";
type Slot = "seat" | "wheel" | "rim" | "pedals" | "shifter" | "brake" | "controls" | "throttle" | "rudder" | "farm" | "pad" | "console" | "headset" | "extra";

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
const KEY = "drew-sim";
const byId = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

const LEVELS: { id: Level; label: string; line: string; target: number }[] = [
  { id: "all", label: "All", line: "Every part for this step.", target: 0.5 },
  { id: "entry", label: "Entry", line: "The cheap start. It works.", target: 0 },
  { id: "novice", label: "Novice", line: "A step up from the cheapest.", target: 0.25 },
  { id: "mid", label: "Mid", line: "The normal pick.", target: 0.5 },
  { id: "pro", label: "Pro", line: "Serious gear.", target: 0.75 },
  { id: "real", label: "Real deal", line: "The top. It costs the most.", target: 1 },
];

const peersOf = new Map<string, number[]>();
for (const item of ITEMS) {
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
  { id: "racing", label: "Racing", line: "A seat, a wheel, and pedals. A shifter is optional." },
  { id: "flight", label: "Flying", line: "A stick or a yoke. A throttle and rudder pedals if you want them." },
  { id: "farm", label: "Farming", line: "A farm stick. Add a wheel if the game also drives a tractor." },
  { id: "pads", label: "Controllers", line: "One gamepad. Xbox, PlayStation, Switch, or PC." },
  { id: "consoles", label: "Consoles", line: "A Switch, a handheld, or a PlayStation Portal." },
  { id: "extras", label: "Extras", line: "A headset, a mount, a clutch add-on, or a button box." },
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

export function Sim({ onLeave }: { onLeave: () => void }) {
  const [game, setGame] = useState<Game | null>(null);
  const [step, setStep] = useState<Slot>("seat");
  const [ids, setIds] = useState<Partial<Record<Slot, string>>>({});
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [level, setLevel] = useState<Level>("all");
  const [notice, setNotice] = useState("");

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
    const names = new Set(ITEMS.filter((item) => item.slot === step && (item.game === game || game === "farm")).map((item) => item.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [game, step]);

  const shown = useMemo(() => {
    if (!game) return [];
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (item.slot !== step) return false;
      if (game === "farm") {
        if (item.game !== "farm" && item.game !== "racing") return false;
        if (step === "farm" && item.game !== "farm") return false;
      } else if (item.game !== game) return false;
      if (!openBox && item.open) return false;
      if (!fitsLevel(item, level)) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.price - b.price);
  }, [game, step, query, brand, openBox, level]);

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

  function pickGame(nextGame: Game) {
    if (nextGame === game) return;
    setGame(nextGame);
    setStep(STEPS[nextGame][0].id);
    setIds({});
    setQuery("");
    setBrand("all");
    setNotice("");
  }

  const steps = game ? STEPS[game] : [];
  const stepMeta = steps.find((item) => item.id === step) ?? steps[0];
  const included = stepMeta ? covers(stepMeta.id) : undefined;
  const blocked = Boolean(included && included.slot !== stepMeta?.id);
  const total = picked.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Build a sim</h1>
        <p className="mt-2 text-base text-muted">Racing, flying, or farming. Pick a level.</p>
      </header>
      {!game ? (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {GAMES.map((item) => (
            <button key={item.id} type="button" onClick={() => pickGame(item.id)} className="press flex min-h-28 flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-5 py-4 text-left">
              <span className="font-display text-3xl font-medium tracking-tight">{item.label}</span>
              <span className="mt-2 text-base text-muted">{item.line}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
            {GAMES.map((item) => (
              <button key={item.id} type="button" onClick={() => pickGame(item.id)} className={`h-12 shrink-0 rounded-full border px-4 text-base ${game === item.id ? "border-accent bg-subtle" : "border-line"}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3">
            {steps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStep(item.id);
                  setBrand("all");
                  setQuery("");
                  setNotice("");
                }}
                className={`h-12 shrink-0 rounded-full border px-4 text-base ${step === item.id ? "border-accent bg-subtle" : "border-line"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
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
                </div>
                <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-elevated px-3 text-base">
                  <option value="all">Every brand</option>
                  {brands.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ul className="flex flex-col gap-2">
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
        <p className="text-base font-medium">
          {picked.length} {picked.length === 1 ? "thing" : "things"} · {money(total)}
        </p>
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
      </aside>
    </div>
  );
}

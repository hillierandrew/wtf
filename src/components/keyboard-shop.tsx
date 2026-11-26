import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { FEEL_LABEL, KEYS, LAYOUT_LABEL, LIGHT_LABEL, money, type Feel, type FnRow, type KeyItem, type Layout, type Light, type Numpad, type Shelf } from "@/lib/keyboard";
import { ThemeToggle } from "@/lib/theme";

type Look = "paper" | "phone";
type Sort = "quiet" | "loud" | "low" | "high";
type View = "home" | "list";

type Preset = {
  id: string;
  title: string;
  line: string;
  shelf: Shelf | "sound";
  layout?: Layout;
  numpad?: Numpad;
  fn?: FnRow;
  light?: Light;
  feel?: Feel;
  band?: "soft";
  sort?: Sort;
  name?: RegExp;
};

const SHAPE: Preset[] = [
  { id: "boards", title: "All keyboards", line: "Every board on the shelf.", shelf: "board" },
  { id: "full", title: "Numpad on the right", line: "Full size and 96%. Function keys stay.", shelf: "board", numpad: "right" },
  { id: "no-numpad", title: "No number pad", line: "60, 65, 75, tenkeyless, and split.", shelf: "board", numpad: "none" },
  { id: "no-fn", title: "No function keys", line: "60% and 65%. The number row is the top row.", shelf: "board", fn: "no" },
  { id: "left", title: "Numpad on the left", line: "Southpaw. The pad sits on the left.", shelf: "board", numpad: "left" },
  { id: "tkl", title: "Tenkeyless", line: "Function keys, no numpad.", shelf: "board", layout: "tkl" },
  { id: "75", title: "75%", line: "Function keys, no numpad, shorter than tenkeyless.", shelf: "board", layout: "75" },
  { id: "96", title: "96%", line: "A compact board with the numpad on the right.", shelf: "board", layout: "96" },
  { id: "60", title: "60%", line: "No function keys. No numpad. No arrow cluster.", shelf: "board", layout: "60" },
  { id: "65", title: "65%", line: "No function keys. Arrows stay. No numpad.", shelf: "board", layout: "65" },
  { id: "split", title: "Split", line: "The board comes apart, or the halves are angled.", shelf: "board", layout: "split" },
];

const SOUND: Preset[] = [
  { id: "sound", title: "Quiet to loud", line: "Measured dB, then an estimate that adds the case.", shelf: "sound", sort: "quiet" },
  { id: "silent", title: "Silent switches", line: "The quiet end. A pad inside the stem.", shelf: "board", feel: "silent", sort: "quiet" },
  { id: "linear", title: "Linear", line: "Smooth. No bump.", shelf: "board", feel: "linear", sort: "quiet" },
  { id: "tactile", title: "Tactile", line: "A bump. A bit louder than linear.", shelf: "board", feel: "tactile", sort: "quiet" },
  { id: "clicky", title: "Clicky", line: "The loud end. A click on the way down.", shelf: "board", feel: "clicky", sort: "loud" },
  { id: "magnetic", title: "Magnetic", line: "Hall effect. Adjustable, close to a linear.", shelf: "board", feel: "magnetic", sort: "quiet" },
  { id: "optical", title: "Optical", line: "A light beam, not a metal contact.", shelf: "board", feel: "optical", sort: "quiet" },
  { id: "membrane", title: "Membrane", line: "Rubber dome. Office boards. Softer, not silent.", shelf: "board", feel: "membrane", sort: "quiet" },
];

const LIGHTS: Preset[] = [
  { id: "rgb", title: "RGB", line: "More than one colour.", shelf: "board", light: "rgb" },
  { id: "backlight", title: "Backlight, not RGB", line: "Lit, one colour.", shelf: "board", light: "backlight" },
  { id: "dark", title: "No backlight", line: "Nothing under the keys.", shelf: "board", light: "none" },
];

const PARTS: Preset[] = [
  { id: "switches", title: "Switches", line: "Loose packs, quiet to loud.", shelf: "switch", sort: "quiet" },
  { id: "keycaps", title: "Keycaps", line: "Sets and single artisan caps.", shelf: "keycap" },
  { id: "rests", title: "Wrist rests", line: "Sits in front of the board.", shelf: "rest" },
  { id: "extras", title: "Small parts", line: "Testers, knobs, brushes.", shelf: "extra" },
  { id: "combos", title: "Keyboard and mouse sets", line: "Both in one box.", shelf: "combo" },
  { id: "mice", title: "Mice", line: "On their own.", shelf: "mouse" },
  { id: "pads", title: "Mouse pads", line: "Under the mouse.", shelf: "pad" },
];

const CAPS: Preset[] = [
  { id: "pudding", title: "Pudding", line: "Clear sides, solid top. The light shows through the walls.", shelf: "keycap", name: /PUDDING/i },
  { id: "clearcaps", title: "Clear", line: "Transparent or crystal caps.", shelf: "keycap", name: /CLEAR|TRANSPARENT|CRYSTAL/i },
  { id: "shine", title: "Shine-through", line: "The legend lets the light out.", shelf: "keycap", name: /SHINE/i },
  { id: "pbt", title: "PBT", line: "The harder plastic. It stays less shiny.", shelf: "keycap", name: /\bPBT\b/i },
  { id: "abs", title: "ABS", line: "The smoother plastic.", shelf: "keycap", name: /\bABS\b/i },
];

const LOUD: Preset[] = [
  { id: "quiet", title: "Quiet", line: "Silent switches. The room stays quiet.", shelf: "board", feel: "silent", sort: "quiet" },
  { id: "soft", title: "Soft", line: "Smooth and light. Linear or a rubber dome. No click.", shelf: "board", band: "soft", sort: "quiet" },
  { id: "loud", title: "Loud", line: "Clicky. You hear every key.", shelf: "board", feel: "clicky", sort: "loud" },
];

const GROUPS: { title: string; items: Preset[] }[] = [
  { title: "Sound", items: SOUND },
  { title: "Shape", items: SHAPE },
  { title: "Light", items: LIGHTS },
  { title: "Parts", items: PARTS },
  { title: "Keycaps", items: CAPS },
];

function matches(item: KeyItem, preset: Preset) {
  if (preset.band === "soft") {
    if (item.shelf !== "board" && item.shelf !== "switch") return false;
    return item.feel === "linear" || item.feel === "membrane" || item.feel === "low" || item.feel === "silent";
  }
  if (preset.shelf === "sound") return item.shelf === "board" || item.shelf === "switch";
  if (item.shelf !== preset.shelf) return false;
  if (preset.layout && item.layout !== preset.layout) return false;
  if (preset.numpad && item.numpad !== preset.numpad) return false;
  if (preset.fn && item.fn !== preset.fn) return false;
  if (preset.light && item.light !== preset.light) return false;
  if (preset.feel && item.feel !== preset.feel) return false;
  if (preset.name && !preset.name.test(`${item.brand} ${item.name}`)) return false;
  return true;
}

function meta(item: KeyItem) {
  const bits: string[] = [];
  if (item.shelf === "board" || item.shelf === "combo") {
    bits.push(LAYOUT_LABEL[item.layout]);
    bits.push(LIGHT_LABEL[item.light]);
  }
  if (item.shelf === "board" || item.shelf === "combo" || item.shelf === "switch") bits.push(FEEL_LABEL[item.feel]);
  if (item.french) bits.push("French");
  if (item.open) bits.push("Open box");
  return bits.filter(Boolean).join(" · ");
}

function SoundMeter({ item, phone }: { item: KeyItem; phone: boolean }) {
  if (item.measured == null && item.estimated == null) return null;
  const value = item.estimated ?? item.measured ?? 50;
  const width = Math.min(100, Math.max(8, ((value - 35) / 37) * 100));
  return (
    <span className="mt-2 block">
      <span className="block text-sm text-[#c4b5fd]">
        {item.measured != null ? `Measured ${item.measured} dB` : "No measured dB"}
        {item.estimated != null ? ` · Estimated ${item.estimated} dB` : ""}
      </span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#2a1240]">
        <span className="block h-full rounded-full bg-[#a855f7]" style={{ width: `${width}%` }} />
      </span>
    </span>
  );
}

export function KeyboardShop({ look, onLeave }: { look: Look; onLeave?: () => void }) {
  const phone = look === "phone";
  const [view, setView] = useState<View>("home");
  const [preset, setPreset] = useState<Preset>(SHAPE[0]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("quiet");
  const [layout, setLayout] = useState<Layout | "any">("any");
  const [numpad, setNumpad] = useState<Numpad | "any">("any");
  const [fn, setFn] = useState<FnRow | "any">("any");
  const [light, setLight] = useState<Light | "any">("any");
  const [feel, setFeel] = useState<Feel | "any">("any");
  const [openBox, setOpenBox] = useState(true);
  const [limit, setLimit] = useState(24);
  const [openId, setOpenId] = useState<string | null>(null);

  function openPreset(next: Preset) {
    setPreset(next);
    setQuery("");
    setSort(next.sort ?? (next.shelf === "sound" || next.shelf === "switch" ? "quiet" : "low"));
    setLayout(next.layout ?? "any");
    setNumpad(next.numpad ?? "any");
    setFn(next.fn ?? "any");
    setLight(next.light ?? "any");
    setFeel(next.feel ?? "any");
    setLimit(24);
    setOpenId(null);
    setView("list");
  }

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const group of GROUPS) {
      for (const item of group.items) out[item.id] = KEYS.filter((row) => matches(row, item)).length;
    }
    return out;
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = KEYS.filter((item) => {
      if (!matches(item, preset)) return false;
      if (!openBox && item.open) return false;
      if (layout !== "any" && item.layout !== layout) return false;
      if (numpad !== "any" && item.numpad !== numpad) return false;
      if (fn !== "any" && item.fn !== fn) return false;
      if (light !== "any" && item.light !== light) return false;
      if (feel !== "any" && item.feel !== feel) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "high") return b.price - a.price;
      if (sort === "low") return a.price - b.price;
      const ae = a.estimated ?? (sort === "quiet" ? 99 : -1);
      const be = b.estimated ?? (sort === "quiet" ? 99 : -1);
      if (ae !== be) return sort === "quiet" ? ae - be : be - ae;
      return a.price - b.price;
    });
    return rows;
  }, [preset, query, sort, layout, numpad, fn, light, feel, openBox]);

  const tunable = preset.shelf === "board" || preset.shelf === "sound" || preset.shelf === "combo";
  const card = "rounded-2xl border border-[#5b21b6] bg-[#140818] text-[#f6edff]";
  const chip = (on: boolean) => `h-11 rounded-full px-3 text-sm ${on ? "bg-[#7c3aed] text-white" : "bg-[#241033] text-[#f3e8ff]"}`;

  const home = (
    <div className="space-y-6">
      <p className="px-1 text-[15px] leading-snug text-[#c4b5fd]">
        Pick how it sounds first. Quiet is silent. Soft is smooth, with no click. Loud is clicky. Measured is a typical decibel number for that switch. Estimated adds the case.
      </p>
      <div className="grid gap-2">
        {LOUD.map((item) => (
          <button key={item.id} type="button" onClick={() => openPreset(item)} className={`press flex min-h-20 flex-col items-start justify-center px-4 py-3 text-left ${card}`}>
            <span className="text-[22px] font-medium leading-none">{item.title}</span>
            <span className="mt-2 block text-[14px] text-[#c4b5fd]">
              {counts[item.id] ?? KEYS.filter((row) => matches(row, item)).length} · {item.line}
            </span>
          </button>
        ))}
      </div>
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#c4b5fd]">{group.title}</h2>
          <div className="overflow-hidden rounded-2xl border border-[#5b21b6] bg-[#140818]">
            {group.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openPreset(item)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#241033] ${index ? "border-t border-[#3b1760]" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] text-[#c4b5fd]">
                    {counts[item.id]} · {item.line}
                  </span>
                </span>
                <ChevronLeft className="size-4 rotate-180 text-[#a78bfa]" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  const list = (
    <div>
      <button type="button" onClick={() => setView("home")} className="mb-3 flex items-center gap-1 text-[17px] text-[#c4b5fd]">
        <ChevronLeft className="size-5" strokeWidth={2.25} />
        Keyboards
      </button>
      <h2 className={phone ? "text-[28px] font-bold leading-none tracking-tight" : "font-display text-3xl font-medium leading-none tracking-tight"}>{preset.title}</h2>
      <p className="mt-2 text-[15px] leading-snug text-[#c4b5fd]">{preset.line}</p>
      <label className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-[#241033] px-3">
        <Search className="size-4 text-[#c4b5fd]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-[16px] outline-none" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["quiet", "Quiet to loud"],
            ["loud", "Loud to quiet"],
            ["low", "Price, low"],
            ["high", "Price, high"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSort(id)} className={chip(sort === id)}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setOpenBox((value) => !value)} className={chip(!openBox)}>
          {openBox ? "Open box shown" : "Open box hidden"}
        </button>
      </div>
      {tunable ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "Any numpad"],
                ["right", "Numpad right"],
                ["none", "No numpad"],
                ["left", "Numpad left"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setNumpad(id)} className={chip(numpad === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "Any function keys"],
                ["yes", "Function keys"],
                ["no", "No function keys"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFn(id)} className={chip(fn === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "Any light"],
                ["rgb", "RGB"],
                ["backlight", "Backlight"],
                ["none", "No backlight"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setLight(id)} className={chip(light === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "Any switch"],
                ["silent", "Silent"],
                ["linear", "Linear"],
                ["tactile", "Tactile"],
                ["clicky", "Clicky"],
                ["magnetic", "Magnetic"],
                ["membrane", "Membrane"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFeel(id)} className={chip(feel === id)}>
                {label}
              </button>
            ))}
          </div>
          <label className="flex h-11 items-center gap-2 rounded-xl bg-[#241033] px-3">
            <span className="shrink-0 text-[13px] text-[#c4b5fd]">Size</span>
            <select value={layout} onChange={(event) => setLayout(event.target.value as Layout | "any")} className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none">
              <option value="any">Any size</option>
              {(Object.keys(LAYOUT_LABEL) as Layout[]).map((id) => (
                <option key={id} value={id}>
                  {LAYOUT_LABEL[id]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <p className="mt-3 text-[13px] text-[#c4b5fd]">{shown.length} shown</p>
      {shown.length === 0 ? <p className={`mt-3 px-4 py-8 text-center text-[17px] text-[#c4b5fd] ${card}`}>Nothing in this list.</p> : null}
      <ul className={`mt-2 overflow-hidden ${card}`}>
        {shown.slice(0, limit).map((item, index) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className={index ? "border-t border-[#3b1760]" : ""}>
              <button type="button" onClick={() => setOpenId(open ? null : item.id)} className="flex w-full items-start gap-3 px-3 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium uppercase tracking-wide text-[#c4b5fd]">{item.brand}</span>
                  <span className="mt-0.5 block text-[16px] font-medium leading-snug">{item.name}</span>
                  <span className="mt-1 block text-[13px] text-[#c4b5fd]">{meta(item)}</span>
                  <SoundMeter item={item} phone={phone} />
                  {open ? <span className="mt-2 block text-[14px] leading-snug text-[#f6edff]">{item.sound}</span> : null}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[16px] font-semibold">{money(item.price)}</span>
                  {item.was ? <span className="block text-[12px] text-[#ff3b30] line-through">{money(item.was)}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {shown.length > limit ? (
        <button type="button" onClick={() => setLimit((value) => value + 24)} className={`mt-3 h-11 w-full text-[17px] font-medium text-[#c4b5fd] ${card}`}>
          Show more
        </button>
      ) : null}
    </div>
  );

  if (phone) return view === "home" ? home : list;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-black text-[#f6edff]">
      <header className="safe-top shrink-0 border-b border-[#3b1760] px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-[#c4b5fd]">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Keyboards</h1>
        <p className="mt-2 text-base text-[#c4b5fd]">Shape, sound, switches, and keycaps.</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{view === "home" ? home : list}</div>
    </div>
  );
}

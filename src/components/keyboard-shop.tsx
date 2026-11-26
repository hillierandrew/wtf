import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { FEEL_LABEL, KEYS, LAYOUT_LABEL, LIGHT_LABEL, money, type Feel, type FnRow, type KeyItem, type Layout, type Light, type Numpad, type Shelf } from "@/lib/keyboard";
import { latest, usePath } from "@/components/history";
import { AddButton } from "@/components/bag";
import { keyBag } from "@/lib/bag";

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
  who?: "feel" | "grandma";
  max?: number;
};

const DOORS: Preset[] = [
  { id: "feel-board", title: "Best mechanical", line: "A real switch, not a rubber dome. Quiet enough to live with. For someone who feels every key.", shelf: "board", who: "feel", sort: "quiet" },
  { id: "grandma-board", title: "Grandma's board", line: "Cheap, quiet, and already finished. Full size if we have it.", shelf: "board", who: "grandma", sort: "low", max: 80 },
  { id: "boards", title: "Finished keyboards", line: "A board that is already built. Switches are in it.", shelf: "board", sort: "quiet" },
  { id: "switches", title: "Switches only", line: "Loose switches. No board in the box.", shelf: "switch", sort: "quiet" },
  { id: "keycaps", title: "Keycaps only", line: "The caps. Not the board, not the switches.", shelf: "keycap" },
];

const ENTHUSIAST: { title: string; items: Preset[] }[] = [
  {
    title: "Sound",
    items: [
      { id: "sound", title: "Quiet to loud", line: "Every board and switch, sorted by decibels.", shelf: "sound", sort: "quiet" },
      { id: "silent", title: "Silent", line: "A pad in the stem. The quiet end.", shelf: "sound", feel: "silent", sort: "quiet" },
      { id: "linear", title: "Linear", line: "Smooth. No bump. No click.", shelf: "sound", feel: "linear", sort: "quiet" },
      { id: "tactile", title: "Tactile", line: "A bump. No click.", shelf: "sound", feel: "tactile", sort: "quiet" },
      { id: "clicky", title: "Clicky", line: "A click you can hear.", shelf: "sound", feel: "clicky", sort: "loud" },
    ],
  },
  {
    title: "Size",
    items: [
      { id: "60", title: "Tiny, 60%", line: "No function keys. No number pad.", shelf: "board", layout: "60" },
      { id: "65", title: "65%", line: "No function keys. Arrows stay.", shelf: "board", layout: "65" },
      { id: "75", title: "75%", line: "Function keys. No number pad.", shelf: "board", layout: "75" },
      { id: "tkl", title: "Tenkeyless", line: "Function keys. No number pad.", shelf: "board", layout: "tkl" },
      { id: "no-numpad", title: "No number pad", line: "Any small board without a pad.", shelf: "board", numpad: "none" },
      { id: "full", title: "Big, numpad right", line: "Full size. The pad is on the right.", shelf: "board", numpad: "right" },
      { id: "left", title: "Numpad on the left", line: "Southpaw.", shelf: "board", numpad: "left" },
      { id: "no-fn", title: "No function keys", line: "The number row is the top row.", shelf: "board", fn: "no" },
    ],
  },
  {
    title: "Light",
    items: [
      { id: "rgb", title: "RGB", line: "More than one colour.", shelf: "board", light: "rgb" },
      { id: "backlight", title: "Backlight", line: "Lit, one colour.", shelf: "board", light: "backlight" },
      { id: "dark", title: "No backlight", line: "Nothing under the keys.", shelf: "board", light: "none" },
    ],
  },
  {
    title: "Keycaps",
    items: [
      { id: "pudding", title: "Pudding", line: "Clear sides. Solid top.", shelf: "keycap", name: /PUDDING/i },
      { id: "clearcaps", title: "Clear", line: "Transparent or crystal.", shelf: "keycap", name: /CLEAR|TRANSPARENT|CRYSTAL/i },
      { id: "shine", title: "Shine-through", line: "The letter lets the light out.", shelf: "keycap", name: /SHINE/i },
      { id: "pbt", title: "PBT", line: "Harder plastic. Stays less shiny.", shelf: "keycap", name: /\bPBT\b/i },
      { id: "abs", title: "ABS", line: "Smoother plastic.", shelf: "keycap", name: /\bABS\b/i },
    ],
  },
];

function matches(item: KeyItem, preset: Preset) {
  if (preset.shelf === "sound") {
    if (item.shelf !== "board" && item.shelf !== "switch") return false;
  } else if (item.shelf !== preset.shelf) return false;
  if (preset.layout && item.layout !== preset.layout) return false;
  if (preset.numpad && item.numpad !== preset.numpad) return false;
  if (preset.fn && item.fn !== preset.fn) return false;
  if (preset.light && item.light !== preset.light) return false;
  if (preset.feel && item.feel !== preset.feel) return false;
  if (preset.name && !preset.name.test(`${item.brand} ${item.name}`)) return false;
  if (preset.max && item.price > preset.max) return false;
  if (preset.who === "feel") {
    if (!["linear", "tactile", "silent", "magnetic"].includes(item.feel)) return false;
  }
  if (preset.who === "grandma") {
    if (item.feel !== "membrane" && item.feel !== "silent" && item.feel !== "low") return false;
  }
  return true;
}

function touchOf(feel: Feel) {
  if (feel === "linear" || feel === "silent" || feel === "magnetic" || feel === "optical") return "Smooth. No bump.";
  if (feel === "tactile") return "A bump under the finger.";
  if (feel === "clicky") return "A bump, then a hard bottom.";
  if (feel === "membrane") return "Soft rubber. The whole key gives.";
  if (feel === "low") return "Short travel. The finger does not go far.";
  if (feel === "bare") return "No switch in the box.";
  return "Touch is not listed.";
}

function clickOf(feel: Feel) {
  if (feel === "clicky") return "Sharp click. You hear it.";
  if (feel === "tactile") return "Bump only. No click.";
  if (feel === "silent") return "No click. A pad kills the sound.";
  if (feel === "membrane") return "A soft thud, not a click.";
  if (feel === "bare") return "No click yet.";
  if (feel === "unknown") return "Click is not listed.";
  return "No click.";
}

function dbLine(item: KeyItem) {
  if (item.shelf === "keycap") return "Keycaps do not make the sound. The switch under them does.";
  if (item.measured == null && item.estimated == null) return "No decibel number for this one.";
  const where = item.shelf === "switch" ? "This is a loose switch." : "This is a finished keyboard.";
  const measured = item.measured != null ? `Measured ${item.measured} dB at the switch.` : "No measured number for this switch.";
  const estimated = item.estimated != null ? `About ${item.estimated} dB once it is in a case.` : "";
  const band = item.estimated == null ? "" : item.estimated < 45 ? "That is quiet, near a library." : item.estimated < 55 ? "That is a normal room." : item.estimated < 64 ? "That is loud enough to notice." : "That is very loud. A conversation is about 60 dB.";
  return [where, measured, estimated, band].filter(Boolean).join(" ");
}

function keyTags(item: KeyItem) {
  const hot = /hot-?swap|hotswap/i.test(item.name);
  const fixed = item.feel === "optical" || item.feel === "membrane" || item.feel === "magnetic" || /solder|proprietary|huntsman|omnipoint/i.test(item.name);
  const tags: { label: string; className: string }[] = [];
  if (item.feel === "linear") tags.push({ label: "Linear", className: "text-sky-800" });
  if (item.feel === "tactile") tags.push({ label: "Tactile", className: "text-amber-900" });
  if (item.feel === "clicky") tags.push({ label: "Clicky", className: "text-red-800" });
  if (item.feel === "silent") tags.push({ label: "Silent", className: "text-emerald-800" });
  if (item.feel === "magnetic") tags.push({ label: "Magnetic", className: "text-teal-800" });
  if (item.feel === "optical") tags.push({ label: "Optical", className: "text-orange-800" });
  if (item.feel === "membrane") tags.push({ label: "Membrane", className: "text-stone-600" });
  if ((item.shelf === "board" || item.shelf === "switch") && item.feel !== "membrane" && item.feel !== "unknown" && item.feel !== "bare") tags.push({ label: "Mechanical", className: "text-sky-950" });
  if (hot) tags.push({ label: "Hot-swap", className: "text-green-800" });
  else if (fixed) tags.push({ label: "Fixed switches", className: "text-rose-900" });
  if (item.light === "none") tags.push({ label: "No backlight", className: "text-stone-700" });
  if (item.light === "rgb" || item.light === "backlight") tags.push({ label: "Backlit", className: "text-blue-800" });
  return tags;
}

function story(item: KeyItem) {
  const hot = /hot-?swap|hotswap/i.test(item.name);
  const fixed = item.feel === "optical" || item.feel === "membrane" || /solder|proprietary|huntsman/i.test(item.name);
  const swap = hot
    ? "The switches pull out. You can change the feel later without a soldering iron."
    : fixed
      ? "The switches stay in. This feel is permanent. Do not promise a different switch later."
      : "The box does not say if the switches come out. Ask before you promise a swap.";
  return `${swap} Touch: ${touchOf(item.feel)} Click: ${clickOf(item.feel)} ${dbLine(item)}`;
}

export function KeyboardShop({ onLeave }: { look?: Look; onLeave?: () => void }) {
  const [view, setView] = useState<View>("home");
  const [preset, setPreset] = useState<Preset>(DOORS[0]);
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
  const path = usePath();

  useEffect(() => {
    if (!path) return;
    const id = latest(path.log, path.at, (item) => item.startsWith("key-"));
    if (!id) {
      setView("home");
      return;
    }
    const found = [...DOORS, ...ENTHUSIAST.flatMap((group) => group.items)].find((item) => `key-${item.id}` === id);
    if (found) openPreset(found);
  }, [path?.at]);

  function openPreset(next: Preset) {
    setPreset(next);
    setQuery("");
    setSort(next.sort ?? "low");
    setLayout(next.layout ?? "any");
    setNumpad(next.numpad ?? "any");
    setFn(next.fn ?? "any");
    setLight(next.light ?? "any");
    setFeel(next.feel ?? "any");
    setLimit(24);
    setOpenId(null);
    setView("list");
    path?.note(`key-${next.id}`, next.title);
  }

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of [...DOORS, ...ENTHUSIAST.flatMap((group) => group.items)]) out[item.id] = KEYS.filter((row) => matches(row, item)).length;
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

  const boards = preset.shelf === "board" || preset.shelf === "sound" || preset.shelf === "combo";

  function chip(on: boolean) {
    return `min-h-11 rounded-full border px-3 text-sm ${on ? "border-[#161616] bg-[#161616] text-white" : "border-[#ccc] bg-white text-[#161616]"}`;
  }

  function pick<T extends string>(current: T, value: T, empty: T, set: (next: T) => void) {
    set(current === value ? empty : value);
  }

  const home = (
    <div className="space-y-6 pb-8">
      <p className="text-[16px] leading-snug text-[#333]">Three shelves. A finished keyboard, switches on their own, or keycaps on their own.</p>
      <div className="grid gap-2">
        {DOORS.map((item) => (
          <button key={item.id} type="button" onClick={() => openPreset(item)} className="min-h-24 rounded-2xl border border-[#161616] bg-white px-4 py-3 text-left">
            <span className="block text-[24px] font-medium leading-none">{item.title}</span>
            <span className="mt-2 block text-[15px] text-[#333]">{counts[item.id]} on the shelf. {item.line}</span>
          </button>
        ))}
      </div>
      {ENTHUSIAST.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#333]">Enthusiast · {group.title}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <button key={item.id} type="button" onClick={() => openPreset(item)} className="min-h-16 rounded-2xl border border-[#ddd] bg-white px-3 py-3 text-left">
                <span className="block text-[17px] font-medium">{item.title}</span>
                <span className="mt-1 block text-[13px] text-[#333]">{counts[item.id]} · {item.line}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  const list = (
    <div className="pb-10">
      <h2 className="text-[28px] font-semibold leading-none">{preset.title}</h2>
      <p className="mt-2 text-[15px] leading-snug text-[#333]">{preset.line}</p>
      <label className="mt-3 flex h-12 items-center gap-2 rounded-xl border border-[#ccc] bg-white px-3">
        <Search className="size-4 text-[#333]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this shelf" className="h-full w-full bg-white text-[16px] text-[#161616] outline-none" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["quiet", "Quiet first"],
            ["loud", "Loud first"],
            ["low", "Cheapest"],
            ["high", "Dearest"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(sort === id ? "low" : id)} className={chip(sort === id)}>
            {label}
          </button>
        ))}
        <button type="button" aria-pressed={!openBox} onClick={() => setOpenBox((value) => !value)} className={chip(!openBox)}>
          {openBox ? "Hide open box" : "Open box hidden"}
        </button>
      </div>
      {boards ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["right", "Numpad right"],
                ["none", "No numpad"],
                ["left", "Numpad left"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={numpad === id} onClick={() => pick(numpad, id, "any", setNumpad)} className={chip(numpad === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["yes", "Function keys"],
                ["no", "No function keys"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={fn === id} onClick={() => pick(fn, id, "any", setFn)} className={chip(fn === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["rgb", "RGB"],
                ["backlight", "Backlight"],
                ["none", "No light"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={light === id} onClick={() => pick(light, id, "any", setLight)} className={chip(light === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["silent", "Silent"],
                ["linear", "Linear"],
                ["tactile", "Tactile"],
                ["clicky", "Clicky"],
                ["magnetic", "Magnetic"],
                ["membrane", "Membrane"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={feel === id} onClick={() => pick(feel, id, "any", setFeel)} className={chip(feel === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["60", "65", "75", "tkl", "96", "full", "split", "numpad-left"] as Layout[]).map((id) => (
              <button key={id} type="button" aria-pressed={layout === id} onClick={() => pick(layout, id, "any", setLayout)} className={chip(layout === id)}>
                {LAYOUT_LABEL[id].split("·")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-[13px] text-[#333]">{shown.length} shown. Tap a filter again to turn it off.</p>
      {shown.length === 0 ? <p className="mt-3 rounded-2xl border border-[#ccc] bg-white px-4 py-8 text-center text-[17px]">Nothing matches. Turn a filter off.</p> : null}
      <ul className="mt-2 space-y-2">
        {shown.slice(0, limit).map((item) => {
          const open = openId === item.id;
          const heard = item.shelf === "board" || item.shelf === "switch" || item.shelf === "combo";
          return (
            <li key={item.id}>
              <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)} className="w-full rounded-2xl border border-[#ddd] bg-white px-3 py-3 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium uppercase tracking-wide text-[#555]">{item.brand}</span>
                    <span className="mt-0.5 block text-[16px] font-medium leading-snug text-[#161616]">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-right text-[16px] font-semibold text-[#161616]">{money(item.price)}</span>
                </span>
                <span className="mt-2 block text-[13px] text-[#333]">
                  {item.shelf === "board" || item.shelf === "combo" ? `${LAYOUT_LABEL[item.layout]} · ${LIGHT_LABEL[item.light]} · ` : ""}
                  {heard ? FEEL_LABEL[item.feel] : "Keycaps"}
                  {item.light === "none" ? " · No backlight" : item.light === "rgb" || item.light === "backlight" ? " · Backlit" : ""}
                  {item.open ? " · Open box" : ""}
                </span>
                <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  {keyTags(item).map((tag) => (
                    <span key={tag.label} className={`text-[13px] font-semibold ${tag.className}`}>{tag.label}</span>
                  ))}
                </span>
                <span className="mt-2 block text-[14px] leading-snug text-[#333]">{open ? story(item) : "More detail"}</span>
                {open ? <span className="mt-2 block text-[14px] leading-snug text-[#161616]">{item.sound || "That is the whole note on this one."}</span> : null}
              </button>
              <AddButton line={keyBag(item, `Keyboard shop. ${item.feel}. Budget ${money(item.price)}. ${item.estimated ? `About ${item.estimated} dB.` : "No dB on this one."}`)} className="mt-2 h-11 w-full rounded-full border border-[#ccc] bg-white text-sm" />
            </li>
          );
        })}
      </ul>
      {shown.length > limit ? (
        <button type="button" onClick={() => setLimit((value) => value + 24)} className="mt-3 h-12 w-full rounded-2xl border border-[#161616] bg-white text-[16px] font-medium">
          Show more
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="flex h-dvh w-full flex-col bg-[#f6f3ee] text-[#161616]">
      <header className="shrink-0 border-b border-black/10 bg-[#f6f3ee] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (view === "list" ? setView("home") : onLeave?.())}
            className="flex h-11 items-center gap-1 rounded-full border border-[#161616] bg-white px-3 text-[16px] text-[#161616]"
          >
            <ChevronLeft className="size-5" />
            {view === "list" ? "Shelves" : "Back"}
          </button>
          <p className="text-[15px] font-medium">Keyboard store</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{view === "home" ? home : list}</div>
    </div>
  );
}

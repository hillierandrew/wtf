import raw from "@/data/keyboards-mice.json";

export type Shelf = "board" | "switch" | "keycap" | "mouse" | "pad" | "combo" | "rest" | "extra";
export type Layout = "60" | "65" | "75" | "tkl" | "96" | "full" | "split" | "numpad-left" | "numpad" | "other";
export type Numpad = "none" | "right" | "left" | "only" | "unknown";
export type FnRow = "yes" | "no" | "unknown";
export type Light = "rgb" | "backlight" | "none" | "unknown";
export type Feel = "silent" | "linear" | "tactile" | "clicky" | "magnetic" | "optical" | "membrane" | "low" | "bare" | "unknown";

type Row = {
  id: string;
  name: string;
  price: number;
  was?: number | null;
  member?: number | null;
  brand?: string;
  kind?: string;
  open?: boolean;
};

export type KeyItem = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  member: number | null;
  brand: string;
  open: boolean;
  shelf: Shelf;
  layout: Layout;
  numpad: Numpad;
  fn: FnRow;
  light: Light;
  feel: Feel;
  french: boolean;
  /** Typical measured class for this switch, dB. Not a test of this unit. */
  measured: number | null;
  /** Same class, plus the case. */
  estimated: number | null;
  sound: string;
};

const FEEL_DB: Record<string, [number, number]> = {
  silent: [40, 43],
  linear: [49, 53],
  tactile: [54, 58],
  clicky: [65, 69],
  magnetic: [51, 55],
  optical: [50, 54],
  membrane: [44, 47],
  low: [46, 49],
};

export const LAYOUT_LABEL: Record<Layout, string> = {
  "60": "60% · no function keys · no numpad",
  "65": "65% · no function keys · no numpad",
  "75": "75% · function keys · no numpad",
  tkl: "Tenkeyless · no numpad",
  "96": "96% · numpad on the right",
  full: "Full size · numpad on the right",
  split: "Split",
  "numpad-left": "Numpad on the left",
  numpad: "Numpad only",
  other: "Size not listed",
};

export const FEEL_LABEL: Record<Feel, string> = {
  silent: "Silent",
  linear: "Linear",
  tactile: "Tactile",
  clicky: "Clicky",
  magnetic: "Magnetic",
  optical: "Optical",
  membrane: "Membrane",
  low: "Low profile",
  bare: "No switch in the box",
  unknown: "Switch not listed",
};

export const LIGHT_LABEL: Record<Light, string> = {
  rgb: "RGB",
  backlight: "Backlight, not RGB",
  none: "No backlight",
  unknown: "Light not listed",
};

export function brandLabel(brand: string) {
  if (/^hello kitty$/i.test(brand)) return "Hello Kitty";
  return brand;
}

function layoutOf(name: string, kind: string): Layout {
  const n = name.toLowerCase();
  if (/southpaw|numpad on the left|\bq12\b|\bv12\b/.test(n)) return "numpad-left";
  if (/split|falcata|\balice\b|\bq10\b|\bv10\b/.test(n)) return "split";
  if (/numpad only|\bq0\b/.test(n)) return "numpad";
  if (/\b60%|\b61 keys?\b|\b62 keys?\b|\b63 keys?\b|\b64 keys?\b|edge60|origins 60/.test(n)) return "60";
  if (/\b65%|muse65|\bal65\b|nano68/.test(n)) return "65";
  if (/\b75%|\bek75\b|\bb75\b|\bmod007\b|\b84 keys\b|\b81 keys\b|\b84\b|\b81\b|lite84|\br75\b|\bek81\b|\bq1\b|\bm1 v5\b/.test(n)) return "75";
  if (/\b80%|tenkeyless|ten-key-less|ten key less|\btkl\b|\b87 keys?\b/.test(n)) return "tkl";
  if (/\b96%|\b98%|\bc98\b|\b96 keys\b|\bk99\b|\b5098\b|1800/.test(n)) return "96";
  if (/full[\s-]?size|\b100%|\b104 keys?\b|\b108 keys?\b|\b105 keys?\b/.test(n)) return "full";
  if (/\b68 keys?\b/.test(n)) return "65";
  if (/\bmini\b/.test(n)) return "60";
  if (/\b75\b/.test(n)) return "75";
  if (/falchion|\bk65\b|\bq2\b/.test(n)) return "65";
  if (/blackwidow|\bk70\b|\bk100\b|\bg413\b|\bg815\b|\bg915\b|\bg213\b|\bg513\b|\bk120\b|alloy core|scope ii|strafe|cynosa|ornata|strike 4|\bk580\b|fidd|typewriter|apex pro|dark mount|light mount|\bq6\b|\bv6\b/.test(n)) return "full";
  if (kind === "keyboard-office" || kind === "french" || kind === "combo-office") return "full";
  return "other";
}

function numpadOf(layout: Layout): Numpad {
  if (layout === "full" || layout === "96") return "right";
  if (layout === "numpad-left") return "left";
  if (layout === "numpad") return "only";
  if (layout === "other") return "unknown";
  return "none";
}

function fnOf(layout: Layout): FnRow {
  if (layout === "60" || layout === "65" || layout === "numpad") return "no";
  if (layout === "other") return "unknown";
  return "yes";
}

function lightOf(name: string, kind: string): Light {
  const n = name.toLowerCase();
  if (/no backlight|non-backlit|unlit|without light/.test(n)) return "none";
  if (/non-?rgb|no rgb|without rgb/.test(n)) return "backlight";
  if (/rgb|argb|rainbow|lightsync|chroma|azoth/.test(n)) return "rgb";
  if (/backlit|backlight/.test(n)) return "backlight";
  if (kind === "keyboard-office" || kind === "combo-office" || kind === "french" || /membrane|\bk120\b/.test(n)) return "none";
  if ((kind === "keyboard-gaming" || kind === "combo-gaming") && /razer|corsair|steelseries|asus|rog |logitech g|hyperx|msi|gravastar/.test(n)) return "rgb";
  return "unknown";
}

function feelOf(name: string, kind: string): Feel {
  const n = name.toLowerCase();
  if (/no switch included|barebone|bare bone/.test(n)) return "bare";
  if (/silent/.test(n)) return "silent";
  if (/clicky|blue switch|mx blue/.test(n)) return "clicky";
  if (/tactile|brown switch|lavender|banana|mako|\bfox switch\b|aqua/.test(n)) return "tactile";
  if (/linear|red switch|yellow switch|oil king|lynx|sea salt|baby raco{1,2}n|\bmint\b|milk v2|nx snow|snow switch|cocoa cream/.test(n)) return "linear";
  if (/magnetic|hall effect|\bhe\b|hfx|magneto|apex pro|omnipoint|double-rail/.test(n)) return "magnetic";
  if (/optical|huntsman/.test(n)) return "optical";
  if (/low[\s-]?profile/.test(n)) return "low";
  if (/membrane/.test(n) || kind === "keyboard-office" || kind === "combo-office" || kind === "french") return "membrane";
  if (/blackwidow/.test(n)) return "clicky";
  return "unknown";
}

function soundOf(name: string, feel: Feel) {
  const n = name.toLowerCase();
  if (feel === "bare") return { measured: null, estimated: null, sound: "No switch in the box, so no sound yet." };
  let measured: number | null = null;
  let estimated: number | null = null;
  const pair = FEEL_DB[feel];
  if (pair) {
    measured = pair[0];
    estimated = pair[1];
  }
  if (/oil king/.test(n)) {
    measured = 55;
    estimated = 58;
  } else if (/silent k pro switch - red|silent red/.test(n)) {
    measured = 39;
    estimated = 41;
  } else if (/silent.*brown|silent k pro switch - brown/.test(n)) {
    measured = 42;
    estimated = 45;
  }
  if (feel === "unknown") {
    measured = null;
    estimated = 52;
  }
  if (estimated != null) {
    if (/aluminum|aluminium|\bcnc\b/.test(n)) estimated += 3;
    if (/gasket/.test(n)) estimated -= 2;
  }
  const level = estimated == null ? "No sound number" : estimated < 45 ? "Quiet" : estimated < 52 ? "Soft" : estimated < 58 ? "Normal" : estimated < 64 ? "Loud" : "Very loud";
  const sound =
    feel === "unknown"
      ? `${level}. The switch is not named, so this is an estimate only.`
      : `${level}. Measured is a typical number for this switch. Estimated adds the case. Not a test of this exact unit.`;
  return { measured, estimated, sound };
}

function shelfOf(name: string, kind: string): Shelf {
  const n = name.toLowerCase();
  if (/clean brush|rotary knob|switch tester|paw launcher|coiled cable/.test(n)) return "extra";
  if (kind === "switch") return "switch";
  if (kind === "keycap") return "keycap";
  if (kind === "wrist") return "rest";
  if (kind.startsWith("mouse")) return "mouse";
  if (kind === "pad") return "pad";
  if (kind.startsWith("combo")) return "combo";
  if (kind.startsWith("keyboard") || kind === "french") return "board";
  return "extra";
}

function mapRow(row: Row): KeyItem {
  const kind = row.kind || "other";
  const name = row.name;
  const shelf = shelfOf(name, kind);
  const layout = shelf === "board" || shelf === "combo" ? layoutOf(name, kind) : "other";
  const feel = shelf === "board" || shelf === "combo" || shelf === "switch" ? feelOf(name, kind) : "unknown";
  const sound = shelf === "board" || shelf === "combo" || shelf === "switch" ? soundOf(name, feel) : { measured: null, estimated: null, sound: "" };
  return {
    id: row.id,
    name: name.replace(/\(open box\)/i, "").replace(/\s+/g, " ").trim(),
    price: row.price,
    was: row.was && row.was > row.price ? row.was : null,
    member: row.member && row.member < row.price ? row.member : null,
    brand: brandLabel(row.brand || name.split(" ")[0] || "Other"),
    open: Boolean(row.open) || /\(open box\)/i.test(row.name),
    shelf,
    layout,
    numpad: numpadOf(layout),
    fn: fnOf(layout),
    light: shelf === "board" || shelf === "combo" ? lightOf(name, kind) : "unknown",
    feel,
    french: /french|azerty|canadian french/.test(name.toLowerCase()),
    measured: sound.measured,
    estimated: sound.estimated,
    sound: sound.sound,
  };
}

export const KEYS: KeyItem[] = (raw as Row[]).map(mapRow);

export function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

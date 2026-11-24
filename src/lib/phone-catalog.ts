import { PARTS } from "@/lib/catalog";
import accessories from "@/data/case-accessories.json";
import cases from "@/data/cases.json";
import controllers from "@/data/controllers.json";
import cooling from "@/data/cooling.json";
import cpus from "@/data/cpus.json";
import desktops from "@/data/desktops.json";
import drives from "@/data/hard-drives.json";
import gpus from "@/data/gpus.json";
import keys from "@/data/keyboards-mice.json";
import laptops from "@/data/laptops.json";
import memory from "@/data/memory.json";
import monitors from "@/data/monitors.json";
import mounts from "@/data/mounts.json";
import psus from "@/data/psus.json";
import sim from "@/data/sim.json";
import sound from "@/data/sound.json";
import ssds from "@/data/ssds.json";

export type PhoneItem = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  member: number | null;
  brand: string;
  group: string;
  kind: string;
  open: boolean;
};

type Shelf = {
  id: string;
  name: string;
  price: number;
  was?: number | null;
  member?: number | null;
  brand?: string;
  kind?: string;
  slot?: string;
  open?: boolean;
};

const KIND: Record<string, string> = {
  amd: "AMD",
  intel: "Intel",
  nvidia: "NVIDIA",
  desktop: "Desktop",
  laptop: "Laptop",
  internal: "Internal",
  external: "External",
  bracket: "Bracket",
  other: "Other",
  psu: "Power supply",
  cable: "Cables",
  aio: "Liquid cooler",
  air: "Air cooler",
  thermal: "Paste",
  fan: "Fans",
  custom: "Custom loop",
  controller: "Controller",
  mid: "Mid tower",
  full: "Full tower",
  sff: "Small",
  lighting: "Lighting",
  io: "Front ports",
  panel: "Panels",
  led: "LED strips",
  hub: "USB hub",
  office: "Office",
  gaming: "Gaming",
  portable: "Portable",
  creator: "Creator",
  refurb: "Refurbished",
  mount: "Monitor arm",
  "tv-mount": "TV mount",
  stand: "Stand",
  "tv-stand": "TV stand",
  business: "Business",
  consumer: "Home",
  barebone: "Barebone",
  refurbished: "Refurbished",
  bundle: "Bundle",
  usb: "USB card",
  sata: "SATA card",
  m2: "M.2 card",
  "keyboard-gaming": "Gaming keyboard",
  "keyboard-custom": "Custom keyboard",
  "keyboard-office": "Office keyboard",
  "mouse-gaming": "Gaming mouse",
  "mouse-office": "Office mouse",
  "mouse-ergo": "Ergo mouse",
  "combo-gaming": "Gaming set",
  "combo-office": "Office set",
  pad: "Mouse pad",
  keycap: "Keycaps",
  switch: "Switches",
  wrist: "Wrist rest",
  french: "French layout",
  wheel: "Wheel",
  rim: "Wheel rim",
  pedals: "Pedals",
  shifter: "Shifter",
  seat: "Cockpit",
  brake: "Brake",
  throttle: "Throttle",
  controls: "Controls",
  rudder: "Rudder",
  farm: "Farming",
  console: "Console",
  extra: "Extra",
  headset: "Headset",
};

function label(kind: string) {
  return KIND[kind] ?? kind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function take(rows: Shelf[], group: string, prefix = ""): PhoneItem[] {
  return rows.map((row) => ({
    id: `${group}:${row.id}`,
    name: row.name,
    price: row.price,
    was: row.was && row.was > row.price ? row.was : null,
    member: row.member && row.member < row.price ? row.member : null,
    brand: row.brand || row.name.split(" ")[0] || "Other",
    group,
    kind: prefix ? `${prefix}${label(row.kind || row.slot || "other")}` : label(row.kind || row.slot || "other"),
    open: Boolean(row.open) || /\(open box\)/i.test(row.name),
  }));
}

const boards: PhoneItem[] = PARTS.filter((part) => part.cat === "motherboard").map((part) => ({
  id: `board:${part.id}`,
  name: part.name,
  price: part.price,
  was: part.was && part.was > part.price ? part.was : null,
  member: null,
  brand: part.brand,
  group: "board",
  kind: part.socket ? part.socket.toUpperCase() : "Board",
  open: /open box/i.test(part.name),
}));

const bundles: PhoneItem[] = PARTS.filter((part) => part.cat === "bundle").map((part) => ({
  id: `bundle:${part.id}`,
  name: part.name,
  price: part.price,
  was: part.was && part.was > part.price ? part.was : null,
  member: null,
  brand: part.brand,
  group: "bundle",
  kind: "Bundle",
  open: /open box/i.test(part.name),
}));

export const PHONE_ITEMS: PhoneItem[] = [
  ...take(cpus as Shelf[], "cpu"),
  ...take(gpus as Shelf[], "gpu"),
  ...take(memory as Shelf[], "memory"),
  ...take(ssds as Shelf[], "storage", "SSD · "),
  ...take(drives as Shelf[], "storage", "HDD · "),
  ...boards,
  ...take(psus as Shelf[], "psu"),
  ...take(cooling as Shelf[], "cooling"),
  ...take(cases as Shelf[], "case"),
  ...take(accessories as Shelf[], "case-parts"),
  ...take(monitors as Shelf[], "monitor"),
  ...take(mounts as Shelf[], "mount"),
  ...take(laptops as Shelf[], "laptops"),
  ...take(desktops as Shelf[], "desktops"),
  ...take(keys as Shelf[], "keys"),
  ...take(sound as Shelf[], "sound"),
  ...take(controllers as Shelf[], "controller"),
  ...take(sim as Shelf[], "sim"),
  ...bundles,
];

export const PHONE_GROUPS: { id: string; title: string; line: string }[] = [
  { id: "laptops", title: "Laptops", line: "Carry it." },
  { id: "desktops", title: "Desktops", line: "Already built." },
  { id: "cpu", title: "Processors", line: "The chip." },
  { id: "gpu", title: "Graphics", line: "The card." },
  { id: "memory", title: "Memory", line: "RAM." },
  { id: "storage", title: "Storage", line: "SSD and hard drive." },
  { id: "board", title: "Motherboards", line: "The board." },
  { id: "psu", title: "Power", line: "Supplies and cables." },
  { id: "cooling", title: "Cooling", line: "Fans and liquid." },
  { id: "case", title: "Cases", line: "The box." },
  { id: "case-parts", title: "Case parts", line: "Lights, panels, brackets." },
  { id: "monitor", title: "Monitors", line: "The screen." },
  { id: "mount", title: "Mounts", line: "Arms and stands." },
  { id: "keys", title: "Keyboards and mice", line: "Desk gear." },
  { id: "sound", title: "Sound cards", line: "Audio." },
  { id: "controller", title: "Controller cards", line: "Extra ports." },
  { id: "sim", title: "Simulators", line: "Wheels and cockpits." },
  { id: "bundle", title: "Bundles", line: "More than one part." },
];

export const PHONE_SECTIONS: { title: string; ids: string[] }[] = [
  { title: "Computers", ids: ["laptops", "desktops"] },
  { title: "Core parts", ids: ["cpu", "gpu", "memory", "storage", "board"] },
  { title: "Power and cooling", ids: ["psu", "cooling", "case", "case-parts"] },
  { title: "Screen and desk", ids: ["monitor", "mount", "keys", "sound", "controller"] },
  { title: "Play", ids: ["sim", "bundle"] },
];

const byId = new Map(PHONE_ITEMS.map((item) => [item.id, item]));

export function phoneItem(id: string) {
  return byId.get(id);
}

export function groupMeta(id: string) {
  return PHONE_GROUPS.find((group) => group.id === id);
}

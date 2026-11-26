import accessories from "@/data/case-accessories.json";
import cases from "@/data/cases.json";
import controllers from "@/data/controllers.json";
import cooling from "@/data/cooling.json";
import cpus from "@/data/cpus.json";
import { DEALS } from "@/data/deals";
import desktops from "@/data/desktops.json";
import drives from "@/data/hard-drives.json";
import gpus from "@/data/gpus.json";
import keys from "@/data/keyboards-mice.json";
import laptops from "@/data/laptops.json";
import updated from "@/data/last-updated.json";
import memory from "@/data/memory.json";
import monitors from "@/data/monitors.json";
import mounts from "@/data/mounts.json";
import psus from "@/data/psus.json";
import sim from "@/data/sim.json";
import sound from "@/data/sound.json";
import ssds from "@/data/ssds.json";
import { PARTS, dealFrom, gpuKnown, laptopBits, machineScore, money, partScore, type Category, type Part } from "@/lib/catalog";

export const STALE_BEFORE = "2026-11-12";
export const SCORE_VERSION = "v2";

export type StockCat = { id: string; title: string };

export const CAT_ORDER: StockCat[] = [
  { id: "cpu", title: "CPUs" },
  { id: "gpu", title: "GPUs" },
  { id: "motherboard", title: "Motherboards" },
  { id: "memory", title: "RAM" },
  { id: "hdd", title: "HDDs" },
  { id: "ssd", title: "SSDs" },
  { id: "psu", title: "Power supplies" },
  { id: "case", title: "Computer cases" },
  { id: "cooler", title: "CPU coolers" },
  { id: "fan", title: "Case fans" },
  { id: "monitor", title: "Monitors" },
  { id: "keyboard", title: "Keyboards" },
  { id: "mouse", title: "Mice" },
  { id: "headset", title: "Headsets" },
  { id: "speaker", title: "Speakers" },
  { id: "laptop", title: "Laptops" },
  { id: "tablet", title: "Tablets" },
  { id: "desktop", title: "Desktop computers" },
  { id: "switch", title: "Keyboard switches" },
  { id: "keycap", title: "Keycaps" },
  { id: "mount", title: "Mounts" },
  { id: "sim", title: "Simulators" },
  { id: "bundle", title: "Bundles" },
  { id: "sound", title: "Sound cards" },
  { id: "controller", title: "Controller cards" },
  { id: "case-parts", title: "Case accessories" },
  { id: "pad", title: "Mouse pads" },
];

type Row = {
  id: string;
  name: string;
  price: number;
  was?: number | null;
  brand?: string;
  kind?: string;
  open?: boolean;
  updated?: string;
  gpu?: number;
  specs?: string;
  watt?: number | null;
  socket?: string | null;
  form?: string | null;
};

export type ShelfDeal = {
  name: "Steal" | "Fair" | "Full" | "Stretch" | "INSUFFICIENT PRICE DATA";
  per: number | null;
  unit: string;
  say: string;
};

export type StockItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  was: number | null;
  cat: string;
  title: string;
  kind: string;
  open: boolean;
  updated: string | null;
  dateNote: string;
  stale: boolean;
  missingPrice: boolean;
  gb: number | null;
  rpm: number | null;
  mhz: number | null;
  ddr: string | null;
  gen: string | null;
  watts: number | null;
  cmr: boolean | null;
  vram: number | null;
  hz: number | null;
  res: string | null;
  year: number | null;
  warranty: string | null;
  power: number | null;
  powerNote: string;
  unitAmount: number | null;
  unitLabel: string;
  deal: ShelfDeal;
  discount: number | null;
  blob: string;
};

const TITLE = new Map(CAT_ORDER.map((cat) => [cat.id, cat.title]));

function ghost(name: string, cat: Category, extra: Partial<Part> = {}): Part {
  return { id: "stock", name, price: 0, was: null, cat, brand: "", socket: extra.socket ?? null, ram: extra.ram ?? null, watt: extra.watt ?? null, form: extra.form ?? null };
}

function num(match: RegExpMatchArray | null, index = 1): number | null {
  if (!match) return null;
  const value = Number(match[index]);
  return Number.isFinite(value) ? value : null;
}

function capacityGb(name: string, cat: string): number | null {
  const n = name.toUpperCase();
  if (cat === "gpu" || cat === "psu" || cat === "monitor" || cat === "keyboard" || cat === "mouse") return null;
  const tb = n.match(/(\d+(?:\.\d+)?)\s*TB\b/);
  if (tb && (cat === "hdd" || cat === "ssd" || cat === "desktop" || cat === "laptop")) return Math.round(Number(tb[1]) * 1000);
  const gb = n.match(/(\d+)\s*GB\b/);
  if (!gb) return null;
  const size = Number(gb[1]);
  if (cat === "memory" && size >= 4 && size <= 256) return size;
  if ((cat === "hdd" || cat === "ssd") && size >= 120 && size <= 8000) return size;
  return null;
}

function catOf(group: string, kind: string, name: string): string {
  const n = name.toUpperCase();
  const k = kind.toLowerCase();
  if (/\bHEADSET\b/.test(n)) return "headset";
  if (group === "storage") {
    if (/BRACKET|CADDY|ADAPTER|DOCK|ENCLOSURE|CABLE|MOUNTING/.test(n) && !/\d+\s*(TB|GB)\b/.test(n)) return "case-parts";
    return /HDD|HARD DRIVE|\bRPM\b/.test(n) || k.includes("hdd") ? "hdd" : "ssd";
  }
  if (group === "keys") {
    if (k.includes("headset") || /HEADSET|HEADPHONE/.test(n)) return "headset";
    if (k.includes("mouse")) return "mouse";
    if (k.includes("switch")) return "switch";
    if (k.includes("keycap")) return "keycap";
    if (k.includes("pad")) return "pad";
    if (/SPEAKER/.test(n)) return "speaker";
    return "keyboard";
  }
  if (group === "sound") return /SPEAKER/.test(n) ? "speaker" : "sound";
  if (group === "cooling") return k.includes("fan") && !k.includes("aio") ? "fan" : "cooler";
  if (group === "laptops") return "laptop";
  if (group === "tablets") return "tablet";
  if (group === "desktops") return "desktop";
  if (group === "board") return "motherboard";
  return group;
}

function knownCpu(name: string) {
  return /X3D|ULTRA\s?[579]|7950|9950|9900|9700|9600|7700|7600|I[357]-|RYZEN\s?[3579]/i.test(name);
}

function powerFor(cat: string, row: Row): { power: number | null; note: string } {
  const estimate = "Scoring v2. Estimate from the product name, not a lab test.";
  if (cat === "laptop" || cat === "tablet") {
    if (typeof row.gpu !== "number" || !row.specs) return { power: null, note: "No power score. The chip number or the spec line is missing." };
    return { power: laptopBits({ gpu: row.gpu, specs: row.specs, name: row.name, kind: row.kind }).score, note: estimate };
  }
  if (cat === "desktop") return { power: machineScore(row.name), note: `${estimate} Graphics is most of a desktop score.` };
  if (cat === "gpu") {
    const speed = gpuKnown(ghost(row.name, "gpu"));
    if (!speed) return { power: null, note: "No power score. This card is not in the estimate table, so it is not marked as slow." };
    return { power: Math.min(100, Math.round((speed / 180) * 100)), note: `${estimate} Speed points ${speed}. An RX 9070 is 100. A 5090 is 180. Score is ${speed} ÷ 180 × 100.` };
  }
  if (cat === "cpu") {
    if (!knownCpu(row.name)) return { power: null, note: "No power score. This chip is not in the estimate table." };
    return { power: partScore(ghost(row.name, "cpu")), note: `${estimate} A 9800X3D-class chip is the top of this table.` };
  }
  if (cat === "cooler") {
    if (!/COOLER|AIO|LIQUID|HEATPIPE|HEATSINK|RADIATOR|\bTOWER\b|\bFAN\b/i.test(row.name)) {
      return { power: null, note: "No power score. This is a fitting, tube, or plug, not a cooler." };
    }
    return { power: partScore(ghost(row.name, "cooler")), note: estimate };
  }
  if (cat === "psu") {
    if (!/(\d{3,4})\s*W\b/i.test(row.name) && !row.watt) {
      return { power: null, note: "No power score. Wattage is not on the name, so this is not marked as a weak supply." };
    }
    return { power: partScore(ghost(row.name, "psu", { watt: row.watt ?? null })), note: estimate };
  }
  if (cat === "memory" || cat === "hdd" || cat === "ssd" || cat === "monitor" || cat === "motherboard" || cat === "case") {
    const partCat: Category = cat === "hdd" || cat === "ssd" ? "storage" : (cat as Category);
    return { power: partScore(ghost(row.name, partCat, { watt: row.watt ?? null, form: row.form ?? null, socket: row.socket ?? null })), note: estimate };
  }
  return { power: null, note: "No power score. This is not a speed category." };
}

function take(rows: Row[], group: string, fallback?: string): StockItem[] {
  return rows.map((row) => {
    const kind = row.kind || "Other";
    const cat = catOf(group, kind, row.name);
    const name = row.name;
    const upper = name.toUpperCase();
    const gb = capacityGb(name, cat);
    const rpm = num(upper.match(/(\d{3,5})\s*RPM/));
    const mhz = num(upper.match(/(\d{4})\s*MHZ/)) ?? num(upper.match(/DDR[345]-?(\d{4})/));
    const ddr = /DDR5/.test(upper) ? "DDR5" : /DDR4/.test(upper) ? "DDR4" : /DDR3/.test(upper) ? "DDR3" : null;
    const gen = cat === "hdd" ? "HDD" : /GEN\s?5|PCIE\s?5/.test(upper) ? "Gen5" : /GEN\s?4|PCIE\s?4/.test(upper) ? "Gen4" : /GEN\s?3|PCIE\s?3/.test(upper) ? "Gen3" : /NVME|M\.2/.test(upper) ? "NVMe" : /SATA/.test(upper) ? "SATA" : null;
    const watts = row.watt ?? num(upper.match(/(\d{3,4})\s*W\b/));
    const cmr = /\bCMR\b/.test(upper) ? true : /\bSMR\b/.test(upper) ? false : null;
    const vram = cat === "gpu" ? num(upper.match(/(\d+)\s*GB/)) : null;
    const hz = num(upper.match(/(\d{2,3})\s*HZ/));
    const res = /4K|3840|UHD/.test(upper) ? "4K" : /1440|QHD|\b2K\b/.test(upper) ? "1440p" : /1080|FHD/.test(upper) ? "1080p" : null;
    const yearMatch = name.match(/\b(20[12]\d)\b/);
    const year = yearMatch ? Number(yearMatch[1]) : null;
    const warrantyMatch = name.match(/(\d+)\s*-?\s*YEAR/i);
    const warranty = warrantyMatch ? `${warrantyMatch[1]} year` : null;
    const priced = Number(row.price);
    const missingPrice = !Number.isFinite(priced) || priced <= 0;
    const updatedAt = row.updated || fallback || null;
    const { power, note } = powerFor(cat, row);
    const was = row.was && row.was > priced ? row.was : null;
    return {
      id: `${cat}:${row.id}`,
      name,
      brand: row.brand || name.split(" ")[0] || "UNKNOWN",
      price: missingPrice ? 0 : priced,
      was,
      cat,
      title: TITLE.get(cat) ?? cat,
      kind,
      open: Boolean(row.open) || /open\s?box/i.test(name),
      updated: row.updated || fallback || null,
      dateNote: row.updated ? "Checked on this product" : fallback ? "Shelf import, not a separate check" : "Unknown",
      stale: Boolean(updatedAt && updatedAt < STALE_BEFORE),
      missingPrice,
      gb,
      rpm,
      mhz,
      ddr,
      gen,
      watts,
      cmr,
      vram: vram && vram >= 4 && vram <= 32 ? vram : null,
      hz,
      res,
      year,
      warranty,
      power,
      powerNote: note,
      unitAmount: null,
      unitLabel: "",
      deal: { name: "INSUFFICIENT PRICE DATA", per: null, unit: "", say: "" },
      discount: was ? Math.round((was - priced) * 100) / 100 : null,
      blob: "",
    };
  });
}

function fillUnits(items: StockItem[]) {
  for (const item of items) {
    if (item.missingPrice) continue;
    if ((item.cat === "hdd" || item.cat === "ssd") && item.gb) {
      const tb = item.gb / 1000;
      item.unitAmount = item.price / tb;
      item.unitLabel = "per TB";
    } else if (item.cat === "memory" && item.gb) {
      item.unitAmount = item.price / item.gb;
      item.unitLabel = "per GB";
    } else if (item.cat === "gpu" && item.power) {
      const speed = gpuKnown(ghost(item.name, "gpu"));
      if (speed) {
        item.unitAmount = item.price / speed;
        item.unitLabel = "per speed point";
      }
    } else if (item.cat === "cpu" && item.power) {
      item.unitAmount = item.price / item.power;
      item.unitLabel = "per power point";
    } else if ((item.cat === "laptop" || item.cat === "desktop") && item.power) {
      item.unitAmount = item.price / item.power;
      item.unitLabel = "per power point";
    } else if (item.cat === "psu" && item.watts) {
      item.unitAmount = item.price / item.watts;
      item.unitLabel = "per watt, not a quality score";
    }
    item.blob = [item.brand, item.name, item.title, item.kind, item.ddr, item.gen, item.res, item.watts ? `${item.watts}W` : "", item.rpm ? `${item.rpm}RPM` : "", item.gb ? `${item.gb}GB` : ""].filter(Boolean).join(" ").toLowerCase();
  }
}

function attachDeals(items: StockItem[]) {
  const peerCats = new Set(["hdd", "ssd", "memory", "gpu", "cpu"]);
  const buckets = new Map<string, number[]>();
  for (const item of items) {
    if (!peerCats.has(item.cat) || item.unitAmount == null || item.open) continue;
    const list = buckets.get(item.cat) ?? [];
    list.push(item.unitAmount);
    buckets.set(item.cat, list);
  }
  for (const item of items) {
    if (item.missingPrice) {
      item.deal = { name: "INSUFFICIENT PRICE DATA", per: null, unit: "", say: "No price on the record, so there is no deal label." };
      continue;
    }
    if (item.cat === "laptop" || item.cat === "desktop") {
      if (!item.power) {
        item.deal = { name: "INSUFFICIENT PRICE DATA", per: null, unit: "", say: "No power score, so price per point is not shown." };
        continue;
      }
      const deal = dealFrom(item.price, item.power);
      item.deal = {
        name: deal.name,
        per: deal.per,
        unit: "per power point",
        say: `${deal.say} Store rule: price ÷ power score. Steal is $14 or less, Fair is $22 or less, Full is $32 or less, Stretch is above that. Not a Canada-wide survey.`,
      };
      continue;
    }
    if (item.cat === "psu") {
      item.deal = {
        name: "INSUFFICIENT PRICE DATA",
        per: item.unitAmount,
        unit: item.unitLabel,
        say: item.unitAmount != null ? `${money(item.unitAmount)} per watt is only a side number. Wattage is not quality, and this shelf has no lab efficiency list.` : "Wattage is not on the name, so price per watt is unknown.",
      };
      continue;
    }
    if (!peerCats.has(item.cat) || item.unitAmount == null) {
      item.deal = { name: "INSUFFICIENT PRICE DATA", per: null, unit: "", say: "Not enough of a like-for-like number to call this a Steal, Fair, Full, or Stretch." };
      continue;
    }
    const peers = buckets.get(item.cat) ?? [];
    if (peers.length < 8) {
      item.deal = { name: "INSUFFICIENT PRICE DATA", per: item.unitAmount, unit: item.unitLabel, say: `Only ${peers.length} new ${item.title} have a comparable number. That is not enough to call a deal.` };
      continue;
    }
    const sorted = peers.slice().sort((a, b) => a - b);
    const at = (p: number) => {
      const i = (sorted.length - 1) * p;
      const lo = Math.floor(i);
      const hi = Math.ceil(i);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
    };
    const p25 = at(0.25);
    const p50 = at(0.5);
    const p75 = at(0.75);
    const name = item.unitAmount <= p25 ? "Steal" : item.unitAmount <= p50 ? "Fair" : item.unitAmount <= p75 ? "Full" : "Stretch";
    item.deal = {
      name,
      per: item.unitAmount,
      unit: item.unitLabel,
      say: `${money(item.unitAmount)} ${item.unitLabel}, against ${peers.length} new ${item.title} on this shelf. Cheaper quarter is Steal, up to the middle is Fair, up to the expensive quarter is Full, above that is Stretch. Open box is not in the comparison. This is not a national price survey.`,
    };
  }
}

const boards: Row[] = PARTS.filter((part) => part.cat === "motherboard").map((part) => ({
  id: part.id,
  name: part.name,
  price: part.price,
  was: part.was,
  brand: part.brand,
  kind: part.socket || "Board",
  socket: part.socket,
  form: part.form,
}));

const partBundles: Row[] = PARTS.filter((part) => part.cat === "bundle").map((part) => ({
  id: part.id,
  name: part.name,
  price: part.price,
  was: part.was,
  brand: part.brand,
  kind: "Bundle",
}));

const dealRows: Row[] = DEALS.map((deal) => ({
  id: deal.id,
  name: deal.name,
  price: deal.price,
  was: deal.save > 0 ? Math.round((deal.price + deal.save) * 100) / 100 : null,
  brand: deal.kind,
  kind: deal.kind,
}));

function buildStock() {
  const raw = [
    ...take(cpus as Row[], "cpu"),
    ...take(gpus as Row[], "gpu"),
    ...take(memory as Row[], "memory"),
    ...take(ssds as Row[], "storage"),
    ...take(drives as Row[], "storage"),
    ...take(boards, "board", updated.lastUpdated),
    ...take(psus as Row[], "psu"),
    ...take(cooling as Row[], "cooling"),
    ...take(cases as Row[], "case"),
    ...take(accessories as Row[], "case-parts"),
    ...take(monitors as Row[], "monitor"),
    ...take(mounts as Row[], "mount"),
    ...take((laptops as Row[]).filter((row) => row.kind !== "tablet"), "laptops"),
    ...take((laptops as Row[]).filter((row) => row.kind === "tablet"), "tablets"),
    ...take(desktops as Row[], "desktops"),
    ...take(keys as Row[], "keys"),
    ...take(sound as Row[], "sound"),
    ...take(controllers as Row[], "controller"),
    ...take(sim as Row[], "sim", updated.sim),
    ...take(partBundles, "bundle", updated.lastUpdated),
    ...take(dealRows, "bundle", updated.lastUpdated),
  ];
  const seen = new Set<string>();
  const items: StockItem[] = [];
  let duplicates = 0;
  for (const item of raw) {
    const key = `${item.cat}|${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}|${item.price}|${item.open ? "o" : "n"}`;
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    items.push(item);
  }
  fillUnits(items);
  attachDeals(items);
  return { items, duplicates, before: raw.length };
}

const built = buildStock();

export const STOCK: StockItem[] = built.items;
export const DUPLICATE_ROWS = built.duplicates;

export function stockCats() {
  const counts = new Map<string, number>();
  for (const item of STOCK) counts.set(item.cat, (counts.get(item.cat) ?? 0) + 1);
  return CAT_ORDER.filter((cat) => counts.has(cat.id)).map((cat) => ({ ...cat, count: counts.get(cat.id) ?? 0 }));
}

export function stockSummary() {
  const cats = stockCats();
  const dated = STOCK.map((item) => item.updated).filter((value): value is string => Boolean(value)).sort();
  return {
    total: STOCK.length,
    duplicatesRemoved: DUPLICATE_ROWS,
    priced: STOCK.filter((item) => !item.missingPrice).length,
    missing: STOCK.filter((item) => item.missingPrice).length,
    stale: STOCK.filter((item) => item.stale).length,
    unknownDate: STOCK.filter((item) => !item.updated).length,
    newest: dated[dated.length - 1] ?? "Unknown",
    oldest: dated[0] ?? "Unknown",
    inventoryImport: updated.lastUpdated || "Unknown",
    cats,
  };
}

export type PriceSort =
  | "price-asc"
  | "price-desc"
  | "power-desc"
  | "deal"
  | "unit-asc"
  | "capacity-desc"
  | "rpm-desc"
  | "cmr"
  | "mhz-desc"
  | "vram-desc"
  | "watts-desc"
  | "hz-desc"
  | "res-desc"
  | "discount-desc"
  | "updated-desc"
  | "year-desc";

const DEAL_RANK = { Steal: 0, Fair: 1, Full: 2, Stretch: 3, "INSUFFICIENT PRICE DATA": 4 };

export function sortsFor(cats: string[]): { id: PriceSort; label: string }[] {
  const one = cats.length === 1 ? cats[0] : "";
  const set = new Set(cats);
  const storageOnly = cats.length > 0 && cats.every((cat) => cat === "hdd" || cat === "ssd");
  const sorts: { id: PriceSort; label: string }[] = [
    { id: "price-asc", label: "Lowest price" },
    { id: "price-desc", label: "Highest price" },
    { id: "power-desc", label: "Highest Power score" },
    { id: "deal", label: "Best Deal" },
    { id: "discount-desc", label: "Largest listed discount" },
    { id: "updated-desc", label: "Recently updated prices" },
  ];
  if (storageOnly) sorts.push({ id: "unit-asc", label: "Lowest price per TB" }, { id: "capacity-desc", label: "Highest capacity" });
  if (one === "hdd") sorts.push({ id: "rpm-desc", label: "Highest RPM" }, { id: "cmr", label: "CMR first" });
  if (one === "memory") sorts.push({ id: "unit-asc", label: "Lowest price per GB" }, { id: "capacity-desc", label: "Highest capacity" }, { id: "mhz-desc", label: "Highest speed" });
  if (one === "gpu") sorts.push({ id: "unit-asc", label: "Best performance per dollar" }, { id: "vram-desc", label: "Highest VRAM" });
  if (one === "cpu" || one === "laptop" || one === "desktop") sorts.push({ id: "unit-asc", label: "Lowest price per power point" });
  if (one === "psu") sorts.push({ id: "watts-desc", label: "Highest wattage" }, { id: "unit-asc", label: "Lowest price per watt (not quality)" });
  if (one === "monitor") sorts.push({ id: "res-desc", label: "Highest resolution" }, { id: "hz-desc", label: "Highest refresh rate" });
  if (one === "laptop") sorts.push({ id: "year-desc", label: "Newest year in the name" });
  if (set.size > 1 && !storageOnly) {
    return sorts.filter((sort) => !["unit-asc", "rpm-desc", "cmr", "mhz-desc", "vram-desc", "watts-desc", "hz-desc", "res-desc", "year-desc", "capacity-desc"].includes(sort.id));
  }
  return sorts;
}

function missingLast(value: number | null, other: number | null, desc: boolean) {
  if (value == null && other == null) return 0;
  if (value == null) return 1;
  if (other == null) return -1;
  return desc ? other - value : value - other;
}

export function compareStock(a: StockItem, b: StockItem, sort: PriceSort): number {
  if (sort === "price-desc") return b.price - a.price;
  if (sort === "power-desc") return missingLast(a.power, b.power, true) || a.price - b.price;
  if (sort === "deal") return DEAL_RANK[a.deal.name] - DEAL_RANK[b.deal.name] || missingLast(a.unitAmount ?? a.deal.per, b.unitAmount ?? b.deal.per, false);
  if (sort === "unit-asc") return missingLast(a.unitAmount, b.unitAmount, false) || a.price - b.price;
  if (sort === "capacity-desc") return missingLast(a.gb, b.gb, true) || a.price - b.price;
  if (sort === "rpm-desc") return missingLast(a.rpm, b.rpm, true);
  if (sort === "cmr") return Number(b.cmr === true) - Number(a.cmr === true) || a.price - b.price;
  if (sort === "mhz-desc") return missingLast(a.mhz, b.mhz, true);
  if (sort === "vram-desc") return missingLast(a.vram, b.vram, true);
  if (sort === "watts-desc") return missingLast(a.watts, b.watts, true);
  if (sort === "hz-desc") return missingLast(a.hz, b.hz, true);
  if (sort === "res-desc") return missingLast(a.res === "4K" ? 3 : a.res === "1440p" ? 2 : a.res === "1080p" ? 1 : null, b.res === "4K" ? 3 : b.res === "1440p" ? 2 : b.res === "1080p" ? 1 : null, true);
  if (sort === "discount-desc") return missingLast(a.discount, b.discount, true);
  if (sort === "updated-desc") return (b.updated ?? "").localeCompare(a.updated ?? "");
  if (sort === "year-desc") return missingLast(a.year, b.year, true);
  return a.price - b.price;
}

export function stockFacts(item: StockItem): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Category", value: item.title },
    { label: "Price", value: item.missingPrice ? "UNKNOWN" : money(item.price) },
    { label: "Condition", value: item.open ? "Open box" : "New, as listed" },
    { label: "Price record", value: item.updated ? `${item.updated}. ${item.dateNote}` : "Unknown" },
  ];
  if (item.was) rows.push({ label: "Earlier price on the sheet", value: money(item.was) });
  if (item.gb && (item.cat === "hdd" || item.cat === "ssd" || item.cat === "memory")) rows.push({ label: "Capacity", value: item.gb >= 1000 ? `${item.gb / 1000} TB` : `${item.gb} GB` });
  else if (item.cat === "hdd" || item.cat === "ssd" || item.cat === "memory") rows.push({ label: "Capacity", value: "UNKNOWN" });
  if (item.unitAmount != null) rows.push({ label: item.unitLabel, value: money(item.unitAmount) });
  if (item.cat === "hdd") rows.push({ label: "RPM", value: item.rpm ? String(item.rpm) : "UNKNOWN" }, { label: "Recording", value: item.cmr == null ? "UNKNOWN" : item.cmr ? "CMR" : "SMR" });
  if (item.cat === "ssd") rows.push({ label: "Interface", value: item.gen ?? "UNKNOWN" }, { label: "Read speed", value: "UNKNOWN" }, { label: "Write speed", value: "UNKNOWN" }, { label: "Endurance", value: "UNKNOWN" });
  if (item.cat === "memory") rows.push({ label: "Type", value: item.ddr ?? "UNKNOWN" }, { label: "Speed", value: item.mhz ? `${item.mhz} MHz` : "UNKNOWN" }, { label: "Latency", value: "UNKNOWN" });
  if (item.cat === "gpu") rows.push({ label: "VRAM", value: item.vram ? `${item.vram} GB` : "UNKNOWN" });
  if (item.cat === "psu") rows.push({ label: "Wattage", value: item.watts ? `${item.watts} W` : "UNKNOWN" }, { label: "Efficiency", value: /TITANIUM|PLATINUM|GOLD|BRONZE/i.test(item.name) ? "Named on the product" : "UNKNOWN" });
  if (item.cat === "monitor") rows.push({ label: "Resolution", value: item.res ?? "UNKNOWN" }, { label: "Refresh", value: item.hz ? `${item.hz} Hz` : "UNKNOWN" });
  rows.push({ label: "Warranty", value: item.warranty ?? "UNKNOWN" }, { label: "Power", value: item.power == null ? "No score" : String(item.power) }, { label: "Deal", value: item.deal.name });
  return rows;
}

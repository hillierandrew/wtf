import raw from "@/data/parts.json";

export const CATS = [
  "prebuilt",
  "bundle",
  "cpu",
  "motherboard",
  "memory",
  "gpu",
  "storage",
  "case",
  "cooler",
  "psu",
  "monitor",
] as const;

export type Category = (typeof CATS)[number];

export type Part = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  cat: Category;
  brand: string;
  socket: string | null;
  ram: string | null;
  watt: number | null;
  form: string | null;
  includes?: string[];
};

export type Build = Partial<Record<Category, Part>>;

export const CAT_LABEL: Record<Category, string> = {
  prebuilt: "Prebuilt",
  bundle: "Bundle",
  cpu: "Processor",
  motherboard: "Motherboard",
  memory: "Memory",
  gpu: "Graphics",
  storage: "Storage",
  case: "Case",
  cooler: "Cooler",
  psu: "Power",
  monitor: "Monitor",
};

export const CAT_TAB: Record<Category, string> = {
  prebuilt: "Ready",
  bundle: "Bundle",
  cpu: "CPU",
  motherboard: "Board",
  memory: "RAM",
  gpu: "GPU",
  storage: "Drive",
  case: "Case",
  cooler: "Cool",
  psu: "Power",
  monitor: "Screen",
};

export const PARTS: Part[] = raw as Part[];

export const byId = new Map(PARTS.map((p) => [p.id, p]));

const FORM_RANK: Record<string, number> = { itx: 1, matx: 2, atx: 3, eatx: 4, full: 4 };

export function money(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function isJunk(part: Part, allowOpenBox: boolean): boolean {
  const blob = `${part.name} ${part.brand}`;
  if (/sodimm|so-dimm|laptop|\becc\b|surveillance|\bpurple\b|(^|\s)ican\b/i.test(blob)) return true;
  if (part.price < 12) return true;
  if (!allowOpenBox && /open\s?box|\[openbox\]|renewed|recertified|refurbished/i.test(blob)) return true;
  return false;
}

export function formOf(part: Part | undefined): string {
  if (!part) return "";
  if (part.form) return part.form;
  const n = part.name.toUpperCase();
  if (/MICRO|MATX|M-ATX/.test(n)) return "matx";
  if (/MINI-?ITX|\bITX\b/.test(n)) return "itx";
  if (/\bE-?ATX\b/.test(n)) return "eatx";
  if (/\bATX\b/.test(n)) return "atx";
  return "";
}

export function formLabel(form: string): string {
  if (form === "itx") return "ITX";
  if (form === "matx") return "mATX";
  if (form === "atx") return "ATX";
  if (form === "eatx") return "E-ATX";
  if (form === "full") return "Full tower";
  return form.toUpperCase();
}

function fitsCase(box: Part, board: Part): boolean {
  return (FORM_RANK[formOf(box)] || 3) >= (FORM_RANK[formOf(board)] || 2);
}

export function sticksOf(part: Part): number {
  const n = part.name || "";
  const m = n.match(/\((\d+)\s*[x×]\s*\d+/i) || n.match(/\b(\d+)\s*[x×]\s*\d+\s*GB/i);
  return m ? Number(m[1]) : 1;
}

export function gbOf(part: Part): number {
  const upper = part.name.toUpperCase();
  const tb = upper.match(/\b(\d+(?:\.\d+)?)\s*TB\b/);
  if (tb && (part.cat === "storage" || part.cat === "memory")) return Math.round(Number(tb[1]) * 1000);
  const m = upper.match(/\b(\d+)\s*GB\b/);
  if (!m) return 0;
  const n = Number(m[1]);
  if (part.cat === "storage" && n >= 120 && n <= 8000) return n;
  if (n >= 4 && n <= 256) return n;
  return 0;
}

export function ramKindOf(part: Part | undefined): string {
  if (!part) return "";
  if (part.ram) return part.ram;
  const m = part.name.toUpperCase().match(/DDR[2-5]/);
  if (m) return m[0];
  if (part.socket === "AM5" || part.socket === "LGA1851") return "DDR5";
  if (part.socket === "AM4") return "DDR4";
  return "";
}

function dimmSlots(board: Part | undefined): number {
  if (!board) return 4;
  const n = board.name.toUpperCase();
  if (/2\s*DIMM/.test(n)) return 2;
  if (/4\s*DIMM/.test(n)) return 4;
  if (formOf(board) === "itx") return 2;
  return 4;
}

export function wattOf(part: Part | undefined): number {
  if (!part) return 0;
  if (part.watt) return part.watt;
  const m = part.name.toUpperCase().match(/(\d{3,4})\s?W\b/);
  return m ? Number(m[1]) : 0;
}

export function gpuTier(part: Part): number {
  const n = part.name.toUpperCase();
  if (/5090|4090/.test(n)) return 6;
  if (/5080|4080|3090|5070\s?TI|9070\s?XT/.test(n)) return 5;
  if (/\b5070\b|\b9070\b|4070|3080|7900/.test(n)) return 4;
  if (/5060|5050|4060|3070|9060|7600|7700|7800|6800|6750|N506T|\bARC\b/.test(n)) return 3;
  if (/3060|3050|1660|1650|6500|6600|6650|2060|2070/.test(n)) return 2;
  if (/1030|1050|\b710\b|\b730\b/.test(n)) return 1;
  if (/RTX|RADEON|GEFORCE/.test(n)) return 3;
  return 0;
}

export function m2Slots(board: Part | undefined): number {
  if (!board) return 2;
  const n = board.name.toUpperCase();
  if (/QUAD|4\s*[X×]?\s*M\.?2/.test(n)) return 4;
  if (/TRIPLE|3\s*[X×]?\s*M\.?2/.test(n)) return 3;
  if (/DUAL|2\s*[X×]?\s*M\.?2/.test(n)) return 2;
  const counted = n.match(/([1-4])\s*[X×]\s*M\.?2/);
  if (counted) return Number(counted[1]);
  const form = formOf(board);
  if (form === "itx") return 2;
  if (form === "atx" || form === "eatx") return 3;
  return 2;
}

export function driveKind(part: Part): "nvme" | "sata" | "hdd" | "2230" | "" {
  const n = part.name.toUpperCase();
  if (/2230|2242/.test(n)) return "2230";
  if (/NVME|M\.2|PCI-?E/.test(n)) return "nvme";
  if (/HDD|HARD DRIVE|\d+\s?RPM|3\.5/.test(n)) return "hdd";
  if (/SATA|2\.5/.test(n)) return "sata";
  return "";
}

export const PRICE_CHECKED = "Nov 21, 2026";

export function priceChange(part: Part): { kind: "down" | "up"; diff: number } | null {
  if (part.was == null || part.was === part.price) return null;
  const diff = Math.round(Math.abs(part.was - part.price) * 100) / 100;
  if (diff < 0.01) return null;
  return { kind: part.was > part.price ? "down" : "up", diff };
}

export function needWatts(build: Build): number {
  const tier = build.gpu ? gpuTier(build.gpu) : 0;
  return tier >= 4 ? 750 : tier >= 3 ? 650 : tier >= 2 ? 550 : tier ? 450 : 400;
}

function coolerSockets(part: Part): string[] {
  const n = part.name.toUpperCase().replace(/\s+/g, "");
  const found: string[] = [];
  if (n.includes("LGA1851") || n.includes("1851")) found.push("LGA1851");
  if (n.includes("LGA1700") || n.includes("1700")) found.push("LGA1700");
  if (n.includes("AM5")) found.push("AM5");
  if (n.includes("AM4")) found.push("AM4");
  return found;
}

/** Empty string means the part fits the rest of the build. */
export function fitWhy(part: Part, others: Build): string {
  if (part.cat === "prebuilt") {
    const mixed = CATS.some((cat) => cat !== "prebuilt" && cat !== "monitor" && others[cat]);
    if (mixed) return "A finished PC replaces a custom build.";
    return "";
  }
  if (part.cat === "bundle" || part.cat === "monitor") return "";
  if (others.prebuilt) return "Clear the finished PC before picking parts.";
  if (part.cat === "cpu" && others.motherboard?.socket && part.socket && part.socket !== others.motherboard.socket) {
    return `${part.socket} processor, ${others.motherboard.socket} motherboard.`;
  }
  if (part.cat === "motherboard" && others.cpu?.socket && part.socket && part.socket !== others.cpu.socket) {
    return `${part.socket} motherboard, ${others.cpu.socket} processor.`;
  }
  if ((part.cat === "cpu" && others.motherboard) || (part.cat === "motherboard" && others.cpu)) {
    const cpu = part.cat === "cpu" ? part : others.cpu;
    const board = part.cat === "motherboard" ? part : others.motherboard;
    const a = ramKindOf(cpu);
    const b = ramKindOf(board);
    if (a && b && a !== b) return `Processor wants ${a}. Board is ${b}.`;
  }
  if (part.cat === "memory") {
    if (/SODIMM|SO-DIMM|LAPTOP/i.test(part.name)) return "Laptop memory does not fit a desktop board.";
    const kind = ramKindOf(part);
    const want = ramKindOf(others.motherboard) || ramKindOf(others.cpu);
    if (kind && want && kind !== want) return `${kind} does not fit a ${want} board.`;
    const sticks = sticksOf(part);
    if (sticks !== 1 && sticks !== 2 && sticks !== 4) return `${sticks} sticks. These boards take 1, 2, or 4.`;
    const slots = dimmSlots(others.motherboard);
    if (others.motherboard && sticks > slots) return `${sticks} sticks, and this board has ${slots} slots.`;
  }
  if (part.cat === "motherboard" && others.memory) {
    const kind = ramKindOf(others.memory);
    const want = ramKindOf(part);
    if (kind && want && kind !== want) return `Memory is ${kind}. This board is ${want}.`;
    const sticks = sticksOf(others.memory);
    const slots = dimmSlots(part);
    if (sticks > slots) return `Memory is ${sticks} sticks. This board has ${slots} slots.`;
  }
  if (part.cat === "storage") {
    const kind = driveKind(part);
    if (kind === "2230") return "2230 is a tiny laptop drive. A desktop board takes a 2280 NVMe. Do not buy this.";
  }
  if (part.cat === "cooler" && others.cpu && /with cooler|wraith/i.test(others.cpu.name)) {
    return "This processor already includes a cooler. A second one is an extra part.";
  }
  if (part.cat === "case" && others.motherboard && formOf(part) && formOf(others.motherboard) && !fitsCase(part, others.motherboard)) {
    return "Case is too small for this motherboard.";
  }
  if (part.cat === "motherboard" && others.case && formOf(part) && formOf(others.case) && !fitsCase(others.case, part)) {
    return "This case is too small for that motherboard.";
  }
  if (part.cat === "cooler" && others.cpu?.socket) {
    const listed = coolerSockets(part);
    if (listed.length && !listed.includes(others.cpu.socket)) {
      return `Cooler lists ${listed.join(" / ")}. Processor is ${others.cpu.socket}.`;
    }
  }
  if (part.cat === "cpu" && others.cooler) {
    const listed = coolerSockets(others.cooler);
    if (part.socket && listed.length && !listed.includes(part.socket)) {
      return `Cooler already chosen lists ${listed.join(" / ")}.`;
    }
  }
  if (part.cat === "psu" && others.gpu) {
    const w = wattOf(part);
    const need = needWatts(others);
    if (w && w < need) return `${w}W supply. This card wants about ${need}W.`;
  }
  if (part.cat === "gpu" && others.psu) {
    const w = wattOf(others.psu);
    const need = needWatts({ ...others, gpu: part });
    if (w && w < need) return `Supply is ${w}W. This card wants about ${need}W.`;
  }
  return "";
}

export function reconcile(priority: Category, map: Build): Build {
  const kept: Build = {};
  const order = [priority, ...CATS.filter((c) => c !== priority)];
  for (const cat of order) {
    const part = map[cat];
    if (part && !fitWhy(part, kept)) kept[cat] = part;
  }
  if (kept.bundle && !bundleIntact(kept)) delete kept.bundle;
  return kept;
}

export function includedParts(part: Part): Part[] {
  const out: Part[] = [];
  for (const id of part.includes ?? []) {
    const found = byId.get(id);
    if (found) out.push(found);
  }
  return out;
}

function bundleIntact(build: Build): boolean {
  const bundle = build.bundle;
  if (!bundle?.includes?.length) return false;
  return bundle.includes.every((id) => {
    const part = byId.get(id);
    return !!part && build[part.cat]?.id === id;
  });
}

export function coveredByBundle(build: Build): Set<Category> {
  const covered = new Set<Category>();
  if (!bundleIntact(build) || !build.bundle) return covered;
  for (const id of build.bundle.includes ?? []) {
    const part = byId.get(id);
    if (part) covered.add(part.cat);
  }
  return covered;
}

/** The bundle wins. Extra parts stay only when they still fit beside it. */
export function applyBundle(part: Part, current: Build): Build {
  const next: Build = { bundle: part };
  for (const inc of includedParts(part)) next[inc.cat] = inc;
  for (const cat of CATS) {
    if (next[cat]) continue;
    const extra = current[cat];
    if (extra && !fitWhy(extra, next)) next[cat] = extra;
  }
  return next;
}

export function tagsOf(part: Part): string[] {
  const tags: string[] = [];
  const n = part.name.toUpperCase();
  if (part.socket) tags.push(part.socket);
  const ram = ramKindOf(part);
  if (ram) tags.push(ram);
  const form = formOf(part);
  if (form && part.cat !== "prebuilt" && part.cat !== "cpu" && part.cat !== "memory") tags.push(formLabel(form));
  if (/2230/.test(n)) tags.push("2230");
  else if (/2242/.test(n)) tags.push("2242");
  else if (/2280/.test(n)) tags.push("2280");
  if (/NVME|M\.2/.test(n)) tags.push("NVMe");
  else if (/HDD|HARD DRIVE|\d+\s?RPM/.test(n)) tags.push("HDD");
  else if (/SATA/.test(n)) tags.push("SATA");
  else if (/\bSSD\b/.test(n)) tags.push("SSD");
  const gen = n.match(/GEN\s?([345])|PCI-?E\s?(?:GEN\s?)?([345])/);
  if (gen) tags.push(`Gen${gen[1] || gen[2]}`);
  if (part.cat === "psu" || part.cat === "cpu" || part.cat === "gpu") {
    const w = wattOf(part);
    if (w) tags.push(`${w}W`);
  }
  if (part.cat === "storage" || part.cat === "memory") {
    const tb = n.match(/\b(\d+(?:\.\d+)?)\s*TB\b/);
    if (tb) tags.push(`${tb[1]}TB`);
    else {
      const gb = gbOf(part);
      if (gb) tags.push(`${gb}GB`);
    }
  }
  if (part.cat === "memory") tags.push(sticksOf(part) === 1 ? "1 stick" : `${sticksOf(part)} sticks`);
  const rad = n.match(/\b(120|140|240|280|360|420)\s?MM\b/);
  if (rad) tags.push(`${rad[1]}mm`);
  if (part.cat === "monitor") {
    const inch = part.name.match(/(\d{2}(?:\.\d)?)"/);
    if (inch) tags.push(`${inch[1]}"`);
    const kind = n.match(/\b(OLED|IPS|VA|FHD|QHD|UHD|4K)\b/);
    if (kind) tags.push(kind[1]);
    const hz = n.match(/(\d{2,3})\s*HZ/);
    if (hz) tags.push(`${hz[1]}Hz`);
  }
  if (part.cat === "bundle" && part.includes?.length) tags.push(`${part.includes.length} parts`);
  if (part.cat === "prebuilt") {
    const ramMatch = part.name.match(/(\d+)\s*GB(?!\s*SSD)/i);
    const disk = part.name.match(/(\d+(?:\.\d+)?)\s*(TB|GB)\s*SSD/i);
    const gpu = part.name.match(/RTX\s?\d{3,4}(?:\s?Ti)?|RX\s?\d{3,4}(?:\s?XT)?|UHD Graphics|HD Graphics|Intel Graphics/i);
    if (ramMatch) tags.push(`${ramMatch[1]}GB RAM`);
    if (disk) tags.push(`${disk[1]}${disk[2].toUpperCase()} SSD`);
    if (gpu) tags.push(gpu[0].replace(/\s+/g, " "));
    if (part.form === "aio") tags.push("All-in-one");
    else if (part.form === "mini") tags.push("Mini");
    else if (part.form === "gaming") tags.push("Gaming");
  }
  return [...new Set(tags)].slice(0, 6);
}

export function shelfNote(cat: Category, build: Build): string {
  const bits: string[] = [];
  if (cat === "cpu" && build.motherboard?.socket) bits.push(build.motherboard.socket);
  if (cat === "motherboard" && build.cpu?.socket) bits.push(build.cpu.socket);
  if (cat === "memory") {
    const want = ramKindOf(build.motherboard) || ramKindOf(build.cpu);
    if (want) bits.push(want);
    if (build.motherboard) bits.push(`up to ${dimmSlots(build.motherboard)} sticks`);
  }
  if (cat === "motherboard" && build.memory) {
    const kind = ramKindOf(build.memory);
    if (kind) bits.push(kind);
  }
  if (cat === "case" && build.motherboard && formOf(build.motherboard)) {
    bits.push(`fits ${formLabel(formOf(build.motherboard))}`);
  }
  if (cat === "motherboard" && build.case && formOf(build.case)) {
    bits.push(`fits in ${formLabel(formOf(build.case))}`);
  }
  if (cat === "psu" && build.gpu) bits.push(`${needWatts(build)}W and up`);
  if (cat === "gpu" && build.psu && wattOf(build.psu)) bits.push(`within ${wattOf(build.psu)}W`);
  if (cat === "cooler" && build.cpu?.socket) bits.push(build.cpu.socket);
  if (cat === "cooler" && build.cpu && /with cooler|wraith/i.test(build.cpu.name)) {
    bits.push("Skip this. A cooler is already in the processor box");
  }
  if (cat === "storage") {
    if (build.motherboard) {
      const slots = m2Slots(build.motherboard);
      bits.push(`Buy 1 drive. This board has ${slots} NVMe slots. Do not buy more`);
    } else bits.push("Buy 1 drive. A second pick replaces it");
  }
  if (cat === "monitor") bits.push("Optional");
  if (cat === "bundle") bits.push("Deal price replaces the parts inside");
  if (cat === "prebuilt") bits.push("Finished PCs. One price for the whole system");
  return bits.length ? bits.join(" · ") : "Full shelf";
}

export function warnings(build: Build): string[] {
  if (build.prebuilt) return [];
  const notes: string[] = [];
  const cpu = build.cpu;
  const gpu = build.gpu;
  if (cpu && !gpu) {
    const n = cpu.name.toUpperCase();
    const hasGraphics = /RADEON|GRAPHICS|GT\b|\d{4}G\b/.test(n) && !/\dF\b|KF\b/.test(n);
    const intelNoGpu = /\dF\b|KF\b/.test(n);
    if (intelNoGpu || (!hasGraphics && /RYZEN|INTEL|CORE/.test(n) && !/G\b|GT\b/.test(n))) {
      if (/\dF\b|KF\b|8400F|7400F/.test(n) || (!/RADEON|GRAPHICS/.test(n) && /RYZEN/.test(n) && !/GT\b|G\b/.test(cpu.name))) {
        notes.push("No graphics card, and this processor has no built-in graphics.");
      }
    }
  }
  if (build.cooler && build.case && formOf(build.case) === "itx") {
    const rad = build.cooler.name.toUpperCase().match(/\b(240|280|360|420)\s?MM\b/);
    if (rad) notes.push(`A ${rad[1]}mm cooler may not fit an ITX case.`);
  }
  if (cpu && build.cooler && /with cooler|wraith/i.test(cpu.name)) {
    notes.push("This processor already includes a cooler.");
  }
  if (build.psu && wattOf(build.psu) && wattOf(build.psu) < needWatts(build) && !coveredByBundle(build).has("psu")) {
    notes.push(`Power supply is ${wattOf(build.psu)}W. This build wants about ${needWatts(build)}W.`);
  }
  return notes;
}

export function spendOf(build: Build): number {
  if (build.prebuilt) return build.prebuilt.price + (build.monitor?.price ?? 0);
  const covered = coveredByBundle(build);
  return CATS.reduce((sum, cat) => {
    const part = build[cat];
    if (!part || (cat !== "bundle" && covered.has(cat))) return sum;
    return sum + part.price;
  }, 0);
}

export function shortName(part: Part): string {
  let name = part.name.replace(/\(Open Box\)/gi, "").replace(/\s+/g, " ").trim();
  if (part.brand && name.toUpperCase().startsWith(part.brand.toUpperCase())) {
    name = name.slice(part.brand.length).trim();
  }
  return name;
}

function cheapest(cat: Category, pred: (part: Part) => boolean): Part | undefined {
  let best: Part | undefined;
  for (const part of PARTS) {
    if (part.cat !== cat || isJunk(part, false)) continue;
    if (!pred(part)) continue;
    if (!best || part.price < best.price) best = part;
  }
  return best;
}

function bestGpu(cap: number, maxTier: number): Part | undefined {
  let best: Part | undefined;
  for (const part of PARTS) {
    if (part.cat !== "gpu" || isJunk(part, false) || part.price > cap + 0.001) continue;
    const tier = gpuTier(part);
    if (tier < 1 || tier > maxTier) continue;
    if (!best || tier > gpuTier(best) || (tier === gpuTier(best) && part.price < best.price)) best = part;
  }
  return best;
}

function hasIgpu(cpu: Part): boolean {
  return /radeon|graphics|5500GT|5600GT|8500G|8600G|8700G/i.test(cpu.name);
}

/** A complete, compatible build under a CAD budget, using the shelf. */
export function suggest(budget: number): Build {
  let cpu: Part | undefined;
  if (budget < 1000) cpu = cheapest("cpu", (p) => /5500GT|5600GT/.test(p.name));
  else if (budget < 1800) cpu = cheapest("cpu", (p) => /Ryzen 5 5500 /.test(p.name));
  else if (budget < 3000) cpu = cheapest("cpu", (p) => /Ryzen 5 7600/.test(p.name));
  else cpu = cheapest("cpu", (p) => /9700X/.test(p.name)) || cheapest("cpu", (p) => /7700X/.test(p.name));
  cpu = cpu || cheapest("cpu", () => true);
  if (!cpu) return {};

  const socket = cpu.socket || "AM4";
  const preferRam = socket === "AM5" || socket === "LGA1851" ? "DDR5" : socket === "AM4" ? "DDR4" : "";
  const board =
    cheapest(
      "motherboard",
      (p) =>
        p.socket === socket &&
        (!preferRam || !p.ram || p.ram === preferRam) &&
        (!formOf(p) || formOf(p) === "atx" || formOf(p) === "matx"),
    ) || cheapest("motherboard", (p) => p.socket === socket);
  if (!board) return { cpu };

  const boardRam = ramKindOf(board) || preferRam || "DDR4";
  const slots = dimmSlots(board);
  const wantGb = budget >= 2200 ? 32 : 16;
  const memPred = (gb: number, loose: boolean) => (p: Part) =>
    ramKindOf(p) === boardRam &&
    gbOf(p) === gb &&
    sticksOf(p) <= slots &&
    (sticksOf(p) === 2 || (loose && (sticksOf(p) === 1 || sticksOf(p) === 4)));
  const memory =
    cheapest("memory", memPred(wantGb, false)) ||
    cheapest("memory", memPred(wantGb, true)) ||
    cheapest("memory", memPred(16, true)) ||
    cheapest("memory", (p) => ramKindOf(p) === boardRam && sticksOf(p) <= slots);

  const ssd = (p: Part) => /SSD|NVME|M\.2/i.test(p.name) && !/HARD DRIVE|\bHDD\b/i.test(p.name);
  const disk = budget >= 3000 ? "2TB" : "1TB";
  const storage =
    cheapest("storage", (p) => ssd(p) && p.name.toUpperCase().includes(disk) && /NVME|M\.2/i.test(p.name)) ||
    cheapest("storage", (p) => ssd(p) && /NVME|M\.2/i.test(p.name)) ||
    cheapest("storage", ssd);

  const pcCase =
    cheapest("case", (p) => fitsCase(p, board) && formOf(p) !== "full") ||
    cheapest("case", (p) => fitsCase(p, board)) ||
    cheapest("case", () => true);

  const out: Build = { cpu, motherboard: board, memory, storage, case: pcCase };

  const includedCooler = /cooler|wraith/i.test(cpu.name);
  if (!includedCooler || budget > 2600) {
    const aio = cheapest(
      "cooler",
      (p) => /\b240\s?MM\b/i.test(p.name) && !fitWhy(p, out),
    );
    const air = cheapest("cooler", (p) => !fitWhy(p, out));
    out.cooler = budget > 2600 && aio ? aio : air;
  }

  let maxTier = budget >= 3600 ? 5 : budget >= 2200 ? 4 : budget >= 1400 ? 3 : budget >= 1000 ? 2 : 0;
  if (maxTier >= 1 || !hasIgpu(cpu)) {
    if (!hasIgpu(cpu) && maxTier < 2) maxTier = 2;
    const spent = spendOf(out);
    const gpu = bestGpu(Math.max(0, budget - spent - 70), maxTier);
    if (gpu) out.gpu = gpu;
  }

  const need = needWatts(out);
  out.psu =
    cheapest("psu", (p) => wattOf(p) >= need && wattOf(p) <= need + 250) ||
    cheapest("psu", (p) => wattOf(p) >= need);

  let guard = 0;
  while (spendOf(out) > budget + 1 && guard++ < 8) {
    if (out.cooler && includedCooler) {
      delete out.cooler;
      continue;
    }
    if (out.gpu && gpuTier(out.gpu) > 1) {
      const lower = bestGpu(out.gpu.price - 1, gpuTier(out.gpu) - 1);
      if (lower) {
        out.gpu = lower;
        const nextNeed = needWatts(out);
        out.psu =
          cheapest("psu", (p) => wattOf(p) >= nextNeed && wattOf(p) <= nextNeed + 250) ||
          cheapest("psu", (p) => wattOf(p) >= nextNeed);
        continue;
      }
      delete out.gpu;
      continue;
    }
    if (out.gpu) {
      delete out.gpu;
      continue;
    }
    break;
  }

  const priority = out.cpu ? "cpu" : "motherboard";
  return reconcile(priority, out);
}

export const BUDGETS = [
  { label: "Under $1,000", value: 1000 },
  { label: "Under $1,400", value: 1400 },
  { label: "Under $2,200", value: 2200 },
  { label: "Under $3,600", value: 3600 },
] as const;

export type AiPick = {
  id: string;
  name: string;
  kicker: string;
  why: string;
  tags: string[];
  best?: boolean;
  build: Build;
};

const CASE = "f97b3798ee";
const CASE_SMALL = "0059866cda";
const SSD1 = "0d6d289946";
const SSD2 = "e9ea0e8f1a";
const AIR = "7bb68f4649";
const PSU550 = "5d5b11a54a";
const PSU650 = "b13774ecd6";
const PSU750 = "33363adcbb";
const PSU850 = "abfe37bd5d";
const BOARD_AM4 = "b80a188b37";
const BOARD_AM5 = "5f5a90664b";
const BOARD_B850 = "34be25cc1f";
const DDR4_16 = "e06fc91f29";
const DDR4_32 = "dae600f39a";
const DDR5_16 = "47f243a92b";
const DDR5_32 = "d95a523fa2";
const GPU_9060 = "a94d77ee17";
const GPU_5060 = "0b368adbd0";
const GPU_9070 = "a7729c89db";
const GPU_9070XT = "c2af03954d";
const GPU_5070 = "f79f7e3de0";
const GPU_5070TI = "e5407756e1";
const SCREEN_1080 = "4aa181b957";
const SCREEN_1440 = "83d46c6e5d";

function buildFrom(ids: string[]): Build {
  const map: Build = {};
  for (const id of ids) {
    const part = byId.get(id);
    if (part) map[part.cat] = part;
  }
  if (map.bundle) return applyBundle(map.bundle, map);
  const priority = map.cpu ? "cpu" : map.motherboard ? "motherboard" : "gpu";
  return reconcile(priority, map);
}

/** Full PCs from this shelf, ranked by what the money buys. */
export function aiPicks(): AiPick[] {
  return [
    {
      id: "frames",
      name: "Price per performance, medium",
      kicker: "Best",
      best: true,
      tags: ["value", "1440", "perf"],
      why: "The Radeon RX 9070 16GB beats the more expensive 5060 Ti and 5070 on this shelf. DDR4 leaves the money in the graphics card.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "cheap",
      name: "Cheapest PC that turns on",
      kicker: "Cheapest",
      tags: ["cheap", "desk", "college"],
      why: "The floor. Built-in graphics, 16GB, one small drive, one case, one power supply. No extra parts.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, "222da28bfa", CASE, PSU550]),
    },
    {
      id: "college",
      name: "College: class, Zoom, essays",
      kicker: "College",
      tags: ["college", "desk"],
      why: "For Word, a browser, and Zoom. 32GB and a 1TB drive. No graphics card, because class does not need one.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550]),
    },
    {
      id: "photo",
      name: "Photoshop and class projects",
      kicker: "Photoshop",
      tags: ["college", "photo"],
      why: "32GB is the part Photoshop actually wants. A mid graphics card is enough for filters. One drive.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "cad",
      name: "AutoCAD for class",
      kicker: "AutoCAD",
      tags: ["college", "cad"],
      why: "AutoCAD likes an Intel chip, 32GB, and an NVIDIA card. This is for class files, not a render farm. One drive.",
      build: buildFrom(["5b8cc605f2", "bfed39ecdd", DDR4_32, GPU_5060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "console",
      name: "About as strong as a console",
      kicker: "Console",
      tags: ["1080", "games", "console"],
      why: "1080p, a real graphics card, and a 144Hz screen. It costs more than a console. You can change the parts later.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650, SCREEN_1080]),
    },
    {
      id: "gta",
      name: "GTA 6 ready, as far as anyone knows",
      kicker: "GTA 6",
      tags: ["games", "am5", "gta"],
      why: "PC specs are not out. This has 32GB, a 16GB graphics card, and a 2TB drive so you are not short when it lands.",
      build: buildFrom(["84d819ea71", BOARD_AM5, DDR5_32, GPU_9070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "max",
      name: "Most expensive on the shelf",
      kicker: "Top",
      tags: ["max", "am5"],
      why: "The top processor, a 64GB kit, an RTX 5080, and a 4K screen. You are paying for the ceiling, not for more frames per dollar.",
      build: buildFrom(["0e1b30db1f", "11a8a65f7a", "d96159d6eb", "ae7ff1d182", SSD2, "0522c8f24d", "0d6e4a6a3a", "c307b5e046", "81e3cc6157"]),
    },
    {
      id: "frames-16",
      name: "Same card, 16GB memory",
      kicker: "Tighter",
      tags: ["value", "1440"],
      why: "Drops to 16GB so the platform is a deal price. Close other apps while you play.",
      build: buildFrom(["2201e3c4ca", GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "frames-2tb",
      name: "Best build, 2TB drive",
      kicker: "More space",
      tags: ["value", "1440"],
      why: "The same frames-per-dollar PC with a 2TB drive, so games do not fill it immediately.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "small",
      name: "Best build, smaller case",
      kicker: "Smaller",
      tags: ["value", "1440"],
      why: "Same parts as the best build, in a micro-ATX case that still fits the board.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE_SMALL, PSU750, AIR]),
    },
    {
      id: "screen-1440",
      name: "Best build plus a 1440p screen",
      kicker: "With screen",
      tags: ["value", "1440", "screen"],
      why: "The value PC and a 27 inch 1440p 180Hz monitor. That screen matches the card.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR, SCREEN_1440]),
    },
    {
      id: "starter",
      name: "Price per performance, low",
      kicker: "Low",
      tags: ["value", "1080", "perf"],
      why: "Cheapest PC here that is not stuck on a low-end card. The 8GB RX 9060 XT is the ceiling, and the processor already includes a cooler.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "starter-2tb",
      name: "1080p with room for games",
      kicker: "1080p",
      tags: ["1080"],
      why: "The cheap 1080p PC with a 2TB drive instead of 1TB.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD2, CASE, PSU650]),
    },
    {
      id: "screen-1080",
      name: "1080p PC and a 144Hz screen",
      kicker: "With screen",
      tags: ["1080", "screen"],
      why: "The starter PC plus a 24.5 inch 144Hz monitor. Enough for that graphics card.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650, SCREEN_1080]),
    },
    {
      id: "nvidia-1080",
      name: "1080p, if you want NVIDIA",
      kicker: "NVIDIA",
      tags: ["nvidia", "1080"],
      why: "The cheapest RTX 5060 on the shelf. The Radeon 1080p build next to it gets you more for the same money.",
      build: buildFrom(["2dfbcfdbfb", GPU_5060, SSD1, CASE, PSU650]),
    },
    {
      id: "desk",
      name: "Desk PC, no graphics card",
      kicker: "No card",
      tags: ["desk"],
      why: "For a desk, not new games. The 5500GT has graphics and a cooler in the box, so you are not paying for a card you will not use.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "desk-32",
      name: "Desk PC, 32GB",
      kicker: "No card",
      tags: ["desk"],
      why: "Same office PC with 32GB, for a lot of browser tabs and light work.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550]),
    },
    {
      id: "light",
      name: "Light games, still no card",
      kicker: "No card",
      tags: ["desk"],
      why: "The 5600GT has the stronger built-in graphics on this cheap platform. It is still not a gaming PC.",
      build: buildFrom(["ebfe91bdf2", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "intel",
      name: "Intel, same value card",
      kicker: "Intel",
      tags: ["1440"],
      why: "A 10-core i5, board, and 16GB as a deal, then the same RX 9070. Pick this if you want Intel. The Ryzen build is the better frames buy.",
      build: buildFrom(["b6694fcce5", GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "work",
      name: "Work and play",
      kicker: "Cores",
      tags: ["work", "1440"],
      why: "20 cores and 32GB from a deal, plus the value graphics card and a 2TB drive. For edits and compiles, not just games.",
      build: buildFrom(["aeb7922d24", GPU_9070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "am5-1080",
      name: "1080p on a new socket",
      kicker: "Newer socket",
      tags: ["am5", "1080"],
      why: "A Ryzen 5 7600X you can replace later, 16GB of DDR5, and the RX 9060 XT. Memory is why this costs more than the AM4 starter.",
      build: buildFrom(["84d819ea71", BOARD_AM5, DDR5_16, GPU_9060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "am5-value",
      name: "1440p on a new socket",
      kicker: "Newer socket",
      tags: ["am5", "1440", "value"],
      why: "The cheap AM5 processor, 32GB, and the RX 9070. You pay the DDR5 tax and keep a socket you can upgrade.",
      build: buildFrom(["84d819ea71", BOARD_AM5, DDR5_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "keep",
      name: "Newer chip, same card",
      kicker: "Newer socket",
      tags: ["am5", "1440"],
      why: "A Ryzen 5 9600X instead of the 7600X. The card does not get faster. You are paying for the newer processor.",
      build: buildFrom(["9ab94a8d13", BOARD_AM5, DDR5_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "esports",
      name: "Tarkov and high frame rates",
      kicker: "Tarkov",
      tags: ["am5", "1440", "games"],
      why: "The 9800X3D is the chip Tarkov actually uses. 32GB, and an RX 9070 so the money stays in the processor.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "stop",
      name: "Price per performance, high",
      kicker: "High",
      tags: ["am5", "1440", "perf"],
      why: "The 9800X3D is only a little more than the 9700X and is the better gaming chip. The RX 9070 XT is the last step up before the 5070 Ti and 5080 cost more for each frame.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070XT, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "nvidia-1440",
      name: "1440p, if you want NVIDIA",
      kicker: "NVIDIA",
      tags: ["nvidia", "1440"],
      why: "The cheapest RTX 5070. It costs more than the RX 9070 and has 12GB. Only pick it if you want NVIDIA.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_5070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "nvidia-high",
      name: "NVIDIA, last sensible step",
      kicker: "NVIDIA",
      tags: ["nvidia", "am5"],
      why: "An RTX 5070 Ti 16GB with the 9800X3D. It is the NVIDIA card that still has 16GB. The Radeon 9070 XT build is the better price.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_5070TI, SSD2, CASE, PSU850, AIR]),
    },
  ];
}

export const AI_FILTERS = ["All", "Per frame", "Cheap", "College", "Games", "Value", "1080p", "1440p", "Newer socket", "NVIDIA", "No card", "Screen", "Work", "Top"] as const;

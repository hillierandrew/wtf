import raw from "@/data/parts.json";

export const CATS = [
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
  if (!allowOpenBox && /open\s?box|\[openbox\]|renewed|recertified/i.test(blob)) return true;
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
  const m = part.name.toUpperCase().match(/\b(\d+)\s*GB\b/);
  if (!m) return 0;
  const n = Number(m[1]);
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
  if (part.cat === "bundle" || part.cat === "monitor") return "";
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
  if (ram && part.cat !== "cpu") tags.push(ram);
  const form = formOf(part);
  if (form) tags.push(formLabel(form));
  if (part.cat === "psu" || part.cat === "cpu") {
    const w = wattOf(part);
    if (w) tags.push(`${w}W`);
  }
  const gb = part.cat === "memory" || part.cat === "storage" ? gbOf(part) : 0;
  if (gb) tags.push(`${gb}GB`);
  if (part.cat === "memory") tags.push(sticksOf(part) === 1 ? "1 stick" : `${sticksOf(part)} sticks`);
  const rad = n.match(/\b(120|140|240|280|360|420)\s?MM\b/);
  if (rad) tags.push(`${rad[1]}mm`);
  if (/NVME|M\.2/.test(n)) tags.push("NVMe");
  else if (/\bSSD\b/.test(n)) tags.push("SSD");
  else if (/HARD DRIVE|\bHDD\b/.test(n)) tags.push("HDD");
  if (part.cat === "monitor") {
    const inch = part.name.match(/(\d{2}(?:\.\d)?)"/);
    if (inch) tags.push(`${inch[1]}"`);
    if (/\b(FHD|QHD|UHD|4K|OLED|IPS|VA)\b/.test(n)) {
      const kind = n.match(/\b(OLED|IPS|VA|FHD|QHD|UHD|4K)\b/);
      if (kind) tags.push(kind[1]);
    }
    const hz = n.match(/(\d{2,3})\s*HZ/);
    if (hz) tags.push(`${hz[1]}Hz`);
  }
  if (part.cat === "bundle" && part.includes?.length) tags.push(`${part.includes.length} parts`);
  return tags.slice(0, 4);
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
  if (cat === "monitor") bits.push("Optional");
  if (cat === "bundle") bits.push("Deal price replaces the parts inside");
  return bits.length ? bits.join(" · ") : "Full shelf";
}

export function warnings(build: Build): string[] {
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

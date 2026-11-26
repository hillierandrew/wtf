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
  "mount",
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
  mount: "Mount",
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
  mount: "Mount",
};

export const PARTS: Part[] = raw as Part[];

export const byId = new Map(PARTS.map((p) => [p.id, p]));

const FORM_RANK: Record<string, number> = { itx: 1, matx: 2, atx: 3, eatx: 4, full: 4 };

export function partImage(part: Part): string {
  const base = import.meta.env.BASE_URL;
  const n = part.name.toUpperCase();
  let file = "cpu.jpg";
  if (part.cat === "motherboard") file = "board.jpg";
  else if (part.cat === "memory") file = "ram.jpg";
  else if (part.cat === "gpu") file = "gpu.jpg";
  else if (part.cat === "storage") file = /HDD|HARD DRIVE|\d+\s?RPM/.test(n) ? "hdd.jpg" : "nvme.jpg";
  else if (part.cat === "case") file = "case.jpg";
  else if (part.cat === "cooler") file = /LIQUID|AIO|240|280|360|420/.test(n) ? "aio.jpg" : "air.jpg";
  else if (part.cat === "psu") file = "psu.jpg";
  else if (part.cat === "monitor" || part.cat === "mount") file = "monitor.jpg";
  else if (part.cat === "prebuilt") file = "tower.jpg";
  else if (part.cat === "bundle") file = /RX|RTX|GEFORCE|RADEON/.test(n) ? "gpu.jpg" : /CASE|D32|4000D|DY460/.test(n) ? "case.jpg" : "cpu.jpg";
  return `${base}parts/${file}`;
}

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
  if (!allowOpenBox && /open\s?box|\[openbox\]/i.test(blob)) return true;
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
  if (form === "itx") return "Mini-ITX";
  if (form === "matx") return "Micro-ATX";
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
  const tb = upper.match(/(\d+(?:\.\d+)?)\s*TB\b/);
  if (tb && (part.cat === "storage" || part.cat === "memory" || part.cat === "prebuilt")) return Math.round(Number(tb[1]) * 1000);
  const gb = upper.match(/(\d+)\s*GB\b/);
  if (gb) {
    const n = Number(gb[1]);
    if (part.cat === "storage" && n >= 120 && n <= 8000) return n;
    if (part.cat === "memory" && n >= 4 && n <= 256) return n;
    if (n >= 4 && n <= 256 && part.cat !== "gpu") return n;
  }
  const short = upper.match(/(\d+)\s*G\b/);
  if (short && part.cat === "storage") {
    const n = Number(short[1]);
    if (n >= 120 && n <= 8000) return n;
  }
  return 0;
}

/** Lower is a better price. Null when this part has no size or speed to divide by. */
export function unitCost(part: Part): { text: string; amount: number } | null {
  if (part.cat === "storage" || part.cat === "memory") {
    const size = gbOf(part);
    if (!size) return null;
    const amount = part.price / size;
    return { text: `${money(amount)}/GB`, amount };
  }
  if (part.cat === "bundle") {
    const scored = scoreBundleText(bundleBlob(part), part.price);
    if (!scored.computer) return null;
    const amount = part.price / scored.score;
    return { text: `${money(amount)}/point`, amount };
  }
  const points = part.cat === "gpu" ? gpuIndex(part) : part.cat === "cpu" ? cpuPoints(part.name) : part.cat === "prebuilt" ? machineScore(part.name) : part.cat === "psu" ? wattOf(part) : 0;
  if (!points) return null;
  const amount = part.price / points;
  const unit = part.cat === "psu" ? "W" : "point";
  return { text: `${money(amount)}/${unit}`, amount };
}

function cpuPoints(name: string): number {
  const n = name.toUpperCase();
  if (/9800X3D|9850X3D|9950X3D/.test(n)) return 96;
  if (/7800X3D|9700X|9900X/.test(n)) return 84;
  if (/X3D/.test(n)) return 88;
  if (/ULTRA\s?9|7950|9950|I9-/.test(n)) return 78;
  if (/ULTRA\s?7|7700|9700|I7-/.test(n)) return 62;
  if (/ULTRA\s?5|7600|9600|I5-/.test(n)) return 46;
  if (/RYZEN\s?5|I3-/.test(n)) return 32;
  if (/RYZEN|INTEL|CORE/.test(n)) return 24;
  return 0;
}

export type Rank = { name: "Crystal" | "Gold" | "Silver" | "Bronze" | "Brown"; score: number; bg: string; fg: string };

export function rankFrom(score: number): Rank {
  const n = Math.max(0, Math.min(100, Math.round(score)));
  if (n >= 90) return { name: "Crystal", score: n, bg: "#d7f6ff", fg: "#083844" };
  if (n >= 75) return { name: "Gold", score: n, bg: "#f6d98a", fg: "#3a2804" };
  if (n >= 55) return { name: "Silver", score: n, bg: "#e7e7e7", fg: "#242424" };
  if (n >= 35) return { name: "Bronze", score: n, bg: "#e8b48a", fg: "#3a220f" };
  return { name: "Brown", score: n, bg: "#c4a07a", fg: "#2a160c" };
}

function bundleBlob(part: Part): string {
  return [part.name, ...includedParts(part).map((item) => item.name)].join(" + ");
}

function namedPart(name: string, cat: Category): Part {
  return { id: "", name, price: 0, was: null, cat, brand: "", socket: null, ram: null, watt: null, form: null };
}

function cardSpeed(text: string): number {
  const chunk = text.split(/\s*\+\s*/).find((piece) => /\b(RTX|RX|GEFORCE)\b/i.test(piece));
  if (!chunk) return 0;
  const card = namedPart(chunk, "gpu");
  return gpuKnown(card) || [0, 20, 40, 60, 85, 120, 170][gpuTier(card)] || 0;
}

function systemRamGb(text: string): number {
  let best = 0;
  for (const chunk of text.split(/\s*\+\s*|,\s*/)) {
    if (!/DDR/i.test(chunk)) continue;
    const size = chunk.match(/(\d+)\s*GB/i);
    if (size) best = Math.max(best, Number(size[1]));
  }
  return best;
}

/** Computer bundles only. A wheel, a chair, or a cable stays at 0. */
export function scoreBundleText(text: string, price = 0): { computer: boolean; score: number; lines: string[] } {
  const chipPts = cpuPoints(text);
  const chipScore = chipPts ? Math.min(100, Math.round((chipPts / 96) * 100)) : 0;
  const speed = cardSpeed(text);
  const cardScore = speed ? Math.min(100, Math.round((speed / 180) * 100)) : 0;
  const ram = systemRamGb(text);
  const ramPts = ram >= 64 ? 12 : ram >= 32 ? 8 : ram >= 16 ? 4 : 0;
  const computer = chipScore > 0 || cardScore > 0;
  const main = Math.max(chipScore, cardScore);
  const side = Math.round(Math.min(chipScore, cardScore) * 0.15);
  const score = computer ? Math.min(100, main + side + ramPts) : 0;
  const rank = rankFrom(score);
  const lines = computer
    ? [
        `${rank.name} ${rank.score}. ${BANDS}`,
        `Chip points are ${chipPts} out of 96, which becomes ${chipScore}. A 9800X3D is 96. The same chip table as a loose processor.`,
        `Card speed is ${speed} out of 180, which becomes ${cardScore}. An RX 9070 is 100 speed. A 5090 is 180. No card is 0.`,
        `The higher of those two is kept. The lower one adds ${side}, which is 15 percent.`,
        `Memory adds ${ramPts}. ${ram || 0} GB of DDR. 64GB is 12, 32GB is 8, 16GB is 4. Gigabytes on the graphics card do not count.`,
        `${main} + ${side} + ${ramPts} = ${score}.`,
      ]
    : ["No computer score. This bundle is a wheel, a chair, a case, or a cable. It is not a chip or a card."];
  if (computer && price > 0) lines.push(`${money(price)} ÷ ${score} = ${money(price / score)} per point.`);
  return { computer, score, lines };
}

/** 0 to 100 for this part. Crystal is the top. Brown is the bottom. */
export function partScore(part: Part): number {
  if (part.cat === "bundle") return scoreBundleText(bundleBlob(part)).score;
  if (part.cat === "gpu") {
    const speed = gpuIndex(part);
    return speed ? Math.min(100, Math.round((speed / 180) * 100)) : 8;
  }
  if (part.cat === "cpu") {
    const points = cpuPoints(part.name);
    return points ? Math.min(100, Math.round((points / 96) * 100)) : 20;
  }
  if (part.cat === "prebuilt") return machineScore(part.name);
  if (part.cat === "memory") {
    const size = gbOf(part);
    const name = part.name.toUpperCase();
    let score = name.includes("DDR5") ? 42 : name.includes("DDR4") ? 28 : 14;
    score += Math.min(38, Math.round((size / 64) * 38));
    const mhz = name.match(/(\d{4})\s*MHZ/);
    if (mhz) score += Number(mhz[1]) >= 6000 ? 20 : Number(mhz[1]) >= 3600 ? 12 : 6;
    return Math.min(100, score);
  }
  if (part.cat === "storage") {
    const name = part.name.toUpperCase();
    const size = gbOf(part);
    let score = /HDD|HARD DRIVE|RPM/.test(name) ? 22 : /GEN\s?5|PCIE\s?5/.test(name) ? 78 : /NVME|GEN\s?4|PCIE/.test(name) ? 62 : 40;
    score += Math.min(18, Math.round(size / 400));
    return Math.min(100, score);
  }
  if (part.cat === "psu") {
    const watts = wattOf(part);
    const name = part.name.toUpperCase();
    let score = Math.min(70, Math.round(watts / 14));
    if (/TITANIUM/.test(name)) score += 24;
    else if (/PLATINUM/.test(name)) score += 18;
    else if (/GOLD/.test(name)) score += 12;
    else if (/BRONZE/.test(name)) score += 4;
    return Math.min(100, score || 20);
  }
  if (part.cat === "monitor") {
    const name = part.name.toUpperCase();
    let score = /4K|3840|UHD/.test(name) ? 70 : /1440|QHD/.test(name) ? 55 : 36;
    const hz = name.match(/(\d{2,3})\s*HZ/);
    if (hz) score += Number(hz[1]) >= 240 ? 25 : Number(hz[1]) >= 144 ? 16 : 6;
    return Math.min(100, score);
  }
  if (part.cat === "motherboard") {
    const name = part.name.toUpperCase();
    if (/X870|Z890|X670/.test(name)) return 90;
    if (/B850|B650|Z790/.test(name)) return 74;
    if (/B550|B760/.test(name)) return 58;
    if (/A620|H610|A520|H510/.test(name)) return 36;
    return 48;
  }
  if (part.cat === "cooler") {
    const name = part.name.toUpperCase();
    if (/420|360/.test(name)) return 88;
    if (/280|240|AIO|LIQUID/.test(name)) return 72;
    return 52;
  }
  if (part.cat === "case") {
    const form = formOf(part);
    if (form === "full" || form === "eatx") return 78;
    if (form === "atx") return 66;
    if (form === "matx") return 54;
    if (form === "itx") return 60;
    return 50;
  }
  return 45;
}

export function partRank(part: Part): Rank {
  return rankFrom(partScore(part));
}

export type ShelfSort = "price-asc" | "price-desc" | "score-desc" | "score-asc" | "deal-asc" | "deal-desc" | "gig-asc" | "gig-desc";

export const SHELF_SORTS: { id: ShelfSort; label: string }[] = [
  { id: "price-asc", label: "Price low" },
  { id: "price-desc", label: "Price high" },
  { id: "score-desc", label: "Score high" },
  { id: "score-asc", label: "Score low" },
  { id: "deal-asc", label: "Best $/point" },
  { id: "deal-desc", label: "Worst $/point" },
  { id: "gig-asc", label: "Best $/GB" },
  { id: "gig-desc", label: "Worst $/GB" },
];

function finite(value: number, desc: boolean, other: number): number {
  const missing = !Number.isFinite(value);
  const otherMissing = !Number.isFinite(other);
  if (missing && otherMissing) return 0;
  if (missing) return 1;
  if (otherMissing) return -1;
  return desc ? other - value : value - other;
}

export function compareShelf(a: Part, b: Part, sort: ShelfSort): number {
  const score = (part: Part) => partScore(part);
  const deal = (part: Part) => unitCost(part)?.amount ?? Number.POSITIVE_INFINITY;
  const gig = (part: Part) => {
    if (part.cat !== "storage" && part.cat !== "memory") return Number.POSITIVE_INFINITY;
    const size = gbOf(part);
    return size ? part.price / size : Number.POSITIVE_INFINITY;
  };
  if (sort === "price-desc") return b.price - a.price;
  if (sort === "score-desc" || sort === "score-asc") return finite(score(a), sort === "score-desc", score(b)) || a.price - b.price;
  if (sort === "deal-desc" || sort === "deal-asc") return finite(deal(a), sort === "deal-desc", deal(b)) || a.price - b.price;
  if (sort === "gig-desc" || sort === "gig-asc") return finite(gig(a), sort === "gig-desc", gig(b)) || a.price - b.price;
  return a.price - b.price;
}

const BANDS = "Crystal is 90 to 100. Gold is 75 to 89. Silver is 55 to 74. Bronze is 35 to 54. Brown is under 35. Scoring v2. This number is an estimate from the product name, not a lab test.";

export function explainPart(part: Part): string[] {
  const score = partScore(part);
  const rank = rankFrom(score);
  const lines = [`${rank.name} ${rank.score}. ${BANDS}`];
  const name = part.name.toUpperCase();
  if (part.cat === "gpu") {
    const speed = gpuIndex(part) || 0;
    lines.push(`Speed points are ${speed}. An RX 9070 is 100. A 5090 is 180.`);
    lines.push(`Score is ${speed} ÷ 180 × 100 = ${speed ? Math.min(100, Math.round((speed / 180) * 100)) : 8}.`);
    if (speed) lines.push(`${money(part.price)} ÷ ${speed} speed points = ${money(part.price / speed)} per point.`);
    else lines.push("This card is not in the estimate table, so it is not given a speed score here.");
  } else if (part.cat === "cpu") {
    const points = cpuPoints(part.name);
    lines.push(`Chip points are ${points || 0} out of 96. A 9800X3D is 96. An older chip is lower.`);
    lines.push(`Score is ${points || 0} ÷ 96 × 100 = ${points ? Math.min(100, Math.round((points / 96) * 100)) : 20}.`);
    if (points) lines.push(`${money(part.price)} ÷ ${points} chip points = ${money(part.price / points)} per point.`);
  } else if (part.cat === "memory") {
    const size = gbOf(part);
    const ddr = name.includes("DDR5") ? "DDR5 starts at 42" : name.includes("DDR4") ? "DDR4 starts at 28" : "Older memory starts at 14";
    const sizePts = Math.min(38, Math.round((size / 64) * 38));
    const mhz = name.match(/(\d{4})\s*MHZ/);
    const speedPts = mhz ? (Number(mhz[1]) >= 6000 ? 20 : Number(mhz[1]) >= 3600 ? 12 : 6) : 0;
    lines.push(`${ddr}. ${size || "Unknown"} GB adds ${sizePts}. ${mhz ? `${mhz[1]} MHz adds ${speedPts}` : "No speed listed"}.`);
    lines.push(`Those add up to ${score}, then stop at 100.`);
    if (size) lines.push(`${money(part.price)} ÷ ${size} GB = ${money(part.price / size)} per GB.`);
  } else if (part.cat === "storage") {
    const size = gbOf(part);
    const base = /HDD|HARD DRIVE|RPM/.test(name) ? "A hard drive starts at 22" : /GEN\s?5|PCIE\s?5/.test(name) ? "A Gen5 drive starts at 78" : /NVME|GEN\s?4|PCIE/.test(name) ? "A Gen4 NVMe starts at 62" : "A SATA SSD starts at 40";
    lines.push(`${base}. Size adds up to 18 more points (${size || 0} GB).`);
    lines.push(`That total is ${score}.`);
    if (size) lines.push(`${money(part.price)} ÷ ${size} GB = ${money(part.price / size)} per GB.`);
  } else if (part.cat === "psu") {
    const watts = wattOf(part);
    lines.push(`${watts || "Unknown"} watts. Score is about watts ÷ 14, plus extra for Gold, Platinum, or Titanium.`);
    lines.push(`That total is ${score}.`);
    if (watts) lines.push(`${money(part.price)} ÷ ${watts} W = ${money(part.price / watts)} per watt.`);
  } else if (part.cat === "prebuilt") {
    const bits = machineParts(part.name);
    lines.push("Formula: graphics + memory + drive + cache. Then the score stops at 100.");
    lines.push(`Graphics = ${bits.gpu}. A 5090 is 88. A 5080 is 80. A 5070 Ti is 72. A 9070 XT is 70. A 5070 is 64. A 9070 is 62. A 5060 Ti is 56. A 9060 is 52. A 5060 is 50. A 3050 is 28. No known card is 8.`);
    lines.push(`Memory = ${bits.ramPts}. ${bits.ram || 0} GB in the name. 64GB is 16, 32GB is 12, 16GB is 6, less is 0.`);
    lines.push(`Drive = ${bits.diskPts}. ${bits.disk || 0} TB of SSD. 4TB is 8, 2TB is 6, 1TB is 4, 0.5TB is 2, less is 0.`);
    lines.push(`Cache = ${bits.cpuPts}. An X3D chip is 6. Any other chip is 0.`);
    lines.push(`Upgrade = ${bits.room}. A tower is 6, because the card, memory, drive, and power supply can be changed later. A tiny case is 4. An all-in-one is 2.`);
    lines.push(`${bits.gpu} + ${bits.ramPts} + ${bits.diskPts} + ${bits.cpuPts} + ${bits.room} = ${bits.raw}, which becomes ${bits.score}.`);
    lines.push(`${money(part.price)} ÷ ${bits.score} = ${money(part.price / bits.score)} per point.`);
    lines.push(`TLDR: ${rank.name} ${bits.score}. The graphics number is most of it. ${bits.ram || 0} GB of memory is ${bits.ramPts} points. The drive is ${bits.diskPts}. Upgrade room is ${bits.room}. You pay ${money(part.price / bits.score)} per point.`);
  } else if (part.cat === "monitor") {
    lines.push("1080p starts at 36, 1440p at 55, 4K at 70. 144Hz adds 16. 240Hz adds 25.");
  } else if (part.cat === "motherboard") {
    lines.push("A top chipset is about 90. A mid board is about 70. A basic board is about 36 to 58.");
  } else if (part.cat === "cooler") {
    lines.push("A 360mm liquid cooler is 88. A smaller liquid cooler is 72. An air cooler is 52.");
  } else if (part.cat === "case") {
    lines.push("This is a size rank, not a speed score. A bigger case scores higher because more boards fit.");
  } else if (part.cat === "bundle") {
    const scored = scoreBundleText(bundleBlob(part), part.price);
    if (!scored.computer) return scored.lines;
    lines.push(...scored.lines.slice(1));
  }
  lines.push("Lower dollars per point, or per gigabyte, is the better price.");
  return lines;
}

export function explainBuild(build: Build): string[] {
  const score = aiScore(build);
  const spend = spendOf(build);
  const rank = rankFrom(score);
  const gpu = build.gpu ? gpuIndex(build.gpu) : 0;
  const base = gpu ? Math.round((gpu / 180) * 82) : 12;
  const ram = build.memory ? gbOf(build.memory) : 0;
  const disk = build.storage ? gbOf(build.storage) : 0;
  const ramPts = ram >= 64 ? 10 : ram >= 32 ? 6 : ram >= 16 ? 3 : 0;
  const diskPts = disk >= 2000 ? 4 : disk >= 1000 ? 2 : 0;
  const cpuPts = /X3D/.test(build.cpu?.name.toUpperCase() ?? "") ? 4 : 0;
  const lines = [
    `${rank.name} ${rank.score}. ${BANDS}`,
    gpu ? `Graphics speed is ${gpu}. ${gpu} ÷ 180 × 82 = ${base}.` : "No graphics card, so the base is 12.",
    `Memory adds ${ramPts}. The drive adds ${diskPts}. A 3D-cache chip adds ${cpuPts}.`,
    `${base} + ${ramPts} + ${diskPts} + ${cpuPts} = ${score}.`,
    `${money(spend)} ÷ ${score} = ${money(spend / score)} per point.`,
  ];
  if (build.storage && disk) lines.push(`Drive: ${money(build.storage.price)} ÷ ${disk} GB = ${money(build.storage.price / disk)} per GB.`);
  if (build.memory && ram) lines.push(`Memory: ${money(build.memory.price)} ÷ ${ram} GB = ${money(build.memory.price / ram)} per GB.`);
  lines.push("Lower dollars per point is more computer for the money.");
  return lines;
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

export type PsuNeed = { min: number; comfortable: number; card: number };

/** Smallest supply that should run the card, and a comfortable one with room for the rest of the PC. */
export function psuForGpu(part: Part): PsuNeed {
  const n = part.name.toUpperCase();
  const rows: [RegExp, number, number, number][] = [
    [/5090/, 1000, 1200, 575],
    [/5080/, 850, 1000, 360],
    [/5070\s?TI/, 750, 850, 300],
    [/\b5070\b/, 650, 750, 250],
    [/5060\s?TI/, 550, 650, 180],
    [/5060|5050/, 550, 650, 145],
    [/4090/, 850, 1000, 450],
    [/4080/, 750, 850, 320],
    [/4070\s?TI/, 700, 850, 285],
    [/\b4070\b/, 650, 750, 200],
    [/4060\s?TI/, 550, 650, 165],
    [/\b4060\b/, 450, 550, 115],
    [/3090/, 750, 850, 350],
    [/3080/, 750, 850, 320],
    [/\b3070\b/, 650, 750, 220],
    [/\b3060\b/, 550, 650, 170],
    [/\b3050\b/, 450, 550, 130],
    [/9070\s?XT/, 750, 850, 304],
    [/\b9070\b/, 650, 750, 220],
    [/9060/, 550, 650, 180],
    [/7900\s?XTX/, 850, 1000, 355],
    [/7900/, 750, 850, 315],
    [/7800/, 700, 850, 263],
    [/7700/, 650, 750, 245],
    [/\b7600\b/, 550, 650, 165],
    [/6800|6750/, 650, 750, 250],
    [/6700|6650|6600/, 500, 650, 160],
    [/B580/, 600, 650, 190],
    [/A770/, 600, 750, 225],
    [/A750/, 550, 650, 225],
    [/1660|1650/, 450, 550, 120],
    [/1050/, 300, 400, 75],
    [/1030/, 300, 400, 30],
  ];
  for (const [re, min, comfortable, card] of rows) {
    if (re.test(n)) return { min, comfortable, card };
  }
  const tier = gpuTier(part);
  if (tier >= 6) return { min: 1000, comfortable: 1200, card: 450 };
  if (tier >= 5) return { min: 850, comfortable: 1000, card: 320 };
  if (tier >= 4) return { min: 750, comfortable: 850, card: 250 };
  if (tier >= 3) return { min: 550, comfortable: 650, card: 160 };
  if (tier >= 2) return { min: 500, comfortable: 600, card: 130 };
  if (tier >= 1) return { min: 400, comfortable: 500, card: 75 };
  return { min: 450, comfortable: 550, card: 75 };
}

/** Rough speed where an RX 9070 is 100. Not a lab benchmark. 0 means the card is not in the table. */
export function gpuKnown(part: Part): number {
  const n = part.name.toUpperCase();
  if (/5090/.test(n)) return 180;
  if (/5080/.test(n)) return 148;
  if (/5070\s?TI/.test(n)) return 122;
  if (/9070\s?XT/.test(n)) return 116;
  if (/\b9070\b/.test(n) && !/GRE/.test(n)) return 100;
  if (/\b5070\b/.test(n)) return 90;
  if (/5060\s?TI/.test(n) && /16\s?G/.test(n)) return 78;
  if (/5060\s?TI/.test(n)) return 72;
  if (/9060\s?XT/.test(n) && /16\s?G/.test(n)) return 68;
  if (/9060/.test(n)) return 64;
  if (/\b5060\b/.test(n)) return 62;
  if (/\b7600\b/.test(n)) return 55;
  if (/3050/.test(n)) return 32;
  if (/4090/.test(n)) return 170;
  if (/4080/.test(n)) return 140;
  if (/4070\s?TI/.test(n)) return 110;
  if (/\b4070\b/.test(n)) return 88;
  if (/4060\s?TI/.test(n)) return 70;
  if (/\b4060\b/.test(n)) return 58;
  if (/3090/.test(n)) return 130;
  if (/3080/.test(n)) return 115;
  if (/\b3070\b/.test(n)) return 80;
  if (/\b3060\b/.test(n)) return 48;
  if (/7900\s?XTX/.test(n)) return 150;
  if (/7900/.test(n)) return 125;
  if (/7800\s?XT/.test(n)) return 105;
  if (/7700/.test(n)) return 78;
  return 0;
}

/** Rough speed where an RX 9070 is 100. Not a lab benchmark. */
export function gpuIndex(part: Part): number {
  const known = gpuKnown(part);
  if (known) return known;
  const tier = gpuTier(part);
  return [0, 20, 40, 60, 85, 120, 170][tier] ?? 0;
}

/** 0 to 100. A 5090 is the top. An old office PC is near the bottom. */
export function machineParts(name: string) {
  const n = name.toUpperCase();
  let gpu = 8;
  if (/5090/.test(n)) gpu = 88;
  else if (/5080/.test(n)) gpu = 80;
  else if (/5070\s?TI/.test(n)) gpu = 72;
  else if (/9070\s?XT/.test(n)) gpu = 70;
  else if (/\b9070\b/.test(n)) gpu = 62;
  else if (/\b5070\b/.test(n)) gpu = 64;
  else if (/5060\s?TI/.test(n)) gpu = 56;
  else if (/9060/.test(n)) gpu = 52;
  else if (/\b5060\b/.test(n)) gpu = 50;
  else if (/3050/.test(n)) gpu = 28;
  else if (/ULTRA\s?9|RYZEN\s?AI|780M|890M/.test(n)) gpu = 24;
  else if (/ULTRA\s?[57]|RYZEN\s?[57]\s?(2|7|8|9)\d{3}/.test(n)) gpu = 16;
  else if (/I[57]-1[34]\d{3}|RYZEN\s?[57]\s?5\d{3}/.test(n)) gpu = 12;
  const ramMatch = n.match(/(\d+)\s*GB(?!\s*SSD)/);
  const ram = ramMatch ? Number(ramMatch[1]) : 0;
  const ramPts = ram >= 64 ? 16 : ram >= 32 ? 12 : ram >= 16 ? 6 : 0;
  const tb = n.match(/(\d+(?:\.\d+)?)\s*TB\s*SSD/);
  const gb = n.match(/(\d+)\s*GB\s*SSD/);
  const disk = tb ? Number(tb[1]) : gb ? Number(gb[1]) / 1000 : 0;
  const diskPts = disk >= 4 ? 8 : disk >= 2 ? 6 : disk >= 1 ? 4 : disk >= 0.5 ? 2 : 0;
  const cpuPts = /X3D/.test(n) ? 6 : 0;
  const room = /ALL-IN-ONE|\bAIO\b/.test(n) ? 2 : /\bMINI\b|\bITX\b/.test(n) ? 4 : 6;
  const raw = gpu + ramPts + diskPts + cpuPts + room;
  return { gpu, ram, ramPts, disk, diskPts, cpuPts, room, raw, score: Math.max(1, Math.min(100, raw)) };
}

export function machineScore(name: string): number {
  return machineParts(name).score;
}

export function laptopBits(item: { gpu: number; specs: string; price?: number; name?: string; kind?: string }) {
  const ramMatch = item.specs.match(/(\d+)GB memory/i);
  const ram = ramMatch ? Number(ramMatch[1]) : 0;
  const disk = item.specs.match(/(\d+(?:\.\d+)?)(TB|GB) storage/i);
  const diskTb = disk ? (disk[2].toUpperCase() === "TB" ? Number(disk[1]) : Number(disk[1]) / 1000) : 0;
  const diskPts = diskTb >= 2 ? 6 : diskTb >= 1 ? 4 : diskTb >= 0.5 ? 2 : 0;
  const ramPts = ram >= 64 ? 16 : ram >= 32 ? 12 : ram >= 16 ? 6 : 0;
  const gpu = item.gpu >= 100 ? 88 : item.gpu >= 90 ? 80 : item.gpu >= 80 ? 72 : item.gpu >= 72 ? 64 : item.gpu >= 60 ? 52 : item.gpu >= 45 ? 40 : item.gpu >= 28 ? 30 : ram >= 16 ? 14 : 8;
  const blob = `${item.name ?? ""} ${item.specs} ${item.kind ?? ""}`.toUpperCase();
  const room = /TABLET|CHROME|SOLDER|NOT UPGRAD/.test(blob) ? 0 : item.gpu >= 45 ? 4 : 2;
  const raw = gpu + ramPts + diskPts + room;
  return { gpu, chip: item.gpu, ram, ramPts, diskTb, diskPts, room, raw, score: Math.max(1, Math.min(100, raw)) };
}

export function explainLaptop(item: { name?: string; price: number; gpu: number; specs: string }): string[] {
  const bits = laptopBits(item);
  const rank = rankFrom(bits.score);
  return [
    `${rank.name} ${rank.score}. ${BANDS}`,
    "Formula: graphics + memory + drive + upgrade. The result stops at 100.",
    `Graphics = ${bits.gpu}. The chip power number is ${bits.chip}. 100 or more means 88. 90 means 80. 80 means 72. 72 means 64. 60 means 52. 45 means 40. 28 means 30. Otherwise 16GB of memory makes it 14, and less memory makes it 8.`,
    `Memory = ${bits.ramPts}. ${bits.ram || 0} GB. 64GB is 16, 32GB is 12, 16GB is 6, less is 0.`,
    `Drive = ${bits.diskPts}. ${bits.diskTb || 0} TB. 2TB is 6, 1TB is 4, 0.5TB is 2, smaller is 0.`,
    `Upgrade = ${bits.room}. A gaming laptop is 4, because the drive and often the memory can be changed. A home laptop is 2. A Chromebook or tablet is 0. Buy the memory you need today if it is 0.`,
    `${bits.gpu} + ${bits.ramPts} + ${bits.diskPts} + ${bits.room} = ${bits.raw}, which becomes ${bits.score}.`,
    `${money(item.price)} ÷ ${bits.score} = ${money(item.price / bits.score)} per point.`,
    `TLDR: ${rank.name} ${bits.score}. Graphics ${bits.gpu}, ${bits.ram || 0} GB is ${bits.ramPts}, the drive is ${bits.diskPts}, upgrade room is ${bits.room}. ${money(item.price / bits.score)} per point.`,
  ];
}

export function dealFrom(price: number, score: number) {
  const per = price / Math.max(1, score);
  if (per <= 14) return { name: "Steal" as const, per, bg: "#d9f5d6", fg: "#145214", ring: "#1f7a34", say: "Hand them this if the budget is the whole conversation." };
  if (per <= 22) return { name: "Fair" as const, per, bg: "#d7ecff", fg: "#0b3558", ring: "#1d4ed8", say: "A normal price for this much computer." };
  if (per <= 32) return { name: "Full" as const, per, bg: "#fff1cc", fg: "#5a3b00", ring: "#b45309", say: "You are paying the sticker. It is not a bargain." };
  return { name: "Stretch" as const, per, bg: "#ffe0e0", fg: "#6b1420", ring: "#be123c", say: "The computer is fine. The price is the part to talk about." };
}

export function dealLines(price: number, score: number, room: number): string[] {
  const deal = dealFrom(price, score);
  const roomLine = room >= 6 ? "A tower. Card, memory, drive, and power supply can change later." : room >= 4 ? "Some room later. Memory and the drive, sometimes the card." : room >= 2 ? "A little room. Usually the drive." : "Sealed. Buy the memory and the storage they need today.";
  return [
    `${deal.name}. ${money(price)} ÷ ${score} = ${money(deal.per)} per point.`,
    "Steal is $14 or less per point. Fair is $22 or less. Full is $32 or less. Stretch is above that.",
    "This is this store's rule for a whole computer. It is not a Canada-wide price survey.",
    `Upgrade room on the power score is ${room}. ${roomLine}`,
    `TLDR: ${deal.say} ${money(deal.per)} per point. Power is a different rank. This one is only the price.`,
  ];
}

export function faceTags(name: string): string[] {
  const n = name.toUpperCase();
  const tags: string[] = [];
  if (/OLED/.test(n)) tags.push("OLED");
  else if (/\bIPS\b/.test(n)) tags.push("IPS");
  else if (/\bVA\b/.test(n)) tags.push("VA");
  if (/4K|UHD|3840/.test(n)) tags.push("4K");
  else if (/QHD|1440|\b2K\b|2560/.test(n)) tags.push("2K");
  else if (/FHD|1080/.test(n)) tags.push("1080p");
  const inch = name.match(/(\d{2}(?:\.\d)?)\s*(?:"|INCH)/i);
  if (inch) tags.push(`${inch[1]}"`);
  if (/NO BACK-?LIGHT|NON-?BACKLIT|NO BACKLIT/.test(n)) tags.push("No backlight");
  else if (/BACK-?LIT|BACKLIGHT|RGB KEYBOARD/.test(n)) tags.push("Backlit keyboard");
  return tags;
}

export function aiScore(build: Build): number {
  const gpu = build.gpu ? gpuIndex(build.gpu) : 0;
  const base = gpu ? Math.round((gpu / 180) * 82) : 12;
  const ram = build.memory ? gbOf(build.memory) : 0;
  const disk = build.storage ? gbOf(build.storage) : 0;
  const ramPts = ram >= 64 ? 10 : ram >= 32 ? 6 : ram >= 16 ? 3 : 0;
  const diskPts = disk >= 2000 ? 4 : disk >= 1000 ? 2 : 0;
  const cpuPts = /X3D/.test(build.cpu?.name.toUpperCase() ?? "") ? 4 : 0;
  return Math.max(1, Math.min(100, base + ramPts + diskPts + cpuPts));
}

export function buildSpeed(build: Build): number {
  if (build.gpu) return gpuIndex(build.gpu);
  const cpu = build.cpu?.name.toUpperCase() ?? "";
  if (/780M|760M|RADEON GRAPHICS|GT\b/.test(cpu)) return 12;
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

export const PRICE_CHECKED = "Nov 22, 2026";

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
    const mixed = CATS.some((cat) => cat !== "prebuilt" && cat !== "monitor" && cat !== "mount" && others[cat]);
    if (mixed) return "A finished PC replaces a custom build.";
    return "";
  }
  if (part.cat === "bundle" || part.cat === "monitor" || part.cat === "mount") return "";
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
  if (part.cat === "cooler" && others.cpu && /cooler|wraith/i.test(others.cpu.name)) {
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

/** Compatibility is separate from Power and Deal. UNKNOWN is not a pass. */
export function buildCheck(build: Build): { status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN"; lines: string[] } {
  const lines: string[] = [];
  let fail = false;
  let warn = false;
  let unknown = false;
  const slots: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "case", "psu"];
  for (const cat of slots) {
    const part = build[cat];
    if (!part) continue;
    const rest: Build = { ...build };
    delete rest[cat];
    const why = fitWhy(part, rest);
    if (why) {
      fail = true;
      lines.push(`FAIL. ${CAT_LABEL[cat]}: ${why}`);
    }
  }
  if (build.cpu && !build.cpu.socket) {
    unknown = true;
    lines.push("UNKNOWN. The processor socket is not on the record.");
  }
  if (build.motherboard && !build.motherboard.socket) {
    unknown = true;
    lines.push("UNKNOWN. The motherboard socket is not on the record.");
  }
  if (build.gpu && build.psu) {
    const need = needWatts(build);
    const have = wattOf(build.psu);
    if (!have) {
      unknown = true;
      lines.push("UNKNOWN. The power supply wattage is not on the record.");
    } else if (have < need + 100) {
      warn = true;
      lines.push(`WARNING. ${have}W is close to the ${need}W estimate for this card. Comfortable is higher.`);
    }
  }
  if (build.cooler && build.cpu) {
    const listed = coolerSockets(build.cooler);
    if (!listed.length) {
      unknown = true;
      lines.push("UNKNOWN. The cooler name does not list a socket, so fit was not measured.");
    }
  } else if (build.cpu && !/cooler|wraith/i.test(build.cpu.name) && !build.cooler) {
    warn = true;
    lines.push("WARNING. No cooler is in this list, and the processor name does not say a cooler is included.");
  }
  if (!fail && !warn && !unknown) lines.push("PASS. Socket, memory type, case size, and power supply match the checks this store can do.");
  lines.push("Not checked: BIOS version, exact GPU length, cooler height, and front-panel USB. Those stay UNKNOWN.");
  const status = fail ? "FAIL" : unknown ? "UNKNOWN" : warn ? "WARNING" : "PASS";
  return { status, lines };
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

function hasIGPU(part: Part): boolean {
  if (part.cat !== "cpu") return false;
  const n = part.name.toUpperCase();
  if (/\dF\b|KF\b/.test(n)) return false;
  if (/7800X3D|7900X3D|7950X3D/.test(n)) return false;
  if (/ULTRA|CORE\s*I[3579]|I[3579]-/.test(n)) return true;
  if (/RYZEN/.test(n) && (/[7-9]\d{3}/.test(n) || /\dG\b/.test(n) || /\bAI\b/.test(n))) return true;
  return false;
}

export function tagsOf(part: Part): string[] {
  const tags: string[] = [];
  if (hasIGPU(part)) tags.push("iGPU");

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
    else if (part.form === "mini") tags.push("Mini-ITX");
    else if (part.form === "gaming") tags.push("Gaming");
  }
  if (/WI-?FI/.test(n)) tags.push("Wi-Fi");
  if (/TITANIUM/.test(n)) tags.push("Titanium");
  else if (/PLATINUM/.test(n)) tags.push("Platinum");
  else if (/GOLD/.test(n)) tags.push("Gold");
  else if (/BRONZE/.test(n)) tags.push("Bronze");
  if (/NON-?MODULAR/.test(n)) tags.push("Not modular");
  else if (/MODULAR/.test(n)) tags.push("Modular");
  if (/ATX\s?3/.test(n)) tags.push("ATX 3");
  if (/WITH COOLER|WRAITH/.test(n)) tags.push("Cooler included");
  const cores = n.match(/(\d+)\s*-?\s*CORE/);
  if (cores && part.cat === "cpu") tags.push(`${cores[1]} cores`);
  if (part.cat === "gpu") {
    const vram = n.match(/\b(4|6|8|10|12|16|20|24|32)\s*G(?:B)?\b/);
    if (vram) tags.push(`${vram[1]}GB VRAM`);
  }
  if (/TRIPLE FAN|3X|3 X/.test(n) && part.cat === "gpu") tags.push("Triple fan");
  else if (/DUAL|DOUBLE FAN|2X/.test(n) && part.cat === "gpu") tags.push("Dual fan");
  if (/X3D|3D V-CACHE/.test(n)) tags.push("3D cache");
  if (/\bARGB\b/.test(n)) tags.push("ARGB");
  else if (/\bRGB\b/.test(n)) tags.push("RGB");
  if (/LOW PROFILE|\bLP\b|SFF/.test(n)) tags.push("Low profile");
  if (/MESH/.test(n)) tags.push("Mesh");
  if (/TEMPERED GLASS|\bTG\b/.test(n)) tags.push("Glass side");
  if (/BLUETOOTH/.test(n)) tags.push("Bluetooth");
  if (/USB-?C/.test(n)) tags.push("USB-C");
  if (/FREESYNC/.test(n)) tags.push("FreeSync");
  if (/G-SYNC/.test(n)) tags.push("G-Sync");
  if (/CURVED/.test(n)) tags.push("Curved");
  if (part.cat === "memory") {
    const cl = n.match(/\bCL\s?(\d{2})\b/);
    if (cl) tags.push(`CL${cl[1]}`);
    const mhz = n.match(/\b(\d{4})\s?MHZ\b/);
    if (mhz) tags.push(`${mhz[1]}MHz`);
  }
  if (part.cat === "case" || part.cat === "cooler" || part.cat === "gpu") {
    if (/\bWHITE\b/.test(n)) tags.push("White");
    else if (/\bBLACK\b/.test(n)) tags.push("Black");
  }
  if (part.cat === "cpu" && /\dF\b|KF\b|8400F/.test(n)) tags.push("No graphics");
  else if (part.cat === "cpu" && /RADEON|GRAPHICS/.test(n)) tags.push("Has graphics");
  return [...new Set(tags)].slice(0, 10);
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
  if (cat === "cooler" && build.cpu && /cooler|wraith/i.test(build.cpu.name)) {
    bits.push("Skip this. A cooler is already in the processor box");
  }
  if (cat === "storage") {
    if (build.motherboard) {
      const slots = m2Slots(build.motherboard);
      bits.push(`${slots} NVMe slots. Add a drive only while a slot is free`);
    } else bits.push("Pick one drive first. Add more after the board is chosen");
  }
  if (cat === "monitor") bits.push("Optional");
  if (cat === "bundle") bits.push("Deal price replaces the parts inside");
  if (cat === "prebuilt") bits.push("Finished PCs. One price for the whole system");
  if (cat === "case" || cat === "motherboard") bits.push("Mini-ITX is tiny. Micro-ATX is small. ATX is normal");
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
  if (cpu && build.cooler && /cooler|wraith/i.test(cpu.name)) {
    notes.push("This processor already includes a cooler.");
  }
  if (build.psu && wattOf(build.psu) && wattOf(build.psu) < needWatts(build) && !coveredByBundle(build).has("psu")) {
    notes.push(`Power supply is ${wattOf(build.psu)}W. This build wants about ${needWatts(build)}W.`);
  }
  return notes;
}

export function spendOf(build: Build, extras: Extras = emptyExtras()): number {
  if (build.prebuilt) {
    const screens = (build.monitor?.price ?? 0) + extras.monitor.reduce((sum, part) => sum + part.price, 0);
    return build.prebuilt.price + screens;
  }
  const covered = coveredByBundle(build);
  const base = CATS.reduce((sum, cat) => {
    const part = build[cat];
    if (!part || (cat !== "bundle" && covered.has(cat))) return sum;
    return sum + part.price;
  }, 0);
  const more = EXTRA_CATS.reduce((sum, cat) => sum + extras[cat].reduce((inner, part) => inner + part.price, 0), 0);
  return Math.round((base + more) * 100) / 100;
}

export function scoreBuild(build: Build): {
  points: number;
  rank: string;
  next: string;
  badges: { name: string; detail: string }[];
} {
  if (build.prebuilt) {
    return {
      points: 100,
      rank: "Ready PC",
      next: build.monitor ? "Copy the list." : "Add a screen if you need one.",
      badges: [{ name: "Finished", detail: "One price for the whole PC." }],
    };
  }
  const stock = Boolean(build.cpu && /cooler|wraith/i.test(build.cpu.name));
  const graphics = Boolean(
    build.gpu || (build.cpu && /RADEON|GRAPHICS|GT\b/i.test(build.cpu.name) && !/\dF\b|KF\b/i.test(build.cpu.name)),
  );
  const checks = [
    Boolean(build.cpu),
    Boolean(build.motherboard),
    Boolean(build.memory),
    Boolean(build.storage),
    Boolean(build.case),
    Boolean(build.psu),
    graphics,
    Boolean(build.cooler) || stock,
  ];
  const points = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const badges: { name: string; detail: string }[] = [];
  if (build.storage) badges.push({ name: "One drive", detail: "No extra drives." });
  if (stock && !build.cooler) badges.push({ name: "Cooler in the box", detail: "You skipped the extra cooler." });
  if (points === 100 && warnings(build).length === 0) badges.push({ name: "It fits", detail: "Every required part is in, and they go together." });
  const speed = buildSpeed(build);
  const spend = spendOf(build);
  if (speed >= 100 && spend > 0 && spend / speed <= 22) badges.push({ name: "Worth the money", detail: "Close to the best frames per dollar." });
  if (speed >= 140) badges.push({ name: "Top shelf", detail: "Faster than the value card." });
  if (formOf(build.case) === "itx" || formOf(build.motherboard) === "itx") badges.push({ name: "Tiny", detail: "Mini-ITX." });
  if (build.monitor) badges.push({ name: "Has a screen", detail: "A monitor is in the list." });
  const rank =
    points >= 100 ? "Bench complete" : points >= 75 ? "It plays" : points >= 50 ? "It posts" : points >= 25 ? "On the bench" : "Empty case";
  const next = !build.cpu
    ? "Pick a processor."
    : !build.motherboard
      ? "Pick a board with the same socket."
      : !build.memory
        ? "Pick memory that matches the board."
        : !build.storage
          ? "Pick one drive."
          : !build.case
            ? "Pick a case that fits the board."
            : !build.psu
              ? "Pick a power supply."
              : !graphics
                ? "This chip needs a graphics card."
                : !build.cooler && !stock
                  ? "Pick one cooler."
                  : "Copy the list, or add a screen.";
  return { points, rank, next, badges };
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
  by?: string;
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

export type GuideAnswers = {
  job: "games" | "work" | "both" | "senior" | "zoom" | "school" | "ai";
  power: "easy" | "normal" | "strong";
  cpu: "amd" | "intel" | "any";
  gpu: "nvidia" | "amd" | "none" | "any";
  size: "normal" | "small";
  screen: "yes" | "no";
};

/** One plain computer from the answers. Every part is on the shelf. */
export function guidePick(answers: GuideAnswers): AiPick {
  const job = answers.job;
  const ai = job === "ai";
  const office = job === "senior" || job === "zoom";
  const power = ai ? "strong" : office ? "easy" : answers.power;
  const box = answers.size === "small" ? CASE_SMALL : CASE;
  const intel = answers.cpu === "intel";
  const skipCard = office || answers.gpu === "none" || (answers.gpu === "any" && (job === "work" || office) && power === "easy");
  const nvidia = ai || answers.gpu === "nvidia" || (answers.gpu !== "amd" && !skipCard);
  const screen = answers.screen === "yes" ? (power === "strong" ? SCREEN_1440 : SCREEN_1080) : "";
  const card = skipCard ? "" : power === "easy" ? (nvidia ? GPU_5060 : GPU_9060) : power === "normal" ? (nvidia ? GPU_5070 : GPU_9070) : nvidia ? GPU_5070TI : GPU_9070XT;
  const ids = intel
    ? skipCard
      ? ["bc01af734d", "40f139f263", DDR5_16, SSD1, box, PSU550, AIR, screen]
      : power === "strong"
        ? ["947a6322f8", "40f139f263", DDR5_32, card, SSD2, box, PSU850, AIR, screen]
        : power === "normal"
          ? ["5b8cc605f2", "cf7081ad5f", DDR4_32, card, SSD2, box, PSU750, AIR, screen]
          : ["5b8cc605f2", "cf7081ad5f", DDR4_16, card, SSD1, box, PSU650, AIR, screen]
    : skipCard
      ? ["12f0a4d78a", "5f5a90664b", DDR5_16, SSD1, box, PSU550, screen]
      : power === "strong"
        ? ["0abb21ae33", answers.size === "small" ? "5f5a90664b" : BOARD_B850, DDR5_32, answers.size === "small" ? (nvidia ? GPU_5070 : GPU_9070) : card, SSD2, box, PSU850, AIR, screen]
        : power === "normal"
          ? ["9ab94a8d13", "5f5a90664b", DDR5_32, card, SSD2, box, PSU750, AIR, screen]
          : ["7e2a9c25b9", "5f5a90664b", DDR5_16, card, SSD1, box, PSU650, screen];
  const why = ai
    ? "A strong NVIDIA card and 32GB of memory. This is for running AI on the computer itself."
    : job === "senior"
      ? "No graphics card. Email, the news, and video calls. Simple and quiet."
      : job === "zoom"
        ? "No graphics card. Built for Zoom, class, and a browser."
        : job === "school"
          ? "A light graphics card for high school class and a few games."
          : `${intel ? "Intel" : "AMD"}. ${skipCard ? "No graphics card." : nvidia ? "An NVIDIA card." : "An AMD card."} ${power === "easy" ? "The easy one." : power === "strong" ? "The strong one." : "The normal one."} ${answers.size === "small" ? "A small case." : "A normal case."}`;
  return {
    id: "guide",
    name: ai ? "Local AI PC" : job === "senior" ? "Seniors PC" : job === "zoom" ? "Zoom PC" : job === "school" ? "High school PC" : "Your PC",
    kicker: "Basic builder",
    tags: ["guide"],
    why,
    build: buildFrom(ids.filter(Boolean)),
  };
}

/** Tiny living-room PCs. Every part is on the shelf. */
export function steamPicks(): AiPick[] {
  const ch160 = "081c74c5ae";
  const ridge = "d2d055d637";
  const terra = "e61417e310";
  const qube = "c09842a8af";
  const board = "1e94317e88";
  const cpuG = "12f0a4d78a";
  const cpuF = "7e2a9c25b9";
  const cpu8600 = "0414cd70dc";
  const sfx = "930a8b0f42";
  const low = "7abfe8da82";
  const solo = "0b368adbd0";
  return [
    {
      id: "steam-couch",
      name: "Couch box, no graphics card",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "desk"],
      why: "A Ryzen 5 8500G already has graphics and a cooler. Mini-ITX board, 16GB, one drive, and a small power supply in a CH160.",
      build: buildFrom([cpuG, board, DDR5_16, SSD1, ch160, sfx]),
    },
    {
      id: "steam-lp",
      name: "Tiny box, low-profile card",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "1080"],
      why: "The RTX 3050 low-profile is short enough for a small case. 1080p in the living room. The processor includes its cooler.",
      build: buildFrom([cpuF, board, DDR5_16, low, SSD1, ch160, sfx]),
    },
    {
      id: "steam-1080",
      name: "Steam Machine, 1080p",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "1080", "games"],
      why: "A single-fan RTX 5060 in the CH160. 32GB and a 2TB drive so a Steam library fits.",
      build: buildFrom([cpuF, board, DDR5_32, solo, SSD2, ch160, sfx]),
    },
    {
      id: "steam-ridge",
      name: "Living-room console shape",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "1080"],
      why: "Fractal Ridge sits under a TV like a console. Same small card and a 2TB drive.",
      build: buildFrom([cpu8600, board, DDR5_32, solo, SSD2, ridge, sfx]),
    },
    {
      id: "steam-terra",
      name: "Pretty tiny PC",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "1080"],
      why: "Fractal Terra is the small metal box. The 8600G includes a cooler, so nothing tall is sticking out.",
      build: buildFrom([cpu8600, board, DDR5_32, solo, SSD2, terra, sfx]),
    },
    {
      id: "steam-cube",
      name: "Cube on the desk",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "desk"],
      why: "Cooler Master Qube. Built-in graphics, 32GB, one drive. For a desk, not a new AAA game.",
      build: buildFrom([cpu8600, board, DDR5_32, SSD1, qube, sfx]),
    },
    {
      id: "steam-strong",
      name: "Small case, stronger card",
      kicker: "Steam Machine",
      tags: ["steam", "tiny", "1440"],
      why: "The RX 9060 XT in the CH160, which has more room than the Ridge. Still one cooler in the processor box.",
      build: buildFrom([cpuF, board, DDR5_32, GPU_9060, SSD2, ch160, sfx]),
    },
  ];
}

/** Finished computers from the shelf. Every id is a real part. */
export function ideaPicks(): AiPick[] {
  const whiteCase = "7d33994ba9";
  const northWhite = "3314615561";
  const whiteCard = "6e4d240e5a";
  const sn850 = "4621e6b145";
  const pro2 = "3075226767";
  const cpu7800 = "c5e6defbca";
  const cpu9950 = "0e1b30db1f";
  return [
    {
      id: "idea-school",
      name: "School only",
      kicker: "Cheap",
      tags: ["cheap", "school"],
      why: "Class, email, and a browser. The processor draws the picture. No graphics card.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "idea-office",
      name: "Quiet office",
      kicker: "Cheap",
      tags: ["cheap", "school"],
      why: "A newer chip with graphics built in. 16GB, one drive, a normal case.",
      build: buildFrom(["12f0a4d78a", BOARD_AM5, DDR5_16, SSD1, CASE, PSU550]),
    },
    {
      id: "idea-1080",
      name: "1080p games",
      kicker: "Games",
      tags: ["games", "cheap"],
      why: "A small NVIDIA card and a Ryzen 5. Fine for Fortnite, Valorant, and older games.",
      build: buildFrom(["7e2a9c25b9", BOARD_AM5, DDR5_16, GPU_5060, SSD1, CASE, PSU650]),
    },
    {
      id: "idea-both",
      name: "School and games",
      kicker: "Games",
      tags: ["games", "school"],
      why: "32GB so a class and a game can both be open. An RX 9060 XT for 1080p.",
      build: buildFrom(["7e2a9c25b9", BOARD_AM5, DDR5_32, GPU_9060, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "idea-1440",
      name: "1440p, normal",
      kicker: "Games",
      tags: ["games"],
      why: "Ryzen 5 9600X and an RX 9070. A 1440p screen is included.",
      build: buildFrom(["9ab94a8d13", BOARD_B850, DDR5_32, GPU_9070, SSD2, CASE, PSU850, AIR, SCREEN_1440]),
    },
    {
      id: "idea-intel",
      name: "Intel, 1080p",
      kicker: "Games",
      tags: ["games"],
      why: "Core i5-14400, DDR4, and an RTX 5060. The cheaper Intel path.",
      build: buildFrom(["5b8cc605f2", "cf7081ad5f", DDR4_32, GPU_5060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "idea-white",
      name: "White, simple",
      kicker: "White",
      tags: ["white", "games"],
      why: "A white case and a white cooler. The card is not white. 1080p.",
      build: buildFrom(["9ab94a8d13", BOARD_B850, DDR5_32, GPU_9060, SSD2, whiteCase, PSU850, AIR]),
    },
    {
      id: "idea-white-fast",
      name: "White, fast",
      kicker: "White",
      tags: ["white", "strong"],
      why: "White case, white cooler, and a white RX 9070 XT. Ryzen 7 9800X3D.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, whiteCard, sn850, northWhite, PSU850, AIR]),
    },
    {
      id: "idea-x3d",
      name: "9800X3D and a 9070 XT",
      kicker: "Strong",
      tags: ["strong", "games"],
      why: "The gaming chip and a fast AMD card. 32GB and a 2TB drive.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070XT, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "idea-last-year",
      name: "7800X3D, still fast",
      kicker: "Strong",
      tags: ["strong", "games"],
      why: "Last year's gaming chip. It still plays new games very well. RX 9070.",
      build: buildFrom([cpu7800, BOARD_AM5, DDR5_32, GPU_9070, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "idea-nvidia",
      name: "Intel and a 5070 Ti",
      kicker: "Strong",
      tags: ["strong", "games"],
      why: "Core Ultra 5 and an RTX 5070 Ti. 32GB. A 1440p screen is included.",
      build: buildFrom(["947a6322f8", "40f139f263", DDR5_32, GPU_5070TI, SSD2, CASE, PSU850, AIR, SCREEN_1440]),
    },
    {
      id: "idea-top",
      name: "The expensive one",
      kicker: "Strong",
      tags: ["strong"],
      why: "Ryzen 9 9950X3D, an RTX 5070 Ti, and a Samsung 990 Pro. This is the top of the shelf.",
      build: buildFrom([cpu9950, BOARD_B850, DDR5_32, GPU_5070TI, pro2, northWhite, PSU850, AIR]),
    },
    {
      id: "idea-couch",
      name: "Living room, no card",
      kicker: "Small",
      tags: ["small", "cheap"],
      why: "A tiny case. The Ryzen 5 8500G already has graphics and a cooler.",
      build: buildFrom(["12f0a4d78a", "1e94317e88", DDR5_16, SSD1, "081c74c5ae", "930a8b0f42"]),
    },
    {
      id: "idea-tiny",
      name: "Tiny 1080p",
      kicker: "Small",
      tags: ["small", "games"],
      why: "A short RTX 3050 in a small case. For a TV, not a 4K monitor.",
      build: buildFrom(["7e2a9c25b9", "1e94317e88", DDR5_16, "7abfe8da82", SSD1, "081c74c5ae", "930a8b0f42"]),
    },
    {
      id: "idea-screen",
      name: "Comes with a screen",
      kicker: "Cheap",
      tags: ["cheap", "school"],
      why: "A basic PC plus a 1080p monitor, if you do not own one yet.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550, SCREEN_1080]),
    },
    {
      id: "idea-white-desk",
      name: "White desk, no card",
      kicker: "White",
      tags: ["white", "school", "cheap"],
      why: "A white case. The chip draws the picture. For class and email.",
      build: buildFrom(["12f0a4d78a", BOARD_AM5, DDR5_16, SSD1, "7d33994ba9", PSU550]),
    },
    {
      id: "idea-fortnite",
      name: "1080p and a 144Hz screen",
      kicker: "Games",
      tags: ["games", "cheap"],
      why: "An RTX 5060 and a 144Hz monitor. The processor includes a cooler.",
      build: buildFrom(["7e2a9c25b9", BOARD_AM5, DDR5_16, GPU_5060, SSD1, CASE, PSU650, SCREEN_1080]),
    },
    {
      id: "idea-photo",
      name: "Photos and class",
      kicker: "School",
      tags: ["school"],
      why: "32GB for photo files. An RX 9060 XT is enough for filters.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "idea-cad",
      name: "Drawings and class",
      kicker: "School",
      tags: ["school"],
      why: "Intel, 32GB, and an NVIDIA card. For class drawings, not a movie studio.",
      build: buildFrom(["5b8cc605f2", "cf7081ad5f", DDR4_32, GPU_5060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "idea-value",
      name: "Most frames for the money",
      kicker: "Games",
      tags: ["games", "strong"],
      why: "Ryzen 7 5700X and an RX 9070. The money goes into the graphics card.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "idea-older",
      name: "Older games, less money",
      kicker: "Cheap",
      tags: ["cheap", "games"],
      why: "Ryzen 5 5500 with a cooler in the box, plus an RX 9060 XT.",
      build: buildFrom(["c72a92cec7", BOARD_AM4, DDR4_16, GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "idea-deal",
      name: "Start from a parts deal",
      kicker: "Cheap",
      tags: ["cheap", "games"],
      why: "One deal price covers the processor, the board, and 16GB. Then a card, a drive, a case, and power.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "idea-stream",
      name: "Play and record",
      kicker: "Strong",
      tags: ["strong", "games"],
      why: "7800X3D, an RTX 5070, 32GB, and a 2TB drive. A 1440p screen is included.",
      build: buildFrom(["c5e6defbca", BOARD_AM5, DDR5_32, GPU_5070, SSD2, CASE, PSU850, AIR, SCREEN_1440]),
    },
    {
      id: "idea-4k",
      name: "Comes with a 4K screen",
      kicker: "Strong",
      tags: ["strong", "games"],
      why: "A 4K monitor and an RTX 5070 Ti. Ryzen 7 9800X3D.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_5070TI, SSD2, CASE, "0d6e4a6a3a", AIR, "884e99ec26"]),
    },
    {
      id: "idea-white-nvidia",
      name: "White, and NVIDIA",
      kicker: "White",
      tags: ["white", "games"],
      why: "A white case and a white RTX 5060.",
      build: buildFrom(["9ab94a8d13", BOARD_B850, DDR5_32, "3197cd012f", SSD2, "7d33994ba9", PSU850, AIR]),
    },
    {
      id: "idea-creator",
      name: "White creator",
      kicker: "White",
      tags: ["white", "strong"],
      why: "Ryzen 7 9700X, a white RX 9070, and a white case. 32GB and a 2TB drive.",
      build: buildFrom(["ee3bc4df84", BOARD_B850, DDR5_32, "71011bb93c", SSD2, "3314615561", PSU850, AIR]),
    },
    {
      id: "idea-64",
      name: "Lots of memory",
      kicker: "Strong",
      tags: ["strong", "school"],
      why: "64GB for many programs at once. Ryzen 9 9950X3D and an RX 9070 XT.",
      build: buildFrom(["0e1b30db1f", BOARD_B850, "d96159d6eb", GPU_9070XT, "3075226767", CASE, "0d6e4a6a3a", AIR]),
    },
    {
      id: "idea-black",
      name: "Black case, 1440p",
      kicker: "Games",
      tags: ["games", "strong"],
      why: "A plain black case. Ryzen 5 9600X and an RX 9070. A 1440p screen is included.",
      build: buildFrom(["9ab94a8d13", BOARD_B850, DDR5_32, GPU_9070, SSD2, "f669def36b", PSU850, AIR, SCREEN_1440]),
    },
    {
      id: "idea-gta",
      name: "Ready if GTA comes to PC",
      kicker: "Games",
      tags: ["games", "strong"],
      why: "32GB, a 16GB card, and a 2TB drive. PC specs are not out. This is a guess, not a promise.",
      build: buildFrom(["84d819ea71", BOARD_AM5, DDR5_32, GPU_9070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "idea-flight",
      name: "Flight simulator",
      kicker: "Strong",
      tags: ["strong", "games"],
      by: "Grok",
      why: "Flight sims care about the processor and the card together. Ryzen 7 9800X3D, an RTX 5070 Ti, 32GB, and a 2TB drive. The stick and throttle are not in this list.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_5070TI, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "idea-race",
      name: "Racing simulator",
      kicker: "Games",
      tags: ["games", "strong"],
      by: "Grok",
      why: "A 1440p racing PC. Ryzen 5 9600X, an RX 9070, 32GB, and a screen. The wheel and pedals are sold on the sim shelf, not in this parts list.",
      build: buildFrom(["9ab94a8d13", BOARD_B850, DDR5_32, GPU_9070, SSD2, CASE, PSU850, AIR, SCREEN_1440]),
    },
    {
      id: "idea-edit",
      name: "Video editing",
      kicker: "Strong",
      tags: ["strong"],
      by: "Grok",
      why: "Ryzen 9 9950X3D, 64GB, a fast drive, and an RTX 5070 Ti. Built for a timeline, not only for games.",
      build: buildFrom(["0e1b30db1f", BOARD_B850, "d96159d6eb", GPU_5070TI, "3075226767", CASE, "0d6e4a6a3a", AIR]),
    },
    {
      id: "idea-workstation",
      name: "CAD workstation",
      kicker: "Strong",
      tags: ["strong", "school"],
      by: "Grok",
      why: "Intel, 32GB, and an RTX 5070 Ti. For drawings and class work. This is a parts list, not a certified workstation.",
      build: buildFrom(["947a6322f8", "40f139f263", DDR5_32, GPU_5070TI, SSD2, CASE, PSU850, AIR]),
    },
  ];
}

export function careerPicks(): AiPick[] {
  return [
    {
      id: "teach",
      name: "Teaching",
      kicker: "Career",
      tags: ["work", "college", "desk"],
      why: "Lessons, slides, and a browser. No graphics card.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "nurse",
      name: "Nursing",
      kicker: "Career",
      tags: ["work", "college", "desk"],
      why: "Charts, notes, and video class. 16GB is enough.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550, SCREEN_1080]),
    },
    {
      id: "accounts",
      name: "Accounting",
      kicker: "Career",
      tags: ["work", "college", "desk"],
      why: "Spreadsheets and tax software. Quiet. No graphics card.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550]),
    },
    {
      id: "cyber",
      name: "Cybersecurity",
      kicker: "Career",
      tags: ["work", "college", "code"],
      why: "Labs, virtual machines, and a lot of browser tabs. 32GB.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, SSD2, CASE, PSU650, AIR]),
    },
    {
      id: "analyst",
      name: "Data analysis",
      kicker: "Career",
      tags: ["work", "college"],
      why: "Python and spreadsheets. 32GB and a 2TB drive.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, SSD2, CASE, PSU650]),
    },
    {
      id: "law",
      name: "Law",
      kicker: "Career",
      tags: ["work", "college", "desk"],
      why: "Writing and research. A screen is included. No graphics card.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550, SCREEN_1080]),
    },
  ];
}

export function microPicks(): AiPick[] {
  return PARTS.filter((part) => part.cat === "prebuilt" && part.form === "mini" && !isJunk(part, false))
    .sort((a, b) => a.price - b.price)
    .map((part) => ({
      id: `micro-${part.id}`,
      name: shortName(part),
      kicker: "Micro PC",
      tags: ["steam", "micro"],
      why: "Already built. A small box. You do not match a board or a case.",
      build: { prebuilt: part } as Build,
    }));
}

/** Full PCs from this shelf, ranked by what the money buys. */
export function aiPicks(): AiPick[] {
  return [
    ...steamPicks(),
    ...careerPicks(),
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
      why: "PC specs are not out, and there is still no PC version. Grand Theft Auto VI came out on PS5 and Xbox on November 19, 2026. This has 32GB, a 16GB card, and a 2TB drive so you are ready if it comes to PC.",
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
    {
      id: "league-low",
      name: "League, low",
      kicker: "League",
      tags: ["games", "league", "1080"],
      why: "League does not need a big card. This is 1080p with a real graphics card and nothing extra.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "league-med",
      name: "League, medium",
      kicker: "League",
      tags: ["games", "league", "am5"],
      why: "A newer socket and the same light card. High settings at 1080p, with room to swap the chip later.",
      build: buildFrom(["84d819ea71", BOARD_AM5, DDR5_16, GPU_9060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "league-ultra",
      name: "League, ultra",
      kicker: "League",
      tags: ["games", "league", "am5"],
      why: "League is limited by the processor. The 9800X3D holds very high frame rates. The card stays modest.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "val-low",
      name: "Valorant, low",
      kicker: "Valorant",
      tags: ["games", "valorant", "1080"],
      why: "Valorant runs on a small card. This is the cheap 1080p PC.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "val-med",
      name: "Valorant, medium",
      kicker: "Valorant",
      tags: ["games", "valorant", "1440"],
      why: "A stronger processor and the RX 9070, so 1440p stays smooth.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "val-ultra",
      name: "Valorant, ultra",
      kicker: "Valorant",
      tags: ["games", "valorant", "am5"],
      why: "Highest frame rates. The 9800X3D does the work. 32GB so nothing else is hitching.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "fn-low",
      name: "Fortnite, low",
      kicker: "Fortnite",
      tags: ["games", "fortnite", "1080"],
      why: "Performance mode and 1080p. The 8GB card is the ceiling.",
      build: buildFrom(["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650]),
    },
    {
      id: "fn-med",
      name: "Fortnite, medium",
      kicker: "Fortnite",
      tags: ["games", "fortnite", "1440"],
      why: "16GB of video memory and the value card. Enough for high settings at 1440p.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR]),
    },
    {
      id: "fn-ultra",
      name: "Fortnite, ultra",
      kicker: "Fortnite",
      tags: ["games", "fortnite", "am5"],
      why: "The RX 9070 XT and the 9800X3D. This is the last step before the money stops buying frames.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070XT, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "stream",
      name: "Streaming",
      kicker: "Stream",
      tags: ["work", "stream"],
      why: "Eight cores and an NVIDIA card, which is the easy one for streaming. One drive.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_5060, SSD1, CASE, PSU650, AIR]),
    },
    {
      id: "edit",
      name: "Video editing",
      kicker: "Edit",
      tags: ["work", "edit"],
      why: "20 cores, 32GB, a 2TB drive, and an NVIDIA card. For cutting video, not for the cheapest frames.",
      build: buildFrom(["aeb7922d24", GPU_5070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "music",
      name: "Music",
      kicker: "Music",
      tags: ["work", "music", "desk"],
      why: "Quiet parts. Built-in graphics, 32GB, one drive. No big card heating the room.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550]),
    },
    {
      id: "code",
      name: "Programming",
      kicker: "Code",
      tags: ["work", "code", "college"],
      why: "32GB and a 1TB drive for projects and browser tabs. A graphics card is not required.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD2, CASE, PSU550]),
    },
    {
      id: "blender",
      name: "Blender and 3D",
      kicker: "3D",
      tags: ["work", "blender"],
      why: "3D wants an NVIDIA card and 32GB. This is a class machine, not a studio farm.",
      build: buildFrom(["5b8cc605f2", "bfed39ecdd", DDR4_32, GPU_5070, SSD2, CASE, PSU750, AIR]),
    },
    ...menuPicks(),
  ];
}

function menuPicks(): AiPick[] {
  const basic = ["2dfbcfdbfb", GPU_9060, SSD1, CASE, PSU650];
  const low = ["61d2f9663c", BOARD_AM4, DDR4_16, GPU_9060, SSD1, CASE, PSU650, AIR];
  const normal = ["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9060, SSD1, CASE, PSU650, AIR];
  const medium = ["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9070, SSD1, CASE, PSU750, AIR];
  const ultra = ["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070XT, SSD2, CASE, PSU850, AIR];
  const desk = ["ae65baf2c4", BOARD_AM4, DDR4_16, "222da28bfa", CASE, PSU550];
  const row = (id: string, game: string, tag: string, level: string, why: string, ids: string[], extra: string[] = []): AiPick => ({
    id,
    name: `${game}, ${level}`,
    kicker: game,
    tags: ["games", tag, level, ...extra],
    why,
    build: buildFrom(ids),
  });
  const ladder = (prefix: string, game: string, tag: string, heavy: boolean, note: string): AiPick[] => [
    row(`${prefix}-basic`, game, tag, "basic", `${note} Basic is the smallest PC that should open it.`, heavy ? basic : desk, heavy ? ["1080"] : ["desk"]),
    row(`${prefix}-low`, game, tag, "low", `${note} Low settings.`, low, ["1080"]),
    row(`${prefix}-normal`, game, tag, "normal", `${note} Normal settings.`, normal, ["1080"]),
    row(`${prefix}-medium`, game, tag, "medium", `${note} Medium settings.`, medium, ["1440"]),
    row(`${prefix}-ultra`, game, tag, "ultra", `${note} Ultra is the fancy one.`, ultra, ["am5"]),
  ];
  return [
    row("cod-basic", "Call of Duty", "cod", "basic", "The cheapest PC here that can open Call of Duty. 1080p, low settings. One drive.", basic, ["1080"]),
    row("cod-low", "Call of Duty", "cod", "low", "Low settings at 1080p, with a bit more processor.", low, ["1080"]),
    row("cod-normal", "Call of Duty", "cod", "normal", "Normal settings. 32GB so the game and a call can both stay open.", normal, ["1080"]),
    row("cod-medium", "Call of Duty", "cod", "medium", "The sensible Call of Duty order. 1440p.", medium, ["1440"]),
    row("cod-ultra", "Call of Duty", "cod", "ultra", "Ultra. Fast chip, big card. You do not need this to play.", ultra, ["am5"]),
    row("bf-basic", "Battlefield", "battlefield", "basic", "Battlefield wants a graphics card even on low. This is the small one.", basic, ["1080"]),
    row("bf-low", "Battlefield", "battlefield", "low", "Low settings, 1080p, 16GB of memory.", low, ["1080"]),
    row("bf-normal", "Battlefield", "battlefield", "normal", "Normal settings. 32GB, because big maps use it.", normal, ["1080"]),
    row("bf-medium", "Battlefield", "battlefield", "medium", "Medium settings at 1440p.", medium, ["1440"]),
    row("bf-ultra", "Battlefield", "battlefield", "ultra", "Ultra. The most this shelf should spend on Battlefield.", ultra, ["am5"]),
    row("skyrim-basic", "Skyrim", "skyrim", "basic", "Old Skyrim runs without a graphics card.", desk, ["desk"]),
    row("skyrim-low", "Skyrim", "skyrim", "low", "Low settings and a small card, if you want a few mods.", basic, ["1080"]),
    row("skyrim-normal", "Skyrim", "skyrim", "normal", "Normal settings and 32GB, which mods like.", normal, ["1080"]),
    row("skyrim-medium", "Skyrim", "skyrim", "medium", "More card than Skyrim needs. Fine if you also play newer games.", medium, ["1440"]),
    row("skyrim-ultra", "Skyrim", "skyrim", "ultra", "For a huge mod list, not for plain Skyrim.", ultra, ["am5"]),
    row("hp-basic", "Harry Potter", "potter", "basic", "Hogwarts Legacy needs a graphics card. This is the smallest one that should open it.", basic, ["1080"]),
    row("hp-low", "Harry Potter", "potter", "low", "Low settings at 1080p. It will not look fancy.", low, ["1080"]),
    row("hp-normal", "Harry Potter", "potter", "normal", "Normal settings. 32GB helps the open world.", normal, ["1080"]),
    row("hp-medium", "Harry Potter", "potter", "medium", "The Harry Potter order most people should take.", medium, ["1440"]),
    row("hp-ultra", "Harry Potter", "potter", "ultra", "Ultra. Pretty, and more money than the game needs.", ultra, ["am5"]),
    row("fn-basic", "Fortnite", "fortnite", "basic", "Basic Fortnite. 1080p, performance mode.", basic, ["1080"]),
    row("fn-size-low", "Fortnite", "fortnite", "low", "Low settings. A small card is enough.", low, ["1080"]),
    row("fn-size-normal", "Fortnite", "fortnite", "normal", "Normal settings and 32GB.", normal, ["1080"]),
    row("fn-size-medium", "Fortnite", "fortnite", "medium", "Medium settings at 1440p.", medium, ["1440"]),
    row("fn-size-ultra", "Fortnite", "fortnite", "ultra", "Ultra. The pretty one. Costs more.", ultra, ["am5"]),
    row("val-basic", "Valorant", "valorant", "basic", "Valorant runs on a small card. This is the cheap order.", basic, ["1080"]),
    row("val-size-low", "Valorant", "valorant", "low", "Low settings, smooth for the money.", low, ["1080"]),
    row("val-size-normal", "Valorant", "valorant", "normal", "Normal settings. The processor matters more than the card.", normal, ["1080"]),
    row("val-size-medium", "Valorant", "valorant", "medium", "Medium. A stronger card, still not the expensive one.", medium, ["1440"]),
    row("val-size-ultra", "Valorant", "valorant", "ultra", "Ultra frame rates. The fast chip does the work.", ultra, ["am5"]),
    row("league-basic", "League", "league", "basic", "League does not need a big card. This is the small order.", basic, ["1080"]),
    row("league-size-low", "League", "league", "low", "Low settings. Easy to run.", low, ["1080"]),
    row("league-size-normal", "League", "league", "normal", "Normal settings. Plenty for League.", normal, ["1080"]),
    row("league-size-medium", "League", "league", "medium", "More than League needs, if you play other games too.", medium, ["1440"]),
    row("league-size-ultra", "League", "league", "ultra", "Ultra. The chip holds very high frame rates.", ultra, ["am5"]),
    {
      id: "office",
      name: "Office mail and calendar",
      kicker: "Office",
      tags: ["work", "office", "desk"],
      why: "Email, a calendar, and a browser. No graphics card. Nothing extra.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "zoom",
      name: "Zoom calls",
      kicker: "Zoom",
      tags: ["work", "zoom", "desk", "screen"],
      why: "For calls. 32GB so a meeting and your notes can both stay open.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550, SCREEN_1080]),
    },
    {
      id: "meet",
      name: "Conference PC",
      kicker: "Conference",
      tags: ["work", "conference", "desk", "screen"],
      why: "One PC and one screen for a meeting room. Quiet. No extra parts.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD1, CASE, PSU550, SCREEN_1080]),
    },
    {
      id: "podcast",
      name: "Podcasting",
      kicker: "Podcast",
      tags: ["work", "podcast", "desk"],
      why: "Quiet parts and a 2TB drive for episodes. One drive.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD2, CASE, PSU550]),
    },
    {
      id: "radio",
      name: "Radio broadcasting",
      kicker: "Radio",
      tags: ["work", "radio"],
      why: "For a long show. Eight cores, 32GB, a 2TB drive, and a small card so the screen turns on.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9060, SSD2, CASE, PSU650, AIR]),
    },
    {
      id: "vlog",
      name: "Vlogging",
      kicker: "Vlog",
      tags: ["work", "vlog"],
      why: "Phone clips, titles, and upload. An NVIDIA card and one 2TB drive.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_5060, SSD2, CASE, PSU650, AIR]),
    },
    ...ladder("gtav", "GTA V", "gtav", true, "Grand Theft Auto V (2013)."),
    ...ladder("gta6", "GTA VI", "gta6", true, "Grand Theft Auto VI (2026) is out on PS5 and Xbox. No PC version yet."),
    ...ladder("mine", "Minecraft", "minecraft", false, "Minecraft (2011)."),
    ...ladder("cs2", "Counter-Strike 2", "cs2", true, "Counter-Strike 2 (2023)."),
    ...ladder("elden", "Elden Ring", "elden", true, "Elden Ring (2022)."),
    ...ladder("cyber", "Cyberpunk 2077", "cyber", true, "Cyberpunk 2077 (2020)."),
    ...ladder("rdr", "Red Dead Redemption 2", "rdr", true, "Red Dead Redemption 2 (2018, PC 2019)."),
    ...ladder("witcher", "The Witcher 3", "witcher", true, "The Witcher 3: Wild Hunt (2015)."),
    ...ladder("bg3", "Baldur's Gate 3", "bg3", true, "Baldur's Gate 3 (2023)."),
    ...ladder("helldive", "Helldivers 2", "helldivers", true, "Helldivers 2 (2024)."),
    ...ladder("mh", "Monster Hunter Wilds", "wilds", true, "Monster Hunter Wilds (2025)."),
    ...ladder("wukong", "Black Myth: Wukong", "wukong", true, "Black Myth: Wukong (2024)."),
    ...ladder("apex", "Apex Legends", "apex", true, "Apex Legends (2019)."),
    ...ladder("ow2", "Overwatch 2", "ow2", true, "Overwatch 2 (2022)."),
    ...ladder("pal", "Palworld", "palworld", true, "Palworld (2024)."),
    ...ladder("diablo", "Diablo IV", "diablo", true, "Diablo IV (2023)."),
    ...ladder("rust", "Rust", "rust", true, "Rust (2018)."),
    ...ladder("destiny", "Destiny 2", "destiny", true, "Destiny 2 (2017)."),
    ...ladder("starfield", "Starfield", "starfield", true, "Starfield (2023)."),
    ...ladder("flight", "Flight Simulator", "flight", true, "Microsoft Flight Simulator (2020)."),
    ...ladder("farm", "Farming Simulator", "farm", true, "Farming Simulator 25 (2024)."),
    ...ladder("truck", "Euro Truck", "truck", false, "Euro Truck Simulator 2 (2012)."),
    ...ladder("cities", "Cities Skylines 2", "cities", true, "Cities: Skylines II (2023)."),
    ...ladder("finals", "The Finals", "finals", true, "The Finals (2023)."),
    ...ladder("lethal", "Lethal Company", "lethal", false, "Lethal Company (2023)."),
    ...ladder("stardew", "Stardew Valley", "stardew", false, "Stardew Valley (2016)."),
    ...ladder("wow", "World of Warcraft", "wow", false, "World of Warcraft (2004)."),
    ...ladder("ff14", "Final Fantasy XIV", "ff14", true, "Final Fantasy XIV (2013)."),
    ...ladder("spider", "Spider-Man", "spider", true, "Marvel's Spider-Man Remastered (2022)."),
    ...ladder("gow", "God of War", "gow", true, "God of War (PC 2022)."),
    ...ladder("alan", "Alan Wake 2", "alan", true, "Alan Wake 2 (2023)."),
    ...ladder("sea", "Sea of Thieves", "sea", true, "Sea of Thieves (2018)."),
    ...ladder("nms", "No Man's Sky", "nms", true, "No Man's Sky (2016)."),
    ...ladder("tarkov", "Tarkov", "tarkov", true, "Escape from Tarkov (2017). The processor matters."),
    ...ladder("forza", "Forza", "forza", true, "Forza Horizon 5 (2021)."),
    ...ladder("sims", "Sims", "sims", false, "The Sims 4 (2014)."),
    ...ladder("warframe", "Warframe", "warframe", true, "Warframe (2013)."),
    ...ladder("poe2", "Path of Exile 2", "poe", true, "Path of Exile 2 (2024)."),
    ...ladder("rivals", "Marvel Rivals", "rivals", true, "Marvel Rivals (2024)."),
    {
      id: "excel",
      name: "Spreadsheets",
      kicker: "Excel",
      tags: ["work", "excel", "desk"],
      why: "Excel, a browser, and mail. 16GB is enough. No graphics card.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_16, SSD1, CASE, PSU550]),
    },
    {
      id: "davinci",
      name: "DaVinci Resolve",
      kicker: "DaVinci",
      tags: ["work", "edit"],
      why: "Color and a cut. 32GB, a 2TB drive, and an NVIDIA card.",
      build: buildFrom(["aeb7922d24", GPU_5070, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "unity",
      name: "Unity",
      kicker: "Unity",
      tags: ["work", "code"],
      why: "A small game you are making. 32GB and a mid card.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_9060, SSD2, CASE, PSU650, AIR]),
    },
    {
      id: "unreal",
      name: "Unreal Engine",
      kicker: "Unreal",
      tags: ["work", "code", "am5"],
      why: "Unreal wants memory and a strong card. This is the class machine, not a studio.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9070, SSD2, CASE, PSU850, AIR]),
    },
    {
      id: "obs",
      name: "OBS recording",
      kicker: "OBS",
      tags: ["work", "stream"],
      why: "Record the screen. An NVIDIA card makes that easy. One drive.",
      build: buildFrom(["61d2f9663c", BOARD_AM4, DDR4_32, GPU_5060, SSD2, CASE, PSU650, AIR]),
    },
    {
      id: "ableton",
      name: "Ableton",
      kicker: "Ableton",
      tags: ["work", "music", "desk"],
      why: "Music software. Quiet parts, 32GB, and no big card heating the room.",
      build: buildFrom(["ae65baf2c4", BOARD_AM4, DDR4_32, SSD2, CASE, PSU550]),
    },
    ...ladder("rl", "Rocket League", "rocket", false, "Rocket League (2015)."),
    ...ladder("roblox", "Roblox", "roblox", false, "Roblox (2006)."),
    {
      id: "xss",
      name: "Xbox Series S class",
      kicker: "Xbox Series S",
      tags: ["console", "games", "1080"],
      why: "Xbox Series S (2020). This PC is a little stronger, which is as close as the shelf gets.",
      build: buildFrom(basic),
    },
    {
      id: "ps5",
      name: "PlayStation 5 class",
      kicker: "PlayStation 5",
      tags: ["console", "games"],
      why: "PlayStation 5 (2020). About that strong, with 32GB and a current small card.",
      build: buildFrom(normal),
    },
    {
      id: "xsx",
      name: "Xbox Series X class",
      kicker: "Xbox Series X",
      tags: ["console", "games"],
      why: "Xbox Series X (2020). Close to a PlayStation 5. This is that class.",
      build: buildFrom(normal),
    },
    {
      id: "ps5pro",
      name: "PlayStation 5 Pro class",
      kicker: "PlayStation 5 Pro",
      tags: ["console", "games", "1440"],
      why: "PlayStation 5 Pro (2024). The RX 9070 is a bit faster than that console.",
      build: buildFrom(medium),
    },
    {
      id: "emu-old",
      name: "PS2, GameCube, and Wii",
      kicker: "Older consoles",
      tags: ["emu", "games", "desk"],
      why: "PlayStation 2 (2000), GameCube (2001), and Wii (2006). For games you already own. No big card.",
      build: buildFrom(desk),
    },
    {
      id: "emu-switch",
      name: "Nintendo Switch",
      kicker: "Switch",
      tags: ["emu", "games"],
      why: "Nintendo Switch (2017). For games you already own. The processor matters more than the card.",
      build: buildFrom(normal),
    },
    {
      id: "emu-ps3",
      name: "PS3 and Xbox 360",
      kicker: "PS3",
      tags: ["emu", "games", "am5"],
      why: "PlayStation 3 (2006) and Xbox 360 (2005). These need a fast chip. For games you already own.",
      build: buildFrom(["0abb21ae33", BOARD_B850, DDR5_32, GPU_9060, SSD2, CASE, PSU750, AIR]),
    },
    {
      id: "emu-all",
      name: "Switch, PS3, and older",
      kicker: "All emulation",
      tags: ["emu", "games", "am5"],
      why: "One PC for Switch, PlayStation 3, Xbox 360, and the older consoles. Games you already own. One drive.",
      build: buildFrom(ultra),
    },
  ];
}

export function extraFilters(cat: Category): { label: string; test: (part: Part) => boolean }[] {
  const blob = (part: Part) => `${part.name} ${part.brand} ${part.socket ?? ""} ${part.ram ?? ""} ${part.form ?? ""}`.toUpperCase();
  const has = (re: RegExp) => (part: Part) => re.test(blob(part));
  const table: Partial<Record<Category, { label: string; test: (part: Part) => boolean }[]>> = {
    cpu: [
      { label: "AMD", test: has(/\bAMD\b|RYZEN/) },
      { label: "Intel", test: has(/\bINTEL\b|\bCORE\b/) },
      { label: "AM5", test: (part) => part.socket === "AM5" },
      { label: "AM4", test: (part) => part.socket === "AM4" },
      { label: "6 cores", test: has(/6[-\s]?CORE/) },
      { label: "8 cores", test: has(/8[-\s]?CORE/) },
      { label: "Has graphics", test: has(/RADEON|GRAPHICS/) },
      { label: "3D cache", test: has(/X3D/) },
    ],
    motherboard: [
      { label: "Mini-ITX", test: (part) => formOf(part) === "itx" },
      { label: "Micro-ATX", test: (part) => formOf(part) === "matx" },
      { label: "ATX", test: (part) => formOf(part) === "atx" },
      { label: "DDR4", test: (part) => ramKindOf(part) === "DDR4" },
      { label: "DDR5", test: (part) => ramKindOf(part) === "DDR5" },
      { label: "Wi-Fi", test: has(/WI-?FI/) },
    ],
    memory: [
      { label: "DDR4", test: (part) => ramKindOf(part) === "DDR4" },
      { label: "DDR5", test: (part) => ramKindOf(part) === "DDR5" },
      { label: "16GB", test: has(/\b16GB\b/) },
      { label: "32GB", test: has(/\b32GB\b/) },
      { label: "64GB", test: has(/\b64GB\b/) },
      { label: "2 sticks", test: (part) => sticksOf(part) === 2 },
    ],
    gpu: [
      { label: "NVIDIA", test: has(/NVIDIA|GEFORCE|RTX/) },
      { label: "AMD", test: has(/\bAMD\b|RADEON/) },
      { label: "8GB", test: has(/\b8GB\b|\b8G\b/) },
      { label: "12GB", test: has(/\b12GB\b|\b12G\b/) },
      { label: "16GB", test: has(/\b16GB\b|\b16G\b/) },
    ],
    storage: [
      { label: "NVMe", test: has(/NVME|M\.2/) },
      { label: "SATA", test: has(/SATA/) },
      { label: "HDD", test: has(/HDD|HARD DRIVE|RPM/) },
      { label: "1TB", test: has(/\b1TB\b/) },
      { label: "2TB", test: has(/\b2TB\b/) },
    ],
    case: [
      { label: "Mini-ITX", test: (part) => formOf(part) === "itx" },
      { label: "Micro-ATX", test: (part) => formOf(part) === "matx" },
      { label: "ATX", test: (part) => formOf(part) === "atx" },
      { label: "Mesh", test: has(/MESH/) },
      { label: "White", test: has(/\bWHITE\b/) },
    ],
    cooler: [
      { label: "Air", test: (part) => !/LIQUID|AIO|240|280|360|420/.test(part.name.toUpperCase()) },
      { label: "Liquid", test: has(/LIQUID|AIO/) },
      { label: "240mm", test: has(/240/) },
      { label: "360mm", test: has(/360/) },
    ],
    psu: [
      { label: "650W", test: (part) => wattOf(part) === 650 },
      { label: "750W", test: (part) => wattOf(part) === 750 },
      { label: "850W", test: (part) => wattOf(part) === 850 },
      { label: "Gold", test: has(/GOLD/) },
      { label: "Modular", test: has(/MODULAR/) },
    ],
    monitor: [
      { label: "1080p", test: has(/1080|FHD/) },
      { label: "1440p", test: has(/1440|QHD/) },
      { label: "4K", test: has(/\b4K\b|3840|UHD/) },
      { label: "144Hz+", test: (part) => {
        const hz = part.name.match(/(\d{2,3})\s*Hz/i);
        return Boolean(hz && Number(hz[1]) >= 144);
      } },
    ],
    prebuilt: [
      { label: "Gaming", test: (part) => part.form === "gaming" || /RTX|RX\s?\d|GEFORCE|RADEON/i.test(part.name) },
      { label: "Mini", test: (part) => part.form === "mini" },
      { label: "Desk", test: (part) => part.form === "desk" || part.form === "aio" },
    ],
  };
  return table[cat] ?? [];
}

export const AI_FILTERS = ["All", "Steam", "League", "Valorant", "Fortnite", "Call of Duty", "Battlefield", "Skyrim", "Harry Potter", "Minecraft", "Office", "Games", "Work", "Per frame", "Cheap", "College", "Value", "1080p", "1440p", "Newer socket", "NVIDIA", "No card", "Screen", "Top"] as const;

export const EXTRA_CATS = ["memory", "storage", "monitor"] as const;
export type ExtraCat = (typeof EXTRA_CATS)[number];
export type Extras = Record<ExtraCat, Part[]>;

export function emptyExtras(): Extras {
  return { memory: [], storage: [], monitor: [] };
}

function countKind(parts: Part[], kinds: Array<ReturnType<typeof driveKind>>): number {
  return parts.filter((part) => kinds.includes(driveKind(part))).length;
}

/** Empty string means this extra part still fits beside the build. */
export function extraWhy(part: Part, build: Build, extras: Extras): string {
  if (build.prebuilt && part.cat !== "monitor") return "A finished PC already has its parts. You can add a screen.";
  if (part.cat !== "memory" && part.cat !== "storage" && part.cat !== "monitor") {
    return "Only one of these. A new tap replaces the one you have.";
  }
  const fit = fitWhy(part, build);
  if (fit) return fit;
  if (part.cat === "memory") {
    if (!build.memory) return "Choose the first memory kit. Then you can add more.";
    const slots = dimmSlots(build.motherboard);
    const used = sticksOf(build.memory) + extras.memory.reduce((sum, item) => sum + sticksOf(item), 0);
    const add = sticksOf(part);
    if (used + add > slots) return `${slots} memory slots. ${used} sticks are in. This kit needs ${add}.`;
    return "";
  }
  if (part.cat === "storage") {
    if (!build.storage) return "Choose the first drive. Then you can add more.";
    const kind = driveKind(part);
    const all = [build.storage, ...extras.storage];
    if (kind === "nvme") {
      const slots = m2Slots(build.motherboard);
      const used = countKind(all, ["nvme"]);
      if (used >= slots) return `${slots} NVMe slots, and they are full.`;
      return "";
    }
    const used = countKind(all, ["sata", "hdd"]);
    if (used >= 4) return "Four SATA plugs is the limit. A hard drive or SATA SSD needs one.";
    return "";
  }
  if (!build.monitor) return "Choose the first screen. Then you can add another.";
  if (extras.monitor.length >= 2) return "Three screens is the limit.";
  return "";
}

export function trimExtras(build: Build, extras: Extras): Extras {
  const next = emptyExtras();
  for (const cat of EXTRA_CATS) {
    for (const part of extras[cat]) {
      if (extraWhy(part, build, next) === "") next[cat].push(part);
    }
  }
  return next;
}

export function slotLine(cat: Category, build: Build, extras: Extras): string {
  if (cat === "memory") {
    const slots = dimmSlots(build.motherboard);
    const used = (build.memory ? sticksOf(build.memory) : 0) + extras.memory.reduce((sum, part) => sum + sticksOf(part), 0);
    return `${used} of ${slots} memory sticks used. Add another kit only if the sticks fit.`;
  }
  if (cat === "storage") {
    const all = [...(build.storage ? [build.storage] : []), ...extras.storage];
    const nvme = countKind(all, ["nvme"]);
    const sata = countKind(all, ["sata", "hdd"]);
    return `${nvme} of ${m2Slots(build.motherboard)} NVMe slots used. ${sata} of 4 hard-drive plugs used.`;
  }
  if (cat === "monitor") return "One screen is enough. You can add up to two more.";
  return "Only one. A new tap replaces it. You cannot have two.";
}
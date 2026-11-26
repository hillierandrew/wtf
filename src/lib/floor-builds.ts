import {
  CAT_LABEL,
  PARTS,
  buildCheck,
  fitWhy,
  formOf,
  gbOf,
  gpuTier,
  isJunk,
  needWatts,
  ramKindOf,
  reconcile,
  shortName,
  spendOf,
  sticksOf,
  wattOf,
  type Build,
  type Category,
  type Part,
} from "@/lib/catalog";

export type FloorMachine = {
  id: string;
  name: string;
  say: string;
  build: Build;
  screen?: Part;
  total: number;
  withScreen: number;
  status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
  note: string;
};

const ORDER: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "case", "psu"];

function alive(cat: Category) {
  return PARTS.filter((part) => part.cat === cat && !isJunk(part, false) && part.price > 0);
}

function pool(cat: Category, build: Build, test: (part: Part) => boolean) {
  return alive(cat)
    .filter((part) => test(part) && !fitWhy(part, build))
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
}

/** Cheapest that fits. `used` skips a box already handed to a cheaper machine, if the next one is within `slack` dollars. */
function pick(cat: Category, build: Build, test: (part: Part) => boolean, used?: Set<string>, slack = 0) {
  const rows = pool(cat, build, test);
  if (!rows.length) return undefined;
  if (used) {
    const cap = rows[0].price + slack;
    const fresh = rows.find((part) => !used.has(part.id) && part.price <= cap + 0.001);
    if (fresh) return fresh;
  }
  return rows[0];
}

function screenOf(kind: "office" | "fast" | "1440") {
  return (part: Part) => {
    const name = part.name;
    if (/portable|refurb|renewed|open\s?box|15\.6|16"|17"|ultrawide/i.test(name)) return false;
    const hz = Number(name.match(/(\d{2,3})\s*Hz/i)?.[1] ?? 0);
    if (kind === "1440") return /1440|QHD|2560/i.test(name) && /27/.test(name) && hz >= 100;
    const fhd = /1920|FHD/i.test(name) && !/1440|2560|4K|3840/i.test(name) && /23\.8|24/.test(name);
    if (!fhd) return false;
    if (kind === "fast") return hz >= 120;
    return hz >= 100 && hz < 120;
  };
}

function stockCooler(part: Part) {
  return /cooler|wraith/i.test(part.name);
}

function listsSocket(part: Part, socket: string) {
  const n = part.name.toUpperCase().replace(/\s+/g, "");
  if (socket === "AM5") return n.includes("AM5");
  if (socket === "AM4") return n.includes("AM4");
  if (socket === "LGA1700") return n.includes("1700");
  if (socket === "LGA1851") return n.includes("1851");
  return false;
}

function sellablePsu(part: Part, min: number, max?: number) {
  const watts = wattOf(part);
  if (!watts || watts < min) return false;
  if (max && watts > max) return false;
  if (/coolmax|apevia|game\s?max|raidmax|logisys|diablotek|solid gear|rosewill/i.test(`${part.name} ${part.brand}`)) return false;
  return true;
}

function plainCase(part: Part) {
  const form = formOf(part);
  if (form !== "matx" && form !== "atx") return false;
  if (/hello kitty|wood front/i.test(part.name)) return false;
  return true;
}

function chipLine(part: Part) {
  const match = part.name.match(/Ryzen\s+[3579]\s+\w+|Core Ultra\s+\d+\s+\w+|Core i\d-\w+/i);
  return match ? match[0].replace(/\s+/g, " ") : shortName(part);
}

function cardLine(part: Part) {
  const ti = part.name.match(/\b(5070|5060|4070|4060)\s?Ti\b/i);
  if (ti) return `RTX ${ti[1]} Ti`;
  const rtx = part.name.match(/\bRTX\s?(\d{4})\b/i);
  if (rtx) return `RTX ${rtx[1]}`;
  const rx = part.name.match(/\bRX\s?(\d{4})\b/i);
  if (rx) return `RX ${rx[1]}`;
  return shortName(part);
}

function spoken(job: string, build: Build, disk: string) {
  const ram = build.memory ? gbOf(build.memory) : 0;
  const cool = build.cpu && stockCooler(build.cpu) && !build.cooler ? "Cooler is in the box." : "Cooler lists the socket.";
  const tail = `${ram}GB, ${disk}. ${cool}`;
  const chip = build.cpu ? chipLine(build.cpu) : "This chip";
  if (!build.gpu) return `${job} ${chip}. The picture is in the chip. ${tail}`;
  const vram = build.gpu.name.match(/(\d+)\s*G(?:B)?\b/i);
  const card = `${cardLine(build.gpu)}${vram ? ` ${vram[1]}GB` : ""}`;
  return `${job} ${chip} and ${card}. ${tail}`;
}

type Spec = {
  id: string;
  name: string;
  job: string;
  cpu: (part: Part) => boolean;
  ram: number;
  disk: "1TB" | "2TB";
  gpus?: ((part: Part) => boolean)[];
  screen: "office" | "fast" | "1440";
};

function assemble(spec: Spec, used: Set<string>): FloorMachine | null {
  const build: Build = {};
  const cpu = pick("cpu", build, spec.cpu);
  if (!cpu) return null;
  build.cpu = cpu;
  const board = pick("motherboard", build, () => true, used, 15);
  if (!board) return null;
  build.motherboard = board;
  const kind = ramKindOf(board) || ramKindOf(cpu);
  const memory =
    pick("memory", build, (part) => gbOf(part) >= spec.ram && sticksOf(part) === 2 && (!kind || ramKindOf(part) === kind)) ||
    pick("memory", build, (part) => gbOf(part) >= spec.ram && (!kind || ramKindOf(part) === kind));
  if (!memory) return null;
  build.memory = memory;
  const nvme = (part: Part) => /NVME|M\.2/i.test(part.name) && !/HDD|HARD DRIVE|2230|2242/i.test(part.name);
  const storage = pick("storage", build, (part) => nvme(part) && part.name.toUpperCase().includes(spec.disk));
  if (!storage) return null;
  build.storage = storage;
  const box = pick("case", build, plainCase, used, 28);
  if (!box) return null;
  build.case = box;
  if (!stockCooler(cpu)) {
    const socket = cpu.socket ?? "";
    const cool = pick(
      "cooler",
      build,
      (part) => Boolean(socket) && listsSocket(part, socket) && !/hello kitty|low profile|240|280|360|420|liquid|aio|dynatron|2u|server/i.test(part.name),
    );
    if (!cool) return null;
    build.cooler = cool;
  }
  if (spec.gpus?.length) {
    for (const test of spec.gpus) {
      const gpu = pick("gpu", build, test);
      if (gpu) {
        build.gpu = gpu;
        break;
      }
    }
    if (!build.gpu) return null;
  }
  const need = needWatts(build);
  const min = build.gpu ? need + 100 : Math.max(need, 550);
  const psu = pick("psu", build, (part) => sellablePsu(part, min, min + 250), used, 30) || pick("psu", build, (part) => sellablePsu(part, min));
  if (!psu) return null;
  build.psu = psu;
  const final = reconcile("cpu", build);
  if (!final.cpu || !final.motherboard || !final.memory || !final.storage || !final.case || !final.psu) return null;
  if (spec.gpus?.length && !final.gpu) return null;
  if (!stockCooler(final.cpu) && !final.cooler) return null;
  const screen = pick("monitor", {}, screenOf(spec.screen), used, 35);
  const check = buildCheck(final);
  if (check.status !== "PASS") return null;
  const total = spendOf(final);
  for (const part of [final.case, final.motherboard, final.psu, screen]) {
    if (part) used.add(part.id);
  }
  return {
    id: spec.id,
    name: spec.name,
    say: spoken(spec.job, final, spec.disk),
    build: final,
    screen,
    total,
    withScreen: Math.round((total + (screen?.price ?? 0)) * 100) / 100,
    status: check.status,
    note: final.memory && final.memory.price > total * 0.28 ? "Socket, memory, case, and power match. Memory is the big line on this receipt." : "Socket, memory, case, and power match.",
  };
}

const SPECS: Spec[] = [
  {
    id: "quiet",
    name: "Quiet desk",
    job: "Email, photos, and a video call.",
    cpu: (part) => /5500GT|5600GT/.test(part.name),
    ram: 16,
    disk: "1TB",
    screen: "office",
  },
  {
    id: "school",
    name: "School",
    job: "Class, a browser, and light games. Stronger built-in graphics than the quiet desk.",
    cpu: (part) => /8600G|8700G/.test(part.name),
    ram: 16,
    disk: "1TB",
    screen: "office",
  },
  {
    id: "work",
    name: "Work bench",
    job: "The desk machine. Sheets, calls, and a lot of tabs.",
    cpu: (part) => /8700G/.test(part.name),
    ram: 16,
    disk: "1TB",
    screen: "office",
  },
  {
    id: "friday",
    name: "Friday night",
    job: "1080p, high settings.",
    cpu: (part) => /7500F/.test(part.name),
    ram: 16,
    disk: "1TB",
    gpus: [(part) => /5060/.test(part.name) && !/TI/i.test(part.name), (part) => /9060/.test(part.name) && gpuTier(part) > 0],
    screen: "fast",
  },
  {
    id: "picture",
    name: "The picture",
    job: "1440p. Hand them this when the games matter.",
    cpu: (part) => /9600X|7700X/.test(part.name),
    ram: 32,
    disk: "2TB",
    gpus: [
      (part) => /\b9070\b/.test(part.name) && !/XT|GRE/i.test(part.name),
      (part) => /\b5070\b/.test(part.name) && !/TI/i.test(part.name),
    ],
    screen: "1440",
  },
  {
    id: "model",
    name: "The model",
    job: "A model on this computer, not in a browser tab. Say the price first.",
    cpu: (part) => /9700X/.test(part.name),
    ram: 32,
    disk: "2TB",
    gpus: [(part) => /5070\s?TI/i.test(part.name), (part) => /\b5070\b/.test(part.name) && !/TI/i.test(part.name)],
    screen: "1440",
  },
];

let cached: FloorMachine[] | null = null;

export function designFloor(): FloorMachine[] {
  if (cached) return cached;
  const used = new Set<string>();
  cached = SPECS.map((spec) => assemble(spec, used)).filter((item): item is FloorMachine => Boolean(item));
  return cached;
}

export function machineRows(machine: FloorMachine): { key: string; label: string; name: string; price: number | null }[] {
  const rows: { key: string; label: string; name: string; price: number | null }[] = ORDER.filter((cat) => machine.build[cat]).map((cat) => ({
    key: machine.build[cat]!.id,
    label: cat === "gpu" ? "Graphics" : cat === "storage" ? "Drive" : cat === "motherboard" ? "Board" : CAT_LABEL[cat],
    name: shortName(machine.build[cat]!),
    price: machine.build[cat]!.price,
  }));
  if (!machine.build.gpu) {
    const at = rows.findIndex((row) => row.label === "Drive");
    rows.splice(at < 0 ? rows.length : at, 0, { key: "igpu", label: "Graphics", name: "In the chip. No extra card.", price: null });
  }
  return rows;
}

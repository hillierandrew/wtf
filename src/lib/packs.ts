import { PARTS, isJunk, machineScore } from "@/lib/catalog";
import { KEYS } from "@/lib/keyboard";
import raw from "@/data/sim.json";
import rawLaptops from "@/data/laptops.json";
import { partBag, simBag, keyBag, lapBag, type BagLine } from "@/lib/bag";

type Gear = { id: string; name: string; price: number; brand: string; game: string; slot: string; also?: string[]; open?: boolean };
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean };
const GEAR = raw as Gear[];
const LAPS = rawLaptops as Lap[];

function liveDesks() {
  return PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, false) && part.price > 0 && !/refurb|renewed|open\s?box|barebone/i.test(part.name));
}

function pickDesk(test: (name: string, score: number) => boolean) {
  return liveDesks().filter((part) => test(part.name, machineScore(part.name))).sort((a, b) => a.price - b.price)[0];
}

function pickGear(game: string, slot: string, test: (item: Gear) => boolean) {
  return GEAR.filter((item) => !item.open && item.price > 0 && item.game === game && item.slot === slot && test(item)).sort((a, b) => a.price - b.price)[0];
}

function pickLap(test: (item: Lap) => boolean) {
  return LAPS.filter((item) => !item.open && item.price > 0 && item.kind !== "tablet" && !/renewed|refurb/i.test(item.name) && test(item)).sort((a, b) => a.price - b.price)[0];
}

function withPc(rule: string, pc: ReturnType<typeof pickDesk>, extra: BagLine[]): BagLine[] {
  if (!pc) return extra;
  return [{ ...partBag(pc, rule), rule: `${rule} Desktop score ${machineScore(pc.name)}.` }, ...extra];
}

export function racingReady(): BagLine[] {
  const rule = "Racing, the starter. A 5060 desktop, a Logitech G29 with pedals, and a wheel stand. Not the farm wheel.";
  const wheel = pickGear("racing", "wheel", (item) => /G29/.test(item.name) && Boolean(item.also?.includes("pedals")));
  const stand = pickGear("racing", "seat", (item) => /wheel stand/i.test(item.name) && !/\band\b/i.test(item.name));
  const pc = pickDesk((name) => /RTX\s?5060/.test(name.toUpperCase()) && !/TI/.test(name.toUpperCase()));
  return withPc(rule, pc, [wheel, stand].filter(Boolean).map((item) => simBag(item!, `${rule} ${item!.slot}.`)));
}

export function racingBetter(): BagLine[] {
  const rule = "Racing, the better one. A 5070 desktop, a MOZA R5 with pedals, and a cockpit. Not the starter.";
  const wheel = pickGear("racing", "wheel", (item) => /R5 Racing Wheel and Pedals/.test(item.name) && Boolean(item.also?.includes("pedals")));
  const seat = pickGear("racing", "seat", (item) => /F-GT Cockpit/i.test(item.name) && !/\band\b/i.test(item.name));
  const pc = pickDesk((name) => /5070/.test(name.toUpperCase()) && !/TI/.test(name.toUpperCase()));
  return withPc(rule, pc, [wheel, seat].filter(Boolean).map((item) => simBag(item!, `${rule} ${item!.slot}.`)));
}

export function racingCarry(): BagLine[] {
  const rule = "Racing, they take it home. A gaming laptop with a 5060, and a Thrustmaster wheel. No stand.";
  const computer = pickLap((item) => item.kind === "game" && item.gpu >= 55 && /5060/.test(item.name) && !/32GB/.test(item.specs));
  const wheel = pickGear("racing", "wheel", (item) => /T300/.test(item.name) && Boolean(item.also?.includes("pedals")));
  const lines: BagLine[] = [];
  if (computer) lines.push(lapBag(computer, `${rule} Laptop.`));
  if (wheel) lines.push(simBag(wheel, `${rule} Wheel and pedals.`));
  return lines;
}

export function farmingDesk(): BagLine[] {
  const rule = "Farming, at a desk. A 3050 desktop is enough. A G920 wheel, not the G29, plus the PC farm stick.";
  const wheel = pickGear("racing", "wheel", (item) => /G920/.test(item.name) && Boolean(item.also?.includes("pedals")));
  const stick = pickGear("farm", "farm", (item) => /FarmStick/i.test(item.name) && !/\bX\b/.test(item.name));
  const pc = pickDesk((name) => /3050/.test(name.toUpperCase()));
  return withPc(rule, pc, [wheel, stick].filter(Boolean).map((item) => simBag(item!, `${rule} ${item!.slot === "farm" ? "Farm stick." : "Wheel."}`)));
}

export function farmingCarry(): BagLine[] {
  const rule = "Farming, on a laptop. A 16GB home laptop and the PC farm stick. A wheel is optional, so it is not in this list.";
  const computer = pickLap((item) => item.kind === "home" && /16GB/.test(item.specs));
  const stick = pickGear("farm", "farm", (item) => /FarmStick/i.test(item.name) && !/\bX\b/.test(item.name));
  const lines: BagLine[] = [];
  if (computer) lines.push(lapBag(computer, `${rule} Laptop.`));
  if (stick) lines.push(simBag(stick, `${rule} Farm stick.`));
  return lines;
}

export function flightDesk(): BagLine[] {
  const rule = "Flying, at a desk. Flight wants 32GB. A 5060 Ti desktop and one HOTAS. The throttle is already on the stick.";
  const stick = pickGear("flight", "controls", (item) => /HOTAS/i.test(item.name) && !/xbox/i.test(item.name));
  const pc = pickDesk((name) => /5060\s?TI/.test(name.toUpperCase()) && /32\s?GB/.test(name.toUpperCase()));
  return withPc(rule, pc, stick ? [simBag(stick, `${rule} Stick and throttle.`)] : []);
}

export function flightCarry(): BagLine[] {
  const rule = "Flying, on a laptop. A 32GB gaming laptop and a PC flight stick. Not the desk HOTAS.";
  const computer = pickLap((item) => item.kind === "game" && /32GB/.test(item.specs) && item.gpu >= 55);
  const stick = pickGear("flight", "controls", (item) => /T16000M Flight Stick, PC/i.test(item.name));
  const lines: BagLine[] = [];
  if (computer) lines.push(lapBag(computer, `${rule} Laptop.`));
  if (stick) lines.push(simBag(stick, `${rule} Stick.`));
  return lines;
}

export function racingPack() {
  return racingReady();
}
export function farmingPack() {
  return farmingDesk();
}
export function flightPack() {
  return flightDesk();
}

export function deskPack(computerPart?: { id: string; name: string; brand?: string; price: number }): BagLine[] {
  const pc = computerPart ?? pickDesk((name, score) => score >= 24 && score <= 36 && !/BRIX|BAREBONE/i.test(name));
  const screen = PARTS.filter((part) => part.cat === "monitor" && !isJunk(part, false) && part.price > 0).sort((a, b) => a.price - b.price)[0];
  const board = KEYS.filter((item) => item.shelf === "board" && !item.open && (item.feel === "membrane" || item.feel === "silent") && item.price > 0).sort((a, b) => a.price - b.price)[0];
  const mouse = KEYS.filter((item) => item.shelf === "mouse" && !item.open && item.price > 0).sort((a, b) => a.price - b.price)[0];
  const score = pc ? machineScore(pc.name) : 0;
  const rule = `Desk bundle. For a whole desk. Budget is the price of each piece. Score ${score || "n/a"}.`;
  const lines: BagLine[] = [];
  if (pc) lines.push(partBag(pc, rule));
  if (screen) lines.push(partBag(screen, `${rule} Monitor.`));
  if (board) lines.push(keyBag(board, `${rule} Keyboard.`));
  if (mouse) lines.push(keyBag(mouse, `${rule} Mouse.`));
  return lines;
}

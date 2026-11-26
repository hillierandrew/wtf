import { PARTS, isJunk, machineScore } from "@/lib/catalog";
import { KEYS } from "@/lib/keyboard";
import raw from "@/data/sim.json";
import { partBag, simBag, keyBag, type BagLine } from "@/lib/bag";

type Gear = { id: string; name: string; price: number; brand: string; game: string; slot: string; also?: string[]; open?: boolean };
const GEAR = raw as Gear[];

function computer(min: number) {
  return PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, false) && part.price > 0 && machineScore(part.name) >= min).sort((a, b) => a.price - b.price)[0];
}

function gear(game: string, slot: string, test?: (item: Gear) => boolean) {
  return GEAR.filter((item) => !item.open && item.price > 0 && item.game === game && item.slot === slot && (!test || test(item))).sort((a, b) => a.price - b.price)[0];
}

export function racingPack(): BagLine[] {
  const pc = computer(55);
  const wheel = gear("racing", "wheel", (item) => Boolean(item.also?.includes("pedals"))) ?? gear("racing", "wheel");
  const pedals = wheel?.also?.includes("pedals") ? undefined : gear("racing", "pedals");
  const stand = GEAR.filter((item) => !item.open && item.price > 0 && item.slot === "seat" && /stand/i.test(item.name)).sort((a, b) => a.price - b.price)[0] ?? gear("racing", "seat");
  const rule = "Racing package. For a racing sim. Budget is the price of each piece. Score is the computer's score.";
  const lines: BagLine[] = [];
  if (pc) lines.push({ ...partBag(pc, rule), rule: `${rule} Computer score ${machineScore(pc.name)}.` });
  if (wheel) lines.push(simBag(wheel, `${rule} Wheel${wheel.also?.includes("pedals") ? " and pedals." : "."}`));
  if (pedals) lines.push(simBag(pedals, `${rule} Pedals.`));
  if (stand) lines.push(simBag(stand, `${rule} Stand.`));
  return lines;
}

export function farmingPack(): BagLine[] {
  const pc = computer(40);
  const wheel = gear("racing", "wheel", (item) => Boolean(item.also?.includes("pedals"))) ?? gear("racing", "wheel");
  const stick = gear("farm", "farm");
  const rule = "Farming package. For Farming Simulator. Budget is the price of each piece. Score is the computer's score.";
  const lines: BagLine[] = [];
  if (pc) lines.push({ ...partBag(pc, rule), rule: `${rule} Computer score ${machineScore(pc.name)}.` });
  if (wheel) lines.push(simBag(wheel, `${rule} Wheel.`));
  if (stick) lines.push(simBag(stick, `${rule} Farm stick.`));
  return lines;
}

export function flightPack(): BagLine[] {
  const pc = computer(50);
  const stick = gear("flight", "controls", (item) => /stick/i.test(item.name)) ?? gear("flight", "controls");
  const rule = "Flight package. For a flight sim. Budget is the price of each piece. Score is the computer's score.";
  const lines: BagLine[] = [];
  if (pc) lines.push({ ...partBag(pc, rule), rule: `${rule} Computer score ${machineScore(pc.name)}.` });
  if (stick) lines.push(simBag(stick, `${rule} Stick.`));
  return lines;
}

export function deskPack(computerPart?: { id: string; name: string; brand?: string; price: number; score?: number }): BagLine[] {
  const pc = computerPart ?? computer(20);
  const screen = PARTS.filter((part) => part.cat === "monitor" && !isJunk(part, false) && part.price > 0).sort((a, b) => a.price - b.price)[0];
  const board = KEYS.filter((item) => item.shelf === "board" && !item.open && (item.feel === "membrane" || item.feel === "silent") && item.price > 0).sort((a, b) => a.price - b.price)[0];
  const mouse = KEYS.filter((item) => item.shelf === "mouse" && !item.open && item.price > 0).sort((a, b) => a.price - b.price)[0];
  const score = pc && "name" in pc ? machineScore(pc.name) : 0;
  const rule = `Desk bundle. For a whole desk. Budget is the price of each piece. Score ${score || "n/a"}.`;
  const lines: BagLine[] = [];
  if (pc) lines.push(partBag(pc, rule));
  if (screen) lines.push(partBag(screen, `${rule} Monitor.`));
  if (board) lines.push(keyBag(board, `${rule} Keyboard.`));
  if (mouse) lines.push(keyBag(mouse, `${rule} Mouse.`));
  return lines;
}

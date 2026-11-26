import { useState } from "react";
import { X } from "lucide-react";
import { dealFrom, dealLines, explainLaptop, explainPart, faceTags, laptopBits, machineParts, money, rankFrom, type Part } from "@/lib/catalog";

const RING: Record<string, string> = {
  Crystal: "#0891b2",
  Gold: "#d97706",
  Silver: "#52525b",
  Bronze: "#c2410c",
  Brown: "#78350f",
};

const GAMES = [
  { name: "Valorant", need: 28, ram: 8 },
  { name: "League of Legends", need: 16, ram: 8 },
  { name: "Minecraft", need: 12, ram: 8 },
  { name: "Fortnite", need: 40, ram: 8 },
  { name: "Overwatch 2", need: 45, ram: 8 },
  { name: "Counter-Strike 2", need: 45, ram: 8 },
  { name: "Call of Duty", need: 60, ram: 16 },
  { name: "Red Dead Redemption 2", need: 55, ram: 12 },
  { name: "GTA V", need: 40, ram: 8 },
  { name: "Elden Ring", need: 55, ram: 12 },
  { name: "Baldur's Gate 3", need: 55, ram: 16 },
  { name: "Cyberpunk 2077", need: 70, ram: 16 },
  { name: "Helldivers 2", need: 60, ram: 16 },
];

const APPS = [
  { name: "Zoom", need: 0, ram: 8 },
  { name: "Email and Chrome", need: 0, ram: 8 },
  { name: "Word and Excel", need: 0, ram: 8 },
  { name: "Netflix", need: 0, ram: 8 },
  { name: "School work", need: 8, ram: 8 },
  { name: "Photo edits", need: 28, ram: 16 },
  { name: "Short videos", need: 45, ram: 16 },
  { name: "A small AI chat on the machine", need: 40, ram: 32 },
];

function chipPower(name: string, gpu?: number) {
  if (gpu && gpu > 0) return gpu;
  const n = name.toUpperCase();
  if (/5090|5080/.test(n)) return 100;
  if (/5070\s?TI|9070\s?XT/.test(n)) return 90;
  if (/\b5070\b|\b9070\b/.test(n)) return 75;
  if (/5060\s?TI|9060/.test(n)) return 68;
  if (/5060|4060|7600/.test(n)) return 60;
  if (/3050|4050/.test(n)) return 40;
  if (/780M|890M|RYZEN\s?AI|ULTRA\s?9/.test(n)) return 24;
  return 12;
}

function ramOf(name: string, specs?: string) {
  const blob = `${specs ?? ""} ${name}`;
  const spec = blob.match(/(\d+)\s*GB memory/i);
  if (spec) return Number(spec[1]);
  const plain = name.match(/(\d+)\s*GB(?!\s*SSD)/i);
  return plain ? Number(plain[1]) : 8;
}

function Sheet({ title, lines, onClose }: { title: string; lines: string[]; onClose: () => void }) {
  const note = lines.filter((line) => line.startsWith("TLDR:"));
  const body = lines.filter((line) => !line.startsWith("TLDR:"));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-left text-[#161616] shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-[#f2f2f2]">
            <X className="size-4" />
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-snug">
          {body.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {note[0] ? <p className="mt-4 rounded-xl bg-[#161616] p-3 text-sm leading-snug text-white">{note[0].replace("TLDR: ", "")}</p> : null}
      </div>
    </div>
  );
}

export function Marks({
  name,
  price,
  score,
  lines,
  room,
  gpu,
  specs,
}: {
  name: string;
  price: number;
  score: number;
  lines: string[];
  room: number;
  gpu?: number;
  specs?: string;
}) {
  const [which, setWhich] = useState<"" | "power" | "deal" | "games" | "apps">("");
  const power = rankFrom(score);
  const deal = dealFrom(price, score);
  const chip = chipPower(name, gpu);
  const ram = ramOf(name, specs);
  const tags = faceTags(`${name} ${specs ?? ""}`);
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setWhich("power")} className="min-h-10 rounded-full px-3 text-sm font-semibold" style={{ background: power.bg, color: power.fg, boxShadow: `0 0 0 3px ${RING[power.name]}` }}>
          {power.name} {power.score}
        </button>
        <button type="button" onClick={() => setWhich("deal")} className="min-h-10 rounded-full px-3 text-sm font-semibold" style={{ background: deal.bg, color: deal.fg, boxShadow: `0 0 0 3px ${deal.ring}` }}>
          {deal.name} {money(deal.per)}/pt
        </button>
        <button type="button" onClick={() => setWhich(which === "games" ? "" : "games")} className={`min-h-10 rounded-full border px-3 text-sm ${which === "games" ? "border-[#161616] bg-[#161616] text-white" : "border-[#ccc] bg-white text-[#161616]"}`}>
          Games
        </button>
        <button type="button" onClick={() => setWhich(which === "apps" ? "" : "apps")} className={`min-h-10 rounded-full border px-3 text-sm ${which === "apps" ? "border-[#161616] bg-[#161616] text-white" : "border-[#ccc] bg-white text-[#161616]"}`}>
          Apps
        </button>
      </div>
      {tags.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#333]">{tag}</span>
          ))}
        </div>
      ) : null}
      {which === "games" ? (
        <div className="mt-2">
          <p className="text-sm">Estimate. Not a promised frame rate.</p>
          <ul className="mt-1 space-y-1 text-sm">
          {GAMES.map((game) => {
            const ok = chip >= game.need && ram >= game.ram;
            return (
              <li key={game.name} className={ok ? "text-[#145214]" : "text-[#6b1420]"}>
                {ok ? "Runs" : "No"} · {game.name}
              </li>
            );
          })}
          </ul>
        </div>
      ) : null}
      {which === "apps" ? (
        <ul className="mt-2 space-y-1 text-sm">
          {APPS.map((app) => {
            const ok = chip >= app.need && ram >= app.ram;
            return (
              <li key={app.name} className={ok ? "text-[#145214]" : "text-[#6b1420]"}>
                {ok ? "Fine" : "Tight"} · {app.name}
              </li>
            );
          })}
        </ul>
      ) : null}
      {which === "power" ? <Sheet title={`${power.name} ${power.score}`} lines={lines} onClose={() => setWhich("")} /> : null}
      {which === "deal" ? <Sheet title={`${deal.name} · ${money(deal.per)} per point`} lines={dealLines(price, score, room)} onClose={() => setWhich("")} /> : null}
    </div>
  );
}

export function laptopMarks(item: { name: string; price: number; gpu: number; specs: string; kind?: string }) {
  const bits = laptopBits(item);
  return <Marks name={item.name} price={item.price} score={bits.score} room={bits.room} gpu={item.gpu} specs={item.specs} lines={explainLaptop(item)} />;
}

export function deskMarks(part: Part) {
  const bits = machineParts(part.name);
  return <Marks name={part.name} price={part.price} score={bits.score} room={bits.room} lines={explainPart({ ...part, cat: "prebuilt" })} />;
}

import { useState } from "react";
import { X } from "lucide-react";
import { dealFrom, dealLines, explainLaptop, explainPart, faceTags, laptopBits, machineParts, money, rankFrom, type Part } from "@/lib/catalog";
import { laptopWeight, releaseYear, specTags } from "@/lib/facts";
import { chipPower, gameSplit, memoryGb, type GameCall } from "@/lib/games";

const RING: Record<string, string> = {
  Crystal: "#0891b2",
  Gold: "#d97706",
  Silver: "#52525b",
  Bronze: "#c2410c",
  Brown: "#78350f",
};

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

export function GameSummary({ name, specs, kind, gpu }: { name: string; specs?: string; kind?: string; gpu?: number }) {
  const split = gameSplit({ name, specs, kind, gpu });
  if (split.blocked && !split.yes.length && !split.low.length) return <p className="mt-2 text-sm leading-snug text-[#333]">{split.blocked}</p>;
  return (
    <div className="mt-2 text-sm leading-snug">
      {split.blocked ? <p className="text-[#333]">{split.blocked}</p> : null}
      <p><span className="font-semibold text-[#145214]">Yes.</span> {split.yes.join(", ") || "None."}</p>
      {split.low.length ? <p><span className="font-semibold text-[#5a3b00]">Low.</span> {split.low.join(", ")}.</p> : null}
      {split.no.length ? <p><span className="font-semibold text-[#6b1420]">No.</span> {split.no.join(", ")}.</p> : null}
    </div>
  );
}

const CALL_COLOR: Record<GameCall, string> = { Yes: "text-[#145214]", Low: "text-[#5a3b00]", No: "text-[#6b1420]" };

export function Marks({
  name,
  price,
  score,
  lines,
  room,
  gpu,
  specs,
  kind,
}: {
  name: string;
  price: number;
  score: number;
  lines: string[];
  room: number;
  gpu?: number;
  specs?: string;
  kind?: string;
}) {
  const [which, setWhich] = useState<"" | "power" | "deal" | "games" | "apps">("");
  const power = rankFrom(score);
  const deal = dealFrom(price, score);
  const chip = chipPower(`${name} ${specs ?? ""}`, gpu);
  const ram = memoryGb(name, specs ?? "");
  const games = gameSplit({ name, specs, kind, gpu });
  const tags = [...faceTags(`${name} ${specs ?? ""}`), ...specTags(name, specs), ...games.yes.slice(0, 4)];
  const carry = Boolean(specs?.match(/memory/i) || /\d{2}(\.\d)?\s*"/.test(name));
  if (carry) {
    const weight = laptopWeight(name, specs);
    tags.push(`${weight.lb} lb`, `${weight.kg} kg`, String(releaseYear(name)));
  }
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
      <GameSummary name={name} specs={specs} kind={kind} gpu={gpu} />
      {tags.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#333]">{tag}</span>
          ))}
        </div>
      ) : null}
      {which === "games" ? (
        <div className="mt-2">
          <p className="text-sm">1080p estimate for games people are playing now. Low means turn it down. Not a promised frame rate. Phantom Blade Zero is a new one, so that line is a guess.</p>
          <ul className="mt-1 space-y-1 text-sm">
          {games.rows.map((game) => (
            <li key={game.name} className={CALL_COLOR[game.how]}>
              {game.how} · {game.name}
            </li>
          ))}
          </ul>
        </div>
      ) : null}
      {which === "apps" ? (
        <ul className="mt-2 space-y-1 text-sm">
          {APPS.map((app) => {
            const ok = chip >= app.need && (ram <= 0 || ram >= app.ram);
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
  return <Marks name={item.name} price={item.price} score={bits.score} room={bits.room} gpu={item.gpu} specs={item.specs} kind={item.kind} lines={explainLaptop(item)} />;
}

export function deskMarks(part: Part) {
  const bits = machineParts(part.name);
  return <Marks name={part.name} price={part.price} score={bits.score} room={bits.room} lines={explainPart({ ...part, cat: "prebuilt" })} />;
}

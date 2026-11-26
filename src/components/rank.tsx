import { useState } from "react";
import { X } from "lucide-react";
import { rankFrom } from "@/lib/catalog";

const WHY: Record<string, string> = {
  Crystal: "90 to 100 is Crystal. This score cleared 90.",
  Gold: "75 to 89 is Gold. This score cleared 75 and stopped under 90.",
  Silver: "55 to 74 is Silver. This score cleared 55 and stopped under 75.",
  Bronze: "35 to 54 is Bronze. This score cleared 35 and stopped under 55.",
  Brown: "Under 35 is Brown. This score did not clear 35.",
};

export function RankBadge({ score, lines }: { score: number; lines: string[] }) {
  const [open, setOpen] = useState(false);
  if (score < 1) {
    return <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">No computer score</span>;
  }
  const rank = rankFrom(score);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: rank.bg, color: rank.fg }}
      >
        {rank.name} {rank.score}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="How this score was made" className="w-full max-w-sm rounded-2xl bg-white p-4 text-left text-[#111] shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">
                {rank.name} {rank.score}
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 items-center justify-center rounded-full bg-neutral-100">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-snug">{WHY[rank.name]}</p>
            <ul className="mt-3 space-y-2 text-sm leading-snug text-neutral-700">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

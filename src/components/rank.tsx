import { useState } from "react";
import { rankFrom } from "@/lib/catalog";

export function RankBadge({ score, lines }: { score: number; lines: string[] }) {
  const [open, setOpen] = useState(false);
  const rank = rankFrom(score);
  return (
    <span className="inline-flex max-w-full flex-col items-start">
      <button
        type="button"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: rank.bg, color: rank.fg }}
      >
        {rank.name} {rank.score}
      </button>
      {open ? (
        <span className="mt-2 block space-y-1 text-xs leading-snug text-muted">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

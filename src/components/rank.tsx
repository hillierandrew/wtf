import { rankFrom, type Rank } from "@/lib/catalog";

export function RankBadge({ score }: { score: number }) {
  const rank: Rank = rankFrom(score);
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: rank.bg, color: rank.fg }}>
      {rank.name} {rank.score}
    </span>
  );
}

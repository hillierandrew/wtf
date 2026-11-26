import { useMemo, useState } from "react";
import { DEALS } from "@/data/deals";
import { dealFrom, money, scoreBundleText } from "@/lib/catalog";
import { specTags } from "@/lib/facts";
import { AddButton } from "@/components/bag";
import { RankBadge } from "@/components/rank";
import type { BagLine } from "@/lib/bag";

type Sort = "score" | "score-low" | "deal" | "low" | "high";

export function Bundles({ onLeave }: { onLeave: () => void }) {
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState<Sort>("score");
  const kinds = useMemo(() => ["all", ...new Set(DEALS.map((deal) => deal.kind))], []);
  const rows = useMemo(() => {
    const list = DEALS.filter((deal) => kind === "all" || deal.kind === kind).map((deal) => {
      const scored = scoreBundleText(`${deal.name} + ${deal.parts.join(" + ")}`, deal.price);
      return { deal, ...scored, per: scored.computer ? deal.price / scored.score : Number.POSITIVE_INFINITY };
    });
    return list.sort((a, b) => {
      if (sort === "high") return b.deal.price - a.deal.price;
      if (sort === "low") return a.deal.price - b.deal.price;
      if (sort === "deal") return a.per - b.per || b.score - a.score;
      if (sort === "score-low") return a.score - b.score || a.deal.price - b.deal.price;
      return b.score - a.score || a.per - b.per;
    });
  }, [kind, sort]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-fg">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <button type="button" onClick={onLeave} className="h-11 rounded-full border border-line px-4 text-sm">Shelves</button>
        <p className="text-sm text-muted">Bundle scores</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="font-display text-4xl font-medium">Bundles</h1>
        <p className="mt-2 text-base text-muted">The score is the chip, the card, and the memory. Wheels and chairs are not scored. Lower dollars per point is the better price.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-11 rounded-full border border-line bg-elevated px-3 text-sm">
            <option value="score">Score, high</option>
            <option value="score-low">Score, low</option>
            <option value="deal">Best dollars per point</option>
            <option value="low">Price, low</option>
            <option value="high">Price, high</option>
          </select>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-11 rounded-full border border-line bg-elevated px-3 text-sm">
            {kinds.map((item) => (
              <option key={item} value={item}>{item === "all" ? "Every bundle" : item}</option>
            ))}
          </select>
        </div>
        <ul className="mt-4 space-y-3">
          {rows.map(({ deal, score, lines, computer, per }) => {
            const dealRank = computer ? dealFrom(deal.price, score) : null;
            const line: BagLine = {
              id: `bundle:${deal.id}`,
              name: deal.name,
              price: deal.price,
              rule: computer ? `Bundle. ${deal.parts.join(", ")}. ${money(deal.price)}. Score ${score}. ${money(per)} per point.` : `Bundle. ${deal.parts.join(", ")}. ${money(deal.price)}. No computer score.`,
            };
            return (
              <li key={deal.id} className="rounded-3xl border border-line bg-elevated p-4">
                <p className="text-sm text-muted">{deal.kind}</p>
                <h2 className="mt-1 text-lg font-medium leading-snug">{deal.name}</h2>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-2xl font-semibold">{money(deal.price)}</p>
                  <RankBadge score={score} lines={lines} />
                </div>
                {dealRank ? <p className="text-sm font-medium" style={{ color: dealRank.fg }}>{dealRank.name}. {money(dealRank.per)} per point.</p> : <p className="text-sm text-muted">No computer score.</p>}
                {deal.save > 0 ? <p className="text-sm text-ok">Save {money(deal.save)}</p> : null}
                <ol className="mt-2 space-y-1 text-sm text-muted">
                  {deal.parts.map((part) => (
                    <li key={part}>{part}</li>
                  ))}
                </ol>
                <div className="mt-2 flex flex-wrap gap-1">
                  {specTags(deal.name).map((tag) => (
                    <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]">{tag}</span>
                  ))}
                </div>
                <AddButton line={line} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
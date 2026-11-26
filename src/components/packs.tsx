import { money } from "@/lib/catalog";
import { AddPack, RuleLine } from "@/components/bag";
import { deskPack, farmingPack, flightPack, racingPack } from "@/lib/packs";

const PACKS = [
  { id: "racing", title: "Racing", line: "PC, wheel, pedals, and a stand.", lines: racingPack },
  { id: "farming", title: "Farming", line: "PC, wheel, and a farm stick.", lines: farmingPack },
  { id: "flight", title: "Flight", line: "PC and a stick.", lines: flightPack },
  { id: "desk", title: "Whole desk", line: "Computer, monitor, keyboard, and mouse.", lines: () => deskPack() },
] as const;

export function Packs() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PACKS.map((pack) => {
        const lines = pack.lines();
        const total = lines.reduce((sum, line) => sum + line.price, 0);
        return (
          <article key={pack.id} className="rounded-3xl border border-line bg-elevated p-4">
            <h3 className="text-2xl font-medium">{pack.title}</h3>
            <p className="mt-1 text-sm text-muted">{pack.line}</p>
            <p className="mt-2 text-xl font-semibold">{money(total)}</p>
            <ol className="mt-2 space-y-1 text-sm">
              {lines.map((line, index) => (
                <li key={line.id}>
                  {index + 1}. {line.name}
                </li>
              ))}
            </ol>
            <RuleLine how={pack.title} who={pack.line} budget={money(total)} score={lines[0]?.rule.match(/Score (\d+)/)?.[1] ?? "on the computer"} />
            <AddPack lines={lines} />
          </article>
        );
      })}
    </div>
  );
}

import { money } from "@/lib/catalog";
import { AddPack, RuleLine } from "@/components/bag";
import { deskPack, farmingCarry, farmingDesk, flightCarry, flightDesk, racingBetter, racingCarry, racingReady } from "@/lib/packs";
import type { BagLine } from "@/lib/bag";

const GROUPS: { title: string; line: string; packs: { id: string; title: string; line: string; lines: () => BagLine[] }[] }[] = [
  {
    title: "Racing",
    line: "The wheel is different in each list. Do not hand them the farm wheel.",
    packs: [
      { id: "racing-ready", title: "Starter, desktop", line: "5060 desktop, Logitech G29, stand.", lines: racingReady },
      { id: "racing-better", title: "Better, desktop", line: "5070 desktop, MOZA R5, cockpit.", lines: racingBetter },
      { id: "racing-lap", title: "Laptop", line: "5060 laptop and a Thrustmaster wheel.", lines: racingCarry },
    ],
  },
  {
    title: "Farming",
    line: "Farming does not need a racing PC. A 3050 is enough.",
    packs: [
      { id: "farm-desk", title: "Desktop", line: "3050 desktop, Logitech G920, farm stick.", lines: farmingDesk },
      { id: "farm-lap", title: "Laptop", line: "16GB home laptop and a farm stick.", lines: farmingCarry },
    ],
  },
  {
    title: "Flying",
    line: "Flight Simulator wants 32GB. The stick already has a throttle on the desktop list.",
    packs: [
      { id: "flight-desk", title: "Desktop", line: "5060 Ti, 32GB, and a HOTAS.", lines: flightDesk },
      { id: "flight-lap", title: "Laptop", line: "32GB gaming laptop and a PC stick.", lines: flightCarry },
    ],
  },
];

export function Packs() {
  const desk = deskPack();
  const deskTotal = desk.reduce((sum, line) => sum + line.price, 0);
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="text-2xl font-semibold">{group.title}</h3>
          <p className="mt-1 text-sm text-[#333]">{group.line}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {group.packs.map((pack) => {
              const lines = pack.lines();
              const total = lines.reduce((sum, line) => sum + line.price, 0);
              return (
                <article key={pack.id} className="rounded-3xl border border-[#161616] bg-white p-4 text-[#161616]">
                  <h4 className="text-xl font-medium">{pack.title}</h4>
                  <p className="mt-1 text-sm text-[#333]">{pack.line}</p>
                  <p className="mt-2 text-xl font-semibold">{money(total)}</p>
                  <ol className="mt-2 space-y-1 text-sm">
                    {lines.map((line, index) => (
                      <li key={line.id}>
                        {index + 1}. {line.name} · {money(line.price)}
                      </li>
                    ))}
                  </ol>
                  <RuleLine how={pack.title} who={pack.line} budget={money(total)} score={lines[0]?.rule.match(/Score (\d+)/)?.[1] ?? "on the computer"} />
                  <AddPack lines={lines} />
                </article>
              );
            })}
          </div>
        </section>
      ))}
      <section>
        <h3 className="text-2xl font-semibold">Not a sim</h3>
        <p className="mt-1 text-sm text-[#333]">They just want a computer on a desk.</p>
        <article className="mt-3 rounded-3xl border border-[#161616] bg-white p-4 text-[#161616]">
          <h4 className="text-xl font-medium">Whole desk</h4>
          <p className="mt-1 text-sm text-[#333]">Computer, monitor, quiet keyboard, and a mouse.</p>
          <p className="mt-2 text-xl font-semibold">{money(deskTotal)}</p>
          <ol className="mt-2 space-y-1 text-sm">
            {desk.map((line, index) => (
              <li key={line.id}>
                {index + 1}. {line.name} · {money(line.price)}
              </li>
            ))}
          </ol>
          <AddPack lines={desk} />
        </article>
      </section>
    </div>
  );
}

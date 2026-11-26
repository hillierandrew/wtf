import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyList, listText } from "@/components/copy-list";
import { money } from "@/lib/catalog";
import { threeOf, useBag, type BagLine, type Scored } from "@/lib/bag";

export function AddButton({ line, className }: { line: BagLine; className?: string }) {
  const add = useBag((state) => state.add);
  const remove = useBag((state) => state.remove);
  const on = useBag((state) => state.lines.some((item) => item.id === line.id));
  return (
    <button type="button" onClick={() => (on ? remove(line.id) : add(line))} className={className ?? "mt-2 h-11 w-full rounded-full border border-line text-sm font-medium"}>
      {on ? "Remove from cart" : "Add to cart"}
    </button>
  );
}

export function AddPack({ lines, className }: { lines: BagLine[]; className?: string }) {
  const addMany = useBag((state) => state.addMany);
  if (!lines.length) return null;
  return (
    <button type="button" onClick={() => addMany(lines)} className={className ?? "mt-2 h-11 w-full rounded-full bg-[#161616] text-sm font-medium text-white"}>
      Add the whole list
    </button>
  );
}

export function RuleLine({ how, who, budget, score }: { how: string; who: string; budget: string; score: string }) {
  return (
    <p className="mt-2 text-sm leading-snug text-current/80">
      Rule: {how}. For {who}. Budget {budget}. Score {score}.
    </p>
  );
}

export function MoreDetail({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm underline">
        {open ? "Hide detail" : "More detail"}
      </button>
      {open ? <p className="mt-1 text-sm leading-snug">{text}</p> : null}
    </div>
  );
}

export function ThreeSearch({ rows, who, lineFor }: { rows: Scored[]; who: string; lineFor: (item: Scored, how: string) => BagLine }) {
  const picks = threeOf(rows);
  if (!picks.length) return <p className="py-8 text-center text-sm">Nothing matches.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {picks.map((pick) => (
        <article key={pick.item.id} className="rounded-3xl border border-line bg-elevated p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">{pick.kind}</p>
          <h3 className="mt-2 text-base font-medium leading-snug">{pick.item.name}</h3>
          <p className="mt-2 text-2xl font-semibold">{money(pick.item.price)}</p>
          <RuleLine how={pick.kind} who={who} budget={money(pick.item.price)} score={String(Math.round(pick.item.score))} />
          <AddButton line={lineFor(pick.item, `${pick.kind}. For ${who}. Budget ${money(pick.item.price)}. Score ${Math.round(pick.item.score)}.`)} />
        </article>
      ))}
    </div>
  );
}

export function BagDock({ lift = false }: { lift?: boolean }) {
  const lines = useBag((state) => state.lines);
  const open = useBag((state) => state.open);
  const setOpen = useBag((state) => state.setOpen);
  const remove = useBag((state) => state.remove);
  const hydrate = useBag((state) => state.hydrate);
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  const text = listText("Cart", lines.map((line) => line.name));
  const [qr, setQr] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!open || !lines.length) return;
    let stop = false;
    QRCode.toDataURL(text, { margin: 1, width: 220 })
      .then((url) => {
        if (!stop) setQr(url);
      })
      .catch(() => setQr(""));
    return () => {
      stop = true;
    };
  }, [open, text, lines.length]);

  return (
    <div className={`bag-dock pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 ${lift ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]" : "bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]"}`}>
      <div className="pointer-events-auto w-full max-w-xl rounded-3xl bg-[#111] text-white shadow-2xl">
        <button type="button" onClick={() => setOpen(!open)} className="flex h-14 w-full items-center justify-between px-4 text-left">
          <span>Cart · {lines.length}</span>
          <span>
            {money(total)} · {open ? "Close" : "Open"}
          </span>
        </button>
        {open ? (
          <div className="max-h-[50dvh] overflow-y-auto px-4 pb-4">
            {lines.length === 0 ? <p className="text-sm text-white/70">Nothing in the cart yet.</p> : null}
            <ol className="space-y-2">
              {lines.map((line, index) => (
                <li key={line.id} className="flex items-start gap-2 text-sm">
                  <span className="min-w-0 flex-1">
                    {index + 1}. {line.name}
                    <span className="mt-0.5 block text-white/60">{line.rule}</span>
                  </span>
                  <button type="button" onClick={() => remove(line.id)} className="h-9 shrink-0 rounded-full border border-white/40 px-3">
                    Remove
                  </button>
                </li>
              ))}
            </ol>
            {qr && lines.length ? <img src={qr} alt="QR code for this cart" className="mx-auto mt-3 size-36 rounded-xl bg-white p-2" /> : null}
            <CopyList title="Cart" names={lines.map((line) => line.name)} className="mt-3 h-12 w-full rounded-full bg-[#d6ff4a] text-base font-semibold text-[#111]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

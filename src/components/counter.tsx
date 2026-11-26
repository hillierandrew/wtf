import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QRCode from "qrcode";
import { CAT_LABEL, PARTS, explainPart, fitWhy, isJunk, money, partScore, rankFrom, reconcile, spendOf, tagsOf, type Build, type Category, type Part } from "@/lib/catalog";
import { listText, partLine } from "@/components/copy-list";
import { RankBadge } from "@/components/rank";
import { usePath } from "@/components/history";

const FROM_CPU: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "psu", "case", "monitor"];
const FROM_GPU: Category[] = ["gpu", "cpu", "motherboard", "memory", "storage", "cooler", "psu", "case", "monitor"];

const SAY: Partial<Record<Category, string>> = {
  cpu: "Start with the chip. Crystal and gold glow. Those are the ones I would hand you.",
  gpu: "Start with the graphics card if the picture matters most. The power supply has to keep up.",
  motherboard: "Only boards that match this chip. The memory type is decided here.",
  memory: "DDR5 stays with a DDR5 board. DDR4 stays with DDR4. The wrong kind is not in this list.",
  storage: "One drive is enough to leave the shop. A bigger one is for photos and games.",
  cooler: "Skip this if the chip already comes with a cooler.",
  psu: "This has to feed the graphics card. Bigger cards want more watts.",
  case: "The case has to fit the board. ATX does not go in a tiny box.",
  monitor: "Skip this if they already have a screen.",
};

function glow(score: number) {
  const name = rankFrom(score).name;
  if (name === "Crystal") return "ring-2 ring-cyan-300 shadow-[0_0_18px_rgba(125,211,252,0.85)]";
  if (name === "Gold") return "ring-2 ring-amber-300 shadow-[0_0_16px_rgba(246,217,138,0.9)]";
  return "";
}

export function Counter({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState<"cpu" | "gpu" | null>(null);
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1500);
  const [build, setBuild] = useState<Build>({});
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const [openCart, setOpenCart] = useState(false);
  const [sort, setSort] = useState<"score-desc" | "score-asc" | "price-asc" | "price-desc">("score-desc");
  const [grid, setGrid] = useState(false);
  const path = usePath();

  const order = from === "gpu" ? FROM_GPU : FROM_CPU;
  const cat = order[Math.min(step, order.length - 1)];
  const parts = useMemo(() => {
    const others: Build = { ...build };
    delete others[cat];
    const spent = spendOf(others);
    const room = Math.max(80, budget - spent);
    const fitting = PARTS.filter((part) => part.cat === cat && !isJunk(part, false) && !fitWhy(part, others));
    const priced = fitting.filter((part) => part.price <= room);
    const list = (priced.length ? priced : fitting).slice();
    list.sort((a, b) => {
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "score-asc") return partScore(a) - partScore(b) || a.price - b.price;
      return partScore(b) - partScore(a) || a.price - b.price;
    });
    return list.slice(0, 40);
  }, [build, cat, budget, sort]);

  const chosen = (["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "psu", "case", "monitor"] as const)
    .map((item) => build[item])
    .filter((part): part is Part => Boolean(part));
  const lines = chosen.map(partLine);
  const text = listText("Shelf list", lines);
  const ideas = (["monitor", "cooler", "storage"] as const).filter((item) => !build[item]);

  useEffect(() => {
    if (!openCart || !lines.length) return;
    let stop = false;
    QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#1a0a24", light: "#fff7ed" } })
      .then((url) => {
        if (!stop) setQr(url);
      })
      .catch(() => setQr(""));
    return () => {
      stop = true;
    };
  }, [openCart, text, lines.length]);

  function take(part: Part) {
    setBuild(reconcile(part.cat, { ...build, [part.cat]: part }));
    const next = Math.min(order.length - 1, step + 1);
    setStep(next);
    setOpenCart(true);
    path?.note(`step-${order[next]}`, CAT_LABEL[order[next]]);
  }

  function drop(part: Part) {
    setBuild((current) => {
      const next = { ...current };
      delete next[part.cat];
      return next;
    });
  }

  function jump(index: number) {
    setStep(index);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (!from) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#1a0a24] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <button type="button" onClick={onClose} className="flex h-11 items-center gap-1 text-base text-[#ffb070]">
          <ChevronLeft className="size-5" /> Back
        </button>
        <h1 className="font-display mt-4 text-4xl font-medium leading-none">Where do we start?</h1>
        <p className="mt-3 text-base text-[#ffd7b0]">One choice. Then only parts that fit stay on the screen.</p>
        <button type="button" onClick={() => { path?.note("start-cpu", "Chip"); setFrom("cpu"); setStep(0); }} className="mt-6 min-h-24 rounded-3xl bg-[#ff7a1a] px-5 py-4 text-left text-[#2a0a12]">
          <span className="block text-2xl font-semibold">Start with the chip</span>
          <span className="mt-1 block text-base">Then the board, the memory, and the graphics card.</span>
        </button>
        <button type="button" onClick={() => { path?.note("start-gpu", "Graphics card"); setFrom("gpu"); setStep(0); }} className="mt-3 min-h-24 rounded-3xl border border-[#ff7a1a] bg-[#2a1038] px-5 py-4 text-left">
          <span className="block text-2xl font-semibold">Start with the graphics card</span>
          <span className="mt-1 block text-base text-[#ffd7b0]">Then I only show chips, boards, and power that can run it.</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[#140816] text-white">
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="flex h-11 items-center gap-1 text-[#ffb070]">
            <ChevronLeft className="size-5" /> Close
          </button>
          <p className="text-sm text-[#ffd7b0]">{step + 1} of {order.length}</p>
        </div>
        <h1 className="mt-1 text-3xl font-semibold leading-none">{CAT_LABEL[cat]}</h1>
        <p className="mt-2 text-sm leading-snug text-[#ffd7b0]">{SAY[cat]}</p>
        <label className="mt-3 block text-sm text-[#ffb070]">
          Budget {money(budget)}
          <input type="range" min={400} max={4500} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 h-8 w-full accent-[#ff7a1a]" />
        </label>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {order.map((item, index) => (
            <button key={item} type="button" onClick={() => { path?.note(`step-${item}`, CAT_LABEL[item]); jump(index); }} className={`h-10 shrink-0 rounded-full px-3 text-sm ${index === step ? "bg-[#ff7a1a] text-[#2a0a12]" : build[item] ? "bg-[#3b1760] text-white" : "bg-[#241033] text-[#ffd7b0]"}`}>
              {CAT_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 pb-2">
          {(
            [
              ["score-desc", "Score high"],
              ["score-asc", "Score low"],
              ["price-asc", "Price low"],
              ["price-desc", "Price high"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSort(id)} className={`h-10 rounded-full px-3 text-sm ${sort === id ? "bg-[#ff7a1a] text-[#2a0a12]" : "bg-[#241033] text-[#ffd7b0]"}`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => setGrid((value) => !value)} className="h-10 rounded-full bg-[#241033] px-3 text-sm text-[#ffd7b0]">
            {grid ? "List" : "Grid"}
          </button>
        </div>
      </header>
      <ul className={`min-h-0 flex-1 overflow-y-auto px-4 pb-3 ${grid ? "grid grid-cols-2 content-start gap-2" : "space-y-2"}`}>
        {parts.map((part) => {
          const score = partScore(part);
          const on = build[cat]?.id === part.id;
          return (
            <li key={part.id}>
              <button type="button" onClick={() => take(part)} className={`flex w-full items-start justify-between gap-3 rounded-2xl bg-[#241033] px-3 py-3 text-left ${glow(score)} ${on ? "outline outline-2 outline-[#ff7a1a]" : ""}`}>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-[#ffb070]">{part.brand}</span>
                  <span className="mt-0.5 block text-base leading-snug">{part.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {tagsOf(part).slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-[#ffd7b0]">{tag}</span>
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <RankBadge score={score} lines={explainPart(part)} />
                  <span className="mt-1 block text-sm font-semibold">{money(part.price)}</span>
                </span>
              </button>
            </li>
          );
        })}
        {parts.length === 0 ? <li className="py-8 text-center text-[#ffd7b0]">Nothing on the shelf fits. Go back and change the last part.</li> : null}
      </ul>
      <footer className="shrink-0 border-t border-[#3b1760] bg-[#1a0a24] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setOpenCart((value) => !value)} className="flex w-full items-center justify-between text-left">
          <span className="text-base">{chosen.length} parts in the cart</span>
          <span className="text-lg font-semibold">{money(spendOf(build))}</span>
        </button>
        {openCart ? (
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            <ol className="space-y-1 text-sm">
              {chosen.map((part, index) => (
                <li key={part.id} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">{index + 1}. {partLine(part)}</span>
                  <button type="button" onClick={() => drop(part)} className="shrink-0 rounded-full border border-[#1c1612] px-2 py-1 text-xs">
                    Remove
                  </button>
                </li>
              ))}
            </ol>
            {qr ? <img src={qr} alt="QR code for this parts list" className="mx-auto mt-2 size-40 rounded-xl bg-[#fff7ed] p-2" /> : null}
            <button type="button" onClick={copy} className="h-11 w-full rounded-full bg-[#ff7a1a] text-base font-semibold text-[#2a0a12]">
              {copied ? "Copied" : "Copy build"}
            </button>
            {ideas.length ? <p className="text-sm text-[#ffd7b0]">Still easy to add: {ideas.map((item) => CAT_LABEL[item].toLowerCase()).join(", ")}.</p> : <p className="text-sm text-[#ffd7b0]">That is a whole computer. A keyboard is the next thing they will ask for.</p>}
          </div>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full border border-[#ff7a1a]">
            <ChevronLeft className="size-4" /> Back
          </button>
          <button type="button" onClick={() => setStep((value) => Math.min(order.length - 1, value + 1))} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-[#ff7a1a] font-semibold text-[#2a0a12]">
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

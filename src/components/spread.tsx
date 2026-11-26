import { useEffect, useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import QRCode from "qrcode";
import { PARTS, isJunk, machineParts, machineScore, money } from "@/lib/catalog";
import { KEYS, type KeyItem } from "@/lib/keyboard";
import { deskMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { CopyList, listText, partLine } from "@/components/copy-list";
import boxPc from "@/assets/box-pc.jpg";
import boxKeys from "@/assets/box-keys.jpg";

const WHO = [
  { id: "grandma", title: "Grandma" },
  { id: "school", title: "School" },
  { id: "work", title: "Work" },
  { id: "games", title: "Games" },
  { id: "think", title: "A model at home" },
] as const;

type Who = (typeof WHO)[number]["id"];

function say(who: Who, name: string, price: string) {
  if (who === "grandma") return `This is the one I would take home to her. Email, photos, and a video call. She does not have to learn it. It is the ${name}, ${price}.`;
  if (who === "school") return `This is enough for class, a browser, and a few years. It is the ${name}, ${price}, and it is under the budget we just set.`;
  if (who === "work") return `This is the desk machine. Enough memory, and it is not a toy. The ${name}, ${price}.`;
  if (who === "games") return `If the picture is the reason they are here, this is the one. Tap Games and I will say what it runs. The ${name}, ${price}.`;
  return `This one can keep a small model on the machine, not only in a browser tab. The ${name}, ${price}.`;
}

function BoxShot({ src, brand, name, price, tall }: { src: string; brand: string; name: string; price: number; tall?: boolean }) {
  return (
    <figure className="relative mt-4 overflow-hidden rounded-2xl bg-black">
      <img src={src} alt="" className={`w-full object-cover ${tall ? "h-72" : "h-48"}`} />
      <figcaption className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-[#f6f1e4]/95 p-3 text-[#1a120c] shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a5a32]">{brand}</p>
        <p className="mt-1 text-sm font-medium leading-snug">{name}</p>
        <p className="mt-1 text-lg font-semibold">{money(price)}</p>
      </figcaption>
    </figure>
  );
}

export function Spread({ onLock }: { onLock: () => void }) {
  const [panel, setPanel] = useState<"home" | "build" | "keys" | "sim">("home");
  const [who, setWho] = useState<Who>("school");
  const [budget, setBudget] = useState(1400);
  const [pcOn, setPcOn] = useState(true);
  const [board, setBoard] = useState<"feel" | "grandma" | null>(null);
  const [cart, setCart] = useState(false);
  const [qr, setQr] = useState("");

  const pick = useMemo(() => {
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget);
    if (who === "grandma") return desks.filter((part) => machineScore(part.name) < 40).sort((a, b) => a.price - b.price)[0] ?? desks.sort((a, b) => a.price - b.price)[0];
    if (who === "school") return desks.filter((part) => machineScore(part.name) < 58).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "work") return desks.filter((part) => machineParts(part.name).ram >= 16).sort((a, b) => a.price / machineScore(a.name) - b.price / machineScore(b.name))[0];
    if (who === "games") return desks.slice().sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
    return desks.filter((part) => machineParts(part.name).ram >= 32).sort((a, b) => machineScore(b.name) - machineScore(a.name))[0] ?? desks.sort((a, b) => machineScore(b.name) - machineScore(a.name))[0];
  }, [budget, who]);

  const feel = useMemo(
    () =>
      KEYS.filter((item) => item.shelf === "board" && ["linear", "tactile", "silent"].includes(item.feel) && item.price <= 180 && !item.open).sort(
        (a, b) => (a.estimated ?? 99) - (b.estimated ?? 99),
      )[0],
    [],
  );
  const grandma = useMemo(
    () => KEYS.filter((item) => item.shelf === "board" && (item.feel === "membrane" || item.feel === "silent") && item.price <= 80).sort((a, b) => a.price - b.price)[0],
    [],
  );

  const ticket = useMemo(() => {
    const lines: { id: string; name: string; price: number }[] = [];
    if (pcOn && pick) lines.push({ id: pick.id, name: partLine(pick), price: pick.price });
    const keys: KeyItem | undefined = board === "feel" ? feel : board === "grandma" ? grandma : undefined;
    if (keys) lines.push({ id: keys.id, name: partLine(keys), price: keys.price });
    return lines;
  }, [pcOn, pick, board, feel, grandma]);

  const total = ticket.reduce((sum, line) => sum + line.price, 0);
  const text = listText("6666 ticket", ticket.map((line) => line.name));

  useEffect(() => {
    if (!cart || !ticket.length) return;
    let stop = false;
    QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#1a120c", light: "#f6f1e4" } })
      .then((url) => {
        if (!stop) setQr(url);
      })
      .catch(() => setQr(""));
    return () => {
      stop = true;
    };
  }, [cart, text, ticket.length]);

  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-dvh bg-[#f3ecdf] pb-28 text-[#1a120c]">
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a5a32]">6666</p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-[0.95] sm:text-6xl">I would put this one in their hands.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#1a120c]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mx-4 mt-4 max-w-2xl text-lg text-[#4a3b2a]">Read the line under the box. Add the keyboard to the same ticket. One QR is the whole thing you walk to the shelf with.</p>
      <div className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {WHO.map((item) => (
          <button key={item.id} type="button" onClick={() => setWho(item.id)} className={`h-11 shrink-0 rounded-full px-4 text-sm ${who === item.id ? "bg-[#1a120c] text-[#f3ecdf]" : "border border-[#1a120c] bg-transparent"}`}>
            {item.title}
          </button>
        ))}
      </div>
      <label className="mx-4 mt-4 block text-sm">
        Their budget {money(budget)}
        <input type="range" min={500} max={4000} step={50} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 h-8 w-full accent-[#9a3412]" />
      </label>
      <div className="mt-6 grid gap-4 px-4 lg:grid-cols-3">
        <article className="rounded-[1.6rem] bg-[#1a120c] p-5 text-[#f3ecdf] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#e7c2a0]">The computer</p>
          {pick ? (
            <>
              <h2 className="mt-2 text-2xl font-medium leading-snug">{pick.name}</h2>
              <p className="mt-3 text-4xl font-medium">{money(pick.price)}</p>
              <BoxShot src={boxPc} brand={pick.brand} name={pick.name} price={pick.price} tall />
              <p className="mt-4 rounded-2xl bg-[#f3ecdf] p-4 text-base leading-snug text-[#1a120c]">Say this. {say(who, pick.name, money(pick.price))}</p>
              <div className="mt-3 text-[#1a120c]">{deskMarks(pick)}</div>
              <button type="button" onClick={() => { setPcOn(true); setCart(true); }} className="mt-4 h-12 w-full rounded-full bg-[#9a3412] text-base font-medium text-white">
                {pcOn ? "Computer is on the ticket" : "Put the computer on the ticket"}
              </button>
            </>
          ) : (
            <p className="mt-3 text-lg">Nothing finished is under that. Build it.</p>
          )}
          <button type="button" onClick={() => setPanel("build")} className="mt-3 h-12 w-full rounded-full border border-[#e7c2a0] text-base">
            Or build it from parts
          </button>
        </article>
        <div className="grid gap-4">
          <article className="rounded-[1.6rem] bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a5a32]">The keyboard</p>
            {feel ? (
              <>
                <h3 className="mt-2 text-xl font-medium leading-snug">{feel.name}</h3>
                <p className="mt-2 text-sm text-[#4a3b2a]">For someone who feels every key. {feel.feel}. About {feel.estimated ?? feel.measured ?? "—"} dB. {money(feel.price)}.</p>
                <BoxShot src={boxKeys} brand={feel.brand} name={feel.name} price={feel.price} />
                <button type="button" onClick={() => { setBoard("feel"); setCart(true); }} className={`mt-3 h-11 w-full rounded-full text-sm ${board === "feel" ? "bg-[#1a120c] text-[#f3ecdf]" : "border border-[#1a120c]"}`}>
                  {board === "feel" ? "On the ticket" : "Add this keyboard"}
                </button>
              </>
            ) : null}
            {grandma ? (
              <div className="mt-4 border-t border-[#e7dccb] pt-4">
                <p className="text-sm text-[#4a3b2a]">If they just need to type: {grandma.name}. {money(grandma.price)}.</p>
                <button type="button" onClick={() => { setBoard("grandma"); setCart(true); }} className={`mt-3 h-11 w-full rounded-full text-sm ${board === "grandma" ? "bg-[#1a120c] text-[#f3ecdf]" : "border border-[#1a120c]"}`}>
                  {board === "grandma" ? "On the ticket" : "Add the simple one"}
                </button>
              </div>
            ) : null}
            <button type="button" onClick={() => setPanel("keys")} className="mt-4 h-11 w-full rounded-full border border-[#1a120c] text-sm">
              Open the keyboard store
            </button>
          </article>
          <article className="rounded-[1.6rem] bg-[#efe2cf] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a5a32]">The rig</p>
            <h3 className="mt-2 text-xl font-medium">Forza, trucks, a farm, or a cockpit.</h3>
            <p className="mt-2 text-sm text-[#4a3b2a]">Pick the game. I show the gear, a rating, and a computer that can run it.</p>
            <button type="button" onClick={() => setPanel("sim")} className="mt-4 h-11 w-full rounded-full bg-[#1a120c] text-sm text-[#f3ecdf]">
              Open the sim shelf
            </button>
          </article>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#1a120c] bg-[#f6f1e4] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setCart((value) => !value)} className="flex w-full items-center justify-between text-left">
          <span className="text-base">{ticket.length} on the ticket</span>
          <span className="text-lg font-semibold">{money(total)} · {cart ? "Close" : "Open"}</span>
        </button>
        {cart ? (
          <div className="mt-3 max-h-[50dvh] overflow-y-auto">
            {ticket.length === 0 ? <p className="text-sm">Nothing yet. Add the computer, then a keyboard.</p> : null}
            <ol className="space-y-2">
              {ticket.map((line, index) => (
                <li key={line.id} className="flex items-start gap-2 text-sm">
                  <span className="min-w-0 flex-1">{index + 1}. {line.name}</span>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => {
                      if (pick && line.id === pick.id) setPcOn(false);
                      else setBoard(null);
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#1a120c]"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ol>
            {qr && ticket.length ? <img src={qr} alt="QR code for this ticket" className="mx-auto mt-3 size-40 rounded-xl bg-[#f6f1e4] p-2" /> : null}
            <CopyList title="6666 ticket" names={ticket.map((line) => line.name)} className="mt-3 h-12 w-full rounded-full bg-[#1a120c] text-base font-medium text-[#f6f1e4]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

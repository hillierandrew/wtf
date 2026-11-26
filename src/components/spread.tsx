import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import rawLaptops from "@/data/laptops.json";
import { PARTS, dealFrom, explainLaptop, explainPart, isJunk, laptopBits, machineParts, machineScore, money, partScore, type Part } from "@/lib/catalog";
import { laptopBlob, laptopFace, releaseYear, tagPaint } from "@/lib/facts";
import { RankBadge } from "@/components/rank";
import { KEYS } from "@/lib/keyboard";
import { deskMarks, laptopMarks } from "@/components/marks";
import { Counter } from "@/components/counter";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Sim } from "@/components/sim";
import { Bundles } from "@/components/bundles";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { AddButton, BagDock } from "@/components/bag";
import { Five } from "@/components/five";
import { keyBag, lapBag, partBag } from "@/lib/bag";
import { Packs } from "@/components/packs";

const WHO = [
  { id: "grandma", title: "Grandma", say: "Email, photos, a video call. Nothing she has to learn." },
  { id: "school", title: "School", say: "Class and a browser, with room to last." },
  { id: "work", title: "Work", say: "The desk. Enough memory, and it is not a toy." },
  { id: "games", title: "Games", say: "The picture is the reason they walked in." },
  { id: "think", title: "A model at home", say: "A small model on the machine, not only in a tab." },
] as const;

type Who = (typeof WHO)[number]["id"];
type Order = "low" | "high" | "score";
type Shelf = "prebuilt" | "laptop" | "cpu" | "motherboard" | "memory" | "gpu" | "storage" | "case" | "cooler" | "psu" | "monitor" | "mount";
type Lap = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open?: boolean };
const LAPS = rawLaptops as Lap[];

const SHELVES: { id: Shelf; title: string }[] = [
  { id: "prebuilt", title: "Desktops" },
  { id: "laptop", title: "Laptops" },
  { id: "cpu", title: "CPUs" },
  { id: "motherboard", title: "Boards" },
  { id: "memory", title: "Memory" },
  { id: "gpu", title: "Graphics" },
  { id: "storage", title: "Drives" },
  { id: "case", title: "Cases" },
  { id: "cooler", title: "Coolers" },
  { id: "psu", title: "Power" },
  { id: "monitor", title: "Screens" },
  { id: "mount", title: "Mounts" },
];

function byMoney<T extends { price: number; score: number }>(rows: T[], order: Order): T[] {
  return rows.slice().sort((a, b) => (order === "high" ? b.price - a.price : order === "score" ? b.score - a.score || a.price - b.price : a.price - b.price));
}

export function Spread({ onLock }: { onLock: () => void }) {
  return (
    <HistoryRoot home="Counter">
      <Floor onLock={onLock} />
      <BagDock />
    </HistoryRoot>
  );
}

function Floor({ onLock }: { onLock: () => void }) {
  const path = usePath();
  const [panel, setPanel] = useState<"home" | "build" | "keys" | "sim" | "deals">("home");
  const [who, setWho] = useState<Who>("school");
  const [budget, setBudget] = useState(1400);
  const [order, setOrder] = useState<Order>("low");
  const [shelf, setShelf] = useState<Shelf>("prebuilt");
  const [more, setMore] = useState(12);
  const [seek, setSeek] = useState("");
  const [five, setFive] = useState(false);

  useEffect(() => {
    if (!path) return;
    const panelId = latest(path.log, path.at, (id) => id === "build" || id === "keys" || id === "sim" || id === "deals" || id === "home");
    setPanel(panelId === "build" || panelId === "keys" || panelId === "sim" || panelId === "deals" ? panelId : "home");
    const whoId = latest(path.log, path.at, (id) => id.startsWith("who:"));
    if (whoId) setWho(whoId.slice(4) as Who);
  }, [path?.at]);

  const person = WHO.find((item) => item.id === who) ?? WHO[1];

  const pick = useMemo(() => {
    const desks = PARTS.filter((part) => part.cat === "prebuilt" && !isJunk(part, true) && part.price > 0 && part.price <= budget).map((part) => ({ part, price: part.price, score: machineScore(part.name) }));
    const narrow =
      who === "grandma" ? desks.filter((row) => row.score < 40) : who === "school" ? desks.filter((row) => row.score < 58) : who === "work" ? desks.filter((row) => machineParts(row.part.name).ram >= 16) : who === "think" ? desks.filter((row) => machineParts(row.part.name).ram >= 32) : desks;
    return byMoney(narrow.length ? narrow : desks, order)[0]?.part;
  }, [budget, who, order]);

  const laptop = useMemo(() => {
    const rows = LAPS.filter((item) => !item.open && item.price > 0 && item.price <= budget && item.kind !== "tablet").map((item) => ({ item, price: item.price, score: laptopBits(item).score }));
    const narrow =
      who === "grandma" ? rows.filter((row) => row.item.gpu < 28) : who === "work" ? rows.filter((row) => row.item.kind === "work") : who === "games" ? rows.filter((row) => row.item.kind === "game") : who === "think" ? rows.filter((row) => /32GB|64GB/.test(row.item.specs)) : rows.filter((row) => row.item.kind === "home" || row.item.kind === "chrome");
    return byMoney(narrow.length ? narrow : rows, order)[0]?.item;
  }, [budget, who, order]);

  const board = useMemo(() => {
    const rows = KEYS.filter((item) => item.shelf === "board" && !item.open && item.price > 0 && item.price <= Math.min(budget, who === "grandma" ? 80 : 180));
    const quiet = rows.filter((item) => item.feel === "silent" || item.feel === "membrane" || (item.estimated ?? 99) < 50);
    const pool = who === "grandma" || who === "school" ? (quiet.length ? quiet : rows) : rows;
    return pool.slice().sort((a, b) => (order === "high" ? b.price - a.price : order === "score" ? (a.estimated ?? 99) - (b.estimated ?? 99) : a.price - b.price))[0];
  }, [budget, who, order]);

  const shelfRows = useMemo(() => {
    if (shelf === "laptop") {
      const q = seek.trim().toLowerCase();
      return byMoney(
        LAPS.filter((item) => !item.open && item.kind !== "tablet" && item.price > 0 && item.price <= budget && (!q || laptopBlob(item).includes(q))).map((item) => ({ id: item.id, name: item.name, brand: item.brand, price: item.price, score: laptopBits(item).score, kind: "laptop" as const })),
        order,
      );
    }
    return byMoney(
      PARTS.filter((part) => part.cat === shelf && !isJunk(part, false) && part.price > 0 && part.price <= budget).map((part) => ({
        id: part.id,
        name: part.name,
        brand: part.brand,
        price: part.price,
        score: shelf === "prebuilt" ? machineScore(part.name) : partScore(part),
        kind: "part" as const,
        part,
      })),
      order,
    );
  }, [shelf, budget, order, seek]);

  function go(next: "home" | "build" | "keys" | "sim" | "deals", label: string) {
    path?.note(next, label);
    setPanel(next);
  }

  if (five) return <Five onClose={() => setFive(false)} />;
  if (panel === "build") return <Counter onClose={() => setPanel("home")} />;
  if (panel === "keys") return <KeyboardShop onLeave={() => setPanel("home")} />;
  if (panel === "sim") return <Sim onLeave={() => setPanel("home")} />;
  if (panel === "deals") return <Bundles onLeave={() => setPanel("home")} />;

  return (
    <div className="min-h-full overflow-y-auto bg-[#f4f1ea] pb-28 text-[#161616]">
      <header className="flex items-start justify-between gap-4 px-4 pt-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#0f6b4c]">6666</p>
          <h1 className="mt-1 max-w-3xl text-4xl font-semibold leading-none tracking-tight sm:text-5xl">One person. One budget. One machine.</h1>
        </div>
        <button type="button" onClick={onLock} aria-label="Lock" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#161616]">
          <Lock className="size-4" />
        </button>
      </header>
      <p className="mx-4 mt-3 max-w-2xl text-lg leading-snug text-[#333]">{person.say} Say the name, then the price.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {WHO.map((item) => (
          <button key={item.id} type="button" onClick={() => { setWho(item.id); path?.note(`who:${item.id}`, item.title); }} className={`h-12 shrink-0 rounded-full px-4 text-base ${who === item.id ? "bg-[#161616] font-semibold text-white" : "border border-[#161616] bg-white"}`}>
            {item.title}
          </button>
        ))}
      </div>

      <div className="mx-4 mt-4 grid gap-3 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_16rem]">
        <label className="block">
          <span className="text-sm text-[#333]">Budget</span>
          <span className="mt-1 block text-4xl font-semibold tabular-nums">{money(budget)}</span>
          <input type="range" min={400} max={4500} step={50} value={budget} onChange={(event) => { setBudget(Number(event.target.value)); setMore(12); }} className="mt-3 h-8 w-full accent-[#0f6b4c]" />
        </label>
        <label className="flex h-14 items-center gap-3 self-end rounded-2xl border border-[#161616] bg-[#f4f1ea] px-3">
          <span className="shrink-0 text-base font-semibold">Sort</span>
          <select value={order} onChange={(event) => setOrder(event.target.value as Order)} className="h-full w-full bg-transparent text-base outline-none">
            <option value="low">Price, low to high</option>
            <option value="high">Price, high to low</option>
            <option value="score">Best score first</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 px-4 lg:grid-cols-3">
        <Offer kicker="Desktop" name={pick?.name} price={pick?.price} line={pick ? `${person.title}. ${money(pick.price)}. ${person.say}` : "Nothing finished is under that. Raise the budget, or build it."}>
          {pick ? deskMarks(pick) : null}
          {pick ? <AddButton line={partBag(pick, `6666. For ${person.title}. Budget ${money(budget)}. Score ${machineScore(pick.name)}. Desktop.`)} className="mt-3 h-12 w-full rounded-full bg-[#161616] text-base font-semibold text-white" /> : null}
        </Offer>
        <Offer kicker="Laptop" ink={laptop ? dealFrom(laptop.price, laptopBits(laptop).score).fg : undefined} name={laptop?.name} price={laptop?.price} line={laptop ? `If they need to carry it. ${laptop.specs}` : "No laptop under that budget."}>
          {laptop ? <p className="mt-1 text-sm font-semibold" style={{ color: dealFrom(laptop.price, laptopBits(laptop).score).fg }}>{money(laptop.price / Math.max(1, laptopBits(laptop).score))} / point · {releaseYear(laptop.name)}</p> : null}
          {laptop ? laptopMarks(laptop) : null}
          {laptop ? <AddButton line={lapBag(laptop, `6666. For ${person.title}. Budget ${money(budget)}. Laptop.`)} className="mt-3 h-12 w-full rounded-full bg-[#0f6b4c] text-base font-semibold text-white" /> : null}
        </Offer>
        <Offer kicker="Keyboard" name={board?.name} price={board?.price} line={board ? `${board.feel}. About ${board.estimated ?? "—"} dB. ${board.layout}.` : "No finished board under that."}>
          {board ? <AddButton line={keyBag(board, `6666. Keyboard for ${person.title}. ${money(board.price)}. About ${board.estimated ?? "—"} dB.`)} className="mt-3 h-12 w-full rounded-full bg-[#161616] text-base font-semibold text-white" /> : null}
          <button type="button" onClick={() => go("keys", "Keyboards")} className="mt-2 h-11 w-full rounded-full border border-[#161616] text-sm">
            All keyboards
          </button>
        </Offer>
      </div>

      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { path?.note("five", "Five minutes"); setFive(true); }} className="h-12 rounded-full bg-[#0f6b4c] px-4 text-base font-semibold text-white">Five minutes</button>
        <button type="button" onClick={() => go("build", "From scratch")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Build from a chip</button>
        <button type="button" onClick={() => go("sim", "Sims")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Sims</button>
        <button type="button" onClick={() => go("deals", "Bundles")} className="h-12 rounded-full border border-[#161616] bg-white px-4 text-base">Bundles</button>
      </div>

      <section className="mx-4 mt-6">
        <h2 className="text-2xl font-semibold">The shelf, under {money(budget)}</h2>
        {shelf === "laptop" ? (
          <input value={seek} onChange={(event) => { setSeek(event.target.value); setMore(12); }} placeholder="OLED, 16 inch, 32GB, school, 2025" className="mt-3 h-12 w-full rounded-2xl border border-[#161616] bg-white px-3 text-base outline-none" />
        ) : null}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {SHELVES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setShelf(item.id); setMore(12); path?.note(`shelf:${item.id}`, item.title); }} className={`h-11 shrink-0 rounded-full px-3 text-sm ${shelf === item.id ? "bg-[#161616] font-semibold text-white" : "bg-white"}`}>
              {item.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#333]">{shelfRows.length} shown, {order === "high" ? "dearest first" : order === "score" ? "best score first" : "cheapest first"}.</p>
        <ul className="mt-2 space-y-2">
          {shelfRows.slice(0, more).map((row) => {
            const lap = row.kind === "laptop" ? LAPS.find((item) => item.id === row.id) : undefined;
            const ink = dealFrom(row.price, Math.max(1, row.score)).fg;
            const tags = lap ? laptopFace(lap.name, lap.specs, lap.kind).slice(0, 6) : [];
            return (
            <li key={row.id} className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-[#0f6b4c]">{row.brand}</p>
                  <p className="text-base font-medium leading-snug">{row.name}</p>
                  <div className="mt-2">
                    <RankBadge score={row.score} lines={lap ? explainLaptop(lap) : row.kind === "part" ? explainPart(row.part) : [`Score ${Math.round(row.score)}.`]} />
                  </div>
                  {tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.map((tag) => {
                        const paint = tagPaint(tag);
                        return (
                          <button key={tag} type="button" onClick={() => { setSeek(tag); setShelf("laptop"); setMore(12); }} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: paint.bg, color: paint.fg }}>
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold tabular-nums" style={{ color: ink }}>{money(row.price)}</p>
                  {lap ? <p className="text-xs font-semibold" style={{ color: ink }}>{money(row.price / Math.max(1, row.score))}/pt · {releaseYear(lap.name)}</p> : null}
                </div>
              </div>
              {lap ? (
                <AddButton line={lapBag(lap, `6666 shelf. ${person.title}. ${money(row.price)}.`)} />
              ) : (
                <AddButton line={partBag(row.kind === "part" ? row.part : { id: row.id, name: row.name, price: row.price, brand: row.brand }, `6666 shelf. ${person.title}. ${money(row.price)}. Score ${Math.round(row.score)}.`)} />
              )}
            </li>
            );
          })}
        </ul>
        {shelfRows.length === 0 ? <p className="mt-3 rounded-2xl bg-white px-4 py-8 text-center">Nothing on this shelf under {money(budget)}.</p> : null}
        {more < shelfRows.length ? (
          <button type="button" onClick={() => setMore((count) => count + 24)} className="mt-3 h-12 w-full rounded-full border border-[#161616] bg-white text-base">
            Show more
          </button>
        ) : null}
      </section>
      <section className="mx-4 mt-6">
        <Packs />
      </section>
    </div>
  );
}

function Offer({ kicker, name, price, line, ink, children }: { kicker: string; name?: string; price?: number; line: string; ink?: string; children?: React.ReactNode }) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6b4c]">{kicker}</p>
      <h2 className="mt-2 text-xl font-semibold leading-snug">{name ?? "None under the budget"}</h2>
      {price ? <p className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: ink }}>{money(price)}</p> : null}
      <p className="mt-2 text-sm leading-snug text-[#333]">{line}</p>
      {children}
    </article>
  );
}

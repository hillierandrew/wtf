import { useMemo, useState } from "react";
import { CopyList, buildNames } from "@/components/copy-list";
import { CAT_LABEL, PARTS, isJunk, money, psuForGpu, shortName, spendOf, type Build, type Part } from "@/lib/catalog";
import { JOBS, LOOKS, childFor, laptopsFor, needsOf, prebuildsFor, type Look, type UseKind, type UseNeed } from "@/lib/phone-use";

type LookMode = "phone" | "site";

const ONCE = new Set<UseKind>(["senior", "school", "zoom", "ai"]);

const MODELS: [RegExp, string][] = [
  [/5090/, "RTX 5090"],
  [/5080/, "RTX 5080"],
  [/5070\s?TI/, "RTX 5070 Ti"],
  [/\b5070\b/, "RTX 5070"],
  [/5060\s?TI/, "RTX 5060 Ti"],
  [/\b5060\b/, "RTX 5060"],
  [/5050/, "RTX 5050"],
  [/4090/, "RTX 4090"],
  [/4080/, "RTX 4080"],
  [/4070\s?TI/, "RTX 4070 Ti"],
  [/\b4070\b/, "RTX 4070"],
  [/4060\s?TI/, "RTX 4060 Ti"],
  [/\b4060\b/, "RTX 4060"],
  [/3090/, "RTX 3090"],
  [/3080/, "RTX 3080"],
  [/\b3070\b/, "RTX 3070"],
  [/\b3060\b/, "RTX 3060"],
  [/\b3050\b/, "RTX 3050"],
  [/9070\s?XT/, "RX 9070 XT"],
  [/\b9070\b/, "RX 9070"],
  [/9060/, "RX 9060"],
  [/7900\s?XTX/, "RX 7900 XTX"],
  [/7900/, "RX 7900 XT"],
  [/7800/, "RX 7800 XT"],
  [/7700/, "RX 7700 XT"],
  [/\b7600\b/, "RX 7600"],
  [/B580/, "Arc B580"],
  [/A770/, "Arc A770"],
  [/1030/, "GT 1030"],
];

function modelOf(name: string) {
  const n = name.toUpperCase();
  for (const [re, label] of MODELS) if (re.test(n)) return label;
  return "";
}

function bandOf(card: number) {
  if (card >= 300) return "ai";
  if (card >= 220) return "strong";
  if (card >= 150) return "normal";
  return "light";
}

export function EasyPick({
  look,
  start,
  onUse,
}: {
  look: LookMode;
  start?: UseKind | null;
  onUse: (build: Build, name: string) => void;
}) {
  const [kind, setKind] = useState<UseKind | null>(start ?? null);
  const [step, setStep] = useState<"jobs" | "list" | "done">(start ? (start && ONCE.has(start) ? "done" : "list") : "jobs");
  const [setting, setSetting] = useState<Look>("normal");
  const [id, setId] = useState(start && ONCE.has(start) ? start : "");
  const phone = look === "phone";

  const options = useMemo(() => (kind ? needsOf(kind, setting) : []), [kind, setting]);
  const need = options.find((item) => item.id === id) ?? (kind && ONCE.has(kind) ? options[0] : undefined);
  const made = useMemo(() => (need ? childFor(need) : {}), [need]);
  const boxes = useMemo(() => (need ? prebuildsFor(need) : []), [need]);
  const laps = useMemo(() => (need ? laptopsFor(need) : []), [need]);

  function openJob(next: UseKind) {
    setKind(next);
    if (ONCE.has(next)) {
      setId(next);
      setStep("done");
      return;
    }
    setId("");
    setStep("list");
  }

  function back() {
    if (step === "done" && kind && !ONCE.has(kind)) {
      setStep("list");
      return;
    }
    setKind(null);
    setId("");
    setStep("jobs");
  }

  const shell = phone ? "space-y-3" : "h-full overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4";
  const card = phone ? "rounded-2xl bg-white p-4 shadow-sm" : "rounded-3xl border border-line bg-elevated p-4";
  const muted = phone ? "text-[#8e8e93]" : "text-muted";
  const tap = phone
    ? "min-h-16 w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm active:opacity-80"
    : "press min-h-20 w-full rounded-3xl border border-line bg-elevated px-4 py-4 text-left";
  const go = phone ? "mt-3 h-14 w-full rounded-2xl bg-[#007aff] text-[17px] font-semibold text-white" : "mt-3 h-14 w-full rounded-2xl bg-accent text-lg text-accent-fg";

  return (
    <div className={shell}>
      {step === "jobs" ? (
        <div className="space-y-3">
          <p className={`text-base leading-snug ${muted}`}>Tap one. That is the whole choice.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {JOBS.map((job) => (
              <button key={job.id} type="button" onClick={() => openJob(job.id)} className={tap}>
                <span className={`block text-xl font-semibold ${phone ? "" : "font-display"}`}>{job.label}</span>
                <span className={`mt-0.5 block text-sm ${muted}`}>{job.line}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "list" && kind ? (
        <div className="space-y-3">
          <button type="button" onClick={back} className={`h-11 rounded-full px-4 text-base ${phone ? "bg-white text-[#007aff] shadow-sm" : "border border-line"}`}>
            Back
          </button>
          {kind === "game" ? (
            <div>
              <p className={`mb-2 text-sm ${muted}`}>How should the game look? Not sure? Tap Normal.</p>
              <div className="grid grid-cols-3 gap-2">
                {LOOKS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSetting(item.id)}
                    className={`h-12 rounded-2xl text-base font-medium ${setting === item.id ? (phone ? "bg-[#007aff] text-white" : "bg-accent text-accent-fg") : phone ? "bg-white shadow-sm" : "border border-line bg-elevated"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-sm ${muted}`}>Tap one.</p>
          )}
          <div className="grid grid-cols-1 gap-2">
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setId(item.id);
                  setStep("done");
                }}
                className={tap}
              >
                <span className="block text-lg font-medium leading-snug">{item.label}</span>
                <span className={`mt-0.5 block text-sm ${muted}`}>{item.line}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "done" && need ? <Result phone={phone} card={card} muted={muted} go={go} need={need} made={made} boxes={boxes} laps={laps} onBack={back} onUse={() => onUse(made, need.label)} /> : null}
    </div>
  );
}

function Result({
  phone,
  card,
  muted,
  go,
  need,
  made,
  boxes,
  laps,
  onBack,
  onUse,
}: {
  phone: boolean;
  card: string;
  muted: string;
  go: string;
  need: UseNeed;
  made: Build;
  boxes: Part[];
  laps: { id: string; name: string; brand: string; price: number }[];
  onBack: () => void;
  onUse: () => void;
}) {
  const parts = (["cpu", "gpu", "memory", "storage", "motherboard", "psu", "case", "cooler", "monitor"] as const)
    .map((cat) => made[cat])
    .filter((part): part is Part => Boolean(part));
  const power = made.gpu ? psuForGpu(made.gpu) : { min: 450, comfortable: 550, card: 0 };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className={`h-11 rounded-full px-4 text-base ${phone ? "bg-white text-[#007aff] shadow-sm" : "border border-line"}`}>
        Back
      </button>
      <section className={card}>
        <p className={`text-sm font-medium ${muted}`}>{need.label}</p>
        <p className="mt-1 text-base leading-snug">{need.line}</p>
        <ul className="mt-3">
          {parts.map((part) => (
            <li key={part.id} className={`flex items-start justify-between gap-3 border-t py-2 text-base ${phone ? "border-[#e5e5ea]" : "border-line"}`}>
              <span className="min-w-0">
                <span className={`block text-xs ${muted}`}>{CAT_LABEL[part.cat]}</span>
                <span className="block leading-snug">{shortName(part)}</span>
              </span>
              <span className="shrink-0 font-medium">{money(part.price)}</span>
            </li>
          ))}
        </ul>
        <p className={`mt-3 text-sm leading-snug ${muted}`}>
          {made.gpu ? "This graphics card" : "No graphics card"}. Minimum power supply {power.min}W. Comfortable is {power.comfortable}W.
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{money(spendOf(made))}</p>
        <CopyList title={need.label} names={buildNames(made)} className={`mt-3 h-11 w-full rounded-xl text-base font-medium ${phone ? "bg-[#1c1c1e] text-white" : "border border-line"}`} />
        <button type="button" onClick={onUse} className={go}>
          Use this computer
        </button>
      </section>
      <section className={card}>
        <h3 className="text-lg font-semibold">Already built</h3>
        {boxes.length === 0 ? <p className={`mt-2 text-base ${muted}`}>Nothing on the shelf fits.</p> : null}
        <ul>
          {boxes.map((part) => (
            <li key={part.id} className={`flex items-start justify-between gap-3 border-t py-3 text-base ${phone ? "border-[#e5e5ea]" : "border-line"}`}>
              <span className="min-w-0 leading-snug">{part.name}</span>
              <span className="shrink-0 font-semibold">{money(part.price)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h3 className="text-lg font-semibold">Laptops</h3>
        {laps.length === 0 ? <p className={`mt-2 text-base ${muted}`}>No laptop on the shelf runs that.</p> : null}
        <ul>
          {laps.map((item) => (
            <li key={item.id} className={`flex items-start justify-between gap-3 border-t py-3 text-base ${phone ? "border-[#e5e5ea]" : "border-line"}`}>
              <span className="min-w-0">
                <span className={`block text-xs ${muted}`}>{item.brand}</span>
                <span className="block leading-snug">{item.name.replace(" (Open box)", "")}</span>
              </span>
              <span className="shrink-0 font-semibold">{money(item.price)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function GpuPower({ look }: { look: LookMode }) {
  const phone = look === "phone";
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<"all" | "light" | "normal" | "strong" | "ai">("all");
  const card = phone ? "rounded-2xl bg-white p-4 shadow-sm" : "rounded-3xl border border-line bg-elevated p-4";
  const muted = phone ? "text-[#8e8e93]" : "text-muted";
  const shell = phone ? "space-y-3" : "h-full overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const best = new Map<string, Part>();
    for (const part of PARTS) {
      if (part.cat !== "gpu" || isJunk(part, false) || part.price < 80) continue;
      const model = modelOf(part.name);
      if (!model) continue;
      const have = best.get(model);
      if (!have || part.price < have.price) best.set(model, part);
    }
    return [...best.entries()]
      .map(([model, part]) => ({ model, part, power: psuForGpu(part) }))
      .filter((row) => (band === "all" ? true : bandOf(row.power.card) === band))
      .filter((row) => !q || `${row.model} ${row.part.name}`.toLowerCase().includes(q))
      .sort((a, b) => a.power.card - b.power.card || a.part.price - b.part.price);
  }, [query, band]);

  const chips = [
    ["all", "All"],
    ["light", "Light"],
    ["normal", "Normal"],
    ["strong", "Strong"],
    ["ai", "Local AI"],
  ] as const;

  return (
    <div className={shell}>
      <section className={card}>
        <h2 className={`text-2xl font-semibold ${phone ? "" : "font-display"}`}>What power supply?</h2>
        <p className={`mt-2 text-base leading-snug ${muted}`}>Minimum keeps the card on. Comfortable leaves room for the processor, the drives, and a later upgrade.</p>
        <p className="mt-3 text-base leading-snug">No graphics card, for Zoom, seniors, or school: minimum 450W. Comfortable is 550W.</p>
      </section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search a card, like 5070"
        className={`h-12 w-full rounded-2xl px-4 text-base outline-none ${phone ? "bg-white shadow-sm" : "border border-line bg-elevated"}`}
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setBand(id)}
            className={`h-11 shrink-0 rounded-full px-4 text-base ${band === id ? (phone ? "bg-[#007aff] text-white" : "bg-accent text-accent-fg") : phone ? "bg-white shadow-sm" : "border border-line bg-elevated"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.model} className={card}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-semibold">{row.model}</p>
              <p className="shrink-0 text-base font-medium">{money(row.part.price)}</p>
            </div>
            <p className={`mt-1 text-sm leading-snug ${muted}`}>Cheapest on the shelf. The card itself is about {row.power.card}W.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className={`rounded-2xl px-3 py-3 ${phone ? "bg-[#f2f2f7]" : "bg-subtle"}`}>
                <p className={`text-xs ${muted}`}>Minimum</p>
                <p className="text-2xl font-semibold">{row.power.min}W</p>
              </div>
              <div className={`rounded-2xl px-3 py-3 ${phone ? "bg-[#e8f2ff]" : "bg-subtle"}`}>
                <p className={`text-xs ${muted}`}>Comfortable</p>
                <p className="text-2xl font-semibold">{row.power.comfortable}W</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className={`text-center text-base ${muted}`}>No card matches.</p> : null}
    </div>
  );
}

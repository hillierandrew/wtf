import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Cpu, Gamepad2, Heart, LayoutGrid, Lock, Search, Zap } from "lucide-react";
import { CAT_LABEL, CATS, PARTS, byId, fitWhy, isJunk, laptopBits, machineScore, money, reconcile, shortName, spendOf, suggest, type Build, type Category, type Part } from "@/lib/catalog";
import { PHONE_ITEMS, PHONE_SECTIONS, groupMeta, phoneItem, type PhoneItem } from "@/lib/phone-catalog";
import { EasyPick, GpuPower } from "@/components/easy";
import { KeyboardShop } from "@/components/keyboard-shop";
import { Counter } from "@/components/counter";
import { laptopMarks, deskMarks } from "@/components/marks";
import laptopsRaw from "@/data/laptops.json";
import { CopyList, named } from "@/components/copy-list";
import { Sim } from "@/components/sim";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { AddButton, BagDock, ThreeSearch } from "@/components/bag";
import { Five } from "@/components/five";
import { keyBag, lapBag, partBag, simBag } from "@/lib/bag";

const LAPS = laptopsRaw as { id: string; name: string; price: number; gpu: number; specs: string; kind?: string }[];

function phoneLine(item: PhoneItem) {
  const rule = `Phone shelf. For ${item.kind}. Budget ${money(item.price)}. Score is on the product, not a lab test.`;
  if (item.group === "laptops") return lapBag(item, rule);
  if (item.group === "keys") return keyBag(item, rule);
  if (item.group === "sim") return simBag(item, rule);
  return partBag(item, rule);
}

function phoneScore(item: PhoneItem) {
  if (item.group === "laptops") {
    const lap = LAPS.find((row) => row.id === item.id);
    return lap ? laptopBits(lap).score : 1;
  }
  return machineScore(item.name) || 1;
}

type Tab = "use" | "power" | "build" | "shop" | "deals" | "search" | "saved";
type Sort = "low" | "high" | "name" | "sale";

const SAVED = "drew-phone-saved";
const PC_KEY = "drew-phone-pc";
const SLOTS: Category[] = ["cpu", "motherboard", "memory", "gpu", "storage", "cooler", "case", "psu", "monitor"];

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED) || "[]");
    return new Set<string>(Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function saleOf(item: PhoneItem) {
  return item.was ? item.was - item.price : 0;
}

function sortItems(list: PhoneItem[], sort: Sort) {
  const next = [...list];
  if (sort === "high") next.sort((a, b) => b.price - a.price);
  else if (sort === "name") next.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "sale") next.sort((a, b) => saleOf(b) - saleOf(a) || a.price - b.price);
  else next.sort((a, b) => a.price - b.price);
  return next;
}

function PhoneMarks({ item }: { item: PhoneItem }) {
  const id = item.id.slice(item.group.length + 1);
  if (item.group === "laptops") {
    const lap = LAPS.find((row) => row.id === id);
    return lap ? laptopMarks(lap) : null;
  }
  const part = byId.get(id);
  return part ? deskMarks(part) : null;
}

export function Phone({ onLock }: { onLock: () => void }) {
  return (
    <HistoryRoot home="Phone">
      <PhoneBody onLock={onLock} />
      <BagDock lift />
    </HistoryRoot>
  );
}

function PhoneBody({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("use");
  const [group, setGroup] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState<Sort>("low");
  const [hideOpen, setHideOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(loadSaved);
  const [limit, setLimit] = useState(48);
  const [pc, setPc] = useState<Build>({});
  const [walk, setWalk] = useState(false);
  const [five, setFive] = useState(false);
  const path = usePath();

  useEffect(() => {
    if (!path) return;
    const tab = latest(path.log, path.at, (id) => id.startsWith("tab:"));
    if (tab) goTab(tab.slice(4) as Tab, true);
    const groupId = latest(path.log, path.at, (id) => id.startsWith("group:"));
    setGroup(groupId ? groupId.slice(6) : null);
    const item = latest(path.log, path.at, (id) => id.startsWith("item:"));
    setOpenId(item ? item.slice(5) : null);
  }, [path?.at]);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(PC_KEY) || "[]");
      if (!Array.isArray(ids)) return;
      const next: Build = {};
      for (const id of ids) {
        const part = typeof id === "string" ? byId.get(id) : undefined;
        if (part) next[part.cat] = part;
      }
      if (Object.keys(next).length) setPc(next);
    } catch {
      /* a new computer is fine */
    }
  }, []);

  useEffect(() => {
    const ids = Object.values(pc)
      .filter((part): part is Part => Boolean(part))
      .map((part) => part.id);
    localStorage.setItem(PC_KEY, JSON.stringify(ids));
  }, [pc]);

  useEffect(() => {
    const tag = document.querySelector('meta[name="theme-color"]');
    const previous = tag?.getAttribute("content");
    tag?.setAttribute("content", "#f2f2f7");
    return () => {
      if (previous) tag?.setAttribute("content", previous);
    };
  }, []);

  useEffect(() => {
    setLimit(48);
  }, [tab, group, query, kind, sort, hideOpen]);

  function toggleSave(id: string) {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(SAVED, JSON.stringify([...next]));
      return next;
    });
  }

  const open = openId ? phoneItem(openId) : undefined;
  const meta = group ? groupMeta(group) : undefined;

  const kinds = useMemo(() => {
    const names = new Set(PHONE_ITEMS.filter((item) => item.group === group).map((item) => item.kind));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [group]);

  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PHONE_ITEMS;
    if (tab === "saved") list = list.filter((item) => saved.has(item.id));
    else if (tab === "deals") list = list.filter((item) => item.was);
    else if (group) list = list.filter((item) => item.group === group);
    else if (tab !== "search" || !q) list = [];
    if (kind !== "all" && group) list = list.filter((item) => item.kind === kind);
    if (hideOpen) list = list.filter((item) => !item.open);
    if (q && (tab === "search" || group || tab === "deals" || tab === "saved")) {
      list = list.filter((item) => `${item.brand} ${item.name} ${item.kind}`.toLowerCase().includes(q));
    }
    return sortItems(list, sort);
  }, [tab, group, query, kind, sort, hideOpen, saved]);

  function goTab(next: Tab, quiet = false) {
    setTab(next);
    setGroup(null);
    setOpenId(null);
    setKind("all");
    setQuery("");
    setSort(next === "deals" ? "sale" : "low");
    if (!quiet) path?.note(`tab:${next}`, next === "use" ? "Use" : next === "power" ? "Power" : next === "build" ? "Build" : next === "deals" ? "Deals" : next === "saved" ? "Saved" : next === "search" ? "Search" : "Store");
  }

  function openGroup(id: string) {
    setGroup(id);
    setOpenId(null);
    setKind("all");
    setQuery("");
    setSort("low");
    path?.note(`group:${id}`, groupMeta(id)?.title ?? id);
  }

  const shown = listed.slice(0, limit);
  const night = group === "keys";
  const title = open ? "Details" : meta?.title ?? (tab === "use" ? "Use" : tab === "power" ? "Power" : tab === "build" ? "Build" : tab === "deals" ? "Deals" : tab === "saved" ? "Saved" : tab === "search" ? "Search" : "Store");

  if (five) return <Five onClose={() => setFive(false)} />;
  if (walk) return <Counter onClose={() => setWalk(false)} />;
  if (group === "keys") return <KeyboardShop onLeave={() => setGroup(null)} />;

  return (
    <div className={`flex h-dvh w-full flex-col overflow-hidden ${night ? "bg-black text-[#f6edff]" : "bg-[#f2f2f7] text-[#1c1c1e]"}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif' }}>
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <header className={`shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur ${night ? "bg-black/90" : "bg-[#f2f2f7]/90"}`}>
          <div className="flex h-11 items-center gap-2">
            {open || group ? (
              <button
                type="button"
                onClick={() => (open ? setOpenId(null) : setGroup(null))}
                className={`flex h-9 items-center gap-0.5 rounded-full pr-2 text-[17px] ${night ? "text-[#c4b5fd]" : "text-[#007aff]"}`}
              >
                <ChevronLeft className="size-5" strokeWidth={2.25} />
                Back
              </button>
            ) : (
              <p className="text-[13px] font-medium tracking-wide text-[#8e8e93]">Parts</p>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={onLock} aria-label="Lock" className="flex size-9 items-center justify-center rounded-full text-[#8e8e93]">
                <Lock className="size-4" />
              </button>
            </div>
          </div>
          {!open ? <h1 className="pb-2 text-[34px] font-bold leading-none tracking-tight">{title}</h1> : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24">
          {open ? (
            <article className="pt-2">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">{open.brand}</p>
              <h2 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{open.name.replace(/\(open box\)/i, "").trim()}</h2>
              <p className="mt-4 text-[40px] font-semibold leading-none tracking-tight">{money(open.price)}</p>
              {open.was ? (
                <p className="mt-2 text-[17px] text-[#8e8e93]">
                  <span className="line-through">{money(open.was)}</span>
                  <span className="ml-2 font-medium text-[#ff3b30]">Save {money(open.was - open.price)}</span>
                </p>
              ) : null}
              {open.member ? <p className="mt-1 text-[15px] text-[#8e8e93]">Member price {money(open.member)}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium shadow-sm">{open.kind}</span>
                {open.open ? <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#8e8e93] shadow-sm">Open box</span> : null}
                <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#8e8e93] shadow-sm">{groupMeta(open.group)?.title}</span>
              </div>
              {open.group === "laptops" || open.group === "desktops" ? <PhoneMarks item={open} /> : null}
              <button
                type="button"
                onClick={() => toggleSave(open.id)}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#007aff] text-[17px] font-semibold text-white active:opacity-80"
              >
                <Heart className={`size-4 ${saved.has(open.id) ? "fill-white" : ""}`} />
                {saved.has(open.id) ? "Saved" : "Save"}
              </button>
              <p className="mt-6 text-center text-[13px] leading-relaxed text-[#8e8e93]">Price checked November 23, 2026. The number on the shelf, not a checkout.</p>
            </article>
          ) : null}

          {!open && tab === "use" ? (
            <div className="space-y-3">
              <button type="button" onClick={() => setFive(true)} className="min-h-20 w-full rounded-2xl bg-[#1c1c1e] px-4 py-4 text-left text-white">
                <span className="block text-[22px] font-semibold">Five minutes</span>
                <span className="mt-1 block text-[15px] text-white/70">What it is for, the games, the budget, and the desk.</span>
              </button>
              <EasyPick
                look="phone"
                onUse={(next) => {
                  setPc(next);
                  setTab("build");
                }}
              />
            </div>
          ) : null}
          {!open && tab === "power" ? <GpuPower look="phone" /> : null}
          {!open && tab === "build" ? (
            <div className="space-y-3">
              <button type="button" onClick={() => setWalk(true)} className="h-14 w-full rounded-2xl bg-[#1c1c1e] text-left px-4 text-[17px] font-semibold text-white">
                Walk the shelf
                <span className="mt-0.5 block text-[13px] font-normal text-white/70">Start with a chip or a graphics card.</span>
              </button>
              <PhoneBuild build={pc} onChange={setPc} />
            </div>
          ) : null}

          {!open && !group && tab === "shop" ? (
            <div className="space-y-6">
              <button type="button" onClick={() => goTab("search")} className="flex h-11 w-full items-center gap-2 rounded-xl bg-[#e3e3e8] px-3 text-left text-[17px] text-[#8e8e93]">
                <Search className="size-4" />
                Search
              </button>
              <button type="button" onClick={() => openGroup("keys")} className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm">
                <span>
                  <span className="block text-[17px] font-medium">Keyboards</span>
                  <span className="mt-0.5 block text-[13px] text-[#8e8e93]">Quiet, soft, or loud.</span>
                </span>
                <ChevronLeft className="size-4 rotate-180 text-[#c7c7cc]" />
              </button>
              <button type="button" onClick={() => openGroup("sim")} className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm">
                <span>
                  <span className="block text-[17px] font-medium">Racing rig</span>
                  <span className="mt-0.5 block text-[13px] text-[#8e8e93]">Forza, iRacing, three screens, a stand.</span>
                </span>
                <ChevronLeft className="size-4 rotate-180 text-[#c7c7cc]" />
              </button>
              <button type="button" onClick={() => goTab("deals")} className="flex h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm">
                <span className="text-[17px] font-medium">Deals</span>
                <ChevronLeft className="size-4 rotate-180 text-[#c7c7cc]" />
              </button>
              {PHONE_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">{section.title}</h2>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    {section.ids.map((id, index) => {
                      const info = groupMeta(id);
                      const rows = PHONE_ITEMS.filter((item) => item.group === id);
                      const from = rows.reduce((min, item) => Math.min(min, item.price), Number.POSITIVE_INFINITY);
                      if (!info) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => openGroup(id)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#f2f2f7] ${index ? "border-t border-[#e5e5ea]" : ""}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[17px] font-medium">{info.title}</span>
                            <span className="mt-0.5 block text-[13px] text-[#8e8e93]">{rows.length} · from {money(from)}</span>
                          </span>
                          <ChevronLeft className="size-4 rotate-180 text-[#c7c7cc]" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
              <p className="pb-2 text-center text-[12px] text-[#8e8e93]">{PHONE_ITEMS.length.toLocaleString("en-CA")} prices</p>
            </div>
          ) : null}

          {!open && group === "sim" ? <Sim look="phone" /> : null}

          {!open && group !== "keys" && group !== "sim" && tab !== "use" && tab !== "build" && tab !== "power" && (group || tab !== "shop") ? (
            <div>
              <div className="sticky top-0 z-10 -mx-4 mb-3 grid grid-cols-2 gap-2 bg-[#f2f2f7]/95 px-4 py-2 backdrop-blur">
                <label className="flex h-10 items-center rounded-xl bg-[#e3e3e8] px-3">
                  <Search className="mr-2 size-4 shrink-0 text-[#8e8e93]" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-[16px] outline-none" />
                </label>
                <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-10 rounded-xl bg-[#e3e3e8] px-3 text-[16px] outline-none">
                  <option value="low">Price, low</option>
                  <option value="high">Price, high</option>
                  <option value="sale">Biggest save</option>
                  <option value="name">Name</option>
                </select>
                {group ? (
                  <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 rounded-xl bg-[#e3e3e8] px-3 text-[16px] outline-none">
                    <option value="all">All types</option>
                    {kinds.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="flex h-10 items-center px-1 text-[13px] text-[#8e8e93]">{listed.length} items</span>
                )}
                <button type="button" onClick={() => setHideOpen((value) => !value)} className={`h-10 rounded-xl px-3 text-left text-[15px] ${hideOpen ? "bg-[#1c1c1e] text-white" : "bg-[#e3e3e8] text-[#1c1c1e]"}`}>
                  {hideOpen ? "Open box hidden" : "Open box shown"}
                </button>
              </div>
              {tab === "search" && query.trim() ? (
                <ThreeSearch
                  rows={listed.filter((item) => item.group === "laptops" || item.group === "desktops").map((item) => ({ id: item.id, name: item.name, brand: item.brand, price: item.price, score: phoneScore(item) }))}
                  who={query.trim()}
                  lineFor={(item, how) => (listed.find((row) => row.id === item.id)?.group === "laptops" ? lapBag(item, how) : partBag(item, how))}
                />
              ) : null}
              {shown.filter((item) => !(tab === "search" && query.trim() && (item.group === "laptops" || item.group === "desktops"))).length === 0 && !(tab === "search" && query.trim()) ? <p className="rounded-2xl bg-white px-4 py-8 text-center text-[17px] text-[#8e8e93]">{tab === "search" && !query.trim() ? "Search a name or a brand." : "Nothing in this list."}</p> : null}
              <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {shown.filter((item) => !(tab === "search" && query.trim() && (item.group === "laptops" || item.group === "desktops"))).map((item, index) => (
                  <li key={item.id} className={index ? "border-t border-[#e5e5ea]" : ""}>
                    <div className="flex items-start gap-2 px-3 py-3">
                      <button type="button" onClick={() => { setOpenId(item.id); path?.note(`item:${item.id}`, item.name.slice(0, 22)); }} className="min-w-0 flex-1 text-left">
                        <span className="block text-[12px] font-medium uppercase tracking-wide text-[#8e8e93]">{item.brand}</span>
                        <span className="mt-0.5 block text-[16px] font-medium leading-snug">{item.name.replace(/\(open box\)/i, "").trim()}</span>
                        <span className="mt-1 block text-[13px] text-[#8e8e93]">
                          {item.kind}
                          {item.open ? " · Open box" : ""}
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[16px] font-semibold">{money(item.price)}</span>
                        {item.was ? <span className="text-[12px] text-[#ff3b30] line-through">{money(item.was)}</span> : null}
                        <AddButton line={phoneLine(item)} className="h-8 rounded-full bg-[#f2f2f7] px-3 text-[13px]" />
                        <button type="button" aria-label={saved.has(item.id) ? "Unsave" : "Save"} onClick={() => toggleSave(item.id)} className="flex size-8 items-center justify-center">
                          <Heart className={`size-4 ${saved.has(item.id) ? "fill-[#ff3b30] text-[#ff3b30]" : "text-[#c7c7cc]"}`} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {shown.length < listed.length ? (
                <button type="button" onClick={() => setLimit((value) => value + 48)} className="mt-3 h-11 w-full rounded-2xl bg-white text-[17px] font-medium text-[#007aff] shadow-sm">
                  Show more
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <nav className="relative z-50 grid shrink-0 grid-cols-5 border-t border-[#d1d1d6] bg-[#f8f8f8]/95 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur">
          {(
            [
              ["use", "Use", Gamepad2],
              ["power", "Power", Zap],
              ["build", "Build", Cpu],
              ["shop", "Shop", LayoutGrid],
              ["saved", "Saved", Heart],
            ] as const
          ).map(([id, label, Icon]) => {
            const on = tab === id && !group && !open;
            return (
              <button key={id} type="button" onClick={() => goTab(id)} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${on ? "text-[#007aff]" : "text-[#8e8e93]"}`}>
                <Icon className={`size-5 ${id === "saved" && saved.size ? "fill-current" : ""}`} strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Menu({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex h-12 min-w-0 items-center gap-2 rounded-xl bg-[#e3e3e8] px-3">
      <span className="shrink-0 text-[13px] text-[#8e8e93]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] outline-none">
        {children}
      </select>
    </label>
  );
}

function PhoneBuild({ build, onChange }: { build: Build; onChange: (next: Build) => void }) {
  const [slot, setSlot] = useState<Category>("cpu");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [budget, setBudget] = useState("1500");
  const [limit, setLimit] = useState(24);

  useEffect(() => {
    setLimit(24);
    setBrand("all");
  }, [slot]);

  const brands = useMemo(() => {
    const others: Build = { ...build };
    delete others[slot];
    const names = new Set(PARTS.filter((part) => part.cat === slot && !isJunk(part, false) && !fitWhy(part, others)).map((part) => part.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [build, slot]);

  const shown = useMemo(() => {
    const others: Build = { ...build };
    delete others[slot];
    const q = query.trim().toLowerCase();
    return PARTS.filter((part) => {
      if (part.cat !== slot || isJunk(part, false) || fitWhy(part, others)) return false;
      if (brand !== "all" && part.brand !== brand) return false;
      if (q && !`${part.brand} ${part.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.price - b.price);
  }, [build, slot, query, brand]);

  const missing = SLOTS.filter((cat) => !build[cat]);
  const chosen = build[slot];

  function take(part: Part) {
    onChange(reconcile(part.cat, { ...build, [part.cat]: part }));
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-[15px] leading-snug text-[#8e8e93]">Pick each part. Ones that do not fit stay out of the list.</p>
      <div className="grid grid-cols-2 gap-2">
        <Menu label="Part" value={slot} onChange={(value) => setSlot(value as Category)}>
          {SLOTS.map((cat) => (
            <option key={cat} value={cat}>
              {CAT_LABEL[cat]}
              {build[cat] ? " · in" : ""}
            </option>
          ))}
        </Menu>
        <Menu label="Make" value={budget} onChange={setBudget}>
          <option value="850">Under $850</option>
          <option value="1200">Under $1,200</option>
          <option value="1500">Under $1,500</option>
          <option value="2200">Under $2,200</option>
          <option value="3000">Under $3,000</option>
          <option value="4500">Under $4,500</option>
        </Menu>
      </div>
      <button type="button" onClick={() => onChange(suggest(Number(budget)))} className="h-11 w-full rounded-2xl bg-[#1c1c1e] text-[16px] font-semibold text-white">
        Make one for me
      </button>
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#8e8e93]">{missing.length ? `Still need ${missing.map((cat) => CAT_LABEL[cat].toLowerCase()).join(", ")}` : "This computer can turn on."}</p>
          <p className="text-[20px] font-semibold">{money(spendOf(build))}</p>
        </div>
        <CopyList title="Computer" names={named(SLOTS.map((cat) => build[cat]))} className="mt-3 h-11 w-full rounded-xl bg-[#1c1c1e] text-[16px] font-medium text-white" />
        {chosen ? (
          <button
            type="button"
            onClick={() => {
              const next = { ...build };
              delete next[slot];
              onChange(next);
            }}
            className="mt-2 text-[15px] text-[#ff3b30]"
          >
            Remove {CAT_LABEL[slot].toLowerCase()}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-11 items-center gap-2 rounded-xl bg-[#e3e3e8] px-3">
          <Search className="size-4 text-[#8e8e93]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-[16px] outline-none" />
        </label>
        <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-11 rounded-xl bg-[#e3e3e8] px-3 text-[16px] outline-none">
          <option value="all">Every brand</option>
          {brands.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {shown.slice(0, limit).map((part, index) => {
          const on = chosen?.id === part.id;
          return (
            <li key={part.id} className={index ? "border-t border-[#e5e5ea]" : ""}>
              <button type="button" onClick={() => take(part)} className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${on ? "bg-[#eef5ff]" : ""}`}>
                <span className="min-w-0">
                  <span className="block text-[12px] uppercase tracking-wide text-[#8e8e93]">{part.brand}</span>
                  <span className="mt-0.5 block text-[16px] leading-snug">{shortName(part)}</span>
                </span>
                <span className="shrink-0 font-semibold">{money(part.price)}</span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 ? <li className="px-4 py-6 text-center text-[16px] text-[#8e8e93]">Nothing here fits.</li> : null}
      </ul>
      {shown.length > limit ? (
        <button type="button" onClick={() => setLimit((value) => value + 24)} className="h-11 w-full rounded-2xl bg-white text-[17px] font-medium text-[#007aff] shadow-sm">
          Show more
        </button>
      ) : null}
    </div>
  );
}


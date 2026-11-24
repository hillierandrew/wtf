import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, Cpu, Gamepad2, Heart, LayoutGrid, Lock, Search } from "lucide-react";
import { CAT_LABEL, CATS, PARTS, byId, fitWhy, isJunk, money, reconcile, shortName, spendOf, suggest, type Build, type Category, type Part } from "@/lib/catalog";
import { PHONE_ITEMS, PHONE_SECTIONS, groupMeta, phoneItem, type PhoneItem } from "@/lib/phone-catalog";
import { LOOKS, childFor, laptopsFor, needsOf, prebuildsFor, type Look, type UseKind, type UseNeed } from "@/lib/phone-use";

type Tab = "use" | "build" | "shop" | "deals" | "search" | "saved";
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

export function Phone({ onLock }: { onLock: () => void }) {
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

  function goTab(next: Tab) {
    setTab(next);
    setGroup(null);
    setOpenId(null);
    setKind("all");
    setQuery("");
    setSort(next === "deals" ? "sale" : "low");
  }

  function openGroup(id: string) {
    setGroup(id);
    setOpenId(null);
    setKind("all");
    setQuery("");
    setSort("low");
  }

  const shown = listed.slice(0, limit);
  const title = open ? "Details" : meta?.title ?? (tab === "use" ? "Use" : tab === "build" ? "Build" : tab === "deals" ? "Deals" : tab === "saved" ? "Saved" : tab === "search" ? "Search" : "Store");

  return (
    <div className="min-h-dvh bg-[#1d1d1f] text-[#1c1c1e] sm:flex sm:items-center sm:justify-center sm:p-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif' }}>
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f2f2f7] sm:h-[min(100dvh-3rem,920px)] sm:rounded-[2.6rem] sm:shadow-[0_40px_90px_rgba(0,0,0,0.45)] sm:ring-8 sm:ring-[#0e0e10]">
        <header className="shrink-0 bg-[#f2f2f7]/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
          <div className="flex h-11 items-center gap-2">
            {open || group ? (
              <button
                type="button"
                onClick={() => (open ? setOpenId(null) : setGroup(null))}
                className="flex h-9 items-center gap-0.5 rounded-full pr-2 text-[17px] text-[#007aff]"
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
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
            <PhoneUse
              onTake={(next) => {
                setPc(next);
                setTab("build");
              }}
            />
          ) : null}
          {!open && tab === "build" ? <PhoneBuild build={pc} onChange={setPc} /> : null}

          {!open && !group && tab === "shop" ? (
            <div className="space-y-6">
              <button type="button" onClick={() => goTab("search")} className="flex h-11 w-full items-center gap-2 rounded-xl bg-[#e3e3e8] px-3 text-left text-[17px] text-[#8e8e93]">
                <Search className="size-4" />
                Search
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

          {!open && tab !== "use" && tab !== "build" && (group || tab !== "shop") ? (
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
              {shown.length === 0 ? <p className="rounded-2xl bg-white px-4 py-8 text-center text-[17px] text-[#8e8e93]">{tab === "search" && !query.trim() ? "Search a name or a brand." : "Nothing in this list."}</p> : null}
              <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {shown.map((item, index) => (
                  <li key={item.id} className={index ? "border-t border-[#e5e5ea]" : ""}>
                    <div className="flex items-start gap-2 px-3 py-3">
                      <button type="button" onClick={() => setOpenId(item.id)} className="min-w-0 flex-1 text-left">
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

        <nav className="grid shrink-0 grid-cols-4 border-t border-[#d1d1d6] bg-[#f8f8f8]/95 px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur">
          {(
            [
              ["use", "Use", Gamepad2],
              ["build", "Build", Cpu],
              ["shop", "Shop", LayoutGrid],
              ["saved", "Saved", Heart],
            ] as const
          ).map(([id, label, Icon]) => {
            const on = tab === id && !group && !open;
            return (
              <button key={id} type="button" onClick={() => goTab(id)} className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${on ? "text-[#007aff]" : "text-[#8e8e93]"}`}>
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

function PhoneUse({ onTake }: { onTake: (build: Build) => void }) {
  const [kind, setKind] = useState<UseKind>("game");
  const [look, setLook] = useState<Look>("normal");
  const options = useMemo(() => needsOf(kind, look), [kind, look]);
  const [id, setId] = useState(options[0]?.id ?? "");
  useEffect(() => {
    if (!options.some((item) => item.id === id)) setId(options[0]?.id ?? "");
  }, [options, id]);
  const need = options.find((item) => item.id === id) ?? options[0];
  const made = useMemo(() => (need ? childFor(need) : {}), [need]);
  const boxes = useMemo(() => (need ? prebuildsFor(need) : []), [need]);
  const laps = useMemo(() => (need ? laptopsFor(need) : []), [need]);
  const parts = CATS.map((cat) => made[cat]).filter((part): part is Part => Boolean(part));

  return (
    <div className="space-y-4">
      <p className="px-1 text-[15px] leading-snug text-[#8e8e93]">Pick what the computer is for. I will put one together from the shelf.</p>
      <div className="grid grid-cols-2 gap-2">
        <Menu label="For" value={kind} onChange={(value) => setKind(value as UseKind)}>
          <option value="game">Games</option>
          <option value="app">Apps</option>
          <option value="course">Courses</option>
        </Menu>
        <Menu label={kind === "game" ? "Look" : "List"} value={kind === "game" ? look : id} onChange={(value) => (kind === "game" ? setLook(value as Look) : setId(value))}>
          {kind === "game"
            ? LOOKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))
            : options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
        </Menu>
      </div>
      {kind === "game" ? (
        <Menu label="Game" value={id} onChange={setId}>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Menu>
      ) : null}
      {need ? <NeedCard need={need} parts={parts} total={spendOf(made)} onTake={() => onTake(made)} boxes={boxes} laps={laps} /> : null}
    </div>
  );
}

function Menu({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl bg-[#e3e3e8] px-3">
      <span className="shrink-0 text-[13px] text-[#8e8e93]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] outline-none">
        {children}
      </select>
    </label>
  );
}

function NeedCard({
  need,
  parts,
  total,
  onTake,
  boxes,
  laps,
}: {
  need: UseNeed;
  parts: Part[];
  total: number;
  onTake: () => void;
  boxes: Part[];
  laps: { id: string; name: string; brand: string; price: number }[];
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">A PC I made</p>
        <h2 className="mt-1 text-[22px] font-semibold leading-tight">{need.label}</h2>
        <p className="mt-1 text-[15px] text-[#8e8e93]">{need.line}</p>
        <ul className="mt-3">
          {parts.map((part) => (
            <li key={part.id} className="flex items-start justify-between gap-3 border-t border-[#e5e5ea] py-2 text-[15px]">
              <span className="min-w-0">
                <span className="block text-[12px] text-[#8e8e93]">{CAT_LABEL[part.cat]}</span>
                <span className="block leading-snug">{shortName(part)}</span>
              </span>
              <span className="shrink-0 font-medium">{money(part.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[28px] font-semibold tracking-tight">{money(total)}</p>
        <button type="button" onClick={onTake} className="mt-3 h-12 w-full rounded-2xl bg-[#007aff] text-[17px] font-semibold text-white active:opacity-80">
          Open in the builder
        </button>
      </section>
      <section>
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">Already built</h3>
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {boxes.length === 0 ? <li className="px-4 py-4 text-[15px] text-[#8e8e93]">No finished PC on the shelf is strong enough.</li> : null}
          {boxes.map((part, index) => (
            <li key={part.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${index ? "border-t border-[#e5e5ea]" : ""}`}>
              <span className="min-w-0 text-[16px] leading-snug">{part.name}</span>
              <span className="shrink-0 font-semibold">{money(part.price)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">Laptops</h3>
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {laps.length === 0 ? <li className="px-4 py-4 text-[15px] text-[#8e8e93]">No laptop on the shelf runs that.</li> : null}
          {laps.map((item, index) => (
            <li key={item.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${index ? "border-t border-[#e5e5ea]" : ""}`}>
              <span className="min-w-0">
                <span className="block text-[12px] text-[#8e8e93]">{item.brand}</span>
                <span className="block text-[16px] leading-snug">{item.name.replace(" (Open box)", "")}</span>
              </span>
              <span className="shrink-0 font-semibold">{money(item.price)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
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


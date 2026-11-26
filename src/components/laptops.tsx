import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Search, X } from "lucide-react";
import raw from "@/data/laptops.json";
import { laptopBits, type ShelfSort } from "@/lib/catalog";
import { laptopMarks } from "@/components/marks";
import { CopyList, partLine } from "@/components/copy-list";
import { SortRow } from "@/components/sorts";
import { ThemeToggle, usePane } from "@/lib/theme";
import { latest, usePath } from "@/components/history";

type Kind = "game" | "home" | "work" | "tablet" | "chrome";
type Filter = "deal" | "games" | "work" | "school" | "grandma" | "create" | "tablet" | "chrome";
type Quality = "low" | "medium" | "normal" | "ultra";

type Laptop = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  brand: string;
  kind: Kind;
  renewed: boolean;
  open: boolean;
  gpu: number;
  score: number;
  deal: number;
  specs: string;
};

type GameNeed = {
  id: string;
  label: string;
  year: number;
  note?: string;
  need: Record<Quality, number>;
  ram: Record<Quality, number>;
};

type Course = {
  id: string;
  label: string;
  program: string;
  gpu: number;
  ram: number;
  windows: boolean;
};

const ITEMS = raw as Laptop[];
const KEY = "drew-laptop";

const FILTERS: { id: Filter; label: string; line: string }[] = [
  { id: "deal", label: "Best deal", line: "Most computer for the money. A higher deal number is better." },
  { id: "games", label: "Games", line: "Strongest for games first. A higher deal number is more computer for the money." },
  { id: "work", label: "Work", line: "Email, office, and class. These are the work laptops." },
  { id: "school", label: "School", line: "Home and school. Not a gaming laptop." },
  { id: "grandma", label: "Grandma", line: "Email, photos, and a video call. Nothing extra to learn." },
  { id: "create", label: "Create", line: "Photos, video, and big files. Lots of memory, or a graphics chip." },
  { id: "tablet", label: "Tablet", line: "A tablet. It is not a laptop." },
  { id: "chrome", label: "Chromebook", line: "For the web and school. Not for heavy games." },
];

const QUALITIES: { id: Quality; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "normal", label: "Normal" },
  { id: "ultra", label: "Ultra" },
];

const GAMES: GameNeed[] = [
  { id: "fortnite", label: "Fortnite", year: 2017, need: { low: 0, medium: 28, normal: 45, ultra: 72 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "league", label: "League of Legends", year: 2009, need: { low: 0, medium: 0, normal: 28, ultra: 45 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "valorant", label: "Valorant", year: 2020, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "minecraft", label: "Minecraft", year: 2011, need: { low: 0, medium: 0, normal: 28, ultra: 45 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "roblox", label: "Roblox", year: 2006, need: { low: 0, medium: 0, normal: 0, ultra: 28 }, ram: { low: 8, medium: 8, normal: 8, ultra: 16 } },
  { id: "rocket", label: "Rocket League", year: 2015, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "sims", label: "The Sims 4", year: 2014, need: { low: 0, medium: 0, normal: 28, ultra: 45 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "overwatch", label: "Overwatch 2", year: 2022, need: { low: 28, medium: 45, normal: 60, ultra: 72 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "apex", label: "Apex Legends", year: 2019, need: { low: 28, medium: 45, normal: 60, ultra: 72 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "cs2", label: "Counter-Strike 2", year: 2023, need: { low: 28, medium: 45, normal: 60, ultra: 72 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "skyrim", label: "Skyrim Special Edition", year: 2016, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "gta5", label: "GTA V", year: 2013, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "rdr2", label: "Red Dead Redemption 2", year: 2019, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "elden", label: "Elden Ring", year: 2022, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 16 } },
  { id: "hogwarts", label: "Hogwarts Legacy", year: 2023, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "bg3", label: "Baldur's Gate 3", year: 2023, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "forza", label: "Forza Horizon 5", year: 2021, need: { low: 45, medium: 60, normal: 72, ultra: 80 }, ram: { low: 16, medium: 16, normal: 16, ultra: 16 } },
  { id: "bf", label: "Battlefield 2042", year: 2021, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 16 } },
  { id: "cyber", label: "Cyberpunk 2077", year: 2020, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "cod", label: "Call of Duty: Black Ops 6", year: 2024, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "tarkov", label: "Escape from Tarkov", year: 2017, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 32, ultra: 32 } },
  { id: "rivals", label: "Marvel Rivals", year: 2024, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 16 } },
  { id: "gta6", label: "GTA 6 ready", year: 2026, note: "Not out yet. This is a guess for when it ships.", need: { low: 60, medium: 72, normal: 90, ultra: 100 }, ram: { low: 16, medium: 32, normal: 32, ultra: 32 } },
  { id: "palworld", label: "Palworld", year: 2024, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "diablo", label: "Diablo IV", year: 2023, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "rust", label: "Rust", year: 2018, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "destiny", label: "Destiny 2", year: 2017, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "starfield", label: "Starfield", year: 2023, need: { low: 60, medium: 72, normal: 90, ultra: 100 }, ram: { low: 16, medium: 16, normal: 32, ultra: 32 } },
  { id: "helldivers", label: "Helldivers 2", year: 2024, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "wilds", label: "Monster Hunter Wilds", year: 2025, need: { low: 60, medium: 72, normal: 90, ultra: 100 }, ram: { low: 16, medium: 16, normal: 32, ultra: 32 } },
  { id: "wukong", label: "Black Myth: Wukong", year: 2024, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "flight", label: "Flight Simulator", year: 2020, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 32, ultra: 32 } },
  { id: "farm", label: "Farming Simulator 25", year: 2024, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "truck", label: "Euro Truck Simulator 2", year: 2012, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "cities", label: "Cities: Skylines 2", year: 2023, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 32, ultra: 32 } },
  { id: "finals", label: "The Finals", year: 2023, need: { low: 45, medium: 60, normal: 72, ultra: 90 }, ram: { low: 16, medium: 16, normal: 16, ultra: 16 } },
  { id: "lethal", label: "Lethal Company", year: 2023, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "stardew", label: "Stardew Valley", year: 2016, need: { low: 0, medium: 0, normal: 0, ultra: 28 }, ram: { low: 4, medium: 8, normal: 8, ultra: 8 } },
  { id: "wow", label: "World of Warcraft", year: 2004, need: { low: 0, medium: 28, normal: 45, ultra: 60 }, ram: { low: 8, medium: 8, normal: 16, ultra: 16 } },
  { id: "ff14", label: "Final Fantasy XIV", year: 2013, need: { low: 28, medium: 45, normal: 60, ultra: 72 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "spiderman", label: "Marvel's Spider-Man", year: 2022, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "gow", label: "God of War", year: 2022, need: { low: 45, medium: 60, normal: 80, ultra: 100 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "alan", label: "Alan Wake 2", year: 2023, need: { low: 60, medium: 72, normal: 90, ultra: 100 }, ram: { low: 16, medium: 16, normal: 16, ultra: 32 } },
  { id: "sea", label: "Sea of Thieves", year: 2018, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
  { id: "nms", label: "No Man's Sky", year: 2016, need: { low: 28, medium: 45, normal: 60, ultra: 80 }, ram: { low: 8, medium: 16, normal: 16, ultra: 16 } },
];

const COURSES: Course[] = [
  { id: "notes", label: "High school notes", program: "a browser and Word", gpu: 0, ram: 4, windows: false },
  { id: "english", label: "English and essays", program: "Word", gpu: 0, ram: 8, windows: true },
  { id: "business", label: "Business", program: "Excel and PowerPoint", gpu: 0, ram: 8, windows: true },
  { id: "nursing", label: "Nursing and health", program: "notes, charts, and video class", gpu: 0, ram: 8, windows: true },
  { id: "cs", label: "Computer science", program: "Visual Studio Code", gpu: 0, ram: 16, windows: true },
  { id: "data", label: "Data class", program: "Python", gpu: 0, ram: 16, windows: true },
  { id: "music", label: "Music production", program: "Ableton and FL Studio", gpu: 0, ram: 16, windows: true },
  { id: "photo", label: "Photoshop", program: "Photoshop", gpu: 0, ram: 16, windows: true },
  { id: "video", label: "Video editing", program: "Premiere and DaVinci", gpu: 45, ram: 16, windows: true },
  { id: "cad", label: "AutoCAD", program: "AutoCAD", gpu: 45, ram: 16, windows: true },
  { id: "arch", label: "Architecture", program: "Revit", gpu: 60, ram: 32, windows: true },
  { id: "blender", label: "3D class", program: "Blender", gpu: 60, ram: 16, windows: true },
  { id: "matlab", label: "Engineering", program: "MATLAB", gpu: 0, ram: 16, windows: true },
  { id: "solid", label: "SolidWorks", program: "SolidWorks", gpu: 60, ram: 32, windows: true },
  { id: "after", label: "Motion graphics", program: "After Effects", gpu: 45, ram: 32, windows: true },
  { id: "zoom", label: "Online class", program: "Zoom", gpu: 0, ram: 8, windows: false },
  { id: "law", label: "Law and writing", program: "Word and a browser", gpu: 0, ram: 8, windows: true },
  { id: "teach", label: "Teaching", program: "slides and a browser", gpu: 0, ram: 8, windows: true },
  { id: "account", label: "Accounting", program: "Excel", gpu: 0, ram: 8, windows: true },
  { id: "cyber", label: "Cybersecurity", program: "labs and a browser", gpu: 0, ram: 16, windows: true },
  { id: "med", label: "Pre-med", program: "notes and video class", gpu: 0, ram: 8, windows: true },
];

function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function hundred(item: Laptop) {
  return laptopBits(item).score;
}

function ramOf(item: Laptop) {
  const match = item.specs.match(/(\d+)GB memory/);
  return match ? Number(match[1]) : 0;
}

function fits(item: Laptop, filter: Filter) {
  if (filter === "deal") return item.kind !== "tablet" && item.kind !== "chrome";
  if (filter === "games") return item.kind === "game" || item.gpu >= 45;
  if (filter === "work") return item.kind === "work";
  if (filter === "school") return (item.kind === "home" || item.kind === "chrome") && item.gpu < 45;
  if (filter === "grandma") return (item.kind === "home" || item.kind === "chrome" || item.kind === "work") && item.gpu < 28;
  if (filter === "create") return item.kind !== "tablet" && item.kind !== "chrome" && (item.gpu > 0 || item.specs.includes("32GB") || item.specs.includes("64GB"));
  if (filter === "tablet") return item.kind === "tablet";
  return item.kind === "chrome";
}

function plays(item: Laptop, game: GameNeed, quality: Quality) {
  if (item.kind === "tablet" || item.kind === "chrome") return false;
  if (ramOf(item) < game.ram[quality]) return false;
  return item.gpu >= game.need[quality];
}

function studies(item: Laptop, course: Course) {
  if (item.kind === "tablet") return false;
  if (course.windows && item.kind === "chrome") return false;
  if (ramOf(item) < course.ram) return false;
  return item.gpu >= course.gpu;
}

function Menu({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-full min-w-0 flex-1 truncate bg-transparent text-base outline-none">
        {children}
      </select>
    </label>
  );
}

export function Laptops({ onLeave }: { onLeave: () => void }) {
  const [filter, setFilter] = useState<Filter>("deal");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [openBox, setOpenBox] = useState(false);
  const [gameId, setGameId] = useState("any");
  const [quality, setQuality] = useState<Quality>("normal");
  const [courseId, setCourseId] = useState("any");
  const [sort, setSort] = useState<ShelfSort>("deal-asc");
  const path = usePath();

  useEffect(() => {
    if (!path) return;
    const id = latest(path.log, path.at, (item) => item.startsWith("for:"));
    setFilter(id ? (id.slice(4) as Filter) : "deal");
  }, [path?.at, path?.log]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setPicked(saved);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, picked);
  }, [picked]);

  const game = GAMES.find((item) => item.id === gameId);
  const course = COURSES.find((item) => item.id === courseId);

  const brands = useMemo(() => {
    const names = new Set(
      ITEMS.filter((item) => {
        if (!fits(item, filter)) return false;
        if (game && !plays(item, game, quality)) return false;
        if (course && !studies(item, course)) return false;
        return true;
      }).map((item) => item.brand),
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [filter, game, course, quality]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (!fits(item, filter)) return false;
      if (game && !plays(item, game, quality)) return false;
      if (course && !studies(item, course)) return false;
      if (!openBox && item.open) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (q && !`${item.brand} ${item.name}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      const aScore = hundred(a);
      const bScore = hundred(b);
      const aDeal = a.price / aScore;
      const bDeal = b.price / bScore;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "score-desc") return bScore - aScore;
      if (sort === "score-asc") return aScore - bScore;
      if (sort === "deal-desc") return bDeal - aDeal;
      if (sort === "gig-asc" || sort === "gig-desc") return sort === "gig-desc" ? b.price - a.price : a.price - b.price;
      if (sort === "price-asc") return a.price - b.price;
      return aDeal - bDeal;
    });
  }, [filter, query, brand, openBox, game, course, quality, sort]);

  const choice = ITEMS.find((item) => item.id === picked);
  const meta = FILTERS.find((item) => item.id === filter)!;
  const qualityLabel = QUALITIES.find((item) => item.id === quality)?.label ?? "Normal";
  const wide = usePane();

  function pickGame(id: string) {
    setGameId(id);
    setCourseId("any");
    setBrand("all");
    if (id !== "any" && (filter === "tablet" || filter === "chrome" || filter === "school")) setFilter("deal");
  }

  function pickCourse(id: string) {
    setCourseId(id);
    setGameId("any");
    setBrand("all");
    if (id !== "any" && (filter === "tablet" || filter === "chrome" || filter === "games")) setFilter("deal");
  }

  return (
    <div className={`mx-auto flex h-full w-full overflow-hidden bg-bg text-fg ${wide ? "max-w-6xl flex-row" : "max-w-xl flex-col"}`}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-2 text-3xl font-medium leading-none tracking-tight">Pick a laptop</h1>
        <p className="mt-1 text-sm text-muted">Games, a class, or the best price. The list is right under the menus.</p>
      </header>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-4 pt-3">
        <Menu
          label="For"
          value={filter}
          onChange={(id) => {
            setFilter(id as Filter);
            path?.note(`for:${id}`, FILTERS.find((item) => item.id === id)?.label ?? id);
            setBrand("all");
            setQuery("");
          }}
        >
          {FILTERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Menu>
        <Menu label="Game" value={gameId} onChange={pickGame}>
          <option value="any">Any game</option>
          {GAMES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Menu>
        <Menu label="Class" value={courseId} onChange={pickCourse}>
          <option value="any">Any class</option>
          {COURSES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Menu>
        {game ? (
          <Menu label="Look" value={quality} onChange={(id) => setQuality(id as Quality)}>
            {QUALITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Menu>
        ) : (
          <SortRow value={sort} onChange={setSort} />
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <p className="text-sm text-muted">{game ? `${game.label} (${game.year}) at ${qualityLabel}. ${game.note ?? "Only laptops that can run it."}` : course ? `${course.label}. Runs ${course.program}.` : meta.line}</p>
        {game ? <SortRow value={sort} onChange={setSort} /> : null}
        <div className="flex gap-2">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-elevated px-3">
            <Search className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-full w-full bg-transparent text-base outline-none" />
          </label>
          <button type="button" onClick={() => setOpenBox((value) => !value)} className={`h-12 shrink-0 rounded-2xl border px-3 text-sm ${openBox ? "border-accent bg-subtle" : "border-line"}`}>
            Open box
          </button>
        </div>
        <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-elevated px-3 text-base">
          <option value="all">Every brand</option>
          {brands.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <ul className="flex flex-col gap-2">
          {shown.length === 0 ? <li className="rounded-2xl border border-line px-4 py-4 text-base">Nothing here runs that. Try a lower setting, or Best deal.</li> : null}
          {shown.map((item) => {
            const selected = picked === item.id;
            return (
              <li key={item.id} className={`overflow-hidden rounded-2xl border ${selected ? "border-accent bg-subtle" : "border-line bg-elevated"}`}>
                <button type="button" onClick={() => setPicked(item.id)} className="press flex w-full items-start justify-between gap-3 px-3 py-4 text-left">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {item.brand}
                      {selected ? <Check className="size-4 text-accent" /> : null}
                    </span>
                    <span className="mt-1 block text-base font-medium leading-snug">{item.name.replace(" (Open box)", "")}</span>
                    <span className="mt-1 block text-sm text-muted">{item.specs}</span>
                    {game ? <span className="mt-1 block text-sm text-muted">{game.label} at {qualityLabel}</span> : null}
                    {course ? <span className="mt-1 block text-sm text-muted">Runs {course.program}</span> : null}
                    <span className="mt-1 block text-sm text-muted">{money(item.price / hundred(item))} per point</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-base font-medium">{money(item.price)}</span>
                    {item.was ? <span className="block text-sm text-ok">Down {money(item.was - item.price)}</span> : null}
                  </span>
                </button>
                <div className="px-3 pb-3">
                  {laptopMarks(item)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      </div>
      <aside className={`shrink-0 bg-elevated px-4 py-4 ${wide ? "flex w-80 flex-col border-l border-line" : "safe-bottom border-t border-line"}`}>
        <p className="text-base font-medium">{choice ? money(choice.price) : "No laptop yet"}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-base">{choice ? choice.name.replace(" (Open box)", "") : "Tap one laptop."}</span>
          {choice ? (
            <button type="button" onClick={() => setPicked("")} aria-label="Remove" className="flex size-11 items-center justify-center rounded-full border border-line">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {choice ? <CopyList title="Laptop" names={[partLine(choice)]} /> : null}
      </aside>
    </div>
  );
}

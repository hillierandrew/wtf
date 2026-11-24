import raw from "@/data/laptops.json";
import { PARTS, buildSpeed, isJunk, machineScore, suggest, type Build, type Part } from "@/lib/catalog";

type Laptop = { id: string; name: string; price: number; brand: string; kind: string; gpu: number; specs: string; open: boolean };

const LAPTOPS = raw as Laptop[];

export type UseKind = "game" | "app" | "course";

export type UseNeed = {
  id: string;
  label: string;
  kind: UseKind;
  line: string;
  gpu: number;
  ram: number;
  windows: boolean;
};

const GAMES: { id: string; label: string; year: number; low: number; normal: number; ultra: number; ram: number }[] = [
  { id: "fortnite", label: "Fortnite", year: 2017, low: 0, normal: 45, ultra: 72, ram: 16 },
  { id: "league", label: "League of Legends", year: 2009, low: 0, normal: 28, ultra: 45, ram: 8 },
  { id: "valorant", label: "Valorant", year: 2020, low: 0, normal: 45, ultra: 60, ram: 16 },
  { id: "minecraft", label: "Minecraft", year: 2011, low: 0, normal: 28, ultra: 45, ram: 8 },
  { id: "roblox", label: "Roblox", year: 2006, low: 0, normal: 0, ultra: 28, ram: 8 },
  { id: "rocket", label: "Rocket League", year: 2015, low: 0, normal: 45, ultra: 60, ram: 16 },
  { id: "cs2", label: "Counter-Strike 2", year: 2023, low: 28, normal: 60, ultra: 72, ram: 16 },
  { id: "gta5", label: "GTA V", year: 2013, low: 28, normal: 60, ultra: 80, ram: 16 },
  { id: "gta6", label: "GTA 6 ready", year: 2026, low: 60, normal: 90, ultra: 100, ram: 32 },
  { id: "rdr2", label: "Red Dead Redemption 2", year: 2019, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "elden", label: "Elden Ring", year: 2022, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "cyber", label: "Cyberpunk 2077", year: 2020, low: 45, normal: 80, ultra: 100, ram: 16 },
  { id: "cod", label: "Call of Duty", year: 2024, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "hogwarts", label: "Hogwarts Legacy", year: 2023, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "bg3", label: "Baldur's Gate 3", year: 2023, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "forza", label: "Forza Horizon 5", year: 2021, low: 45, normal: 72, ultra: 80, ram: 16 },
  { id: "apex", label: "Apex Legends", year: 2019, low: 28, normal: 60, ultra: 72, ram: 16 },
  { id: "overwatch", label: "Overwatch 2", year: 2022, low: 28, normal: 60, ultra: 72, ram: 16 },
  { id: "rivals", label: "Marvel Rivals", year: 2024, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "wukong", label: "Black Myth: Wukong", year: 2024, low: 45, normal: 80, ultra: 100, ram: 16 },
  { id: "wilds", label: "Monster Hunter Wilds", year: 2025, low: 60, normal: 90, ultra: 100, ram: 16 },
  { id: "starfield", label: "Starfield", year: 2023, low: 60, normal: 90, ultra: 100, ram: 32 },
  { id: "helldivers", label: "Helldivers 2", year: 2024, low: 45, normal: 72, ultra: 90, ram: 16 },
  { id: "flight", label: "Flight Simulator", year: 2020, low: 45, normal: 80, ultra: 100, ram: 32 },
  { id: "farm", label: "Farming Simulator 25", year: 2024, low: 28, normal: 60, ultra: 80, ram: 16 },
  { id: "cities", label: "Cities: Skylines 2", year: 2023, low: 45, normal: 80, ultra: 100, ram: 32 },
  { id: "wow", label: "World of Warcraft", year: 2004, low: 0, normal: 45, ultra: 60, ram: 16 },
  { id: "ff14", label: "Final Fantasy XIV", year: 2013, low: 28, normal: 60, ultra: 72, ram: 16 },
  { id: "sims", label: "The Sims 4", year: 2014, low: 0, normal: 28, ultra: 45, ram: 8 },
  { id: "stardew", label: "Stardew Valley", year: 2016, low: 0, normal: 0, ultra: 28, ram: 8 },
];

const APPS: { id: string; label: string; line: string; gpu: number; ram: number }[] = [
  { id: "chrome", label: "Chrome and the web", line: "Browsing, mail, and video.", gpu: 0, ram: 8 },
  { id: "office", label: "Word, Excel, PowerPoint", line: "Office work.", gpu: 0, ram: 8 },
  { id: "zoom", label: "Zoom", line: "Class and meetings.", gpu: 0, ram: 8 },
  { id: "discord", label: "Discord", line: "Chat and a call.", gpu: 0, ram: 8 },
  { id: "spotify", label: "Spotify", line: "Music.", gpu: 0, ram: 8 },
  { id: "steam", label: "Steam", line: "The game library itself.", gpu: 28, ram: 16 },
  { id: "vscode", label: "Visual Studio Code", line: "Writing code.", gpu: 0, ram: 16 },
  { id: "python", label: "Python", line: "Scripts and data class.", gpu: 0, ram: 16 },
  { id: "photoshop", label: "Photoshop", line: "Photos.", gpu: 28, ram: 16 },
  { id: "premiere", label: "Premiere Pro", line: "Video editing.", gpu: 60, ram: 32 },
  { id: "resolve", label: "DaVinci Resolve", line: "Color and video.", gpu: 60, ram: 32 },
  { id: "after", label: "After Effects", line: "Motion graphics.", gpu: 60, ram: 32 },
  { id: "blender", label: "Blender", line: "3D.", gpu: 72, ram: 32 },
  { id: "unity", label: "Unity", line: "Making a game.", gpu: 60, ram: 32 },
  { id: "unreal", label: "Unreal Engine", line: "A heavy game engine.", gpu: 80, ram: 32 },
  { id: "ableton", label: "Ableton and FL Studio", line: "Music production.", gpu: 0, ram: 16 },
  { id: "cad", label: "AutoCAD", line: "Drawings.", gpu: 45, ram: 16 },
  { id: "revit", label: "Revit", line: "Buildings.", gpu: 60, ram: 32 },
  { id: "solid", label: "SolidWorks", line: "Parts and machines.", gpu: 60, ram: 32 },
  { id: "matlab", label: "MATLAB", line: "Engineering math.", gpu: 0, ram: 16 },
];

const COURSES: { id: string; label: string; line: string; gpu: number; ram: number; windows: boolean }[] = [
  { id: "notes", label: "High school notes", line: "A browser and Word.", gpu: 0, ram: 8, windows: false },
  { id: "english", label: "English", line: "Essays.", gpu: 0, ram: 8, windows: true },
  { id: "business", label: "Business", line: "Excel and slides.", gpu: 0, ram: 8, windows: true },
  { id: "finance", label: "Finance", line: "Spreadsheets.", gpu: 0, ram: 8, windows: true },
  { id: "account", label: "Accounting", line: "Excel.", gpu: 0, ram: 8, windows: true },
  { id: "law", label: "Law", line: "Reading and writing.", gpu: 0, ram: 8, windows: true },
  { id: "psych", label: "Psychology", line: "Papers and stats.", gpu: 0, ram: 8, windows: true },
  { id: "bio", label: "Biology", line: "Notes and labs.", gpu: 0, ram: 8, windows: true },
  { id: "nursing", label: "Nursing", line: "Charts and video class.", gpu: 0, ram: 8, windows: true },
  { id: "premed", label: "Pre-med", line: "Notes and video class.", gpu: 0, ram: 8, windows: true },
  { id: "teach", label: "Teaching", line: "Slides and a browser.", gpu: 0, ram: 8, windows: true },
  { id: "film", label: "Film studies", line: "Watching and a short edit.", gpu: 45, ram: 16, windows: true },
  { id: "design", label: "Graphic design", line: "Photoshop and Illustrator.", gpu: 45, ram: 16, windows: true },
  { id: "cs", label: "Computer science", line: "Code and a browser.", gpu: 0, ram: 16, windows: true },
  { id: "data", label: "Data science", line: "Python.", gpu: 0, ram: 16, windows: true },
  { id: "cyber", label: "Cybersecurity", line: "Labs.", gpu: 0, ram: 16, windows: true },
  { id: "ce", label: "Computer engineering", line: "Code and some 3D.", gpu: 45, ram: 16, windows: true },
  { id: "eng", label: "Engineering", line: "MATLAB.", gpu: 0, ram: 16, windows: true },
  { id: "arch", label: "Architecture", line: "Revit.", gpu: 60, ram: 32, windows: true },
  { id: "mech", label: "Mechanical engineering", line: "SolidWorks.", gpu: 60, ram: 32, windows: true },
  { id: "gamedesign", label: "Game design", line: "Unity or Unreal.", gpu: 72, ram: 32, windows: true },
  { id: "music", label: "Music", line: "A studio program.", gpu: 0, ram: 16, windows: true },
];

export const LOOKS = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "ultra", label: "Ultra" },
] as const;

export type Look = (typeof LOOKS)[number]["id"];

export function needsOf(kind: UseKind, look: Look): UseNeed[] {
  if (kind === "game") {
    return GAMES.map((game) => ({
      id: game.id,
      label: game.label,
      kind,
      line: String(game.year),
      gpu: game[look],
      ram: look === "ultra" ? Math.max(game.ram, 16) : game.ram,
      windows: true,
    }));
  }
  if (kind === "app") {
    return APPS.map((app) => ({ id: app.id, label: app.label, kind, line: app.line, gpu: app.gpu, ram: app.ram, windows: true }));
  }
  return COURSES.map((course) => ({ id: course.id, label: course.label, kind, line: course.line, gpu: course.gpu, ram: course.ram, windows: course.windows }));
}

function budgetFor(gpu: number, ram: number) {
  let budget = gpu >= 100 ? 4500 : gpu >= 90 ? 3600 : gpu >= 72 ? 2800 : gpu >= 60 ? 2000 : gpu >= 45 ? 1500 : gpu >= 28 ? 1100 : 850;
  if (ram >= 32) budget = Math.max(budget, 2200);
  return budget;
}

export function childFor(need: UseNeed): Build {
  const budget = budgetFor(need.gpu, need.ram);
  let build = suggest(budget);
  if (need.gpu >= 45 && buildSpeed(build) < need.gpu * 0.75) build = suggest(Math.min(4800, budget + 1400));
  return build;
}

function ramOf(item: Laptop) {
  const match = item.specs.match(/(\d+)GB memory/);
  return match ? Number(match[1]) : 0;
}

export function laptopsFor(need: UseNeed) {
  return LAPTOPS.filter((item) => {
    if (item.open || item.kind === "tablet") return false;
    if (need.windows && item.kind === "chrome") return false;
    if (ramOf(item) < need.ram) return false;
    return item.gpu >= need.gpu;
  })
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);
}

export function prebuildsFor(need: UseNeed): Part[] {
  const floor = Math.round(need.gpu * 0.72);
  return PARTS.filter((part) => {
    if (part.cat !== "prebuilt" || isJunk(part, false)) return false;
    const score = machineScore(part.name);
    if (need.gpu < 28) return part.form !== "gaming" || score < 40;
    return score >= floor;
  })
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);
}

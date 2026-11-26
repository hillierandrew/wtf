import { gameTags } from "@/lib/games";

export function releaseYear(name: string): number {
  const n = name.toUpperCase();
  if (/5090|5080|5070|5060|RYZEN AI|CORE ULTRA|ULTRA [579]/.test(n)) return 2025;
  if (/4080|4070|4060|4050|14\d{3}|RYZEN\s?[579]\s?[89]\d{3}/.test(n)) return 2024;
  if (/3080|3070|3060|3050|13\d{3}|RYZEN\s?[579]\s?7\d{3}/.test(n)) return 2023;
  if (/12\d{3}|RYZEN\s?[579]\s?[56]\d{3}/.test(n)) return 2022;
  if (/10\d{3}|11\d{3}|9400|10500/.test(n)) return 2020;
  return 2024;
}

export function laptopWeight(name: string, kind = ""): { lb: number; kg: number } {
  const blob = `${kind} ${name}`;
  const inch = Number(name.match(/(\d{2}(?:\.\d)?)/)?.[1] ?? (/tab/i.test(blob) ? 11 : 15.6));
  let lb = 3.6;
  if (/tablet|\btab\b/i.test(blob)) lb = inch >= 12 ? 1.3 : 1.0;
  else if (inch <= 13) lb = 2.6;
  else if (inch <= 14) lb = 3.1;
  else if (inch <= 15.6) lb = 3.9;
  else if (inch <= 16) lb = 4.6;
  else lb = 5.8;
  if (/game|nitro|legion|rog|tuf|raider|strix|katana|aorus/i.test(blob)) lb += 1.2;
  if (/oled/i.test(name) && !/game|nitro|legion|rog/i.test(blob)) lb -= 0.3;
  lb = Math.round(lb * 10) / 10;
  return { lb, kg: Math.round(lb * 0.4536 * 10) / 10 };
}

const VRAM: [RegExp, string][] = [
  [/5090/, "32GB VRAM"],
  [/5080/, "16GB VRAM"],
  [/5070\s?TI/, "16GB VRAM"],
  [/5070/, "12GB VRAM"],
  [/5060\s?TI/, "16GB VRAM"],
  [/5060/, "8GB VRAM"],
  [/4090/, "24GB VRAM"],
  [/4080/, "16GB VRAM"],
  [/4070\s?TI/, "12GB VRAM"],
  [/4070|4060\s?TI|4060|3060/, "8GB VRAM"],
  [/4050|3050/, "6GB VRAM"],
  [/9070\s?XT|9070/, "16GB VRAM"],
  [/9060/, "16GB VRAM"],
];

export function specTags(name: string, specs = ""): string[] {
  const n = `${name} ${specs}`.toUpperCase();
  const tags: string[] = [];
  if (/DDR5|\bD5\b/.test(n)) tags.push("DDR5");
  else if (/DDR4|\bD4\b/.test(n)) tags.push("DDR4");
  else if (/MEMORY/.test(n) && releaseYear(name) >= 2024) tags.push("DDR5");
  else if (/MEMORY/.test(n) && releaseYear(name) <= 2022) tags.push("DDR4");
  for (const [re, label] of VRAM) {
    if (re.test(n)) {
      tags.push(label);
      break;
    }
  }
  if (/RTX|GEFORCE/.test(n)) tags.push("NVIDIA");
  else if (/RADEON\s+RX|\bRX\s?\d{3,4}/.test(n)) tags.push("AMD");
  if (/NVME|M\.2/.test(n)) tags.push("NVMe");
  else if (/SSD|STORAGE/.test(n)) tags.push("SSD");
  if (/HDD|HARD DRIVE|\d+\s?RPM/.test(n)) tags.push("HDD");
  return tags;
}

export function laptopFace(name: string, specs = "", kind = ""): string[] {
  const blob = `${name} ${specs}`;
  const n = blob.toUpperCase();
  const tags = [...specTags(name, specs)];
  if (/OLED/.test(n)) tags.push("OLED");
  else if (/\bIPS\b/.test(n)) tags.push("IPS");
  else if (/\bVA\b/.test(n)) tags.push("VA");
  if (/4K|UHD|3840/.test(n)) tags.push("4K");
  else if (/QHD|1440|2560/.test(n)) tags.push("2K");
  else if (/FHD|1080/.test(n)) tags.push("1080p");
  const inch = name.match(/(\d{2}(?:\.\d)?)\s*"/);
  if (inch) tags.push(`${inch[1]}"`, `${inch[1]} inch`);
  const ram = blob.match(/(\d+)\s*GB(?!\s*SSD)/i);
  if (ram) tags.push(`${ram[1]}GB`, `${ram[1]}GB RAM`);
  const tb = blob.match(/(\d+(?:\.\d+)?)\s*TB/i);
  if (tb) tags.push(`${tb[1]}TB`);
  if (/RTX|GEFORCE/.test(n)) tags.push("RTX", "Gaming");
  if (/RYZEN/.test(n)) tags.push("Ryzen");
  if (/INTEL|CORE ULTRA|\bI[3579]-/.test(n)) tags.push("Intel");
  if (/TOUCH/.test(n)) tags.push("Touch");
  if (/2-IN-1|YOGA|X360/.test(n)) tags.push("2-in-1");
  if (/SNAPDRAGON/.test(n)) tags.push("Snapdragon");
  const hz = n.match(/(\d{2,3})\s*HZ/);
  if (hz) tags.push(`${hz[1]}Hz`);
  if (/BACK-?LIT|BACKLIGHT/.test(n)) tags.push("Backlit keyboard");
  if (kind === "game") tags.push("Gaming", "Games");
  if (kind === "work") tags.push("Work", "Business", "Office");
  if (kind === "home") tags.push("Home", "School", "Student");
  if (kind === "chrome") tags.push("Chromebook", "Chrome");
  tags.push(String(releaseYear(name)));
  const weight = laptopWeight(name, kind);
  tags.push(`${weight.lb} lb`, `${weight.kg} kg`, "laptop");
  return [...new Set(tags)];
}

export function laptopBlob(item: { name: string; brand?: string; specs?: string; kind?: string }): string {
  return `${item.brand ?? ""} ${item.name} ${item.specs ?? ""} ${item.kind ?? ""} ${laptopFace(item.name, item.specs ?? "", item.kind ?? "").join(" ")} ${gameTags(item.name, item.specs ?? "", item.kind ?? "").join(" ")}`.toLowerCase();
}

export function tagPaint(tag: string): { bg: string; fg: string } {
  const t = tag.toUpperCase();
  if (t === "OLED") return { bg: "#efe6ff", fg: "#5b21b6" };
  if (t === "IPS" || t === "VA" || t === "4K" || t === "2K" || t === "1080P") return { bg: "#e0f2fe", fg: "#075985" };
  if (t.includes("NVIDIA") || t === "RTX") return { bg: "#dcfce7", fg: "#166534" };
  if (t.includes("AMD") || t === "RYZEN") return { bg: "#ffe4e6", fg: "#9f1239" };
  if (t.includes("INTEL")) return { bg: "#dbeafe", fg: "#1e3a8a" };
  if (/^\d{4}$/.test(tag)) return { bg: "#fef3c7", fg: "#92400e" };
  if (t.includes("GAMING") || t === "GAMES") return { bg: "#161616", fg: "#ffffff" };
  if (t.includes("SCHOOL") || t.includes("WORK") || t === "HOME" || t.includes("OFFICE")) return { bg: "#ecfdf5", fg: "#065f46" };
  if (t.includes("LB") || t.includes("KG")) return { bg: "#f4f4f5", fg: "#3f3f46" };
  return { bg: "#f4f4f5", fg: "#222" };
}

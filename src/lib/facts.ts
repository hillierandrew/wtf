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
  const inch = Number(name.match(/(\d{2}(?:\.\d)?)/)?.[1] ?? ( /tab/i.test(blob) ? 11 : 15.6));
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

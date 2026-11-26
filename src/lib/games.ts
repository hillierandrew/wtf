/** 1080p store estimate for games people are playing on PC now. Not a frame-rate test. */

export type GameCall = "Yes" | "Low" | "No";

export const PLAY_GAMES: { name: string; tag: string; need: number; ram: number }[] = [
  { name: "Counter-Strike 2", tag: "CS2", need: 18, ram: 8 },
  { name: "Fortnite", tag: "Fortnite", need: 20, ram: 8 },
  { name: "Marvel Rivals", tag: "Marvel Rivals", need: 48, ram: 16 },
  { name: "GTA V Enhanced", tag: "GTA", need: 48, ram: 16 },
  { name: "Black Myth Wukong", tag: "Wukong", need: 48, ram: 16 },
  { name: "Expedition 33", tag: "Expedition 33", need: 48, ram: 16 },
  { name: "ARC Raiders", tag: "ARC Raiders", need: 58, ram: 16 },
  { name: "Monster Hunter Wilds", tag: "Wilds", need: 64, ram: 16 },
  { name: "Doom: The Dark Ages", tag: "Doom", need: 64, ram: 16 },
  { name: "Kingdom Come 2", tag: "Kingdom Come 2", need: 64, ram: 16 },
  { name: "Cyberpunk 2077", tag: "Cyberpunk", need: 64, ram: 16 },
  { name: "Call of Duty", tag: "Call of Duty", need: 64, ram: 16 },
  { name: "Phantom Blade Zero", tag: "Phantom Blade", need: 64, ram: 16 },
];

/** Rough graphics power. 0 means no picture. An RTX 5060 is 64. A 5090 is 96. */
export function chipPower(name: string, gpu?: number): number {
  const n = name.toUpperCase();
  if (/5090/.test(n)) return 96;
  if (/5080/.test(n)) return 90;
  if (/5070\s?TI|9070\s?XT|4090/.test(n)) return 84;
  if (/\b5070\b|\b9070\b|4080/.test(n)) return 76;
  if (/5060\s?TI|9060\s?XT/.test(n)) return 70;
  if (/4070\s?TI/.test(n)) return 72;
  if (/\b4070\b/.test(n)) return 66;
  if (/5060|9060/.test(n)) return 64;
  if (/4060\s?TI/.test(n)) return 62;
  if (/4060/.test(n)) return 58;
  if (/4050/.test(n)) return 48;
  if (/3060|3070/.test(n)) return 44;
  if (/3050|2050|1650/.test(n)) return 36;
  if (/\bARC\b/.test(n)) return 32;
  if (gpu && gpu >= 100) return 96;
  if (gpu && gpu >= 90) return 90;
  if (gpu && gpu >= 80) return 84;
  if (gpu && gpu >= 72) return 76;
  if (gpu && gpu >= 60) return 64;
  if (gpu && gpu >= 45) return 48;
  if (gpu && gpu >= 28) return 36;
  if (/RTX|\bRX\s?\d{3,4}|GEFORCE/.test(n)) return 40;
  if (/\dF\b|KF\b|X3D|7600X|9600X|9700X|7700X|7500F|8400F/.test(n)) return 0;
  if (/780M|890M|760M/.test(n)) return 26;
  if (/RYZEN AI|ULTRA|IRIS|HD GRAPHICS|\dG\b|\bGT\b/.test(n)) return 20;
  if (/INTEL|RYZEN|CORE/.test(n)) return 14;
  return 0;
}

export function memoryGb(name: string, specs = ""): number {
  const blob = `${specs} ${name}`;
  const labeled = blob.match(/(\d+)\s*GB\s*(?:memory|RAM)/i);
  if (labeled) return Number(labeled[1]);
  const ddr = blob.match(/(\d+)\s*GB\s*DDR/i);
  if (ddr) return Number(ddr[1]);
  const sizes: number[] = [];
  for (const chunk of blob.split(/\s*\+\s*/)) {
    if (/\b(RTX|RX|GEFORCE)\b/i.test(chunk)) continue;
    for (const match of chunk.matchAll(/(\d+)\s*GB/gi)) {
      const n = Number(match[1]);
      if (n >= 8 && n <= 128) sizes.push(n);
    }
  }
  return sizes.length ? Math.max(...sizes) : 0;
}

export function gameCall(chip: number, ram: number, need: number, needRam: number): GameCall {
  if (chip <= 0) return "No";
  const ramOk = ram <= 0 || ram >= needRam;
  const ramClose = ram <= 0 || ram >= Math.max(8, needRam - 8);
  if (chip >= need && ramOk) return "Yes";
  if (chip >= Math.round(need * 0.7) && ramClose) return "Low";
  return "No";
}

export function gameSplit(input: { name: string; specs?: string; kind?: string; gpu?: number }): {
  blocked: string;
  ram: number;
  yes: string[];
  low: string[];
  no: string[];
  rows: { name: string; tag: string; how: GameCall }[];
} {
  const kind = input.kind ?? "";
  if (kind === "chrome" || kind === "tablet") {
    return {
      blocked: "Chrome OS or a tablet. These Windows games do not run.",
      ram: 0,
      yes: [],
      low: [],
      no: PLAY_GAMES.map((game) => game.tag),
      rows: PLAY_GAMES.map((game) => ({ name: game.name, tag: game.tag, how: "No" })),
    };
  }
  const chip = chipPower(`${input.name} ${input.specs ?? ""}`, input.gpu);
  const ram = memoryGb(input.name, input.specs);
  if (chip <= 0) {
    return {
      blocked: "No graphics. None of these games run until you add a card.",
      ram,
      yes: [],
      low: [],
      no: PLAY_GAMES.map((game) => game.tag),
      rows: PLAY_GAMES.map((game) => ({ name: game.name, tag: game.tag, how: "No" })),
    };
  }
  const rows = PLAY_GAMES.map((game) => ({ name: game.name, tag: game.tag, how: gameCall(chip, ram, game.need, game.ram) }));
  return {
    blocked: ram <= 0 ? "Memory is not in this box. The call assumes 16GB gets added." : "",
    ram,
    yes: rows.filter((row) => row.how === "Yes").map((row) => row.tag),
    low: rows.filter((row) => row.how === "Low").map((row) => row.tag),
    no: rows.filter((row) => row.how === "No").map((row) => row.tag),
    rows,
  };
}

export function gameTags(name: string, specs = "", kind = ""): string[] {
  return gameSplit({ name, specs, kind }).yes;
}

export type GuideJob = "games" | "school" | "work" | "grandma" | "zoom" | "think";
export type GuideGame = "shooters" | "fortnite" | "minecraft" | "racing" | "farming" | "flight" | "any";

export type GuideItem = { id: string; name: string; price: number; brand?: string };
export type GuideLap = GuideItem & { kind: string; gpu: number; specs: string; open?: boolean; renewed?: boolean };
export type GuideGear = GuideItem & { game: string; slot: string; also?: string[]; open?: boolean };
export type GuideKey = GuideItem & { shelf: string; feel: string; open?: boolean; french?: boolean };

export type GuideLine = GuideItem & { kind: "pc" | "lap" | "monitor" | "key" | "mouse" | "gear"; specs?: string; gpu?: number };

export type GuideResult = {
  why: string;
  over: string | null;
  lines: GuideLine[];
};

type Catalog = {
  towers: GuideItem[];
  laptops: GuideLap[];
  monitors: GuideItem[];
  keys: GuideKey[];
  gear: GuideGear[];
};

const BAD = /barebone|refurbished|renewed|open\s?box|chromebook|no\s+ram|no\s+storage/i;

function money(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function choose<T extends { price: number }>(items: T[], max: number, target: number, score: (item: T) => number): T | null {
  const under = items.filter((item) => item.price > 0 && item.price <= max + 0.001);
  if (!under.length) return null;
  let best = -Infinity;
  for (const item of under) best = Math.max(best, score(item));
  const top = under.filter((item) => score(item) === best);
  top.sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target) || b.price - a.price);
  return top[0] ?? null;
}

function cheapest<T extends { price: number }>(items: T[], max = Infinity): T | null {
  return items.filter((item) => item.price > 0 && item.price <= max).sort((a, b) => a.price - b.price)[0] ?? null;
}

export function gpuClass(name: string): number {
  const n = name.toUpperCase();
  if (/5090/.test(n)) return 9;
  if (/5080/.test(n)) return 8;
  if (/5070\s?TI/.test(n)) return 7;
  if (/5070|9070\s?XT/.test(n)) return 6;
  if (/9070|5060\s?TI/.test(n)) return 5;
  if (/5060|9060/.test(n)) return 4;
  if (/4070|4060\s?TI|3070/.test(n)) return 3;
  if (/4060|4050|3060/.test(n)) return 2;
  if (/3050|1660|1650/.test(n)) return 1;
  return 0;
}

function gpuLabel(name: string): string | null {
  const match = name.match(/RTX\s?\d{3,4}\s?TI|RX\s?\d{3,4}\s?XT|GTX\s?\d{3,4}|RTX\s?\d{3,4}|RX\s?\d{3,4}/i);
  return match ? match[0].replace(/\s+/g, " ").replace(/TI/i, "Ti").replace(/XT/i, "XT").toUpperCase().replace("TI", "Ti") : null;
}

function memLabel(name: string): string | null {
  const match = name.match(/(\d+)\s*GB(?!\s*SSD)/i);
  return match ? `${match[1]}GB of memory` : null;
}

function discrete(name: string) {
  return gpuClass(name) > 0;
}

function nvidia(name: string) {
  return /RTX|GTX/i.test(name);
}

function officeBox(name: string) {
  return /NUC|THINKCENTRE|OPTIPLEX|PRODESK|ELITEDESK|BAREBONE/i.test(name);
}

function liveTowers(items: GuideItem[]) {
  return items.filter((item) => item.price > 0 && !BAD.test(item.name));
}

function liveLaps(items: GuideLap[]) {
  return items.filter((item) => item.price > 0 && !item.open && !item.renewed && item.kind !== "tablet" && item.kind !== "chrome" && !BAD.test(item.name));
}

function memGb(item: GuideLap) {
  const match = item.specs.match(/(\d+)\s*GB\s*memory/i) ?? item.name.match(/(\d+)\s*GB/i);
  return match ? Number(match[1]) : 0;
}

function lapFit(item: GuideLap) {
  const n = item.name.toUpperCase();
  const mem = memGb(item);
  let score = 0;
  if (mem >= 32) score += 6;
  else if (mem >= 16) score += 4;
  else if (mem >= 8) score += 1;
  else score -= 4;
  if (/1TB|2TB/.test(`${item.specs} ${n}`)) score += 1;
  if (/CELERON|N100|N150|N200|N250|N350|N50\b|PENTIUM|ATHLON/.test(n)) score -= 6;
  if (/RYZEN 3|CORE 3|I3-|SNAPDRAGON/.test(n)) score -= 2;
  if (/I[357]-1[0-2]\d{3}|I[357]-[6-9]\d{3}|RYZEN\s?[357]\s?[1-5]\d{3}[^0-9]/.test(n)) score -= 4;
  if (/RYZEN 5|CORE 5|I5-/.test(n)) score += 2;
  if (/RYZEN 7|CORE 7|I7-|ULTRA [57]/.test(n)) score += 4;
  if (/RYZEN AI|ULTRA 9/.test(n)) score += 5;
  if (item.kind === "work") score += 2;
  if (item.kind === "game") score -= 8;
  return score;
}

function cardLine(item: GuideItem) {
  const card = gpuLabel(item.name);
  const mem = memLabel(item.name);
  return [card, mem].filter(Boolean).join(" and ") || "a finished computer";
}

function lineOf(item: GuideItem, kind: GuideLine["kind"], extra?: { specs?: string; gpu?: number }): GuideLine {
  return { id: item.id, name: item.name, price: item.price, brand: item.brand, kind, ...extra };
}

function towersFor(catalog: Catalog, test: (item: GuideItem) => boolean) {
  return liveTowers(catalog.towers).filter((item) => discrete(item.name) && !officeBox(item.name) && test(item));
}

function bestTower(catalog: Catalog, max: number, target: number, cap: number, minClass = 1, onlyNvidia = false) {
  return choose(
    towersFor(catalog, (item) => gpuClass(item.name) >= minClass && gpuClass(item.name) <= cap && (!onlyNvidia || nvidia(item.name))),
    max,
    target,
    (item) => gpuClass(item.name) * 10,
  );
}

function bestLap(catalog: Catalog, max: number, target: number, allow: (item: GuideLap) => boolean) {
  const pool = liveLaps(catalog.laptops).filter(allow);
  const roomy = pool.filter((item) => memGb(item) >= 16);
  return choose(roomy.length ? roomy : pool, max, target, lapFit);
}

function gameLap(catalog: Catalog, max: number, target: number, cap: number) {
  return choose(
    liveLaps(catalog.laptops).filter((item) => item.kind === "game" && gpuClass(item.name) >= 1 && gpuClass(item.name) <= cap),
    max,
    target,
    (item) => gpuClass(item.name) * 10 + (memGb(item) >= 32 ? 1 : 0),
  );
}

function pickMonitor(catalog: Catalog, max: number, games: boolean) {
  const ok = catalog.monitors.filter((item) => item.price >= 90 && item.price <= max && !BAD.test(item.name));
  if (games) {
    const qhd = ok.filter((item) => /27/.test(item.name) && /QHD|1440|2560/.test(item.name) && /IPS/i.test(item.name));
    const fast = ok.filter((item) => /27|24\.?5|23\.8|24/.test(item.name) && /144|165|180|240/.test(item.name));
    return choose(qhd.length ? qhd : fast.length ? fast : ok, Math.min(max, 320), 180, () => 1);
  }
  const ips = ok.filter((item) => /IPS/i.test(item.name) && /24|27/.test(item.name));
  return choose(ips.length ? ips : ok, Math.min(max, 180), 120, (item) => (/24/.test(item.name) ? 1 : 0));
}

function pickBoard(catalog: Catalog, max: number, games: boolean) {
  const boards = catalog.keys.filter((item) => !item.open && !item.french && item.shelf === "board" && !/tester|azerty|french/i.test(item.name));
  if (games) return choose(boards.filter((item) => item.price >= 40), Math.min(max, 90), 55, () => 1);
  const quiet = boards.filter((item) => item.feel === "membrane" || item.feel === "silent" || item.feel === "low");
  return choose(quiet.length ? quiet : boards, Math.min(max, 50), 30, () => 1);
}

function pickMouse(catalog: Catalog, max: number) {
  const mice = catalog.keys.filter((item) => !item.open && item.shelf === "mouse" && item.price >= 15 && item.name.length > 14 && !/\(\s*\)/.test(item.name));
  const branded = mice.filter((item) => /logitech|lenovo|\bhp\b|asus|razer|corsair|steelseries/i.test(item.name));
  return choose(branded.length ? branded : mice, Math.min(max, 40), 25, () => 1);
}

function addExtras(catalog: Catalog, lines: GuideLine[], budget: number, games: boolean, wantMonitor: boolean) {
  let left = budget - lines.reduce((sum, line) => sum + line.price, 0);
  const added: string[] = [];
  if (wantMonitor && left >= 100) {
    const screen = pickMonitor(catalog, left, games);
    if (screen && screen.price <= left) {
      lines.push(lineOf(screen, "monitor"));
      left -= screen.price;
      added.push("screen");
    }
  }
  if (left >= 20) {
    const board = pickBoard(catalog, left, games);
    if (board && board.price <= left) {
      lines.push(lineOf(board, "key"));
      left -= board.price;
      added.push("keyboard");
    }
  }
  if (left >= 15) {
    const mouse = pickMouse(catalog, left);
    if (mouse && mouse.price <= left) {
      lines.push(lineOf(mouse, "mouse"));
      added.push("mouse");
    }
  }
  return added;
}

function overText(total: number, budget: number) {
  if (total <= budget + 0.5) return null;
  return `This is ${money(total)}. They said ${money(budget)}. Nothing cheaper does this job.`;
}

function laptopAnswer(catalog: Catalog, budget: number, desk: boolean, pickCap: number, target: number, allow: (item: GuideLap) => boolean, why: (item: GuideLap) => string, wantMonitor: boolean): GuideResult {
  const cap = Math.min(budget, pickCap);
  const pick = bestLap(catalog, cap, Math.min(budget, target), allow)
    ?? cheapest(liveLaps(catalog.laptops).filter(allow).filter((item) => memGb(item) >= 16))
    ?? cheapest(liveLaps(catalog.laptops).filter(allow));
  if (!pick) return { why: "Nothing in the list fits.", over: null, lines: [] };
  const lines = [lineOf(pick, "lap", { specs: pick.specs, gpu: pick.gpu })];
  const extras = desk ? addExtras(catalog, lines, budget, false, wantMonitor) : [];
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  const screen = desk && !extras.includes("screen") ? " The laptop is the screen." : "";
  const tail = extras.length ? ` With the ${extras.join(" and ")}.` : screen;
  return { why: `${why(pick)}${tail} ${money(pick.price)}.`, over: overText(total, budget), lines };
}

function computerAnswer(catalog: Catalog, budget: number, desk: boolean, cap: number, target: number, onlyNvidia: boolean, why: (item: GuideItem, skipped: boolean) => string, floor: GuideItem | null): GuideResult {
  const bare = bestTower(catalog, budget, Math.min(budget, target), cap, 1, onlyNvidia);
  const held = desk ? bestTower(catalog, Math.max(0, budget - 230), Math.min(budget - 230, target), cap, 1, onlyNvidia) : bare;
  const drop = bare && held ? gpuClass(bare.name) - gpuClass(held.name) : 0;
  const keepCard = Boolean(desk && bare && drop >= 2);
  const pick = keepCard ? bare : held ?? bare ?? floor;
  if (!pick) return { why: "Nothing in the list plays this.", over: null, lines: [] };
  const lines = [lineOf(pick, "pc")];
  const room = budget - pick.price;
  const extras = desk && !keepCard ? addExtras(catalog, lines, budget, true, true) : room >= 100 && desk ? addExtras(catalog, lines, budget, true, false) : [];
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  const skipped = Boolean(desk && !lines.some((line) => line.kind === "monitor"));
  const extraNote = extras.length && !skipped ? ` The desk adds a ${extras.join(", ")}.` : skipped && desk ? " The screen is the next thing. A weaker card just to add a screen today is the wrong sale." : "";
  return { why: `${why(pick, skipped)}${extraNote}`, over: overText(total, budget), lines };
}

function wheelOf(catalog: Catalog, max = Infinity) {
  return cheapest(
    catalog.gear.filter((item) => !item.open && item.game === "racing" && item.slot === "wheel" && item.also?.includes("pedals") && /pc/i.test(item.name)),
    max,
  );
}

function standOf(catalog: Catalog, max: number) {
  const stands = catalog.gear.filter((item) => !item.open && item.slot === "seat" && /stand/i.test(item.name));
  if (max >= 350) {
    const better = stands.find((item) => /wheel stand 2/i.test(item.name) && item.price <= max);
    if (better) return better;
  }
  return cheapest(stands, max);
}

function simAnswer(catalog: Catalog, budget: number, desk: boolean, game: "racing" | "farming" | "flight"): GuideResult {
  const lines: GuideLine[] = [];
  const wheel = wheelOf(catalog);
  const farm = cheapest(catalog.gear.filter((item) => !item.open && item.game === "farm" && item.slot === "farm"));
  const flight = cheapest(catalog.gear.filter((item) => !item.open && item.game === "flight" && item.slot === "controls" && /hotas/i.test(item.name) && /pc/i.test(item.name)))
    ?? cheapest(catalog.gear.filter((item) => !item.open && item.game === "flight" && item.slot === "controls" && /pc/i.test(item.name)));
  const gear = game === "racing" ? wheel : game === "farming" ? farm : flight;
  const gearCost = gear?.price ?? 0;
  const pc = bestTower(catalog, Math.max(0, budget - gearCost), budget - gearCost, 9, 1, false)
    ?? towersFor(catalog, (item) => gpuClass(item.name) >= 1).sort((a, b) => a.price - b.price)[0];
  if (pc) lines.push(lineOf(pc, "pc"));
  if (gear) lines.push(lineOf(gear, "gear"));
  if (desk) addExtras(catalog, lines, budget, true, true);
  const spent = lines.reduce((sum, line) => sum + line.price, 0);
  if (game === "farming" && wheel && spent + wheel.price <= budget + 0.5) lines.push(lineOf(wheel, "gear"));
  if (game === "racing") {
    const now = lines.reduce((sum, line) => sum + line.price, 0);
    const stand = standOf(catalog, budget - now);
    if (stand && now + stand.price <= budget + 0.5) lines.push(lineOf(stand, "gear"));
  }
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  const card = pc ? cardLine(pc) : "a computer";
  const gearName = game === "racing" ? "a wheel and pedals" : game === "farming" ? "a farm stick" : "a stick and throttle";
  const stand = lines.some((line) => /stand/i.test(line.name));
  const wheeled = lines.filter((line) => line.kind === "gear").length > 1;
  const screen = desk && !lines.some((line) => line.kind === "monitor") ? " The screen did not fit. It is the next thing." : "";
  const why = game === "racing"
    ? `Racing. ${card}, plus ${gearName}.${stand ? " A stand is on the list." : " A stand is the next thing if it did not fit."}${screen}`
    : game === "farming"
      ? `Farming. ${card}, plus ${gearName}.${wheeled ? " A wheel is on the list too." : " A wheel is the next thing."}${screen}`
      : `Flight. ${card}, plus ${gearName}.${screen}`;
  return { why, over: overText(total, budget), lines };
}

export function guide(job: GuideJob, game: GuideGame | null, budget: number, desk: boolean, catalog: Catalog): GuideResult {
  if (game === "racing" || game === "farming" || game === "flight") return simAnswer(catalog, budget, desk, game);

  if (job === "school") {
    return laptopAnswer(catalog, budget, desk, 1600, 1200, (item) => item.kind === "home" || item.kind === "work", (item) => `School. A normal Windows laptop with ${memGb(item) >= 16 ? "16GB or more" : "the memory it has"}. Not a gaming laptop and not a Chromebook.`, true);
  }
  if (job === "work") {
    return laptopAnswer(catalog, budget, desk, 1800, 1600, (item) => item.kind === "home" || item.kind === "work", (item) => `Work. Windows, ${memGb(item) >= 16 ? "16GB or more" : "the memory on the sticker"}, for mail, sheets, and calls.`, true);
  }
  if (job === "grandma") {
    return laptopAnswer(catalog, budget, desk, 1100, 950, (item) => item.kind === "home" && !/SNAPDRAGON/i.test(item.name), (item) => `Grandma. Email, photos, and a video call. Windows, ${memGb(item) >= 16 ? "16GB" : "light memory"}, a screen she can read. Not a Chromebook.`, false);
  }
  if (job === "zoom") {
    return laptopAnswer(catalog, budget, desk, 1600, 1200, (item) => (item.kind === "home" || item.kind === "work") && !/17\.3|\b17\b|SNAPDRAGON/i.test(item.name), () => `Zoom. A Windows laptop for the meeting, with enough memory to leave the camera on. Not a Chromebook.`, false);
  }
  if (job === "think") {
    const floor = towersFor(catalog, (item) => nvidia(item.name) && gpuClass(item.name) >= 4).sort((a, b) => a.price - b.price)[0] ?? null;
    return computerAnswer(catalog, budget, desk, 9, budget, true, (item) => {
      const card = gpuLabel(item.name) ?? "an NVIDIA card";
      return `A model at home. It needs NVIDIA. This is a ${card}. ${money(item.price)}.`;
    }, floor);
  }

  const minecraft = game === "minecraft";
  const cap = minecraft ? 4 : game === "fortnite" ? 6 : 9;
  const target = minecraft ? 1700 : budget;
  const floorTower = towersFor(catalog, (item) => gpuClass(item.name) >= 1 && gpuClass(item.name) <= cap).sort((a, b) => a.price - b.price)[0];
  const floorLap = liveLaps(catalog.laptops).filter((item) => item.kind === "game" && gpuClass(item.name) >= 1).sort((a, b) => a.price - b.price)[0];
  const floor = minecraft ? null : floorTower && floorLap ? (floorLap.price < floorTower.price ? null : floorTower) : floorTower ?? null;

  if (minecraft && budget < 1199) {
    return laptopAnswer(catalog, budget, desk, budget, budget, (item) => item.kind === "home" || item.kind === "work", () => `Minecraft. A normal Windows laptop does this. A gaming card is not the sale.`, false);
  }

  const bare = bestTower(catalog, budget, Math.min(budget, target), cap);
  if (!bare && !minecraft) {
    const lap = gameLap(catalog, budget, budget, cap) ?? floorLap;
    if (!lap) return { why: "Nothing in the list plays this.", over: null, lines: [] };
    const lines = [lineOf(lap, "lap", { specs: lap.specs, gpu: lap.gpu })];
    if (desk) addExtras(catalog, lines, budget, true, false);
    const total = lines.reduce((sum, line) => sum + line.price, 0);
    const card = gpuLabel(lap.name) ?? "a gaming chip";
    return {
      why: `${game === "fortnite" ? "Fortnite" : game === "shooters" ? "Shooters" : "Games"}. No desktop fits ${money(budget)}. This laptop has a ${card}. ${money(lap.price)}.`,
      over: overText(total, budget),
      lines,
    };
  }

  return computerAnswer(catalog, budget, desk, cap, target, false, (item) => {
    const card = cardLine(item);
    if (minecraft) return `Minecraft. ${card} is enough. A bigger card does not change this game. ${money(item.price)}.`;
    const name = game === "fortnite" ? "Fortnite" : game === "shooters" ? "Shooters" : "Games";
    return `${name}. A desktop with ${card}. ${money(item.price)}.`;
  }, minecraft ? floorTower ?? null : floor);
}

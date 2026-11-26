import { create } from "zustand";
import { partLine } from "@/components/copy-list";

export type BagLine = { id: string; name: string; price: number; rule: string };

const KEY = "drew-bag";

type BagState = {
  lines: BagLine[];
  open: boolean;
  ready: boolean;
  hydrate: () => void;
  add: (line: BagLine) => void;
  addMany: (lines: BagLine[]) => void;
  remove: (id: string) => void;
  setOpen: (open: boolean) => void;
};

function write(lines: BagLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode */
  }
}

export const useBag = create<BagState>((set, get) => ({
  lines: [],
  open: false,
  ready: false,
  hydrate() {
    if (get().ready) return;
    let lines: BagLine[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BagLine[];
        if (Array.isArray(parsed)) lines = parsed.filter((line) => line && typeof line.id === "string" && typeof line.name === "string" && typeof line.price === "number");
      }
    } catch {
      lines = [];
    }
    set({ lines, ready: true });
  },
  add(line) {
    const lines = get().lines.some((item) => item.id === line.id) ? get().lines : [...get().lines, line];
    write(lines);
    set({ lines, open: true });
  },
  addMany(next) {
    const lines = [...get().lines];
    for (const line of next) {
      if (!lines.some((item) => item.id === line.id)) lines.push(line);
    }
    write(lines);
    set({ lines, open: true });
  },
  remove(id) {
    const lines = get().lines.filter((line) => line.id !== id);
    write(lines);
    set({ lines });
  },
  setOpen(open) {
    set({ open });
  },
}));

export function partBag(part: { id: string; name: string; brand?: string; price: number }, rule: string): BagLine {
  return { id: `part:${part.id}`, name: partLine(part), price: part.price, rule };
}

export function lapBag(part: { id: string; name: string; brand?: string; price: number }, rule: string): BagLine {
  return { id: `lap:${part.id}`, name: partLine(part), price: part.price, rule };
}

export function keyBag(part: { id: string; name: string; brand?: string; price: number }, rule: string): BagLine {
  return { id: `key:${part.id}`, name: partLine(part), price: part.price, rule };
}

export function simBag(part: { id: string; name: string; brand?: string; price: number }, rule: string): BagLine {
  return { id: `sim:${part.id}`, name: partLine(part), price: part.price, rule };
}

export type Scored = { id: string; name: string; price: number; score: number; brand?: string };

export function threeOf<T extends Scored>(rows: T[]) {
  const list = rows.filter((row) => row.price > 0);
  if (!list.length) return [] as { kind: string; item: T }[];
  const cheap = [...list].sort((a, b) => a.price - b.price)[0];
  const premium = [...list].sort((a, b) => b.score - a.score || b.price - a.price)[0];
  const value = [...list].sort((a, b) => a.price / Math.max(1, a.score) - b.price / Math.max(1, b.score))[0];
  const out: { kind: string; item: T }[] = [{ kind: "Cheapest that matches", item: cheap }];
  if (value.id !== cheap.id) out.push({ kind: "Best value", item: value });
  if (premium.id !== cheap.id && premium.id !== value.id) out.push({ kind: "Premium", item: premium });
  return out;
}

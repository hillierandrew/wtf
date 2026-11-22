import { create } from "zustand";
import { CATS, CAT_LABEL, applyBundle, byId, reconcile, type Build, type Category, type Part } from "@/lib/catalog";

const BUILD_KEY = "drew-bench-build";
const OPEN_KEY = "drew-bench-openbox";
const SAVED_KEY = "drew-bench-saved";

export type SavedBuild = {
  id: string;
  name: string;
  ids: Partial<Record<Category, string>>;
};

type Ids = Partial<Record<Category, string>>;

type State = {
  hydrated: boolean;
  openBox: boolean;
  ids: Ids;
  saved: SavedBuild[];
  notice: string;
  hydrate: () => void;
  setOpenBox: (value: boolean) => void;
  pick: (part: Part) => void;
  remove: (cat: Category) => void;
  clear: () => void;
  apply: (build: Build, note?: string) => void;
  save: (name: string) => void;
  loadSaved: (id: string) => void;
  removeSaved: (id: string) => void;
  dismiss: () => void;
};

function idsOf(build: Build): Ids {
  const ids: Ids = {};
  for (const cat of CATS) {
    const part = build[cat];
    if (part) ids[cat] = part.id;
  }
  return ids;
}

function buildOf(ids: Ids): Build {
  const build: Build = {};
  for (const cat of CATS) {
    const id = ids[cat];
    const part = id ? byId.get(id) : undefined;
    if (part) build[cat] = part;
  }
  return build;
}

function writeLocal(ids: Ids, openBox: boolean, saved: SavedBuild[]) {
  try {
    localStorage.setItem(BUILD_KEY, JSON.stringify(ids));
    localStorage.setItem(OPEN_KEY, openBox ? "1" : "0");
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    /* private mode */
  }
}

function droppedNote(before: Ids, after: Ids): string {
  const gone = CATS.filter((cat) => before[cat] && !after[cat]);
  if (!gone.length) return "";
  const labels = gone.map((cat) => CAT_LABEL[cat].toLowerCase());
  return `Removed ${labels.join(", ")}. It no longer fits.`;
}

export const useBench = create<State>((set, get) => ({
  hydrated: false,
  openBox: false,
  ids: {},
  saved: [],
  notice: "",
  hydrate: () => {
    if (get().hydrated) return;
    let ids: Ids = {};
    let openBox = false;
    let saved: SavedBuild[] = [];
    try {
      const rawIds = localStorage.getItem(BUILD_KEY);
      if (rawIds) ids = JSON.parse(rawIds) as Ids;
      openBox = localStorage.getItem(OPEN_KEY) === "1";
      const rawSaved = localStorage.getItem(SAVED_KEY);
      if (rawSaved) saved = JSON.parse(rawSaved) as SavedBuild[];
    } catch {
      ids = {};
      saved = [];
    }
    set({ hydrated: true, openBox, ids: idsOf(buildOf(ids)), saved });
  },
  setOpenBox: (value) => {
    const { ids, saved } = get();
    writeLocal(ids, value, saved);
    set({ openBox: value });
  },
  pick: (part) => {
    const { ids, openBox, saved } = get();
    const current = buildOf(ids);
    const next =
      part.cat === "prebuilt"
        ? { prebuilt: part }
        : part.cat === "bundle"
          ? applyBundle(part, current)
          : reconcile(part.cat, { ...current, [part.cat]: part });
    const nextIds = idsOf(next);
    writeLocal(nextIds, openBox, saved);
    const dropped = droppedNote(ids, nextIds);
    const note =
      part.cat === "prebuilt" && next.prebuilt
        ? "Finished PC. That price is the whole system."
        : part.cat === "bundle" && next.bundle
          ? dropped
            ? `Bundle applied. ${dropped}`
            : "Bundle applied. The deal price replaces those parts."
          : dropped;
    set({ ids: nextIds, notice: note });
  },
  remove: (cat) => {
    const { ids, openBox, saved } = get();
    const next = { ...ids };
    delete next[cat];
    writeLocal(next, openBox, saved);
    set({ ids: next, notice: "" });
  },
  clear: () => {
    const { openBox, saved } = get();
    writeLocal({}, openBox, saved);
    set({ ids: {}, notice: "" });
  },
  apply: (build, note) => {
    const { openBox, saved } = get();
    const ids = idsOf(build);
    writeLocal(ids, openBox, saved);
    set({ ids, notice: note ?? "" });
  },
  save: (name) => {
    const { ids, openBox, saved } = get();
    if (!CATS.some((cat) => ids[cat])) return;
    const entry: SavedBuild = {
      id: `${Date.now()}`,
      name: name.trim() || "Untitled build",
      ids,
    };
    const next = [entry, ...saved].slice(0, 8);
    writeLocal(ids, openBox, next);
    set({ saved: next, notice: "Build saved on this device." });
  },
  loadSaved: (id) => {
    const { saved, openBox } = get();
    const found = saved.find((item) => item.id === id);
    if (!found) return;
    const ids = idsOf(buildOf(found.ids));
    writeLocal(ids, openBox, saved);
    set({ ids, notice: `Loaded ${found.name}.` });
  },
  removeSaved: (id) => {
    const { ids, openBox, saved } = get();
    const next = saved.filter((item) => item.id !== id);
    writeLocal(ids, openBox, next);
    set({ saved: next });
  },
  dismiss: () => set({ notice: "" }),
}));

export function partsFrom(ids: Ids): Build {
  return buildOf(ids);
}

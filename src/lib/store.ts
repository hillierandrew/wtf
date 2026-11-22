import { create } from "zustand";
import { CATS, CAT_LABEL, EXTRA_CATS, applyBundle, byId, emptyExtras, extraWhy, reconcile, trimExtras, type Build, type Category, type ExtraCat, type Extras, type Part } from "@/lib/catalog";

const BUILD_KEY = "drew-bench-build";
const OPEN_KEY = "drew-bench-openbox";
const SAVED_KEY = "drew-bench-saved";

const EXTRA_KEY = "drew-bench-extras";

export type ExtraIds = Record<ExtraCat, string[]>;

export type SavedBuild = {
  id: string;
  name: string;
  ids: Partial<Record<Category, string>>;
  extras?: ExtraIds;
};

type Ids = Partial<Record<Category, string>>;

type State = {
  hydrated: boolean;
  openBox: boolean;
  ids: Ids;
  extraIds: ExtraIds;
  saved: SavedBuild[];
  notice: string;
  hydrate: () => void;
  setOpenBox: (value: boolean) => void;
  pick: (part: Part) => void;
  addExtra: (part: Part) => void;
  remove: (cat: Category) => void;
  removeExtra: (cat: ExtraCat, index: number) => void;
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

function emptyExtraIds(): ExtraIds {
  return { memory: [], storage: [], monitor: [] };
}

function extrasFrom(ids: ExtraIds): Extras {
  const extras = emptyExtras();
  for (const cat of EXTRA_CATS) {
    for (const id of ids[cat] ?? []) {
      const part = byId.get(id);
      if (part && part.cat === cat) extras[cat].push(part);
    }
  }
  return extras;
}

function extraIdsOf(extras: Extras): ExtraIds {
  return {
    memory: extras.memory.map((part) => part.id),
    storage: extras.storage.map((part) => part.id),
    monitor: extras.monitor.map((part) => part.id),
  };
}

function writeLocal(ids: Ids, extraIds: ExtraIds, openBox: boolean, saved: SavedBuild[]) {
  try {
    localStorage.setItem(BUILD_KEY, JSON.stringify(ids));
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extraIds));
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
  extraIds: emptyExtraIds(),
  saved: [],
  notice: "",
  hydrate: () => {
    if (get().hydrated) return;
    let ids: Ids = {};
    let extraIds = emptyExtraIds();
    let openBox = false;
    let saved: SavedBuild[] = [];
    try {
      const rawIds = localStorage.getItem(BUILD_KEY);
      if (rawIds) ids = JSON.parse(rawIds) as Ids;
      const rawExtra = localStorage.getItem(EXTRA_KEY);
      if (rawExtra) extraIds = { ...emptyExtraIds(), ...(JSON.parse(rawExtra) as Partial<ExtraIds>) };
      openBox = localStorage.getItem(OPEN_KEY) === "1";
      const rawSaved = localStorage.getItem(SAVED_KEY);
      if (rawSaved) saved = JSON.parse(rawSaved) as SavedBuild[];
    } catch {
      ids = {};
      extraIds = emptyExtraIds();
      saved = [];
    }
    const build = buildOf(ids);
    extraIds = extraIdsOf(trimExtras(build, extrasFrom(extraIds)));
    set({ hydrated: true, openBox, ids: idsOf(build), extraIds, saved });
  },
  setOpenBox: (value) => {
    const { ids, extraIds, saved } = get();
    writeLocal(ids, extraIds, value, saved);
    set({ openBox: value });
  },
  pick: (part) => {
    const { ids, extraIds, openBox, saved } = get();
    const current = buildOf(ids);
    const next =
      part.cat === "prebuilt"
        ? { prebuilt: part }
        : part.cat === "bundle"
          ? applyBundle(part, current)
          : reconcile(part.cat, { ...current, [part.cat]: part });
    const nextIds = idsOf(next);
    const trimmed = extraIdsOf(trimExtras(next, extrasFrom(extraIds)));
    writeLocal(nextIds, trimmed, openBox, saved);
    const dropped = droppedNote(ids, nextIds);
    const lostExtra = EXTRA_CATS.some((cat) => (extraIds[cat]?.length ?? 0) > trimmed[cat].length);
    const replaced = part.cat !== "prebuilt" && part.cat !== "bundle" && ids[part.cat] && ids[part.cat] !== part.id;
    const note =
      part.cat === "prebuilt" && next.prebuilt
        ? "Finished PC. That price is the whole system."
        : part.cat === "bundle" && next.bundle
          ? dropped
            ? `Bundle applied. ${dropped}`
            : "Bundle applied. The deal price replaces those parts."
          : [replaced ? "Replaced. You still have one." : "", dropped, lostExtra ? "An extra part no longer fits, so it was removed." : ""]
              .filter(Boolean)
              .join(" ");
    set({ ids: nextIds, extraIds: trimmed, notice: note });
  },
  addExtra: (part) => {
    const { ids, extraIds, openBox, saved } = get();
    const build = buildOf(ids);
    const extras = extrasFrom(extraIds);
    const why = extraWhy(part, build, extras);
    if (why || (part.cat !== "memory" && part.cat !== "storage" && part.cat !== "monitor")) {
      set({ notice: why || "Only one of these." });
      return;
    }
    const nextExtras = extraIdsOf(trimExtras(build, { ...extras, [part.cat]: [...extras[part.cat], part] }));
    writeLocal(ids, nextExtras, openBox, saved);
    set({ extraIds: nextExtras, notice: "Added. It fits in an empty slot." });
  },
  remove: (cat) => {
    const { ids, extraIds, openBox, saved } = get();
    const next = { ...ids };
    const extras = extrasFrom(extraIds);
    if ((cat === "memory" || cat === "storage" || cat === "monitor") && extras[cat].length) {
      const [first, ...rest] = extras[cat];
      next[cat] = first.id;
      extras[cat] = rest;
    } else delete next[cat];
    const build = buildOf(next);
    const trimmed = extraIdsOf(trimExtras(build, extras));
    writeLocal(idsOf(build), trimmed, openBox, saved);
    set({ ids: idsOf(build), extraIds: trimmed, notice: "" });
  },
  removeExtra: (cat, index) => {
    const { ids, extraIds, openBox, saved } = get();
    const extras = extrasFrom(extraIds);
    extras[cat] = extras[cat].filter((_, item) => item !== index);
    const trimmed = extraIdsOf(trimExtras(buildOf(ids), extras));
    writeLocal(ids, trimmed, openBox, saved);
    set({ extraIds: trimmed, notice: "" });
  },
  clear: () => {
    const { openBox, saved } = get();
    const extraIds = emptyExtraIds();
    writeLocal({}, extraIds, openBox, saved);
    set({ ids: {}, extraIds, notice: "" });
  },
  apply: (build, note) => {
    const { openBox, saved } = get();
    const ids = idsOf(build);
    const extraIds = emptyExtraIds();
    writeLocal(ids, extraIds, openBox, saved);
    set({ ids, extraIds, notice: note ?? "" });
  },
  save: (name) => {
    const { ids, extraIds, openBox, saved } = get();
    if (!CATS.some((cat) => ids[cat])) return;
    const entry: SavedBuild = {
      id: `${Date.now()}`,
      name: name.trim() || "Untitled build",
      ids,
      extras: extraIds,
    };
    const next = [entry, ...saved].slice(0, 8);
    writeLocal(ids, extraIds, openBox, next);
    set({ saved: next, notice: "Build saved on this device." });
  },
  loadSaved: (id) => {
    const { saved, openBox } = get();
    const found = saved.find((item) => item.id === id);
    if (!found) return;
    const ids = idsOf(buildOf(found.ids));
    const extraIds = extraIdsOf(trimExtras(buildOf(found.ids), extrasFrom({ ...emptyExtraIds(), ...found.extras })));
    writeLocal(ids, extraIds, openBox, saved);
    set({ ids, extraIds, notice: `Loaded ${found.name}.` });
  },
  removeSaved: (id) => {
    const { ids, extraIds, openBox, saved } = get();
    const next = saved.filter((item) => item.id !== id);
    writeLocal(ids, extraIds, openBox, next);
    set({ saved: next });
  },
  dismiss: () => set({ notice: "" }),
}));

export function partsFrom(ids: Ids): Build {
  return buildOf(ids);
}

export function extrasFromIds(ids: ExtraIds | undefined): Extras {
  return extrasFrom(ids ?? emptyExtraIds());
}

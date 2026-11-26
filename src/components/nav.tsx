export type Screen = "pc" | "desk" | "sim" | "laptop" | "desktop" | "value" | "steam" | "games" | "guide" | "colour" | "ideas" | "pick" | "power";

const LINKS: { id: Screen; label: string }[] = [
  { id: "pick", label: "For" },
  { id: "power", label: "Power" },
  { id: "guide", label: "Guide" },
  { id: "ideas", label: "AI" },
  { id: "games", label: "Games" },
  { id: "pc", label: "PC" },
  { id: "desktop", label: "Prebuilds" },
  { id: "laptop", label: "Laptops" },
  { id: "colour", label: "Colour" },
  { id: "desk", label: "Keys" },
];

const NAMES: Record<string, string> = {
  pick: "For",
  power: "Power",
  ideas: "AI",
  guide: "Guide",
  games: "Games",
  pc: "Build",
  steam: "Steam",
  value: "Price",
  desktop: "Prebuilds",
  laptop: "Laptops",
  colour: "Colour",
  sim: "Sims",
  desk: "Keys",
};

export function ScreenBar({
  mode,
  trail,
  onBack,
  onFull,
  onJump,
  onGo,
}: {
  mode: Screen;
  trail: Array<Screen | null>;
  onBack: () => void;
  onFull: () => void;
  onJump: (index: number) => void;
  onGo: (next: Screen) => void;
}) {
  const prevIndex = trail.length >= 2 ? trail.length - 2 : -1;
  const previous = prevIndex >= 0 ? trail[prevIndex] : null;
  return (
    <div className="safe-top shrink-0 border-b border-line bg-bg">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onBack} className="h-11 shrink-0 rounded-full bg-accent px-4 text-base text-accent-fg">
          Back
        </button>
        <button type="button" onClick={onFull} className="h-11 shrink-0 rounded-full border border-line px-4 text-base">
          Full
        </button>
        <button type="button" onClick={() => onJump(0)} className="h-11 shrink-0 rounded-full border border-line px-4 text-base">
          Home
        </button>
        {previous ? (
          <button type="button" onClick={() => onJump(prevIndex)} className="hidden h-11 max-w-32 shrink truncate rounded-full border border-line px-4 text-base sm:inline-flex sm:items-center">
            {NAMES[previous] ?? previous}
          </button>
        ) : null}
        <label className="ml-auto flex h-11 min-w-0 flex-1 items-center rounded-full border border-line bg-elevated px-3 sm:max-w-xs">
          <select
            aria-label="Go to"
            value={mode}
            onChange={(event) => onGo(event.target.value as Screen)}
            className="h-full w-full truncate bg-transparent text-base outline-none"
          >
            {LINKS.map((link) => (
              <option key={link.id} value={link.id}>
                {link.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

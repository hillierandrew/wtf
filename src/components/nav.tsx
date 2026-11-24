export type Screen = "pc" | "desk" | "sim" | "laptop" | "desktop" | "value" | "steam" | "games" | "guide" | "colour" | "ideas";

const LINKS: { id: Screen; label: string }[] = [
  { id: "ideas", label: "AI" },
  { id: "guide", label: "Guide" },
  { id: "games", label: "Games" },
  { id: "pc", label: "PC" },
  { id: "steam", label: "Steam" },
  { id: "value", label: "Price" },
  { id: "desktop", label: "Prebuilds" },
  { id: "laptop", label: "Laptops" },
  { id: "colour", label: "Colour" },
  { id: "sim", label: "Sims" },
  { id: "desk", label: "Keys" },
];

const NAMES: Record<string, string> = {
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
  return (
    <div className="safe-top shrink-0 border-b border-line bg-bg">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        <button type="button" onClick={onBack} className="h-11 shrink-0 rounded-full bg-accent px-4 text-base text-accent-fg">
          Back
        </button>
        <button type="button" onClick={onFull} className="h-11 shrink-0 rounded-full border border-line px-4 text-base">
          Full
        </button>
        <button type="button" onClick={() => onJump(0)} className={`h-11 shrink-0 rounded-full border px-4 text-base ${mode === null ? "border-accent bg-subtle" : "border-line"}`}>
          Home
        </button>
        {trail.map((step, index) =>
          step ? (
            <button
              key={`${step}-${index}`}
              type="button"
              onClick={() => onJump(index)}
              className={`h-11 shrink-0 rounded-full border px-4 text-base ${index === trail.length - 1 ? "border-accent bg-subtle" : "border-line"}`}
            >
              {NAMES[step] ?? step}
            </button>
          ) : null,
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto px-3 pb-2">
        {LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onGo(link.id)}
            className={`h-11 shrink-0 rounded-full border px-4 text-base ${mode === link.id ? "border-accent bg-subtle" : "border-line"}`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
}

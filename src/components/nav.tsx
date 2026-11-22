export type Screen = "pc" | "desk" | "sim" | "laptop" | "desktop" | "value";

const LINKS: { id: Screen; label: string }[] = [
  { id: "pc", label: "PC" },
  { id: "value", label: "Price" },
  { id: "desktop", label: "Prebuilds" },
  { id: "laptop", label: "Laptops" },
  { id: "sim", label: "Sims" },
  { id: "desk", label: "Keys" },
];

export function ScreenBar({
  mode,
  onBack,
  onGo,
}: {
  mode: Screen;
  onBack: () => void;
  onGo: (next: Screen) => void;
}) {
  return (
    <div className="safe-top flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-bg px-3 py-2">
      <button type="button" onClick={onBack} className="h-11 shrink-0 rounded-full bg-accent px-4 text-base text-accent-fg">
        Back
      </button>
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
  );
}

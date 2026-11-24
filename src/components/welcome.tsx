import { ThemeToggle } from "@/lib/theme";

type ColourPick = "white" | "black" | "all";

const COLOURS: { id: ColourPick; label: string; swatch: string }[] = [
  { id: "white", label: "White", swatch: "#f7f4ee" },
  { id: "black", label: "Black", swatch: "#1c1612" },
  { id: "all", label: "Both", swatch: "linear-gradient(135deg, #f7f4ee 50%, #1c1612 50%)" },
];

export function Welcome({
  onEnter,
  onDesk,
  onSim,
  onLaptop,
  onDesktop,
  onValue,
  onSteam,
  onGames,
  onGuide,
  onColour,
  onIdeas,
}: {
  onEnter: () => void;
  onDesk: () => void;
  onSim: () => void;
  onLaptop: () => void;
  onDesktop: () => void;
  onValue: () => void;
  onSteam: () => void;
  onGames: () => void;
  onGuide: () => void;
  onColour: (pick: ColourPick) => void;
  onIdeas: () => void;
}) {
  const buttons = [
    { label: "AI CREATED BUILDS", line: "Finished computers. Tap one. Use it.", onClick: onIdeas },
    { label: "BASIC BUILDER", line: "Four questions. The parts get picked for you.", onClick: onGuide },
    { label: "BUILD A PC", line: "Pick each part. The wrong ones stay out.", onClick: onEnter },
    { label: "GAMES", line: "Pick a game. See the computers that run it.", onClick: onGames },
    { label: "COLOUR", line: "White or black cases, coolers, and cards.", onClick: () => onColour("white") },
    { label: "PREBUILDS", line: "A finished PC. Scored 0 to 100.", onClick: onDesktop },
    { label: "LAPTOPS", line: "Games, a college class, or the best price.", onClick: onLaptop },
    { label: "SIMULATORS", line: "Racing, flying, controllers, and consoles.", onClick: onSim },
    { label: "STEAM MACHINE", line: "A tiny living-room PC.", onClick: onSteam },
    { label: "PRICE CHECK", line: "Cost per gigabyte, or per point of speed.", onClick: onValue },
    { label: "KEYBOARDS", line: "Keyboard, mouse, camera, microphone, and headset.", onClick: onDesk },
  ];
  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-bg text-fg">
      <header className="safe-top mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-tight">drew.wtf</p>
        <ThemeToggle />
      </header>
      <section className="mx-auto w-full max-w-6xl px-4 pb-2">
        <p className="text-sm text-muted">Colour. Tap one.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {COLOURS.map((item) => (
            <button key={item.id} type="button" onClick={() => onColour(item.id)} className="press flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-elevated px-2 text-center sm:min-h-24 sm:flex-row sm:gap-3 sm:px-4">
              <span className="size-12 shrink-0 rounded-full border border-line sm:size-14" style={{ background: item.swatch }} />
              <span className="text-lg font-medium sm:text-2xl">{item.label}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2 px-4 pb-8 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {buttons.map((item) => (
          <button key={item.label} type="button" onClick={item.onClick} className="press flex min-h-20 w-full flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-4 py-4 text-left sm:min-h-28 sm:px-5 sm:py-5">
            <span className="font-display text-2xl font-medium leading-none tracking-tight sm:text-3xl lg:text-4xl">{item.label}</span>
            <span className="mt-2 text-sm leading-snug text-muted sm:mt-3 sm:text-base">{item.line}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

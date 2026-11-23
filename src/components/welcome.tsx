import { ThemeToggle } from "@/lib/theme";

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
}) {
  const buttons = [
    { label: "GAMES", line: "Pick a game or a program. See the computers and laptops that run it.", onClick: onGames },
    { label: "BASIC BUILDER", line: "A few easy questions. The right parts get picked for you.", onClick: onGuide },
    { label: "BUILD A PC", line: "Pick each part. The wrong ones stay out.", onClick: onEnter },
    { label: "STEAM MACHINE", line: "A tiny living-room PC. Small parts I put together, or a mini PC that is already built.", onClick: onSteam },
    { label: "PRICE CHECK", line: "Cost per gigabyte, or per point of speed. Tap to add it.", onClick: onValue },
    { label: "PREBUILDS", line: "A finished PC. Scored 0 to 100.", onClick: onDesktop },
    { label: "LAPTOPS", line: "Games, a college class, or the best price.", onClick: onLaptop },
    { label: "SIMULATORS", line: "Racing, flying, or farming.", onClick: onSim },
    { label: "KEYBOARDS", line: "Keyboard, mouse, camera, microphone, and headset.", onClick: onDesk },
  ];
  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-bg text-fg">
      <header className="safe-top flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-tight">drew.wtf</p>
        <ThemeToggle />
      </header>
      <section className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-10">
        {buttons.map((item) => (
          <button key={item.label} type="button" onClick={item.onClick} className="press flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-line bg-elevated px-6 py-8 text-center">
            <span className="font-display text-4xl font-medium leading-none tracking-tight sm:text-5xl">{item.label}</span>
            <span className="mt-4 max-w-sm text-lg leading-snug text-muted">{item.line}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

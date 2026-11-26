import { ThemeToggle } from "@/lib/theme";
import { JOBS, type UseKind } from "@/lib/phone-use";

type ColourPick = "white" | "black" | "all";

export function Welcome({
  onEnter,
  onDesk,
  onLaptop,
  onDesktop,
  onGames,
  onGuide,
  onColour,
  onIdeas,
  onJob,
  onPower,
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
  onJob: (kind: UseKind) => void;
  onPower: () => void;
}) {
  const more = [
    { label: "Build each part", line: "The long way. One part at a time.", onClick: onEnter },
    { label: "Basic questions", line: "A few taps. I pick the parts.", onClick: onGuide },
    { label: "Finished PCs", line: "Already built. Sorted by the deal.", onClick: onDesktop },
    { label: "Laptops", line: "The same jobs, in a laptop.", onClick: onLaptop },
    { label: "Games list", line: "Pick a game and see what runs it.", onClick: onGames },
    { label: "AI builds", line: "Ready-made computers.", onClick: onIdeas },
    { label: "Keyboards", line: "Keyboard, mouse, and a headset.", onClick: onDesk },
    { label: "White or black", line: "Only the colour.", onClick: () => onColour("all") },
  ];
  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-bg text-fg">
      <header className="safe-top mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-tight">drew.wtf</p>
        <ThemeToggle />
      </header>
      <section className="mx-auto w-full max-w-3xl px-4 pb-6">
        <h1 className="font-display text-4xl font-medium leading-none tracking-tight">What is it for?</h1>
        <p className="mt-2 text-base text-muted">Tap one box. Seniors, high school, Zoom, and local AI stop there.</p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {JOBS.map((job) => (
            <button key={job.id} type="button" onClick={() => onJob(job.id)} className="press flex min-h-20 w-full flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-4 py-4 text-left">
              <span className="font-display text-2xl font-medium leading-none">{job.label}</span>
              <span className="mt-2 text-sm leading-snug text-muted">{job.line}</span>
            </button>
          ))}
          <button type="button" onClick={onPower} className="press flex min-h-20 w-full flex-col items-start justify-center rounded-3xl border border-line bg-elevated px-4 py-4 text-left sm:col-span-2">
            <span className="font-display text-2xl font-medium leading-none">Graphics card power</span>
            <span className="mt-2 text-sm leading-snug text-muted">The minimum supply, and the comfortable one.</span>
          </button>
        </div>
      </section>
      <section className="mx-auto w-full max-w-3xl px-4 pb-10">
        <p className="text-sm text-muted">More, if you want it</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {more.map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="press flex min-h-16 w-full flex-col items-start justify-center rounded-2xl border border-line bg-elevated px-4 py-3 text-left">
              <span className="text-lg font-medium">{item.label}</span>
              <span className="text-sm text-muted">{item.line}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
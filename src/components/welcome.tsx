import { ThemeToggle } from "@/lib/theme";

export function Welcome({ onEnter, onDesk, onSim, onLaptop }: { onEnter: () => void; onDesk: () => void; onSim: () => void; onLaptop: () => void }) {
  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-bg text-fg">
      <header className="safe-top flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-tight">drew.wtf</p>
        <ThemeToggle />
      </header>
      <button type="button" onClick={onEnter} className="press flex min-h-[78dvh] w-full flex-col items-center justify-center px-8 text-center">
        <span className="mb-6 h-px w-16 bg-accent" />
        <span className="font-display max-w-xs text-5xl font-medium leading-[0.95] tracking-tight text-fg sm:max-w-lg sm:text-7xl">CLICK TO BUILD A PC</span>
        <span className="mt-6 max-w-sm text-lg leading-snug text-muted">One question first. We keep the wrong parts out.</span>
      </button>
      <section className="border-t border-line px-4 py-8">
        <button type="button" onClick={onDesk} className="press mx-auto flex min-h-40 w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-line bg-elevated px-6 py-8 text-center">
          <span className="font-display text-4xl font-medium leading-none tracking-tight sm:text-6xl">BUILD A KEYBOARD</span>
          <span className="mt-4 max-w-sm text-lg leading-snug text-muted">Keyboard, mouse, pad, camera, microphone, and headset.</span>
        </button>
        <button type="button" onClick={onSim} className="press mx-auto mt-4 flex min-h-40 w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-line bg-elevated px-6 py-8 text-center">
          <span className="font-display text-4xl font-medium leading-none tracking-tight sm:text-6xl">BUILD A GAMING SIM</span>
          <span className="mt-4 max-w-sm text-lg leading-snug text-muted">Racing, flying, or farming. One of each part.</span>
        </button>
        <button type="button" onClick={onLaptop} className="press mx-auto mt-4 flex min-h-40 w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-line bg-elevated px-6 py-8 text-center">
          <span className="font-display text-4xl font-medium leading-none tracking-tight sm:text-6xl">PICK A LAPTOP</span>
          <span className="mt-4 max-w-sm text-lg leading-snug text-muted">Games, work, school, or the best price.</span>
        </button>
      </section>
    </div>
  );
}

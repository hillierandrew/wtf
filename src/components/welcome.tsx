import { ThemeToggle } from "@/lib/theme";

export function Welcome({ onEnter, onDesk }: { onEnter: () => void; onDesk: () => void }) {
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
          <span className="mt-4 max-w-sm text-lg leading-snug text-muted">Keyboards, mice, and mouse pads. They work with any PC.</span>
        </button>
      </section>
    </div>
  );
}

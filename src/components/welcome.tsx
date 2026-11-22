import { ThemeToggle } from "@/lib/theme";

export function Welcome({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-tight">drew.wtf</p>
        <ThemeToggle />
      </header>
      <button
        type="button"
        onClick={onEnter}
        className="press flex flex-1 flex-col items-center justify-center px-8 text-center"
      >
        <span className="mb-6 h-px w-16 bg-accent" />
        <span className="font-display max-w-xs text-5xl font-medium leading-[0.95] tracking-tight text-fg sm:max-w-lg sm:text-7xl">
          CLICK TO BUILD A PC
        </span>
        <span className="mt-6 max-w-sm text-lg leading-snug text-muted">One question first. We keep the wrong parts out.</span>
      </button>
    </div>
  );
}

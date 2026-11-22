export function Welcome({ onEnter }: { onEnter: () => void }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="press flex h-dvh w-full items-center justify-center bg-bg px-8 text-center"
    >
      <span className="font-display max-w-xs text-5xl font-medium leading-none tracking-tight text-fg sm:max-w-lg sm:text-7xl">
        CLICK TO BUILD A PC
      </span>
    </button>
  );
}

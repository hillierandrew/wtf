import { createContext, useContext, useState, type ReactNode } from "react";

export type Crumb = { id: string; label: string };

type Api = {
  log: Crumb[];
  at: number;
  note: (id: string, label: string) => void;
  back: () => void;
  forward: () => void;
  jump: (index: number) => void;
};

const Ctx = createContext<Api | null>(null);

export function HistoryRoot({ home, children }: { home: string; children: ReactNode }) {
  const [nav, setNav] = useState<{ log: Crumb[]; at: number }>({ log: [{ id: "home", label: home }], at: 0 });
  const api: Api = {
    log: nav.log,
    at: nav.at,
    note(id, label) {
      setNav((current) => {
        const base = current.log.slice(0, current.at + 1);
        const last = base[base.length - 1];
        if (last?.id === id) {
          if (last.label === label) return current;
          const log = base.slice();
          log[log.length - 1] = { id, label };
          return { log, at: log.length - 1 };
        }
        const cut = id.indexOf(":");
        const prefix = cut > 0 ? id.slice(0, cut) : "";
        if (prefix && last?.id.startsWith(`${prefix}:`)) {
          const log = base.slice();
          log[log.length - 1] = { id, label };
          return { log, at: log.length - 1 };
        }
        return { log: [...base, { id, label }], at: base.length };
      });
    },
    back() {
      setNav((current) => (current.at === 0 ? current : { ...current, at: current.at - 1 }));
    },
    forward() {
      setNav((current) => (current.at >= current.log.length - 1 ? current : { ...current, at: current.at + 1 }));
    },
    jump(index) {
      setNav((current) => {
        const at = Math.max(0, Math.min(current.log.length - 1, index));
        return at === current.at ? current : { ...current, at };
      });
    },
  };
  const show = nav.log.length > 1;
  return (
    <Ctx.Provider value={api}>
      <div className="flex h-dvh max-h-dvh flex-col">
        {show ? (
          <div className="z-40 flex shrink-0 items-center gap-2 bg-[#111] px-2 pt-[max(0.35rem,env(safe-area-inset-top))] pb-2 text-white">
            <button type="button" onClick={api.back} disabled={nav.at === 0} className="h-10 shrink-0 rounded-full bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-30">
              Back
            </button>
            <button type="button" onClick={api.forward} disabled={nav.at >= nav.log.length - 1} className="h-10 shrink-0 rounded-full bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-30">
              Forward
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {nav.log.map((crumb, index) => (
                <span key={`${crumb.id}-${index}`} className="flex shrink-0 items-center gap-1">
                  {index > 0 ? <span className="text-sm text-white/45">{">"}</span> : null}
                  <button
                    type="button"
                    onClick={() => api.jump(index)}
                    className={`h-10 max-w-[11rem] truncate rounded-full px-2 text-sm ${index === nav.at ? "bg-[#d6ff4a] font-semibold text-[#111]" : index > nav.at ? "text-white/35" : "text-white"}`}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="history-slot min-h-0 flex-1">{children}</div>
      </div>
    </Ctx.Provider>
  );
}

export function usePath() {
  return useContext(Ctx);
}

export function latest(log: Crumb[], at: number, test: (id: string) => boolean) {
  for (let index = at; index >= 0; index -= 1) {
    if (test(log[index].id)) return log[index].id;
  }
  return null;
}

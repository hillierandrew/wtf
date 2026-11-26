import { useDoorLock } from "@/components/lock";
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

export function HistoryRoot({ home, onLock, children }: { home: string; onLock?: () => void; children: ReactNode }) {
  const door = useDoorLock();
  const lock = onLock ?? door;
  const [nav, setNav] = useState<{ log: Crumb[]; at: number }>({
    log: [
      { id: "lock", label: "Lock" },
      { id: "home", label: home },
    ],
    at: 1,
  });

  function move(at: number) {
    if (at <= 0) {
      lock();
      return;
    }
    setNav((current) => {
      const next = Math.max(1, Math.min(current.log.length - 1, at));
      return next === current.at ? current : { ...current, at: next };
    });
  }

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
      move(nav.at - 1);
    },
    forward() {
      move(nav.at + 1);
    },
    jump(index) {
      move(index);
    },
  };
  const homeAt = Math.max(1, nav.log.findIndex((crumb) => crumb.id === "home"));
  return (
    <Ctx.Provider value={api}>
      <div className="flex h-dvh max-h-dvh flex-col bg-[#f2f2f7] text-[#111]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
        <div className="z-50 flex shrink-0 items-center gap-1.5 border-b border-black/10 bg-white px-2 pt-[max(0.4rem,env(safe-area-inset-top))] pb-2">
          <button type="button" onClick={api.back} className="h-10 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-[15px] font-medium">
            Back
          </button>
          <button type="button" onClick={() => move(homeAt)} disabled={nav.at === homeAt} className="h-10 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-[15px] font-medium disabled:opacity-30">
            Home
          </button>
          <button type="button" onClick={api.forward} disabled={nav.at >= nav.log.length - 1} className="h-10 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-[15px] font-medium disabled:opacity-30">
            Forward
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {nav.log.map((crumb, index) => (
              <span key={`${crumb.id}-${index}`} className="flex shrink-0 items-center gap-1">
                {index > 0 ? <span className="text-[15px] text-[#8e8e93]">{">"}</span> : null}
                <button
                  type="button"
                  onClick={() => api.jump(index)}
                  className={`h-10 max-w-[12rem] truncate rounded-full px-2 text-[15px] ${index === nav.at ? "font-semibold text-[#007aff]" : index > nav.at ? "text-[#c7c7cc]" : "text-[#111]"}`}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>
        </div>
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

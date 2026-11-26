import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from "react";

const CODE = "1234";
const PHONE = "5678";
const STORE = "7777";
const SHOW = "6767";
const MIND = "6666";
const Storefront = lazy(() => import("@/components/storefront").then((mod) => ({ default: mod.Storefront })));
const Phone = lazy(() => import("@/components/phone").then((mod) => ({ default: mod.Phone })));
const GlassStore = lazy(() => import("@/components/glass-store").then((mod) => ({ default: mod.GlassStore })));
const Spread = lazy(() => import("@/components/spread").then((mod) => ({ default: mod.Spread })));
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"] as const;

export const DoorLock = createContext<() => void>(() => {});
export function useDoorLock() {
  return useContext(DoorLock);
}

function tone(kind: "tap" | "no" | "yes") {
  try {
    const ctx = new AudioContext();
    const note = ctx.createOscillator();
    const gain = ctx.createGain();
    note.type = "square";
    note.frequency.value = kind === "no" ? 180 : kind === "yes" ? 880 : 660;
    gain.gain.value = 0.03;
    note.connect(gain);
    gain.connect(ctx.destination);
    note.start();
    note.stop(ctx.currentTime + (kind === "yes" ? 0.12 : 0.05));
    note.onended = () => void ctx.close();
  } catch {
    /* a quiet keypad is fine */
  }
}

export function Gate({ children }: { children: React.ReactNode }) {
  const [door, setDoor] = useState<"wait" | "closed" | "site" | "phone" | "store" | "glass" | "spread">("closed");
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("drew-gate");
      setDoor(saved === "spread" ? "spread" : saved === "glass" ? "glass" : saved === "store" ? "store" : saved === "phone" ? "phone" : saved === "1" ? "site" : "closed");
    } catch {
      setDoor("closed");
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => setShow(false), 2300);
    return () => window.clearTimeout(timer);
  }, [show]);

  function enter(next: "site" | "phone" | "store" | "glass" | "spread", intro = false) {
    try {
      sessionStorage.setItem("drew-gate", next === "spread" ? "spread" : next === "glass" ? "glass" : next === "store" ? "store" : next === "phone" ? "phone" : "1");
    } catch {
      /* the door still opens for this visit */
    }
    setShow(intro);
    setDoor(next);
  }

  function lock() {
    try {
      sessionStorage.removeItem("drew-gate");
    } catch {
      /* still returns to the keypad */
    }
    setShow(false);
    setDoor("closed");
  }

  if (door === "wait") return <div className="min-h-dvh bg-[#141210]" />;
  if (door === "spread") {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-[#07110c]" />}>
        <Spread onLock={lock} />
      </Suspense>
    );
  }

  if (door === "glass") {
    return (
      <>
        <Suspense fallback={<div className="min-h-dvh bg-black" />}>
          <GlassStore onLock={lock} />
        </Suspense>
        {show ? <Pop /> : null}
      </>
    );
  }

  if (door === "store") {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-[#fafafa]" />}>
        <Storefront onLock={lock} />
      </Suspense>
    );
  }

  if (door === "phone") {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-[#f2f2f7]" />}>
        <Phone onLock={lock} />
      </Suspense>
    );
  }
  if (door === "closed") return <Lock onOpen={enter} />;
  return <DoorLock.Provider value={lock}>{children}</DoorLock.Provider>;
}

function fromKey(event: KeyboardEvent): string | null {
  if (event.repeat) return null;
  if (/^Numpad[0-9]$/.test(event.code)) return event.code.slice(6);
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  if (event.key >= "0" && event.key <= "9") return event.key;
  if (event.code === "NumpadEnter" || event.key === "Enter" || event.key === "#") return "#";
  if (event.key === "Backspace" || event.key === "Escape" || event.code === "NumpadDecimal") return "C";
  return null;
}

const POPS = [
  { t: "Desktops", x: "-28vw", y: "-16vh" },
  { t: "Laptops", x: "24vw", y: "-12vh" },
  { t: "Graphics", x: "-20vw", y: "16vh" },
  { t: "Screens", x: "22vw", y: "18vh" },
  { t: "LIQUID", x: "0px", y: "0px" },
];

function Pop() {
  return (
    <div className="fixed inset-0 z-50 bg-black" style={{ perspective: "900px" }}>
      {POPS.map((item, index) => (
        <div
          key={item.t}
          className="glass-rise absolute left-1/2 top-1/2 flex h-28 w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-[#c084fc] bg-[#140818]/80 text-lg font-medium text-white shadow-[0_0_30px_rgba(168,85,247,0.45)] backdrop-blur-xl"
          style={{ ["--x" as string]: item.x, ["--y" as string]: item.y, animationDelay: `${index * 0.08}s` }}
        >
          {item.t}
        </div>
      ))}
    </div>
  );
}

function playUwu() {
  const audio = new Audio(`${import.meta.env.BASE_URL}uwu.mp3`);
  audio.volume = 0.9;
  void audio.play().catch(() => {});
}

function Lock({ onOpen }: { onOpen: (next: "site" | "phone" | "store" | "glass" | "spread", intro?: boolean) => void }) {
  const [digits, setDigits] = useState("");
  const [state, setState] = useState<"armed" | "denied" | "open">("armed");
  const digitsRef = useRef("");
  const busy = useRef(false);

  function decide(value: string) {
    if (busy.current) return;
    busy.current = true;
    if (value === SHOW) {
      setState("open");
      onOpen("glass", true);
      return;
    }
    if (value === MIND) {
      setState("open");
      tone("yes");
      window.setTimeout(() => onOpen("spread"), 280);
      return;
    }
    if (value === CODE || value === PHONE || value === STORE) {
      setState("open");
      tone("yes");
      window.setTimeout(() => onOpen(value === STORE ? "store" : value === PHONE ? "phone" : "site"), 480);
      return;
    }
    setState("denied");
    tone("no");
    window.setTimeout(() => {
      digitsRef.current = "";
      setDigits("");
      setState("armed");
      busy.current = false;
    }, 650);
  }

  function press(key: string) {
    if (busy.current) return;
    if (key === "C") {
      digitsRef.current = "";
      setDigits("");
      tone("tap");
      return;
    }
    if (key === "OK" || key === "#") {
      tone("tap");
      decide(digitsRef.current);
      return;
    }
    const next = (digitsRef.current + key).slice(0, 4);
    digitsRef.current = next;
    setDigits(next);
    if (SHOW.startsWith(next)) playUwu();
    else tone("tap");
    if (next === SHOW) decide(SHOW);
    else if (next.length === 4) window.setTimeout(() => decide(next), 140);
  }

  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const key = fromKey(event);
      if (!key) return;
      event.preventDefault();
      press(key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const lamp = state === "open" ? "bg-[#c084fc]" : state === "denied" ? "bg-[#fb7185]" : "bg-[#a855f7]";
  const label = state === "open" ? "OPEN" : state === "denied" ? "WRONG CODE" : "ARMED";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#1a0530] px-4 py-8 text-white">
      <div className={`w-full max-w-sm rounded-[2rem] border-2 border-[#ff7a1a] bg-[#14061f] p-5 shadow-[0_0_36px_rgba(255,122,26,0.45)] ${state === "denied" ? "lock-shake" : ""}`}>
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium tracking-[0.28em] text-[#ffb070]">DOOR</p>
          <p className="flex items-center gap-2 text-xs tracking-[0.22em] text-[#e9d5ff]">
            <span className={`size-2.5 rounded-full ${lamp} ${state === "armed" ? "lock-pulse" : ""}`} />
            {label}
          </p>
        </div>
        <div className="mt-5 flex justify-center gap-3" aria-label="Code">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`size-3 rounded-full ${index < digits.length ? "bg-[#ff7a1a] shadow-[0_0_12px_#ff7a1a]" : "bg-[#2a1040]"}`} />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "C" ? "Clear" : key === "OK" ? "OK" : key}
              className="press flex h-16 items-center justify-center rounded-full border border-[#c084fc] bg-[#ff7a1a] text-2xl font-medium text-[#2a0a12] shadow-[0_0_16px_rgba(255,122,26,0.45)] active:translate-y-0.5"
            >
              {key}
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-[#e9d5ff]">Enter the code. It opens on its own, or press OK.</p>
        <input
          ref={field}
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          aria-label="Type the code"
          value=""
          onChange={() => field.current?.focus()}
          className="sr-only"
        />
      </div>
    </div>
  );
}

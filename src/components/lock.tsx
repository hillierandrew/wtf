import { lazy, Suspense, useEffect, useRef, useState } from "react";

const CODE = "1234";
const PHONE = "5678";
const Phone = lazy(() => import("@/components/phone").then((mod) => ({ default: mod.Phone })));
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"] as const;

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
  const [door, setDoor] = useState<"wait" | "closed" | "site" | "phone">("wait");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("drew-gate");
      setDoor(saved === "phone" ? "phone" : saved === "1" ? "site" : "closed");
    } catch {
      setDoor("closed");
    }
  }, []);

  function enter(next: "site" | "phone") {
    try {
      sessionStorage.setItem("drew-gate", next === "phone" ? "phone" : "1");
    } catch {
      /* the door still opens for this visit */
    }
    setDoor(next);
  }

  if (door === "wait") return <div className="min-h-dvh bg-[#141210]" />;
  if (door === "phone") {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-[#f2f2f7]" />}>
        <Phone
          onLock={() => {
            try {
              sessionStorage.removeItem("drew-gate");
            } catch {
              /* still returns to the keypad */
            }
            setDoor("closed");
          }}
        />
      </Suspense>
    );
  }
  if (door === "closed") return <Lock onOpen={enter} />;
  return children;
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

function Lock({ onOpen }: { onOpen: (next: "site" | "phone") => void }) {
  const [digits, setDigits] = useState("");
  const [state, setState] = useState<"armed" | "denied" | "open">("armed");
  const digitsRef = useRef("");
  const busy = useRef(false);

  function decide(value: string) {
    if (busy.current) return;
    busy.current = true;
    if (value === CODE || value === PHONE) {
      setState("open");
      tone("yes");
      window.setTimeout(() => onOpen(value === PHONE ? "phone" : "site"), 480);
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
    tone("tap");
    if (next.length === 4) window.setTimeout(() => decide(next), 140);
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

  const lamp = state === "open" ? "bg-ok" : state === "denied" ? "bg-danger" : "bg-accent";
  const label = state === "open" ? "OPEN" : state === "denied" ? "WRONG CODE" : "ARMED";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#100e0c] px-4 py-8 text-[#f6f1e7]">
      <div className={`w-full max-w-sm rounded-[2rem] border border-[#5c6168] bg-[radial-gradient(circle_at_30%_0%,#4c5158,#2a2d32_42%,#141618)] p-5 shadow-[0_28px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.16)] ${state === "denied" ? "lock-shake" : ""}`}>
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium tracking-[0.28em] text-[#d7dbe0]">DOOR</p>
          <p className="flex items-center gap-2 text-xs tracking-[0.22em] text-[#aeb6bf]">
            <span className={`size-2.5 rounded-full ${lamp} ${state === "armed" ? "lock-pulse" : ""}`} />
            {label}
          </p>
        </div>
        <div className="mt-5 flex justify-center gap-3" aria-label="Code">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`size-3 rounded-full ${index < digits.length ? "bg-[#7dffb2] shadow-[0_0_10px_#7dffb2]" : "bg-[#0c0d0f] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"}`} />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "C" ? "Clear" : key === "OK" ? "OK" : key}
              className={`press flex h-16 items-center justify-center rounded-full text-2xl font-medium text-[#f6f7f8] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_5px_0_#0c0d10] active:translate-y-0.5 active:shadow-none ${key === "OK" ? "bg-[#1f8f4d]" : "bg-[#3c4148]"}`}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-[#9aa3ab]">Enter the code. It opens on its own, or press OK.</p>
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

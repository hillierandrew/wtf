import { useState } from "react";
import { CAT_LABEL, CATS, guidePick, money, shortName, spendOf, warnings, type GuideAnswers } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

const STEPS: { key: keyof GuideAnswers; ask: string; help: string; options: { id: GuideAnswers[keyof GuideAnswers]; label: string; line: string }[] }[] = [
  {
    key: "job",
    ask: "What is this computer for?",
    help: "Tap one box. That is the whole question.",
    options: [
      { id: "games", label: "Games", line: "Playing games is the main thing." },
      { id: "work", label: "School and work", line: "Class, email, and programs." },
      { id: "both", label: "Both", line: "Not sure? Tap this." },
    ],
  },
  {
    key: "power",
    ask: "How strong should it be?",
    help: "Cheap costs less. Strong costs more.",
    options: [
      { id: "easy", label: "Cheap", line: "Class, older games, and a browser." },
      { id: "normal", label: "Normal", line: "Not sure? Tap this." },
      { id: "strong", label: "Strong", line: "New games turned up." },
    ],
  },
  {
    key: "size",
    ask: "How big is the box?",
    help: "A normal box is easier to build.",
    options: [
      { id: "normal", label: "Normal", line: "A regular tower. Pick this if you are not sure." },
      { id: "small", label: "Small", line: "A shorter case for a desk." },
    ],
  },
  {
    key: "screen",
    ask: "Do you need a monitor?",
    help: "A monitor is the screen. A TV counts. Not sure? Say you already have one.",
    options: [
      { id: "no", label: "I already have a screen", line: "Nothing extra gets added." },
      { id: "yes", label: "Add a monitor", line: "A screen goes on the list." },
    ],
  },
];

export function Guide({ onLeave, onUse }: { onLeave: () => void; onUse: (name: string, build: ReturnType<typeof guidePick>["build"]) => void }) {
  const pane = usePane();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<GuideAnswers>>({});
  const current = STEPS[step];
  const done = step >= STEPS.length;
  const pick = done ? guidePick({ ...(answers as GuideAnswers), cpu: "any", gpu: answers.job === "work" && answers.power === "easy" ? "none" : "any" }) : null;
  const notes = pick ? warnings(pick.build) : [];

  function choose(id: string) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.key]: id }));
    setStep((value) => value + 1);
  }

  return (
    <div className={`mx-auto flex h-full w-full flex-col overflow-hidden bg-bg text-fg ${pane ? "max-w-3xl" : "max-w-xl"}`}>
      <header className="safe-top shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onLeave} className="text-base text-muted">
            Welcome
          </button>
          <ThemeToggle />
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium leading-none tracking-tight">Basic builder</h1>
        <p className="mt-2 text-base text-muted">{done ? "These parts fit together." : `Question ${step + 1} of ${STEPS.length}`}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {current && !done ? (
          <div>
            <h2 className="font-display text-3xl font-medium leading-tight">{current.ask}</h2>
            <p className="mt-2 text-base text-muted">{current.help}</p>
            <div className={`mt-4 grid gap-3 ${pane ? "grid-cols-2" : "grid-cols-1"}`}>
              {current.options.map((option) => (
                <button key={option.id} type="button" onClick={() => choose(option.id)} className="press min-h-24 rounded-3xl border border-line bg-elevated px-5 py-5 text-left">
                  <span className="block text-3xl font-medium">{option.label}</span>
                  <span className="mt-1 block text-base text-muted">{option.line}</span>
                </button>
              ))}
            </div>
            {step > 0 ? (
              <button type="button" onClick={() => setStep((value) => value - 1)} className="mt-4 h-12 rounded-full border border-line px-5 text-base">
                Back
              </button>
            ) : null}
          </div>
        ) : null}
        {pick ? (
          <div>
            <p className="text-lg text-muted">{pick.why}</p>
            <ul className="mt-4 space-y-2">
              {CATS.map((cat) => {
                const part = pick.build[cat];
                if (!part) return null;
                return (
                  <li key={cat} className="rounded-2xl border border-line bg-elevated px-4 py-3">
                    <p className="text-sm text-muted">{CAT_LABEL[cat]}</p>
                    <p className="text-lg font-medium leading-snug">{shortName(part)}</p>
                    <p className="text-base">{money(part.price)}</p>
                  </li>
                );
              })}
            </ul>
            {notes.map((note) => (
              <p key={note} className="mt-3 text-base text-danger">
                {note}
              </p>
            ))}
            <p className="mt-4 text-3xl font-medium">Total {money(spendOf(pick.build))}</p>
            <button type="button" onClick={() => onUse(pick.name, pick.build)} className="mt-4 h-16 w-full rounded-2xl bg-accent text-xl text-accent-fg">
              Use this PC
            </button>
            <button type="button" onClick={() => { setAnswers({}); setStep(0); }} className="mt-3 h-12 w-full rounded-2xl border border-line text-base">
              Start over
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { useState } from "react";
import { CAT_LABEL, CATS, guidePick, money, shortName, spendOf, warnings, type GuideAnswers } from "@/lib/catalog";
import { ThemeToggle, usePane } from "@/lib/theme";

const STEPS: { key: keyof GuideAnswers; ask: string; help: string; options: { id: GuideAnswers[keyof GuideAnswers]; label: string; line: string }[] }[] = [
  {
    key: "job",
    ask: "What is this computer for?",
    help: "Tap one. You can go back.",
    options: [
      { id: "games", label: "Games", line: "Playing games is the main thing." },
      { id: "work", label: "School and work", line: "Class, email, and programs." },
      { id: "both", label: "Both", line: "Games and school." },
    ],
  },
  {
    key: "power",
    ask: "How strong should it be?",
    help: "Easy is cheaper. Strong costs more.",
    options: [
      { id: "easy", label: "Easy", line: "Class, older games, and a browser." },
      { id: "normal", label: "Normal", line: "Most new games at normal settings." },
      { id: "strong", label: "Strong", line: "New games turned up, or a hard program." },
    ],
  },
  {
    key: "cpu",
    ask: "AMD or Intel?",
    help: "This is the processor. Either one can make a good PC.",
    options: [
      { id: "amd", label: "AMD", line: "Usually the better price." },
      { id: "intel", label: "Intel", line: "The other big name." },
      { id: "any", label: "You pick", line: "I will choose AMD." },
    ],
  },
  {
    key: "gpu",
    ask: "Which graphics card?",
    help: "This draws the games. Skip it if you do not play games.",
    options: [
      { id: "nvidia", label: "NVIDIA", line: "The green ones. Good for games and editing." },
      { id: "amd", label: "AMD", line: "The red ones. Good for games." },
      { id: "none", label: "No card", line: "The processor draws the picture." },
      { id: "any", label: "You pick", line: "I will choose NVIDIA, unless this is an easy work PC." },
    ],
  },
  {
    key: "size",
    ask: "How big is the box?",
    help: "A normal box is easier. A small box fits on a desk.",
    options: [
      { id: "normal", label: "Normal", line: "A regular tower." },
      { id: "small", label: "Small", line: "A shorter case." },
    ],
  },
  {
    key: "screen",
    ask: "Do you need a screen?",
    help: "Skip this if you already have one.",
    options: [
      { id: "no", label: "I have a screen", line: "Do not add one." },
      { id: "yes", label: "I need a screen", line: "Add one monitor." },
    ],
  },
];

export function Guide({ onLeave, onUse }: { onLeave: () => void; onUse: (name: string, build: ReturnType<typeof guidePick>["build"]) => void }) {
  const pane = usePane();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<GuideAnswers>>({});
  const current = STEPS[step];
  const done = step >= STEPS.length;
  const pick = done ? guidePick(answers as GuideAnswers) : null;
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
                <button key={option.id} type="button" onClick={() => choose(option.id)} className="press min-h-20 rounded-2xl border border-line bg-elevated px-4 py-4 text-left">
                  <span className="block text-2xl font-medium">{option.label}</span>
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
            <p className="mt-4 text-2xl font-medium">Total {money(spendOf(pick.build))}</p>
            <button type="button" onClick={() => onUse(pick.name, pick.build)} className="mt-4 h-14 w-full rounded-2xl bg-accent text-lg text-accent-fg">
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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [mode, setMode] = useState<"pc" | "desk" | "sim" | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mode || !hydrated) return <Welcome onEnter={() => setMode("pc")} onDesk={() => setMode("desk")} onSim={() => setMode("sim")} />;
  if (mode === "desk") return <Desk onLeave={() => setMode(null)} />;
  if (mode === "sim") return <Sim onLeave={() => setMode(null)} />;
  return <Builder onLeave={() => setMode(null)} />;
}

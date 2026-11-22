import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desk } from "@/components/desk";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [mode, setMode] = useState<"pc" | "desk" | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mode || !hydrated) return <Welcome onEnter={() => setMode("pc")} onDesk={() => setMode("desk")} />;
  if (mode === "desk") return <Desk onLeave={() => setMode(null)} />;
  return <Builder onLeave={() => setMode(null)} />;
}

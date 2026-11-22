import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [mode, setMode] = useState<"pc" | "desk" | "sim" | "laptop" | "desktop" | "value" | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  let screen = <Welcome onEnter={() => setMode("pc")} onDesk={() => setMode("desk")} onSim={() => setMode("sim")} onLaptop={() => setMode("laptop")} onDesktop={() => setMode("desktop")} onValue={() => setMode("value")} />;
  if (mode && hydrated) {
    if (mode === "value") screen = <Value onLeave={() => setMode(null)} onBuild={() => setMode("pc")} />;
    else if (mode === "desk") screen = <Desk onLeave={() => setMode(null)} />;
    else if (mode === "sim") screen = <Sim onLeave={() => setMode(null)} />;
    else if (mode === "laptop") screen = <Laptops onLeave={() => setMode(null)} />;
    else if (mode === "desktop") screen = <Desktops onLeave={() => setMode(null)} />;
    else screen = <Builder onLeave={() => setMode(null)} />;
  }
  return <Gate>{screen}</Gate>;
}

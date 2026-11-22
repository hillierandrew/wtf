import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";
import "./styles.css";

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [mode, setMode] = useState<"pc" | "desk" | "sim" | "laptop" | "desktop" | "value" | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mode || !hydrated) return <Welcome onEnter={() => setMode("pc")} onDesk={() => setMode("desk")} onSim={() => setMode("sim")} onLaptop={() => setMode("laptop")} onDesktop={() => setMode("desktop")} onValue={() => setMode("value")} />;
  if (mode === "value") return <Value onLeave={() => setMode(null)} onBuild={() => setMode("pc")} />;
  if (mode === "desk") return <Desk onLeave={() => setMode(null)} />;
  if (mode === "sim") return <Sim onLeave={() => setMode(null)} />;
  if (mode === "laptop") return <Laptops onLeave={() => setMode(null)} />;
  if (mode === "desktop") return <Desktops onLeave={() => setMode(null)} />;
  return <Builder onLeave={() => setMode(null)} />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Gate>
        <Home />
      </Gate>
    </StrictMode>,
  );
}

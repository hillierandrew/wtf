import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";
import "./styles.css";

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [mode, setMode] = useState<"pc" | "desk" | "sim" | "laptop" | "desktop" | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mode || !hydrated) return <Welcome onEnter={() => setMode("pc")} onDesk={() => setMode("desk")} onSim={() => setMode("sim")} onLaptop={() => setMode("laptop")} onDesktop={() => setMode("desktop")} />;
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
      <Home />
    </StrictMode>,
  );
}

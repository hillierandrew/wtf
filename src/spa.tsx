import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@/components/builder";
import { Desk } from "@/components/desk";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";
import "./styles.css";

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

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}

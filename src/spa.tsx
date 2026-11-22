import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@/components/builder";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";
import "./styles.css";

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!open || !hydrated) return <Welcome onEnter={() => setOpen(true)} />;
  return <Builder onLeave={() => setOpen(false)} />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}

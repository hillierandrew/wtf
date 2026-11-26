import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Gate } from "@/components/lock";
import { HistoryRoot } from "@/components/history";
import { Floor } from "@/components/floor";
import { useBench } from "@/lib/store";
import "./styles.css";

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Gate>
      <HistoryRoot home="1234">
        <Floor hydrated={hydrated} />
      </HistoryRoot>
    </Gate>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}

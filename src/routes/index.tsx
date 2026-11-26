import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Gate } from "@/components/lock";
import { HistoryRoot } from "@/components/history";
import { Floor } from "@/components/floor";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

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

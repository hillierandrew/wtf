import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

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

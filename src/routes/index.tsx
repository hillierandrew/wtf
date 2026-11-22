import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { ScreenBar, type Screen } from "@/components/nav";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [stack, setStack] = useState<Array<Screen | null>>([null]);
  const mode = stack[stack.length - 1] ?? null;

  function go(next: Screen) {
    setStack((current) => (current[current.length - 1] === next ? current : [...current, next]));
  }

  function back() {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : [null]));
  }

  function home() {
    setStack([null]);
  }

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  let screen = <Welcome onEnter={() => go("pc")} onDesk={() => go("desk")} onSim={() => go("sim")} onLaptop={() => go("laptop")} onDesktop={() => go("desktop")} onValue={() => go("value")} />;
  if (mode && hydrated) {
    const page =
      mode === "value" ? (
        <Value onLeave={home} onBuild={() => go("pc")} />
      ) : mode === "desk" ? (
        <Desk onLeave={home} />
      ) : mode === "sim" ? (
        <Sim onLeave={home} />
      ) : mode === "laptop" ? (
        <Laptops onLeave={home} />
      ) : mode === "desktop" ? (
        <Desktops onLeave={home} />
      ) : (
        <Builder onLeave={home} />
      );
    screen = (
      <div className="flex h-dvh flex-col bg-bg">
        <ScreenBar mode={mode} onBack={back} onGo={go} />
        <div className="screen-slot min-h-0 flex-1">{page}</div>
      </div>
    );
  }
  return <Gate>{screen}</Gate>;
}

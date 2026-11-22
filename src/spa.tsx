import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { ScreenBar, type Screen } from "@/components/nav";
import { Steam } from "@/components/steam";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { useBench } from "@/lib/store";
import "./styles.css";

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [stack, setStack] = useState<Array<Screen | null>>([null]);
  const [boot, setBoot] = useState<"play" | "review">("play");
  const mode = stack[stack.length - 1] ?? null;

  function go(next: Screen) {
    if (next === "pc") setBoot("play");
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

  if (!mode || !hydrated) return <Welcome onEnter={() => go("pc")} onDesk={() => go("desk")} onSim={() => go("sim")} onLaptop={() => go("laptop")} onDesktop={() => go("desktop")} onValue={() => go("value")} onSteam={() => go("steam")} />;
  const screen =
    mode === "steam" ? (
      <Steam
        onLeave={home}
        onUse={(pick) => {
          useBench.getState().apply(pick.build, `${pick.name}. A tiny PC. Change a part if you want.`);
          setBoot("review");
          setStack((current) => [...current, "pc"]);
        }}
      />
    ) : mode === "value" ? (
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
      <Builder onLeave={home} start={boot} />
    );
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <ScreenBar mode={mode} onBack={back} onGo={go} />
      <div className="screen-slot min-h-0 flex-1">{screen}</div>
    </div>
  );
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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { ScreenBar, type Screen } from "@/components/nav";
import { Games } from "@/components/games";
import { Guide } from "@/components/guide";
import { Steam } from "@/components/steam";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { Colour } from "@/components/colour";
import { Ideas } from "@/components/ideas";
import { useBench } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);
  const [stack, setStack] = useState<Array<Screen | null>>([null]);
  const [boot, setBoot] = useState<"play" | "review">("play");
  const [colour, setColour] = useState<"white" | "black" | "all">("white");
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

  let screen = (
    <Welcome
      onEnter={() => go("pc")}
      onDesk={() => go("desk")}
      onSim={() => go("sim")}
      onLaptop={() => go("laptop")}
      onDesktop={() => go("desktop")}
      onValue={() => go("value")}
      onSteam={() => go("steam")}
      onGames={() => go("games")}
      onGuide={() => go("guide")}
      onIdeas={() => go("ideas")}
      onColour={(pick) => {
        setColour(pick);
        go("colour");
      }}
    />
  );
  if (mode && hydrated) {
    const page =
      mode === "games" ? (
        <Games
          onLeave={home}
          onUse={(pick) => {
            useBench.getState().apply(pick.build, `${pick.name}. Change a part if you want.`);
            setBoot("review");
            setStack((current) => [...current, "pc"]);
          }}
        />
      ) : mode === "guide" ? (
        <Guide
          onLeave={home}
          onUse={(name, build) => {
            useBench.getState().apply(build, `${name}. The questions picked these parts.`);
            setBoot("review");
            setStack((current) => [...current, "pc"]);
          }}
        />
      ) : mode === "steam" ? (
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
        <Desktops
          onLeave={home}
          onUse={(pick) => {
            useBench.getState().apply(pick.build, `${pick.name}. Change a part if you want.`);
            setBoot("review");
            setStack((current) => [...current, "pc"]);
          }}
        />
      ) : mode === "colour" ? (
        <Colour onLeave={home} start={colour} />
      ) : mode === "ideas" ? (
        <Ideas
          onLeave={home}
          onUse={(pick) => {
            useBench.getState().apply(pick.build, `${pick.name}. Change a part if you want.`);
            setBoot("review");
            setStack((current) => [...current, "pc"]);
          }}
        />
      ) : (
        <Builder onLeave={home} start={boot} />
      );
    screen = (
      <div className="flex h-dvh flex-col bg-bg">
        <ScreenBar mode={mode} trail={stack} onBack={back} onFull={home} onJump={(index) => setStack((current) => current.slice(0, index + 1))} onGo={go} />
        <div className="screen-slot min-h-0 flex-1">{page}</div>
      </div>
    );
  }
  return <Gate>{screen}</Gate>;
}

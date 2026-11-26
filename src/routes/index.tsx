import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { Gate } from "@/components/lock";
import { ScreenBar, type Screen, NAMES } from "@/components/nav";
import { HistoryRoot, latest, usePath } from "@/components/history";
import { BagDock } from "@/components/bag";
import { Games } from "@/components/games";
import { Guide } from "@/components/guide";
import { Steam } from "@/components/steam";
import { Value } from "@/components/value";
import { Welcome } from "@/components/welcome";
import { Colour } from "@/components/colour";
import { Ideas } from "@/components/ideas";
import { EasyPick, GpuPower } from "@/components/easy";
import { useBench } from "@/lib/store";
import type { UseKind } from "@/lib/phone-use";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useBench((state) => state.hydrated);
  const hydrate = useBench((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Gate>
      <HistoryRoot home="Shop">
        <Site hydrated={hydrated} />
      </HistoryRoot>
    </Gate>
  );
}

const PAGES = new Set(["pc", "desk", "sim", "laptop", "desktop", "value", "steam", "games", "guide", "colour", "ideas", "pick", "power"]);

function Site({ hydrated }: { hydrated: boolean }) {
  const path = usePath();
  const [boot, setBoot] = useState<"play" | "review">("play");
  const [colour, setColour] = useState<"white" | "black" | "all">("white");
  const [job, setJob] = useState<UseKind | null>(null);
  const pageId = path ? pageOf(path.log, path.at) : "home";
  const mode = pageId === "home" ? null : (pageId as Screen);

  function go(next: Screen) {
    if (next === "pc") setBoot("play");
    path?.note(next, NAMES[next] ?? next);
  }

  function back() {
    path?.back();
  }

  function home() {
    path?.jump(0);
  }

  useEffect(() => {
    if (!path) return;
    const picked = latest(path.log, path.at, (id) => id.startsWith("pick:"));
    if (picked) setJob(picked.slice(5) as UseKind);
    const tone = latest(path.log, path.at, (id) => id.startsWith("colour:"));
    if (tone) setColour(tone.slice(7) as "white" | "black" | "all");
  }, [path?.at, path?.log, path]);

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
      onJob={(kind) => {
        setJob(kind);
        path?.note(`pick:${kind}`, "For");
      }}
      onPower={() => go("power")}
      onColour={(pick) => {
        setColour(pick);
        path?.note(`colour:${pick}`, "Colour");
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
            path?.note("pc", "Build");
          }}
        />
      ) : mode === "guide" ? (
        <Guide
          onLeave={home}
          onUse={(name, build) => {
            useBench.getState().apply(build, `${name}. The questions picked these parts.`);
            setBoot("review");
            path?.note("pc", "Build");
          }}
        />
      ) : mode === "steam" ? (
        <Steam
          onLeave={home}
          onUse={(pick) => {
            useBench.getState().apply(pick.build, `${pick.name}. A tiny PC. Change a part if you want.`);
            setBoot("review");
            path?.note("pc", "Build");
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
            path?.note("pc", "Build");
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
            path?.note("pc", "Build");
          }}
        />
      ) : mode === "pick" ? (
        <EasyPick
          look="site"
          start={job}
          onUse={(build, name) => {
            useBench.getState().apply(build, `${name}. Change a part if you want.`);
            setBoot("review");
            path?.note("pc", "Build");
          }}
        />
      ) : mode === "power" ? (
        <GpuPower look="site" />
      ) : (
        <Builder onLeave={home} start={boot} />
      );
    screen = (
      <div className="flex h-full min-h-0 flex-col bg-bg">
        <ScreenBar mode={mode} trail={trailOf(path?.log ?? [], path?.at ?? 0)} onBack={back} onFull={home} onJump={(index) => jumpScreen(path, index)} onGo={go} />
        <div className="screen-slot min-h-0 flex-1">{page}</div>
      </div>
    );
  }
  return (
    <>
      {screen}
      <BagDock />
    </>
  );
}

function pageOf(log: { id: string }[], at: number) {
  for (let index = at; index >= 0; index -= 1) {
    const id = log[index].id;
    if (id.startsWith("pick:")) return "pick";
    if (id.startsWith("colour:")) return "colour";
    if (id === "home") return "home";
    if (PAGES.has(id)) return id;
  }
  return "home";
}

function trailOf(log: { id: string }[], at: number) {
  const trail: Array<Screen | null> = [];
  for (let index = 0; index <= at && index < log.length; index += 1) {
    const page = pageOf(log, index);
    const next = page === "home" ? null : (page as Screen);
    if (trail[trail.length - 1] !== next) trail.push(next);
  }
  return trail.length ? trail : [null];
}

function jumpScreen(path: ReturnType<typeof usePath>, index: number) {
  if (!path) return;
  let seen = -1;
  for (let cursor = 0; cursor < path.log.length; cursor += 1) {
    const page = pageOf(path.log, cursor);
    const prev = cursor === 0 ? "" : pageOf(path.log, cursor - 1);
    if (page !== prev) {
      seen += 1;
      if (seen === index) {
        path.jump(cursor);
        return;
      }
    }
  }
}

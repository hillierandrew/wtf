import { useEffect, useState } from "react";
import { Builder } from "@/components/builder";
import { Desktops } from "@/components/desktops";
import { Laptops } from "@/components/laptops";
import { Sim } from "@/components/sim";
import { Desk } from "@/components/desk";
import { type Screen, NAMES } from "@/components/nav";
import { latest, usePath } from "@/components/history";
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
import { JOBS, type UseKind } from "@/lib/phone-use";

const PAGES = new Set(["pc", "desk", "sim", "laptop", "desktop", "value", "steam", "games", "guide", "colour", "ideas", "pick", "power"]);

export function Floor({ hydrated }: { hydrated: boolean }) {
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

  function home() {
    const index = path?.log.findIndex((crumb) => crumb.id === "home") ?? 1;
    path?.jump(index < 0 ? 1 : index);
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
        path?.note(`pick:${kind}`, JOBS.find((job) => job.id === kind)?.label ?? "For");
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
    screen = <div className="h-full min-h-0 overflow-hidden">{page}</div>;
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

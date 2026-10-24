/* speccy.js
 * What this file is: the "read my PC" box on every password store.
 * Speccy (the Windows app) cannot push data into a website. The person
 * saves File → Save as Text file, or Save as XML, then pastes or uploads it.
 * parse() turns that text into { cpu, cores, ramGB, ramType, slots, gpus, disks }.
 * advice() turns those numbers into keep / upgrade lines a customer can read.
 * The browser guess is only a hint. It is not a Speccy report.
 * Parent banner posts { type:"drew-layout", layout:"phone"|"desk" }.
 * This file forwards that to window.setLayout when the store has one.
 */
(function (root) {
  "use strict";

  function num(s) {
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function gbIn(line) {
    var tb = String(line).match(/(\d+(?:\.\d+)?)\s*TB\b/i);
    if (tb) return num(tb[1]) * 1000;
    var gb = String(line).match(/(\d+(?:\.\d+)?)\s*GB\b/i);
    if (gb) return num(gb[1]);
    var mb = String(line).match(/(\d+(?:\.\d+)?)\s*MB(?:ytes)?\b/i);
    if (mb && /size|memory|capacity/i.test(line)) return num(mb[1]) / 1024;
    return 0;
  }

  function sections(text) {
    var out = {};
    var name = "TOP";
    String(text || "").split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      if (!/^\s/.test(line) && line.trim().length < 40 && !/^\d/.test(line.trim())) {
        name = line.trim().replace(/:$/, "");
        out[name] = out[name] || [];
        return;
      }
      (out[name] = out[name] || []).push(line.trim());
    });
    return out;
  }

  function firstLine(map, keys) {
    for (var i = 0; i < keys.length; i++) {
      var rows = map[keys[i]];
      if (rows && rows.length) return rows;
    }
    return [];
  }

  function parseText(text) {
    var map = sections(text);
    var cpuRows = firstLine(map, ["CPU", "Processor"]);
    var ramRows = firstLine(map, ["RAM", "Memory"]);
    var gpuRows = firstLine(map, ["Graphics", "Display"]);
    var diskRows = firstLine(map, ["Storage", "Drives", "Hard Drives"]);
    var cpu = "";
    var cores = 0;
    cpuRows.forEach(function (line) {
      var c = line.match(/cores?\s*[:=]?\s*(\d+)/i);
      if (c) cores = parseInt(c[1], 10);
      if (!cpu && !/^(cores?|threads?|name|code name|package|technology|family|model|stepping|revision|instructions|virtualization|hyperthreading|bus speed|average temperature|caches|specification)\b/i.test(line)) cpu = line.replace(/\s+\d+\s*°C.*$/, "");
    });
    if (!cores) {
      var c2 = text.match(/Cores\s*[:=]?\s*(\d+)/i);
      if (c2) cores = parseInt(c2[1], 10);
    }
    var ramGB = 0;
    var ramType = "";
    var slots = { total: 0, used: 0, free: 0 };
    ramRows.concat([text]).forEach(function (line) {
      if (!ramGB) {
        var g = line.match(/(\d+(?:\.\d+)?)\s*GB\b/i);
        if (g && /ram|memory|dual-channel|single-channel|channel/i.test(line)) ramGB = num(g[1]);
      }
      var typ = line.match(/\b(DDR[2345]|LPDDR[45])\b/i);
      if (typ) ramType = typ[1].toUpperCase();
      var tot = line.match(/Total memory slots\s*(\d+)/i);
      var used = line.match(/Used memory slots\s*(\d+)/i);
      var free = line.match(/Free memory slots\s*(\d+)/i);
      if (tot) slots.total = parseInt(tot[1], 10);
      if (used) slots.used = parseInt(used[1], 10);
      if (free) slots.free = parseInt(free[1], 10);
    });
    if (!ramGB) {
      var size = text.match(/Size\s+(\d+)\s+MBytes/i);
      if (size) ramGB = Math.round(parseInt(size[1], 10) / 1024);
    }
    var gpus = [];
    gpuRows.forEach(function (line) {
      if (/basic display|microsoft basic/i.test(line)) return;
      if (!/nvidia|geforce|gtx|rtx|radeon|amd|intel|arc|uhd|iris/i.test(line)) return;
      if (/\d{3,4}\s*x\s*\d{3,4}/i.test(line) && !/nvidia|geforce|radeon|intel|arc/i.test(line)) return;
      gpus.push(line.replace(/\s+\d+\s*°C.*$/, ""));
    });
    var disks = [];
    diskRows.forEach(function (line) {
      var gb = gbIn(line);
      if (!gb) return;
      var kind = /nvme|m\.2/i.test(line) ? "NVMe" : /ssd/i.test(line) ? "SSD" : /hdd|hard disk|sata \(hdd\)/i.test(line) ? "HDD" : "drive";
      disks.push({ gb: gb, kind: kind, name: line });
    });
    return { cpu: cpu, cores: cores, ramGB: ramGB, ramType: ramType, slots: slots, gpus: gpus, disks: disks, source: "speccy" };
  }

  function parseXml(text) {
    try {
      var doc = new DOMParser().parseFromString(text, "text/xml");
      if (!doc || doc.querySelector("parsererror")) throw new Error("bad xml");
      var lines = [];
      var section = "";
      function walk(node) {
        if (!node || node.nodeType !== 1) return;
        var tag = node.nodeName.toLowerCase();
        if (node.children && node.children.length && /cpu|processor|ram|memory|graphic|display|storage|disk|drive/.test(tag)) {
          var label = /cpu|processor/.test(tag) ? "CPU" : /ram|memory/.test(tag) ? "RAM" : /graph|display/.test(tag) ? "Graphics" : "Storage";
          if (label !== section) { section = label; lines.push(section); }
        }
        if (!node.children || !node.children.length) {
          var v = (node.textContent || "").trim();
          if (v) lines.push("  " + node.nodeName + " " + v);
        } else {
          for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
        }
      }
      walk(doc.documentElement);
      return parseText(lines.join("\n"));
    } catch (e) {
      return parseText(text.replace(/<[^>]+>/g, "\n"));
    }
  }

  function parse(raw) {
    var text = String(raw || "").replace(/^\uFEFF/, "");
    if (!text.trim()) return null;
    if (text.indexOf("<") !== -1 && /<\/[a-z]/i.test(text)) return parseXml(text);
    return parseText(text);
  }

  function gpuTier(name) {
    var n = String(name || "").toUpperCase();
    if (!n) return 0;
    if (/UHD|HD GRAPHICS|IRIS|RADEON\(TM\)|RADEON GRAPHICS|VEGA \d/.test(n) && !/RX\s*\d|GTX|RTX|ARC/.test(n)) return 0;
    var m = n.match(/RTX\s*(\d{4})/);
    if (m) return +m[1] >= 4070 ? 4 : +m[1] >= 3060 ? 3 : 2;
    m = n.match(/GTX\s*(\d{3,4})/);
    if (m) return +m[1] >= 1660 ? 2 : 1;
    m = n.match(/RX\s*(\d{3,4})/);
    if (m) return +m[1] >= 6700 ? 3 : +m[1] >= 5600 ? 2 : 1;
    if (/ARC\s/.test(n)) return 2;
    if (/NVIDIA|GEFORCE|RADEON/.test(n)) return 1;
    return 0;
  }

  function cpuNeedsUpgrade(spec) {
    var n = String(spec.cpu || "").toUpperCase();
    if (spec.cores && spec.cores < 6) return true;
    if (/CELERON|PENTIUM|ATHLON|A[468]-|FX-|CORE 2|I[357]-\d{3}\b|RYZEN 3/.test(n)) return true;
    return false;
  }

  function advice(spec) {
    if (!spec) return [];
    var lines = [];
    if (spec.cpu) {
      lines.push(cpuNeedsUpgrade(spec)
        ? { kind: "upgrade", title: "Upgrade the processor.", detail: spec.cpu + (spec.cores ? " (" + spec.cores + " cores)." : ".") + " A 6-core chip is the smallest I would leave in a computer I sell." }
        : { kind: "keep", title: "Leave the processor.", detail: spec.cpu + "." });
    } else {
      lines.push({ kind: "maybe", title: "Processor was not in the file.", detail: "Paste the whole Speccy text, not one page of it." });
    }
    if (spec.ramGB) {
      var slotNote = "";
      if (spec.slots && spec.slots.total && spec.slots.free === 0) slotNote = " Every memory slot is full, so an upgrade means replacing a stick, not adding one.";
      else if (spec.slots && spec.slots.free) slotNote = " " + spec.slots.free + " memory slot" + (spec.slots.free === 1 ? " is" : "s are") + " empty, so a stick can be added.";
      if (spec.ramGB < 16) lines.push({ kind: "upgrade", title: "Upgrade the memory.", detail: spec.ramGB + " GB" + (spec.ramType ? " " + spec.ramType : "") + ". 16 GB is the smallest I would leave in." + slotNote });
      else if (spec.ramGB < 32) lines.push({ kind: "maybe", title: "Memory can be upgraded.", detail: spec.ramGB + " GB is enough for school, office, and most games. Video work wants 32 GB." + slotNote });
      else lines.push({ kind: "keep", title: "Leave the memory.", detail: spec.ramGB + " GB" + (spec.ramType ? " " + spec.ramType : "") + "." + slotNote });
    } else {
      lines.push({ kind: "maybe", title: "Memory size was not in the file.", detail: "Look for a line like 16.0GB in the Speccy summary." });
    }
    if (spec.gpus && spec.gpus.length) {
      var best = spec.gpus[0];
      var tier = 0;
      spec.gpus.forEach(function (g) { var t = gpuTier(g); if (t >= tier) { tier = t; best = g; } });
      if (tier <= 0) lines.push({ kind: "upgrade", title: "Upgrade the graphics card if they play games.", detail: best + " is built into the processor. Fine for school and video calls. Not fine for new games." });
      else if (tier === 1) lines.push({ kind: "maybe", title: "The graphics card can be upgraded.", detail: best + " still runs older games. A newer card is the upgrade if the picture is the problem." });
      else lines.push({ kind: "keep", title: "Leave the graphics card.", detail: best + "." });
    } else {
      lines.push({ kind: "maybe", title: "No graphics card was listed.", detail: "If this is a laptop, the graphics may be inside the processor and not a card you can swap." });
    }
    if (spec.disks && spec.disks.length) {
      var total = 0;
      var fast = 0;
      var hasHdd = false;
      spec.disks.forEach(function (d) {
        total += d.gb;
        if (d.kind === "SSD" || d.kind === "NVMe") fast += d.gb;
        if (d.kind === "HDD") hasHdd = true;
      });
      var shown = Math.round(total) + " GB across " + spec.disks.length + " drive" + (spec.disks.length === 1 ? "" : "s") + ".";
      if (fast === 0) lines.push({ kind: "upgrade", title: "Upgrade the storage.", detail: shown + " It is a hard drive. An SSD is the upgrade people feel the same day." });
      else if (fast < 500) lines.push({ kind: "upgrade", title: "Upgrade the storage.", detail: shown + " The fast drive is under 500 GB. Add a 1 TB SSD." + (hasHdd ? " The hard drive can stay for old files." : "") });
      else if (hasHdd) lines.push({ kind: "maybe", title: "Storage can be upgraded.", detail: shown + " The SSD is fine. The hard drive is the slow one." });
      else lines.push({ kind: "keep", title: "Leave the storage.", detail: shown });
    } else {
      lines.push({ kind: "maybe", title: "Storage was not in the file.", detail: "Paste the Storage section too." });
    }
    return lines;
  }

  function browserGuess() {
    var cores = navigator.hardwareConcurrency || 0;
    var ram = navigator.deviceMemory || 0;
    var gpu = "";
    try {
      var c = document.createElement("canvas");
      var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (gl) {
        var ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "";
      }
    } catch (e) {}
    return {
      cpu: cores ? cores + " cores, name hidden by the browser" : "",
      cores: cores,
      ramGB: ram,
      ramType: "",
      slots: { total: 0, used: 0, free: 0 },
      gpus: gpu ? [gpu] : [],
      disks: [],
      source: "browser"
    };
  }

  function render(out, spec) {
    out.replaceChildren();
    if (spec.source === "browser") {
      var note = document.createElement("p");
      note.textContent = "This is a guess from the browser, not from Speccy. Chrome hides the processor name and often caps memory at 8 GB. Paste Speccy for the real list.";
      out.appendChild(note);
    }
    advice(spec).forEach(function (line) {
      var p = document.createElement("p");
      p.className = "speccy-" + line.kind;
      var b = document.createElement("b");
      b.textContent = line.title;
      p.appendChild(b);
      var s = document.createElement("span");
      s.textContent = " " + line.detail;
      p.appendChild(s);
      out.appendChild(p);
    });
  }

  function mount(el) {
    if (!el || el.dataset.ready) return;
    el.dataset.ready = "1";
    el.className = (el.className ? el.className + " " : "") + "speccy-box";
    var h = document.createElement("h2");
    h.textContent = "Your PC, from Speccy";
    var p = document.createElement("p");
    p.textContent = "On their computer, open Speccy. Click File, then Save as Text file. Open that file, copy all of it, and paste it here. A file works too.";
    var area = document.createElement("textarea");
    area.rows = 5;
    area.placeholder = "Paste the Speccy text here";
    area.setAttribute("aria-label", "Speccy text");
    var row = document.createElement("div");
    row.className = "speccy-row";
    var go = document.createElement("button");
    go.type = "button";
    go.textContent = "Read the specs";
    var fileBtn = document.createElement("button");
    fileBtn.type = "button";
    fileBtn.textContent = "Choose the file";
    var guess = document.createElement("button");
    guess.type = "button";
    guess.textContent = "Guess from this browser";
    var file = document.createElement("input");
    file.type = "file";
    file.accept = ".txt,.xml,text/plain,text/xml";
    file.hidden = true;
    var out = document.createElement("div");
    out.className = "speccy-out";
    function run(raw) {
      var spec = parse(raw);
      if (!spec || (!spec.cpu && !spec.ramGB && !(spec.gpus && spec.gpus.length) && !(spec.disks && spec.disks.length))) {
        out.replaceChildren();
        var err = document.createElement("p");
        err.textContent = "That did not look like a Speccy report. Use File, Save as Text file, and paste the whole thing.";
        out.appendChild(err);
        return;
      }
      render(out, spec);
    }
    go.addEventListener("click", function () { run(area.value); });
    fileBtn.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { area.value = String(reader.result || ""); run(area.value); };
      reader.readAsText(f);
    });
    guess.addEventListener("click", function () { render(out, browserGuess()); });
    row.append(go, fileBtn, guess);
    el.append(h, p, area, file, row, out);
  }

  var css = document.createElement("style");
  css.textContent = [
    ".speccy-box{margin:12px 0 18px;padding:14px;border:1px solid rgba(127,127,127,.45);border-radius:16px}",
    ".speccy-box h2{margin:0 0 8px;font-size:22px;letter-spacing:-.03em}",
    ".speccy-box p{margin:8px 0}",
    ".speccy-box textarea{width:100%;min-height:96px;box-sizing:border-box;font:14px/1.4 ui-monospace,Menlo,Consolas,monospace;padding:10px;border-radius:12px;border:1px solid rgba(127,127,127,.45);background:transparent;color:inherit}",
    ".speccy-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}",
    ".speccy-row button{min-height:48px;padding:0 14px;border-radius:999px;border:1px solid rgba(127,127,127,.5);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}",
    ".speccy-upgrade b{color:#b42318}",
    ".speccy-keep b{color:#1d6b45}",
    ".speccy-maybe b{color:#8a5a12}"
  ].join("");
  document.head.appendChild(css);

  root.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "drew-layout") return;
    var fn = root.drewSetLayout || root.setLayout;
    if (typeof fn === "function") fn(d.layout === "desk" ? "desk" : "phone");
  });

  function boot() {
    var el = document.getElementById("speccy");
    if (el) mount(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  root.drewSpeccy = { parse: parse, advice: advice, mount: mount };
})(window);

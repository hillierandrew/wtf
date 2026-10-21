(function () {
  var key = "drew-theme";
  var saved = "";
  try { saved = localStorage.getItem(key) || ""; } catch (e) {}
  if (!saved) saved = document.documentElement.getAttribute("data-ink") === "light" ? "dark" : "light";
  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
    try { localStorage.setItem(key, mode); } catch (e) {}
  }
  apply(saved);
  var style = document.createElement("style");
  style.textContent = [
    "html[data-theme=dark]{color-scheme:dark;--bg:#000;--ink:#f5f5f7;--muted:#a1a1a6;--line:#333336;--card:#1d1d1f;--paper:#1d1d1f;--orange:#ff9f0a}",
    "html[data-theme=light]{color-scheme:light;--bg:#f5f5f7;--ink:#1d1d1f;--muted:#6e6e73;--line:#d2d2d7;--card:#fff;--paper:#fff;--orange:#8a4b12}",
    "html[data-theme=dark] body{background:var(--bg);color:var(--ink)}",
    "html[data-theme=dark] button,html[data-theme=dark] select,html[data-theme=dark] input,html[data-theme=dark] textarea{background:#1d1d1f;color:#f5f5f7;border-color:#3a3a3c}",
    "html[data-theme=dark] .top,html[data-theme=dark] body.phone .eat-bar,html[data-theme=dark] body.phone .order-bar{background:rgba(0,0,0,.92)}",
    "html[data-theme=dark] button.primary,html[data-theme=dark] .purpose,html[data-theme=dark] a.dark,html[data-theme=dark] button.dark,html[data-theme=dark] .go{background:#f5f5f7;color:#000}",
    "html[data-theme=dark] .nope{background:#2a2118}",
    "html[data-ink=light][data-theme=dark] body{background:#000 !important;color:#f5f5f7}",
    "html[data-ink=light][data-theme=light] body{background:#f5f5f7 !important;color:#1d1d1f}",
    "html[data-ink=light][data-theme=light] .icon,html[data-ink=light][data-theme=light] .back,html[data-ink=light][data-theme=light] .pitch,html[data-ink=light][data-theme=light] .budget{background:#fff;color:#1d1d1f;border-color:#d2d2d7}",
    "#drewBulb{position:fixed;z-index:40;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));width:44px;height:44px;border-radius:999px;border:1px solid rgba(127,127,127,.45);background:rgba(28,28,30,.55);color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(16px)}"
  ].join("");
  document.head.appendChild(style);
  function mount() {
    if (document.getElementById("drewBulb")) return;
    var b = document.createElement("button");
    b.id = "drewBulb";
    b.type = "button";
    b.textContent = "\uD83D\uDCA1";
    function label() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      b.setAttribute("aria-label", dark ? "Switch to light" : "Switch to night");
    }
    label();
    b.addEventListener("click", function () {
      apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
      label();
    });
    document.body.appendChild(b);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();

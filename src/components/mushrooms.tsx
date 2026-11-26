import { useEffect, useRef, type RefObject } from "react";

const CH = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@", "o", "O", "0", "|", "!", "I", "/", "\\"];
const NC = 10;
const FONT = '"SF Mono",Menlo,Consolas,"Courier New",monospace';
const HB = 18;
const LB = 6;
const NB = HB * LB * 2;
const SEG = Math.PI / 3;
const SATS = [58, 94];
const LIGHTS = [24, 36, 48, 60, 72, 86];
const MS: number[][] = [
  [-0.86, 0.97, 0.55, 0.2, 300, 0, 1],
  [-0.6, 1, 0.95, 0.3, 180, 1.3, 1.2],
  [-0.3, 0.98, 0.45, 0.17, 60, 2.1, 0.9],
  [-0.05, 1, 1.15, 0.38, 320, 0.7, 1.4],
  [0.28, 0.97, 0.6, 0.22, 150, 3.4, 1],
  [0.52, 1, 0.85, 0.28, 40, 4.2, 1.1],
  [0.8, 0.98, 0.5, 0.19, 270, 5.1, 0.9],
  [0.97, 1, 0.7, 0.24, 190, 2.6, 1],
];
const NM = MS.length;
const NS = 80;
const RMX = 6;

export function Mushrooms({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current as HTMLCanvasElement | null;
    const glow = glRef.current as HTMLCanvasElement | null;
    const box = host.current;
    if (!cv || !glow || !box) return;
    const g = cv.getContext("2d", { alpha: false });
    const gg = glow.getContext("2d");
    if (!g || !gg) return;
    const canvas: HTMLCanvasElement = cv;
    const bloom: HTMLCanvasElement = glow;
    const root: HTMLDivElement = box;
    const pen: CanvasRenderingContext2D = g;
    const bloomPen: CanvasRenderingContext2D = gg;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { sin, cos, abs, exp, floor, ceil, round, min, max, sqrt, atan2 } = Math;
    let alive = true;
    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let fs = 14;
    let cw = 8;
    let ch = 16;
    let cols = 0;
    let rows = 0;
    let N = 0;
    let half = 1;
    let A = 1;
    let B = 1;
    let sf = 1;
    let fsAdd = 0;
    let X = new Float32Array(0);
    let Y = new Float32Array(0);
    let R = new Float32Array(0);
    let TH = new Float32Array(0);
    let NX = new Float32Array(0);
    let NY = new Float32Array(0);
    let BID = new Int16Array(0);
    let CID = new Uint8Array(0);
    let ORD = new Int32Array(0);
    const cnt = new Int32Array(NB);
    const off = new Int32Array(NB);
    const cur = new Int32Array(NB);
    let rz = true;

    function resize() {
      dpr = min(devicePixelRatio || 1, 2);
      W = root.clientWidth || window.innerWidth;
      H = root.clientHeight || window.innerHeight;
      canvas.width = floor(W * dpr);
      canvas.height = floor(H * dpr);
      bloom.width = max(2, floor(W / 5));
      bloom.height = max(2, floor(H / 5));
      pen.setTransform(dpr, 0, 0, dpr, 0, 0);
      fs = max(11, min(18, round(min(W, H) / 55)), ceil(sqrt((W * H) / (16000 * 0.66)))) + fsAdd;
      pen.font = `${fs}px ${FONT}`;
      pen.textBaseline = "top";
      pen.textAlign = "left";
      cw = pen.measureText("M").width;
      ch = fs * 1.1;
      cols = ceil(W / cw);
      rows = ceil(H / ch);
      N = cols * rows;
      X = new Float32Array(N);
      Y = new Float32Array(N);
      R = new Float32Array(N);
      TH = new Float32Array(N);
      NX = new Float32Array(N);
      NY = new Float32Array(N);
      BID = new Int16Array(N);
      CID = new Uint8Array(N);
      ORD = new Int32Array(N);
      half = min(W, H) / 2;
      A = W / 2 / half;
      B = H / 2 / half;
      sf = min(1, A / 1.5 + 0.25);
      for (let r = 0, i = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++, i++) {
          X[i] = c * cw;
          Y[i] = r * ch;
          const nx = ((c + 0.5) * cw - W / 2) / half;
          const ny = ((r + 0.5) * ch - H / 2) / half;
          NX[i] = nx;
          NY[i] = ny;
          R[i] = sqrt(nx * nx + ny * ny);
          TH[i] = atan2(ny, nx);
        }
      }
    }

    const bk = (h: number, L: number, S: number) => {
      let hb = floor(h / (360 / HB)) % HB;
      if (hb < 0) hb += HB;
      let lb = floor((L - 18) / 12);
      lb = lb < 0 ? 0 : lb > LB - 1 ? LB - 1 : lb;
      return ((hb * LB + lb) << 1) | (S >= 72 ? 1 : 0);
    };

    const CX = new Float32Array(NM);
    const CY = new Float32Array(NM);
    const RW = new Float32Array(NM);
    const RH = new Float32Array(NM);
    const SW = new Float32Array(NM);
    const BY = new Float32Array(NM);
    const GL = new Float32Array(NM);
    const MH = new Float32Array(NM);
    let bass = 0;
    let mids = 0;
    let highs = 0;
    let energy = 0;
    let kick = 0;
    let simPhase = 0;
    const rrad = new Float32Array(RMX);
    const ramp = new Float32Array(RMX);
    const ar = new Float32Array(RMX);
    const aa = new Float32Array(RMX);
    let slow = 0;
    let last = 0;
    let t = 0;
    let hue = 200;
    let rot = 0;
    let pt = 0;

    function launch(amp: number) {
      kick = max(kick, amp);
      let k = 0;
      for (let i = 0; i < RMX; i++) {
        if (ramp[i] <= 0) {
          k = i;
          break;
        }
        if (ramp[i] < ramp[k]) k = i;
      }
      rrad[k] = 0;
      ramp[k] = amp;
    }

    function analyse(dt: number) {
      const p = 0.5 + 0.5 * sin(t * 1.7);
      const tb = 0.22 + 0.28 * p * p * p;
      const tm = 0.25 + 0.12 * sin(t * 0.63);
      const th = 0.14 + 0.08 * sin(t * 0.9 + 1.3);
      const before = floor(simPhase);
      simPhase += dt * 0.25;
      if (floor(simPhase) !== before) launch(0.45);
      const f = (v: number, tg: number) => v + (tg - v) * (1 - exp(-dt * (tg > v ? 28 : 3.2)));
      bass = f(bass, tb);
      mids = f(mids, tm);
      highs = f(highs, th);
      energy = bass * 0.5 + mids * 0.3 + highs * 0.2;
      kick *= exp(-dt / 0.13);
    }

    function frame(ms: number) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const raw = (ms - last) / 1000 || 0.016;
      last = ms;
      if (rz) {
        rz = false;
        resize();
      }
      if (raw > 0.034 && raw < 0.25) slow++;
      else if (slow > 0) slow--;
      if (slow > 90 && fsAdd < 12) {
        fsAdd += 2;
        slow = 0;
        resize();
      }
      const dt = min(0.05, raw);
      t += dt;
      analyse(dt);
      let nr = 0;
      for (let k = 0; k < RMX; k++) {
        if (ramp[k] <= 0) continue;
        rrad[k] += dt * 1.1;
        ramp[k] *= exp(-dt / 0.8);
        if (rrad[k] > 3 || ramp[k] < 0.03) {
          ramp[k] = 0;
          continue;
        }
        ar[nr] = rrad[k];
        aa[nr] = ramp[k];
        nr++;
      }
      hue = (hue + dt * (7 + mids * 80 + kick * 300)) % 360;
      root.style.setProperty("--mush", hue.toFixed(1));
      rot += dt * (0.08 + energy * 0.9);
      pt += dt * (0.6 + mids * 1.5);
      const hi = highs;
      const K = kick;
      const HU = hue;
      const sc = 1.35 * (1 + (0.12 + bass * 0.38) * sin(t * 0.45) + 0.1 * hi * sin(t * 2.3)) + K * 0.12;
      const tw = 0.55 + bass * 2.4 + 0.3 * sin(t * 0.21);
      const fm = 1 + mids * 0.55;
      const F1 = 2.1 * fm;
      const F2 = 1.7 * fm;
      const F3 = 1.3 * fm;
      const F4 = 3.2 * fm;
      const T1 = pt * 1.1;
      const T2 = pt * 0.9;
      const T3 = pt * 0.7;
      const T4 = pt * 1.5;
      const T5 = pt * 0.5;
      const T6 = pt * 0.25;
      const melt = 0.45 + 0.25 * sin(t * 0.17) + bass * 0.5 + hi * 0.2;
      const km = max(0, min(1, 0.6 + 1.1 * sin(t * 0.09)));

      for (let j = 0; j < NM; j++) {
        const m = MS[j];
        const pu = 1 + 0.08 * sin(t * 1.5 + m[5]) + bass * 0.15 + K * 0.1;
        const s = sf * pu;
        CX[j] = m[0] * A * 0.95 + 0.05 * sin(t * 0.8 + m[5]) * (1 + bass);
        BY[j] = m[1] * B;
        CY[j] = BY[j] - m[2] * sf * pu * 1.05;
        RW[j] = m[3] * s;
        RH[j] = m[3] * s * 0.55;
        SW[j] = m[3] * s * 0.17;
        GL[j] = m[6] * (0.6 + 0.5 * bass + K * 0.6);
        MH[j] = m[4];
      }

      for (let i = 0; i < N; i++) {
        const r0 = R[i];
        const nx = NX[i];
        const ny = NY[i];
        let r = r0 * sc;
        let glowAmt = 0;
        for (let k = 0; k < nr; k++) {
          const d = r0 - ar[k];
          const w = aa[k] / (1 + d * d * 60);
          r += d * w * 3.5;
          glowAmt += w;
        }
        let a = TH[i] + rot + (tw * 1.6) / (0.45 + r0);
        if (km > 0.001) {
          const af = ((a % SEG) + SEG) % SEG;
          a += (abs(af - SEG * 0.5) - af) * km;
        }
        let x = r * cos(a);
        let y = r * sin(a);
        const mel = melt * (0.5 + 0.5 * sin(nx * 4 + t * 0.6 + sin(nx * 9 + t) * 0.8)) * (0.35 + (0.65 * (ny + B)) / (2 * B));
        x += 0.45 * sin(y * 1.7 + T1);
        y += 0.45 * cos(x * 1.4 - T2) - mel * 1.4;
        x += 0.3 * sin(y * 2.6 + T3 + bass * 2);
        y += 0.3 * cos(x * 2.2 - T4);
        const s = sin(x * F1 + T1) + sin(y * F2 - T2) + sin((x + y) * F3 + T3) + sin(r * F4 - T4) + cos(x * y * 0.6 + T5);
        let v = 0.5 + 0.5 * sin(s * 0.9 + T6) + glowAmt * 0.22;
        const sp = 0.5 + 0.5 * sin(x * 29 + t * 4.1) * sin(y * 31 - t * 3.3);
        const mx = nx + 0.035 * sin(ny * 7 + t * 1.3) * (1 + bass);
        const my = ny - mel * 0.35;
        let halo = 0;
        let hh = 0;
        let hit = -1;
        let part = 0;
        let sh = 0;
        let px = 0;
        let py = 0;
        for (let j = 0; j < NM; j++) {
          const dx = mx - CX[j];
          const dy = my - CY[j];
          const g1 = GL[j] / (1 + (dx * dx + dy * dy) * 9);
          halo += g1;
          hh += g1 * MH[j];
          if (hit >= 0) continue;
          const rw = RW[j];
          const rh = RH[j];
          const e = (dx * dx) / (rw * rw) + (dy * dy) / (rh * rh);
          if (dy <= 0.03 * rh && e < 1) {
            hit = j;
            part = 1;
            sh = 1 - e;
            px = dx / rw;
            py = dy / rh;
          } else if (dy > 0 && dy < rh * 0.3 && dx * dx < rw * rw * 0.8) {
            hit = j;
            part = 3;
            px = dx;
          } else if (my > CY[j] && my < BY[j]) {
            const q = (my - CY[j]) / (BY[j] - CY[j]);
            const w = SW[j] * (1 + 0.9 * q * q);
            const c = dx - 0.02 * sin(my * 9 + j);
            if (abs(c) < w) {
              hit = j;
              part = 2;
              sh = 1 - abs(c) / w;
              px = dx;
            }
          }
        }
        let hv = HU + r0 * 65 + v * 80 + glowAmt * 30;
        if (halo > 0.01) {
          const hm = min(1, halo * 0.7);
          hv += (hh / halo - hv) * hm * 0.5;
          v += halo * 0.3;
        }
        let lv = 26 + 40 * v + 9 * sin(r0 * 7 - t * 2.2) + K * 24 + halo * 12;
        let sat = 60 + 28 * hi + 14 * sin(r0 * 5 + t * 1.7);
        let ci = floor((v + hi * (0.18 + 0.4 * sp)) * (NC - 1) + 0.5);
        if (hit >= 0) {
          hv = MH[hit] + HU * 0.3 + sh * 50;
          sat = 95;
          if (part === 1) {
            const spot = sin(px * 9 + hit * 2) * sin(py * 9 + hit) > 0.78;
            ci = spot ? 11 : 4 + floor((1 - sh) * 5.5);
            lv = 46 + (1 - sh) * 34 + K * 20 + (spot ? 18 : 0);
            if (spot) hv += 120;
          } else if (part === 2) {
            ci = 13 + ((floor(my * 40) + hit) & 1);
            lv = 38 + 34 * sh + K * 16;
          } else {
            ci = 16 + (floor(px * 45) & 1);
            lv = 52 + K * 16;
          }
        } else if (ci <= 0) {
          BID[i] = -1;
          continue;
        }
        if (ci > 17) ci = 17;
        BID[i] = bk(hv, lv, sat);
        CID[i] = ci;
      }

      for (let s = 0; s < NS; s++) {
        const sy = B - ((t * (0.05 + 0.02 * (s % 7)) + s * 0.137) % 1) * 2.2 * B;
        const sx = A * sin(s * 12.9 + t * 0.2 * (1 + (s % 3) * 0.3)) + 0.05 * sin(sy * 6 + t * 2 + s);
        const c = floor((sx * half + W / 2) / cw);
        const r = floor((sy * half + H / 2) / ch);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        const i = r * cols + c;
        BID[i] = bk(HU + s * 23, 86, 94);
        CID[i] = 1 + (s % 3) * 5;
      }

      cnt.fill(0);
      for (let i = 0; i < N; i++) {
        const id = BID[i];
        if (id >= 0) cnt[id]++;
      }
      let sum = 0;
      for (let b = 0; b < NB; b++) {
        off[b] = cur[b] = sum;
        sum += cnt[b];
      }
      for (let i = 0; i < N; i++) {
        const id = BID[i];
        if (id >= 0) ORD[cur[id]++] = i;
      }

      pen.fillStyle = "rgba(0,0,0,.42)";
      pen.fillRect(0, 0, W, H);
      for (let b = 0; b < NB; b++) {
        const n = cnt[b];
        if (!n) continue;
        const rest = b >> 1;
        pen.fillStyle = `hsl(${(rest / LB | 0) * (360 / HB) + 360 / HB / 2},${SATS[b & 1]}%,${LIGHTS[rest % LB]}%)`;
        for (let j = off[b], e = j + n; j < e; j++) {
          const i = ORD[j];
          pen.fillText(CH[CID[i]], X[i], Y[i]);
        }
      }
      bloomPen.drawImage(canvas, 0, 0, bloom.width, bloom.height);
    }

    const onResize = () => {
      rz = true;
    };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [host]);

  return (
    <>
      <canvas ref={cvRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <canvas
        ref={glRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ filter: "blur(12px) brightness(1.7) saturate(1.7)", mixBlendMode: "screen", opacity: 0.9 }}
        aria-hidden="true"
      />
    </>
  );
}

/* Byte-mode QR, error correction M, versions 1–20. */
(function (root) {
  const ECC = [
    null,
    [10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
    [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44],
    [30,1,50,4,51],[22,6,36,2,37],[22,8,37,1,38],[24,4,40,5,41],[24,5,41,5,42],
    [28,7,45,3,46],[28,10,46,1,47],[26,9,43,4,44],[26,3,44,11,45],[26,3,41,13,42]
  ];
  const ALIGN = [
    null,[], [6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
    [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]
  ];
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return (a && b) ? EXP[LOG[a] + LOG[b]] : 0; }
  const GEN = {
    10:[251,67,46,61,118,70,64,94,32,45],
    16:[120,104,107,109,102,161,76,3,91,191,147,169,182,194,225,120],
    18:[215,234,158,94,184,97,118,170,79,187,152,148,252,179,5,98,96,153],
    22:[210,171,247,242,93,230,14,109,221,53,200,74,8,172,98,80,219,134,160,105,165,231],
    24:[229,121,135,48,211,117,251,126,159,180,169,152,192,226,228,218,111,0,117,232,87,96,227,21],
    26:[173,125,158,2,103,182,118,17,145,201,111,28,165,53,161,21,245,142,13,102,48,227,153,145,218,70],
    28:[168,223,200,104,224,234,108,180,110,190,195,147,205,27,232,201,21,43,245,87,42,195,212,119,242,37,9,123],
    30:[41,173,145,152,216,31,179,182,50,48,110,86,239,96,222,125,42,173,226,193,224,130,156,37,251,216,238,40,192,180]
  };
  function rs(data, eccLen) {
    const gen = GEN[eccLen];
    const out = data.concat(new Array(eccLen).fill(0));
    for (let k = 0; k < data.length; k++) {
      const coef = out[k];
      if (!coef) continue;
      const lcoef = LOG[coef];
      for (let n = 0; n < eccLen; n++) out[k + n + 1] ^= EXP[lcoef + gen[n]];
    }
    return out.slice(data.length);
  }
  function capacity(v) {
    const e = ECC[v];
    return e[1] * e[2] + e[3] * e[4];
  }
  function choose(len) {
    const need = len + 3;
    for (let v = 1; v <= 20; v++) if (capacity(v) >= need) return v;
    return 0;
  }
  function modules(v) { return 17 + 4 * v; }
  function set(m, r, c, bit) { if (r < 0 || c < 0 || r >= m.length || c >= m.length) return; if (m[r][c] == null) m[r][c] = bit ? 1 : 0; }
  function finder(m, r, c) {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const on = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      set(m, r + y, c + x, on);
    }
  }
  function alignment(m, v) {
    const pos = ALIGN[v];
    for (const r of pos) for (const c of pos) {
      if (m[r][c] != null) continue;
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) set(m, r + y, c + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
  }
  function reserveFormat(m) {
    const n = m.length;
    for (let i = 0; i < 9; i++) { if (m[8][i] == null) m[8][i] = 0; if (m[i][8] == null) m[i][8] = 0; }
    for (let i = 0; i < 8; i++) { if (m[8][n - 1 - i] == null) m[8][n - 1 - i] = 0; if (m[n - 1 - i][8] == null) m[n - 1 - i][8] = 0; }
    m[n - 8][8] = 1;
  }
  function formatBits(mask) {
    let data = (0 << 3) | mask;
    let rem = data << 10;
    for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
    const bits = ((data << 10) | rem) ^ 0x5412;
    return bits & 0x7fff;
  }
  function applyFormat(m, mask) {
    const bits = formatBits(mask);
    const n = m.length;
    const coordsA = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    const coordsB = [];
    for (let i = 0; i < 7; i++) coordsB.push([n - 1 - i, 8]);
    coordsB.push([8, n - 8]);
    for (let i = 6; i >= 0; i--) coordsB.push([8, n - 1 - i]);
    for (let i = 0; i < 15; i++) {
      const bit = (bits >>> (14 - i)) & 1;
      m[coordsA[i][0]][coordsA[i][1]] = bit;
      m[coordsB[i][0]][coordsB[i][1]] = bit;
    }
  }
  function placeData(m, bits) {
    const n = m.length;
    let i = 0;
    for (let col = n - 1; col > 0; col -= 2) {
      let right = col;
      if (right <= 6) right--;
      for (let vertical = 0; vertical < n; vertical++) {
        for (let z = 0; z < 2; z++) {
          const j = right - z;
          let upwards = (right & 2) === 0;
          if (j < 6) upwards = !upwards;
          const row = upwards ? n - 1 - vertical : vertical;
          if (m[row][j] != null) continue;
          m[row][j] = i < bits.length ? bits[i++] : 0;
        }
      }
    }
  }
  function maskOf(mask, r, c) {
    if (mask === 0) return ((r + c) % 2) === 0;
    if (mask === 1) return (r % 2) === 0;
    if (mask === 2) return (c % 3) === 0;
    if (mask === 3) return ((r + c) % 3) === 0;
    if (mask === 4) return ((Math.floor(r / 2) + Math.floor(c / 3)) % 2) === 0;
    if (mask === 5) return ((r * c) % 2 + (r * c) % 3) === 0;
    if (mask === 6) return ((((r * c) % 2) + ((r * c) % 3)) % 2) === 0;
    return ((((r + c) % 2) + ((r * c) % 3)) % 2) === 0;
  }
  function penalty(m) {
    const n = m.length;
    let score = 0;
    for (let r = 0; r < n; r++) {
      let run = 1;
      for (let c = 1; c < n; c++) {
        if (m[r][c] === m[r][c - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    for (let c = 0; c < n; c++) {
      let run = 1;
      for (let r = 1; r < n; r++) {
        if (m[r][c] === m[r - 1][c]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) dark++;
    score += Math.floor(Math.abs(dark / (n * n) * 100 - 50) / 5) * 10;
    return score;
  }
  function build(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    const version = choose(bytes.length);
    if (!version) return null;
    const n = modules(version);
    const e = ECC[version];
    const data = [];
    const bits = [];
    function push(val, len) { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    push(0x4, 4);
    push(bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((b) => push(b, 8));
    const capBits = capacity(version) * 8;
    const term = Math.min(4, capBits - bits.length);
    push(0, term);
    while (bits.length % 8) bits.push(0);
    const pads = [0xec, 0x11];
    let pi = 0;
    while (bits.length < capBits) { push(pads[pi], 8); pi ^= 1; }
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let b = 0; b < 8; b++) v = (v << 1) | bits[i + b];
      data.push(v);
    }
    const blocks = [];
    let offset = 0;
    function take(count, size) {
      for (let i = 0; i < count; i++) {
        const chunk = data.slice(offset, offset + size);
        offset += size;
        blocks.push(chunk.concat(rs(chunk, e[0])));
      }
    }
    take(e[1], e[2]);
    take(e[3], e[4]);
    const out = [];
    const maxLen = Math.max(...blocks.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) blocks.forEach((b) => { if (i < b.length - e[0]) out.push(b[i]); });
    for (let i = 0; i < e[0]; i++) blocks.forEach((b) => out.push(b[b.length - e[0] + i]));
    const stream = [];
    out.forEach((byte) => { for (let i = 7; i >= 0; i--) stream.push((byte >>> i) & 1); });
    const remainder = [0,0,7,7,7,7,7,0,0,0,0,0,0,0,3,3,3,3,3,3,3][version] || 0;
    for (let i = 0; i < remainder; i++) stream.push(0);
    let best = null, bestScore = Infinity, bestMask = 0;
    for (let mask = 0; mask < 8; mask++) {
      const m = Array.from({ length: n }, () => Array(n).fill(null));
      finder(m, 0, 0); finder(m, 0, n - 7); finder(m, n - 7, 0);
      alignment(m, version);
      for (let i = 0; i < n; i++) { set(m, 6, i, i % 2 === 0); set(m, i, 6, i % 2 === 0); }
      if (version >= 7) { /* version bits omitted: we stay under version 7 when possible, and add them below */ }
      if (version >= 7) placeVersion(m, version);
      reserveFormat(m);
      placeData(m, stream);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c] != null && !(r === 8 || c === 8)) {
        /* data already placed into nulls; format cells are 0 and should be masked only if they were data. Format is applied after. */
      }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const reserved = isReserved(version, n, r, c);
        if (!reserved && maskOf(mask, r, c)) m[r][c] ^= 1;
      }
      applyFormat(m, mask);
      placeVersion(m, version);
      const score = penalty(m);
      if (score < bestScore) { bestScore = score; best = m; bestMask = mask; }
    }
    return best;
  }
  function versionBits(version) {
    let rem = version << 12;
    for (let i = 17; i >= 12; i--) if ((rem >>> i) & 1) rem ^= 0x1f25 << (i - 12);
    return ((version << 12) | rem) & 0x3ffff;
  }
  function placeVersion(m, version) {
    if (version < 7) return;
    const bits = versionBits(version);
    const n = m.length;
    for (let i = 0; i < 18; i++) {
      const bit = (bits >>> i) & 1;
      const a = Math.floor(i / 3);
      const b = i % 3;
      m[a][n - 11 + b] = bit;
      m[n - 11 + b][a] = bit;
    }
  }
  function isReserved(version, n, r, c) {
    if (r < 9 && c < 9) return true;
    if (r < 9 && c >= n - 8) return true;
    if (r >= n - 8 && c < 9) return true;
    if (r === 6 || c === 6) return true;
    const pos = ALIGN[version];
    for (const ar of pos) for (const ac of pos) {
      if (Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2) {
        if (ar < 9 && ac < 9) continue;
        if (ar < 9 && ac > n - 10) continue;
        if (ar > n - 10 && ac < 9) continue;
        return true;
      }
    }
    if (r === 8 && (c < 9 || c >= n - 8)) return true;
    if (c === 8 && (r < 9 || r >= n - 8)) return true;
    if (version >= 7 && ((r < 6 && c >= n - 11 && c < n - 8) || (c < 6 && r >= n - 11 && r < n - 8))) return true;
    return false;
  }
  function draw(canvas, text, scale) {
    const m = build(text);
    if (!m || !canvas) return false;
    const s = scale || 4;
    const q = 4;
    const n = m.length;
    canvas.width = (n + q * 2) * s;
    canvas.height = canvas.width;
    const g = canvas.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect((c + q) * s, (r + q) * s, s, s);
    return true;
  }
  root.drewQR = { build, draw };
})(typeof window !== "undefined" ? window : globalThis);

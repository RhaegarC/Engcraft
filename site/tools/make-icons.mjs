#!/usr/bin/env node
/* Generate Pronoun Trainer app icons (PNG) with zero dependencies (Node only).

   Design: playful rounded tile with a purple->orange vertical gradient, a white
   speech-bubble (pill + tail) with three dark-purple dots. Rendered with 4x
   supersampling for smooth edges, then box-downsampled to the output sizes.
   Usage: node tools/make-icons.mjs
*/
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
const SIZES = [512, 192, 180];

const TOP = [108, 92, 231];     // #6C5CE7 purple
const BOT = [255, 159, 67];     // #FF9F43 orange
const BUBBLE = [255, 255, 255];
const DOT = [95, 39, 205];      // #5F27CD

function render(size) {
  const SS = 4; // supersample factor

  // geometry in final-size units
  const m = size * 0.05;
  const [x0, y0, x1, y1] = [m, m, size - m, size - m];
  const R = size * 0.20; // outer corner radius

  const bw = size * 0.56, bh = size * 0.30;        // bubble size
  const bxc = size * 0.5, byc = size * 0.46;       // bubble center
  const [BX0, BY0, BX1, BY1] = [bxc - bw / 2, byc - bh / 2, bxc + bw / 2, byc + bh / 2];
  const br = bh / 2; // pill end radius

  const tx0 = BX0 + bw * 0.20; // tail (downward triangle on bubble bottom)
  const tx1 = BX0 + bw * 0.46;
  const ty0 = BY1;
  const ty1 = BY1 + size * 0.11;
  const txc = (tx0 + tx1) / 2;

  const dr = size * 0.050; // dot radius
  const dcx = [BX0 + bw * 0.30, bxc, BX0 + bw * 0.70];
  const dcy = byc;

  function inPill(x, y) {
    const cx = Math.min(Math.max(x, BX0 + br), BX1 - br);
    const cy = Math.min(Math.max(y, BY0), BY1);
    return (x - cx) ** 2 + (y - cy) ** 2 <= br * br || (BX0 + br <= x && x <= BX1 - br && BY0 <= y && y <= BY1);
  }

  function inTri(x, y) {
    const sign = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    const d1 = sign([x, y], [tx0, ty0], [tx1, ty0]);
    const d2 = sign([x, y], [tx1, ty0], [txc, ty1]);
    const d3 = sign([x, y], [txc, ty1], [tx0, ty0]);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  function tag(x, y) {
    if (x < x0 || x > x1 || y < y0 || y > y1) return "out";
    const cx = Math.min(Math.max(x, x0 + R), x1 - R);
    const cy = Math.min(Math.max(y, y0 + R), y1 - R);
    if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) return "out";
    if (inPill(x, y) || inTri(x, y)) {
      for (const c of dcx) if ((x - c) ** 2 + (y - dcy) ** 2 <= dr * dr) return "dot";
      return "bubble";
    }
    return "bg";
  }

  const rgba = Buffer.alloc(size * size * 4);
  const counts = { bg: 0, bubble: 0, dot: 0, out: 0 };
  for (let py = 0; py < size; py++) {
    const t = Math.min(1, Math.max(0, (py + 0.5) / size));
    const bgc = [0, 1, 2].map((i) => Math.round(TOP[i] + (BOT[i] - TOP[i]) * t));
    for (let px = 0; px < size; px++) {
      counts.bg = counts.bubble = counts.dot = counts.out = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          counts[tag(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS)]++;
        }
      }
      const n = SS * SS;
      let r = 0, g = 0, b = 0, a = 0;
      for (const [name, col] of [["bg", bgc], ["bubble", BUBBLE], ["dot", DOT]]) {
        const c = counts[name];
        if (c) { r += col[0] * c; g += col[1] * c; b += col[2] * c; a += 255 * c; }
      }
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return rgba;
}

function downsample(rgba, src, dst) {
  const out = Buffer.alloc(dst * dst * 4);
  const f = src / dst;
  for (let py = 0; py < dst; py++) {
    for (let px = 0; px < dst; px++) {
      const [x0, x1, y0, y1] = [Math.floor(px * f), Math.floor((px + 1) * f), Math.floor(py * f), Math.floor((py + 1) * f)];
      let rs = 0, gs = 0, bs = 0, as = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * src + xx) * 4;
          rs += rgba[i]; gs += rgba[i + 1]; bs += rgba[i + 2]; as += rgba[i + 3];
        }
      }
      const n = (x1 - x0) * (y1 - y0);
      const i = (py * dst + px) * 4;
      out[i] = Math.round(rs / n);
      out[i + 1] = Math.round(gs / n);
      out[i + 2] = Math.round(bs / n);
      out[i + 3] = Math.round(as / n);
    }
  }
  return out;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ ~0) >>> 0;
}

function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  const chunk = (tag, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const type = Buffer.from(tag, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
    return Buffer.concat([len, type, data, crc]);
  };

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
const big = render(512);
const files = {
  "icon-512.png": [512, big],
  "icon-192.png": [192, downsample(big, 512, 192)],
  "apple-touch-icon.png": [180, downsample(big, 512, 180)],
};
for (const [name, [size, data]] of Object.entries(files)) {
  const path = join(OUT, name);
  const pngBuf = png(size, size, data);
  writeFileSync(path, pngBuf);
  console.log("wrote", path, pngBuf.length, "bytes");
}

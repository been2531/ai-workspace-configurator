// @ts-check
'use strict'
/**
 * Generates a clean 128×128 PNG icon.
 * Design: dark navy bg + single bold lightning bolt, 4× supersampling AA.
 * Pure Node.js — no external deps.
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const W = 128, H = 128
const px = Buffer.alloc(W * H * 4, 0)

// ─── Primitives ──────────────────────────────────────────────────────────────

function setRGBA(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 4
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a
}

function blendRGBA(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 4
  const sa = a / 255, da = px[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa < 1e-4) return
  px[i]     = ((r * sa + px[i]     * da * (1 - sa)) / oa) | 0
  px[i + 1] = ((g * sa + px[i + 1] * da * (1 - sa)) / oa) | 0
  px[i + 2] = ((b * sa + px[i + 2] * da * (1 - sa)) / oa) | 0
  px[i + 3] = (oa * 255) | 0
}

/** True if (qx,qy) is inside the rounded rect */
function inRRect(qx, qy, rx, ry, rw, rh, rad) {
  if (qx < rx || qx >= rx + rw || qy < ry || qy >= ry + rh) return false
  const inL = qx < rx + rad, inR = qx >= rx + rw - rad
  const inT = qy < ry + rad, inB = qy >= ry + rh - rad
  if ((inL || inR) && (inT || inB)) {
    const cx = inL ? rx + rad : rx + rw - rad
    const cy = inT ? ry + rad : ry + rh - rad
    return (qx - cx) ** 2 + (qy - cy) ** 2 <= rad ** 2
  }
  return true
}

/** Point-in-polygon (even-odd rule) — accepts fractional coordinates */
function inPoly(qx, qy, pts) {
  let inside = false
  const n = pts.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    if (((yi > qy) !== (yj > qy)) && qx < (xj - xi) * (qy - yi) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

/**
 * Returns a [0,1] coverage value for pixel (x,y) against a polygon.
 * Uses 4×4 sub-pixel grid sampling for smooth anti-aliased edges.
 */
function coverage4x(x, y, pts) {
  let hits = 0
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const fx = x + (sx + 0.5) / 4
      const fy = y + (sy + 0.5) / 4
      if (inPoly(fx, fy, pts)) hits++
    }
  }
  return hits / 16
}

// ─── Design ──────────────────────────────────────────────────────────────────

// 1. Background: dark navy → deeper at bottom, with subtle center warmth
for (let y = 0; y < H; y++) {
  const t = y / (H - 1)
  // #13112a → #080816
  const bgR = ((0x13 * (1 - t) + 0x08 * t)) | 0
  const bgG = ((0x11 * (1 - t) + 0x08 * t)) | 0
  const bgB = ((0x2a * (1 - t) + 0x16 * t)) | 0
  for (let x = 0; x < W; x++) {
    if (inRRect(x, y, 0, 0, W, H, 24)) {
      setRGBA(x, y, bgR, bgG, bgB, 255)
    }
  }
}

// 2. Very subtle inner glow (center highlight, barely visible)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (!inRRect(x, y, 0, 0, W, H, 24)) continue
    const d = Math.sqrt((x - 64) ** 2 + (y - 55) ** 2)
    if (d < 60) {
      const t = Math.max(0, 1 - d / 60)
      blendRGBA(x, y, 0x4f, 0x46, 0xdc, (t * t * 28) | 0)
    }
  }
}

// ─── Lightning bolt shape ─────────────────────────────────────────────────────
//
// 6-point polygon, scaled for 128×128, with a clean "⚡" silhouette.
// The "notch" (y=63 vs y=65) prevents degenerate scanlines.
//
//     P1(76,10)
//    ╱         ╲ P6(70,63)
//   ╱  upper    ──P5(85,63)
// P2(43,65)──P3(59,65)
//   ╲  lower   ╱
//    ╲         P4(43,118)
//

const bolt = [
  [76, 10],  // 1 top-right
  [43, 65],  // 2 mid-left (lower notch top-left)
  [59, 65],  // 3 mid-right of notch
  [43, 118], // 4 bottom tip (slightly left for natural look)
  [85, 63],  // 5 far right  (2px above notch to avoid degenerate scanline)
  [70, 63],  // 6 notch-left (upper half right)
]

// Color: upper = #f0f4ff (near-white) → lower = #a5b4fc (indigo-300)
// Calculated per-pixel by y-position within the bolt's bounding box.
for (let y = 0; y < H; y++) {
  const t = Math.max(0, Math.min(1, (y - 10) / (118 - 10)))
  // Near-white → indigo gradient
  const bR = ((0xf0 * (1 - t) + 0xa5 * t)) | 0
  const bG = ((0xf4 * (1 - t) + 0xb4 * t)) | 0
  const bB = ((0xff * (1 - t) + 0xfc * t)) | 0

  for (let x = 0; x < W; x++) {
    if (!inRRect(x, y, 0, 0, W, H, 24)) continue

    const cov = coverage4x(x, y, bolt)
    if (cov > 0) {
      blendRGBA(x, y, bR, bG, bB, (cov * 255) | 0)
    }
  }
}

// ─── Thin inner highlight line along left edge of bolt ───────────────────────
// Makes the bolt look slightly three-dimensional / glowing

const hiLine = [
  [65, 12],  // near P1
  [56, 12],  // left of P1
  [35, 63],  // near P2
  [42, 63],  // right of P2 (thin strip)
]

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (!inRRect(x, y, 0, 0, W, H, 24)) continue
    const cov = coverage4x(x, y, hiLine)
    if (cov > 0) {
      // White highlight at 40% max opacity — subtle
      blendRGBA(x, y, 0xff, 0xff, 0xff, (cov * 100) | 0)
    }
  }
}

// ─── Write PNG ───────────────────────────────────────────────────────────────

function crc32(data) {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  let crc = 0xFFFFFFFF
  for (const b of data) crc = t[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const ty = Buffer.from(type)
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length)
  const c = Buffer.allocUnsafe(4); c.writeUInt32BE(crc32(Buffer.concat([ty, data])))
  return Buffer.concat([l, ty, data, c])
}

const ihdr = Buffer.allocUnsafe(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

const rows = []
for (let y = 0; y < H; y++) {
  rows.push(0) // PNG filter: None
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    rows.push(px[i], px[i + 1], px[i + 2], px[i + 3])
  }
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(Buffer.from(rows), { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

const out = path.join(__dirname, 'icon.png')
fs.writeFileSync(out, png)
console.log(`✓ icon.png (${(png.length / 1024).toFixed(1)} KB)`)

import type { Breakdown, Features } from './types'

/**
 * In-browser visual feature extractor. Mirrors backend/matcher.py:
 *  1. Estimate the background from the border and mask it out.
 *  2. 16x4x4 HSV color histogram of foreground pixels (L1 normalized).
 *  3. Sobel edge density + 4x4 spatial edge grid.
 *  4. Shape descriptor: foreground bounding-box aspect ratio and fill ratio.
 */
const N = 64
const HBINS = 16
const SBINS = 4
const VBINS = 4
const BG_DIST = 36
const EDGE_T = 120

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max === 0 ? 0 : d / max, max]
}

export function colorName(h: number, s: number, v: number): string {
  if (v < 0.22) return 'black'
  if (s < 0.14) return v > 0.82 ? 'white' : 'gray'
  if (h < 15 || h >= 345) return v < 0.45 ? 'maroon' : 'red'
  if (h < 40) return v < 0.6 ? 'brown' : 'orange'
  if (h < 68) return 'yellow'
  if (h < 165) return 'green'
  if (h < 255) return s < 0.45 && v > 0.7 ? 'light blue' : 'blue'
  if (h < 300) return 'purple'
  return 'pink'
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

export function extractFeatures(img: HTMLImageElement | HTMLCanvasElement): Features {
  const sw = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width
  const sh = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height
  const canvas = document.createElement('canvas')
  canvas.width = N
  canvas.height = N
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const side = Math.min(sw, sh)
  ctx.drawImage(img, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, N, N)
  const { data } = ctx.getImageData(0, 0, N, N)

  // 1. background estimate from the border
  const br: number[] = [], bgc: number[] = [], bb: number[] = []
  for (let i = 0; i < N; i++) {
    for (const [x, y] of [[i, 0], [i, N - 1], [0, i], [N - 1, i]]) {
      const p = (y * N + x) * 4
      br.push(data[p]); bgc.push(data[p + 1]); bb.push(data[p + 2])
    }
  }
  const mr = median(br), mg = median(bgc), mb = median(bb)
  const mask = new Uint8Array(N * N)
  let fgCount = 0
  for (let i = 0; i < N * N; i++) {
    const dr = data[i * 4] - mr, dg = data[i * 4 + 1] - mg, db = data[i * 4 + 2] - mb
    if (Math.sqrt(dr * dr + dg * dg + db * db) > BG_DIST) { mask[i] = 1; fgCount++ }
  }
  const frac = fgCount / (N * N)
  if (frac < 0.03 || frac > 0.92) { mask.fill(1); fgCount = N * N }

  // 2. HSV histogram + color names
  const hist = new Array<number>(HBINS * SBINS * VBINS).fill(0)
  const names = new Map<string, number>()
  for (let i = 0; i < N * N; i++) {
    if (!mask[i]) continue
    const [h, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
    const hb = s < 0.12 ? 0 : Math.floor((h / 360) * HBINS) % HBINS
    const sb = Math.min(SBINS - 1, Math.floor(s * SBINS))
    const vb = Math.min(VBINS - 1, Math.floor(v * VBINS))
    hist[(hb * SBINS + sb) * VBINS + vb] += 1
    const n = colorName(h, s, v)
    names.set(n, (names.get(n) ?? 0) + 1)
  }
  for (let i = 0; i < hist.length; i++) hist[i] /= fgCount
  const colors = [...names.entries()]
    .filter(([, c]) => c / fgCount >= 0.12)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n]) => n)

  // 3. Sobel edges
  const gray = new Float32Array(N * N)
  for (let i = 0; i < N * N; i++) gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  const gridCounts = new Array<number>(16).fill(0)
  let edges = 0
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const g = (dx: number, dy: number) => gray[(y + dy) * N + x + dx]
      const gx = -g(-1, -1) - 2 * g(-1, 0) - g(-1, 1) + g(1, -1) + 2 * g(1, 0) + g(1, 1)
      const gy = -g(-1, -1) - 2 * g(0, -1) - g(1, -1) + g(-1, 1) + 2 * g(0, 1) + g(1, 1)
      if (Math.hypot(gx, gy) > EDGE_T) {
        edges++
        gridCounts[Math.floor((y / N) * 4) * 4 + Math.floor((x / N) * 4)]++
      }
    }
  }
  const cell = (N / 4) * (N / 4)
  const grid = gridCounts.map((c) => c / cell)
  const edge = edges / ((N - 2) * (N - 2))

  // 4. shape: bbox aspect + fill
  let minX = N, minY = N, maxX = -1, maxY = -1
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (mask[y * N + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1
  const aspect = bw / bh
  const fill = fgCount / (bw * bh)

  return { hist, edge, grid, aspect, fill, colors }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

const ratio = (a: number, b: number) => (Math.max(a, b) <= 1e-9 ? 1 : Math.min(a, b) / Math.max(a, b))

export function visualSimilarity(a: Features, b: Features): { score: number; parts: Breakdown } {
  let color = 0
  for (let i = 0; i < a.hist.length; i++) color += Math.min(a.hist[i], b.hist[i])
  const edge = 0.6 * cosine(a.grid, b.grid) + 0.4 * ratio(a.edge, b.edge)
  const shape = 0.5 * ratio(a.aspect, b.aspect) + 0.5 * ratio(a.fill, b.fill)
  return { score: 0.6 * color + 0.25 * edge + 0.15 * shape, parts: { color, edge, shape } }
}

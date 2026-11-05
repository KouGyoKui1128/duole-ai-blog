// Generative line-art covers, ported from docs/design/duole-site.html. The same
// kind and seed always draw the same picture.

export type CoverKind = "chain" | "graph" | "rings" | "loop" | "lines" | "bars"

type Ink = (alpha: number) => string
type Draw = (c: CanvasRenderingContext2D, w: number, h: number, r: () => number, ink: Ink, hot: string, art: string) => void

interface GraphNode {
  x: number
  y: number
  on?: boolean
}

const ARTICLE_COVER_BY_TAG: [string, CoverKind][] = [
  ["langgraph", "graph"],
  ["rag", "rings"],
  ["ai agent", "loop"],
  ["langchain", "chain"],
]

export function articleCoverKind(tags: { name: string }[]): CoverKind {
  const names = tags.map((tag) => tag.name.toLowerCase())
  return ARTICLE_COVER_BY_TAG.find(([name]) => names.includes(name))?.[1] ?? "lines"
}

export function projectCoverKind(slug: string): CoverKind {
  return seedOf(slug) % 2 === 0 ? "lines" : "bars"
}

export function seedOf(text: string): number {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createRandom(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const ART: Record<CoverKind, Draw> = {
  chain(c, w, h, r, ink, hot) {
    const n = 9
    const ph = r() * 6
    const step = w / (n - 1.4)
    for (let i = 0; i < n; i++) {
      const x = (i - 0.2) * step
      const y = h / 2 + Math.sin(i * 0.75 + ph) * h * 0.13
      const rot = i % 2 ? 0.55 : -0.55
      for (let k = 0; k < 11; k++) {
        c.beginPath()
        c.ellipse(x, y, step * 0.78 * (1 - k * 0.07), h * 0.2 * (1 - k * 0.07), rot, 0, 7)
        c.strokeStyle = i === 4 && k === 0 ? hot : ink(0.1 + (k === 0 ? 0.34 : 0.13))
        c.stroke()
      }
    }
  },
  graph(c, w, h, r, ink, hot, art) {
    const L = 6
    const layers: GraphNode[][] = []
    for (let l = 0; l < L; l++) {
      const count = l === 0 || l === L - 1 ? 1 : 3 + Math.floor(r() * 4)
      const col: GraphNode[] = []
      for (let i = 0; i < count; i++) {
        col.push({ x: w * (0.08 + (0.84 * l) / (L - 1)), y: h * ((i + 1) / (count + 1)) + (r() - 0.5) * h * 0.06 })
      }
      layers.push(col)
    }
    for (let l = 0; l < L - 1; l++) {
      for (const a of layers[l]) {
        for (const b of layers[l + 1]) {
          if (r() < 0.18) continue
          c.beginPath()
          c.moveTo(a.x, a.y)
          const mx = (a.x + b.x) / 2
          c.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y)
          c.strokeStyle = ink(0.24)
          c.stroke()
        }
      }
    }
    let at = layers[0][0]
    c.lineWidth *= 1.6
    for (let l = 1; l < L; l++) {
      const b = layers[l][Math.floor(r() * layers[l].length)]
      const mx = (at.x + b.x) / 2
      c.beginPath()
      c.moveTo(at.x, at.y)
      c.bezierCurveTo(mx, at.y, mx, b.y, b.x, b.y)
      c.strokeStyle = hot
      c.stroke()
      b.on = true
      at = b
    }
    layers[0][0].on = true
    c.lineWidth /= 1.6
    for (const col of layers) {
      for (const p of col) {
        c.beginPath()
        c.arc(p.x, p.y, Math.max(3, h * 0.012), 0, 7)
        c.fillStyle = p.on ? hot : art
        c.fill()
        c.strokeStyle = p.on ? hot : ink(0.6)
        c.stroke()
      }
    }
  },
  rings(c, w, h, r, ink, hot) {
    const cx = w * 0.62
    const cy = h * 0.54
    const max = Math.hypot(w, h) * 0.62
    const n = 34
    for (let i = 1; i <= n; i++) {
      const R = (max * i) / n
      const seg = 3 + Math.floor(r() * 6)
      for (let s = 0; s < seg; s++) {
        const a = r() * 6.28
        const b = a + 0.2 + r() * 1.3
        c.beginPath()
        c.arc(cx, cy, R, a, b)
        c.strokeStyle = ink(0.1 + 0.34 * (1 - i / n))
        c.stroke()
      }
    }
    for (let i = 0; i < 7; i++) {
      const R = max * (0.08 + r() * 0.42)
      const a = -1.1 + r() * 1.1
      c.beginPath()
      c.moveTo(cx, cy)
      c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
      c.strokeStyle = ink(0.2)
      c.stroke()
      c.beginPath()
      c.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, Math.max(2.5, h * 0.01), 0, 7)
      c.fillStyle = hot
      c.fill()
    }
  },
  loop(c, w, h, r, ink, hot) {
    const cx = w / 2
    const cy = h / 2
    const A = w * 0.44
    const B = h * 0.42
    for (let k = 0; k < 26; k++) {
      const d = k * 0.045 + r() * 0.004
      c.beginPath()
      for (let t = 0; t <= 6.3; t += 0.02) {
        const x = cx + A * Math.sin(3 * t + d)
        const y = cy + B * Math.sin(2 * t)
        if (t === 0) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      c.strokeStyle = k === 13 ? hot : ink(0.15)
      c.stroke()
    }
  },
  lines(c, w, h, r, ink, hot) {
    const gap = Math.max(11, h / 30)
    const left = w * 0.1
    const right = w * 0.9
    let row = 0
    for (let y = gap * 2; y < h - gap; y += gap, row++) {
      let x = left + (row % 7 === 0 ? w * 0.05 : 0)
      const end = row % 7 === 6 ? left + (right - left) * (0.3 + r() * 0.4) : right
      while (x < end) {
        const len = Math.min(10 + r() * 62, end - x)
        c.beginPath()
        c.moveTo(x, y)
        c.lineTo(x + len, y)
        c.strokeStyle = r() < 0.025 ? hot : ink(0.14 + r() * 0.28)
        c.stroke()
        x += len + 7
      }
    }
  },
  bars(c, w, h, r, ink, hot) {
    const rows = 15
    const rh = h / (rows + 2)
    for (let i = 1; i < 9; i++) {
      c.beginPath()
      c.moveTo((w * i) / 9, 0)
      c.lineTo((w * i) / 9, h)
      c.strokeStyle = ink(0.08)
      c.stroke()
    }
    let x = w * 0.06
    for (let i = 1; i <= rows; i++) {
      const len = w * (0.06 + r() * 0.26)
      const y = i * rh + rh * 0.2
      c.strokeStyle = i === 8 ? hot : ink(0.4)
      c.fillStyle = i === 8 ? hot : ink(0.06)
      c.fillRect(x, y, len, rh * 0.6)
      c.strokeRect(x, y, len, rh * 0.6)
      x = x + len * (0.2 + r() * 0.7) - (x > w * 0.62 ? w * 0.36 : 0)
    }
  },
}

export function paintCover(canvas: HTMLCanvasElement, kind: CoverKind, seed: string): void {
  const box = canvas.getBoundingClientRect()
  const context = canvas.getContext("2d")
  if (!context || box.width < 2 || box.height < 2) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(box.width * dpr)
  canvas.height = Math.round(box.height * dpr)
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  const art = cssVar("--art")
  const rgb = cssVar("--ink-rgb")
  context.fillStyle = art
  context.fillRect(0, 0, box.width, box.height)
  context.lineWidth = 0.8
  ART[kind](context, box.width, box.height, createRandom(seedOf(seed)), (alpha) => `rgba(${rgb},${alpha})`, cssVar("--brass"), art)
}

export function onThemeChange(listener: () => void): () => void {
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  return () => observer.disconnect()
}

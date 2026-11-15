'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { useReadingProgress, type ReadingProgress } from "@/components/blog/reading-progress"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"

/*
 * The left-margin dot-matrix panel, ported from docs/design/article-detail.html.
 * Top half: an LED readout of where the reader is. Bottom half: a small game where a pixel
 * robot patrols the floor and runs to collect an item each time reading passes a threshold.
 */

type PanelCopy = (typeof SECTION_COPY)["zh"]["panel"]

const GAP = 10
const JUMP_SECONDS = 0.5
const FONT: Record<string, string[]> = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  "%": ["11000", "11001", "00010", "00100", "01000", "10011", "00011"],
}
// 7 x 8 robot: # body, e eye or antenna light. Two walking frames.
const BOT = [
  ["...e...", "...#...", ".#####.", ".#e#e#.", ".#####.", "..###..", ".#####.", ".#...#."],
  ["...e...", "...#...", ".#####.", ".#e#e#.", ".#####.", "..###..", ".#####.", "..#.#.."],
]
const ITEMS = [
  { at: 20, px: [".##..", "#..#.", ".##..", "..#..", "..##."] },
  { at: 40, px: [".#.#.", "#####", "#...#", "#####", ".#.#."] },
  { at: 60, px: [".###.", "#####", ".###.", "..#..", "....."] },
  { at: 80, px: ["..#..", ".###.", "#####", ".###.", ".#.#."] },
  { at: 97, px: ["#####", "#####", ".###.", "..#..", ".###."] },
]
export const PANEL_ITEM_COUNT = ITEMS.length
// Layout rows of the readout.
const R = { glyph: 4, title: 12, bar: 14, read: 16, rule: 18, bag: 20 }

const pad = (n: number) => String(n).padStart(2, "0")

interface PanelOptions {
  canvas: HTMLCanvasElement
  host: HTMLElement
  readMinutes: number
  copy: PanelCopy
  paused: boolean
  onGot: (got: number) => void
}

interface Panel {
  setProgress: (progress: ReadingProgress) => void
  setPaused: (paused: boolean) => void
  destroy: () => void
}

function createPanel({ canvas, host, readMinutes, copy, paused: startPaused, onGot }: PanelOptions): Panel {
  const cx = canvas.getContext("2d")!
  const born = performance.now()
  const pointer = { x: -999, y: -999 }
  const S = { pct: 0, n: 0, idx: -1, title: "" }
  const G = {
    x: 2, dir: 1, moving: false, stepAcc: 0, frame: 0, rest: 0, jump: 0, got: 0,
    item: null as { k: number; x: number } | null,
    pops: [] as { text: string; x: number; t: number }[],
    sparks: [] as { x: number; y: number; vx: number; vy: number; t: number }[],
  }
  let W = 0, H = 0, cols = 0, rows = 0, oy = 0
  let C = { ink: "", brass: "", fg: "", mono: "" }
  let paused = startPaused, onScreen = true, raf = 0, lastT = 0, reportedGot = 0

  const reportGot = () => {
    if (G.got !== reportedGot) {
      reportedGot = G.got
      onGot(G.got)
    }
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement)
    C = {
      ink: cs.getPropertyValue("--ink-rgb").trim(),
      brass: cs.getPropertyValue("--brass").trim(),
      fg: cs.getPropertyValue("--fg").trim(),
      mono: cs.getPropertyValue("--mono").trim() || "monospace",
    }
  }
  const ink = (a: number) => `rgba(${C.ink},${a})`

  function fit() {
    const b = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = b.width; H = b.height; cols = Math.floor(W / GAP); rows = Math.floor(H / GAP); oy = (H - rows * GAP) / 2
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (!G.item && G.got < ITEMS.length && cols) G.item = spawn(G.got)
  }

  const ground = () => rows - 2
  const cellX = (c: number) => c * GAP + GAP / 2
  const cellY = (r: number) => oy + r * GAP + GAP / 2
  const block = (c: number, r: number, color: string, size: number) => {
    cx.fillStyle = color
    cx.fillRect(cellX(c) - size / 2, cellY(r) - size / 2, size, size)
  }
  const reached = () => ITEMS.filter((i) => S.pct >= i.at).length

  function spawn(k: number) {
    if (k >= ITEMS.length) return null
    // Keep the item where the robot can stand centred on it: x in [2, cols - 7].
    const max = Math.max(1, cols - 8)
    let x = 2 + Math.floor(Math.random() * max)
    for (let tries = 0; tries < 12 && Math.abs(x + 2 - (G.x + 3)) < 6; tries++) x = 2 + Math.floor(Math.random() * max)
    return { k, x }
  }

  /* game step */
  function update(dt: number) {
    if (!cols) return
    G.jump = Math.max(0, G.jump - dt)
    // The pause after a pickup counts down every frame, whatever the robot is doing.
    if (G.rest > 0) G.rest -= dt
    const unlocked = G.item !== null && G.got < reached()
    let speed = 0
    if (unlocked && G.item) {
      const target = Math.min(cols - 8, Math.max(1, G.item.x - 1))
      const d = target - G.x
      G.dir = Math.sign(d) || G.dir
      speed = G.rest > 0 ? 0 : 9
      if (Math.abs(d) < 0.35) {
        G.got++; G.jump = JUMP_SECONDS; G.rest = 0.7
        G.pops.push({ text: `+${copy.itemNames[G.item.k]}`, x: G.x + 3, t: 0 })
        for (let i = 0; i < 10; i++) {
          G.sparks.push({ x: G.item.x + 2, y: ground() - 3, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 8, t: 0 })
        }
        G.item = spawn(G.got)
        speed = 0
        reportGot()
      }
    } else if (G.got >= ITEMS.length) {
      if (G.jump === 0 && Math.random() < dt * 0.9) G.jump = JUMP_SECONDS
      if (Math.random() < dt * 0.25) G.dir *= -1
      speed = 2
    } else if (G.rest > 0) {
      // standing still for a moment
    } else {
      speed = 3
      if (Math.random() < dt * 0.18) G.rest = 0.8 + Math.random() * 1.2
      if (Math.random() < dt * 0.12) G.dir *= -1
    }
    if (speed && G.rest <= 0) {
      const nx = Math.min(cols - 8, Math.max(1, G.x + G.dir * speed * dt))
      if (!unlocked && (nx <= 1 || nx >= cols - 8)) G.dir *= -1
      G.stepAcc += Math.abs(nx - G.x); G.x = nx
      G.frame = Math.floor(G.stepAcc * 1.6) % 2; G.moving = true
    } else G.moving = false
    G.pops.forEach((p) => { p.t += dt })
    G.pops = G.pops.filter((p) => p.t < 1.3)
    G.sparks.forEach((s) => { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 26 * dt })
    G.sparks = G.sparks.filter((s) => s.t < 0.9)
  }

  /* drawing */
  function draw(t: number) {
    if (W < 40) return
    cx.clearRect(0, 0, W, H)
    const { n, i: cur } = S.n ? { n: S.n, i: Math.max(0, S.idx) } : { n: 10, i: Math.min(9, Math.floor(S.pct / 10)) }
    const g = ground()
    const scan = ((t / 26) % (H + 140)) - 70

    // 1. the dot field
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const px = cellX(c), py = cellY(r)
      const wave = 0.5 + 0.5 * Math.sin(c * 0.42 + t / 1500) * Math.cos(r * 0.19 - t / 2100)
      const sb = Math.max(0, 1 - Math.abs(py - scan) / 22) * 0.22
      const mb = Math.max(0, 1 - Math.hypot(px - pointer.x, py - pointer.y) / 64) * 0.4
      cx.fillStyle = ink(0.045 + wave * 0.07 + sb + mb)
      cx.beginPath(); cx.arc(px, py, 0.65 + wave * 0.45 + (sb + mb) * 1.2, 0, 7); cx.fill()
    }

    cx.font = `500 10.5px ${C.mono}`; cx.textBaseline = "middle"
    // 2. header: live light + elapsed time
    const live = !paused && Math.floor(t / 600) % 2 === 0
    block(0, 1, live ? C.brass : ink(0.3), 5)
    cx.fillStyle = ink(0.6); cx.textAlign = "left"; cx.fillText(paused ? copy.paused : copy.live, cellX(1) + 2, cellY(1))
    const s = Math.floor((performance.now() - born) / 1000)
    cx.textAlign = "right"; cx.fillText(`${pad(Math.floor(s / 60))}:${pad(s % 60)}`, W - 2, cellY(1))

    // 3. big LED glyph: step number, or percent when the article has no headings
    const text = S.n ? pad(cur + 1) : `${S.pct}%`
    ;[...text].forEach((ch, k) => {
      const f = FONT[ch]
      if (!f) return
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
        const cc = 1 + k * 6 + c, rr = R.glyph + r
        if (cc >= cols) continue
        if (f[r][c] === "1") { cx.shadowColor = C.brass; cx.shadowBlur = 8; block(cc, rr, C.brass, 8); cx.shadowBlur = 0 }
        else block(cc, rr, ink(0.07), 7)
      }
    })
    if (S.n) { cx.fillStyle = ink(0.5); cx.textAlign = "right"; cx.fillText(`/${pad(n)}`, W - 2, cellY(R.glyph + 6)) }

    // 4. current section name
    cx.textAlign = "left"; cx.fillStyle = C.fg
    let name = S.n ? S.title : copy.reading
    while (name.length > 1 && cx.measureText(name).width > W - 4) name = name.slice(0, -2) + "…"
    cx.fillText(name, 2, cellY(R.title))

    // 5. segmented progress bar
    const span = cols - 2
    for (let c = 0; c < span; c++) {
      const a = Math.floor((c / span) * n), b = Math.floor(((c + 1) / span) * n)
      if (b !== a && c < span - 1 && n <= span / 2) continue // gap between segments
      const lit = c / span < S.pct / 100
      block(1 + c, R.bar, lit ? C.brass : ink(0.14), lit ? 7 : 5)
    }
    cx.fillStyle = ink(0.6); cx.textAlign = "left"; cx.fillText(copy.read(S.pct), 2, cellY(R.read))
    const left = Math.max(0, Math.ceil(readMinutes * (1 - S.pct / 100)))
    cx.textAlign = "right"; cx.fillText(left ? copy.left(left) : copy.finished, W - 2, cellY(R.read))

    // 6. divider and inventory
    for (let c = 0; c < cols; c++) block(c, R.rule, ink(0.2), 2)
    cx.fillStyle = ink(0.6); cx.textAlign = "left"; cx.fillText(copy.items, 2, cellY(R.bag))
    ITEMS.forEach((_, i) => {
      const c = cols - 1 - (ITEMS.length - 1 - i) * 2
      if (i < G.got) { cx.shadowColor = C.brass; cx.shadowBlur = 6; block(c, R.bag, C.brass, 8); cx.shadowBlur = 0 }
      else { cx.strokeStyle = ink(0.35); cx.lineWidth = 1; cx.strokeRect(cellX(c) - 3.5, cellY(R.bag) - 3.5, 7, 7) }
    })

    // 7. floor
    for (let c = 0; c < cols; c++) block(c, g, ink(0.32), 4)

    // 8. the next item: dim while locked, glowing and bobbing once unlocked
    if (G.item) {
      const it = ITEMS[G.item.k], open = G.got < reached()
      const bob = open && !paused && Math.floor(t / 380) % 2 ? 1 : 0
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        if (it.px[r][c] !== "#") continue
        if (open) { cx.shadowColor = C.brass; cx.shadowBlur = 10; block(G.item.x + c, g - 6 + r - bob, C.brass, 8); cx.shadowBlur = 0 }
        else block(G.item.x + c, g - 6 + r, ink(0.18), 6)
      }
      cx.fillStyle = open ? C.brass : ink(0.45); cx.textAlign = "center"
      cx.fillText(open ? copy.grab : copy.unlocksAt(it.at), cellX(G.item.x + 2), cellY(g - 8))
    }

    // 9. the robot
    const hop = G.jump > 0 ? Math.round(Math.sin(Math.PI * (1 - G.jump / JUMP_SECONDS)) * 2.4) : 0
    const blink = Math.floor(t / 140) % 26 === 0
    const sprite = BOT[G.moving ? G.frame : 0], bx = Math.round(G.x), by = g - 8 - hop
    for (let r = 0; r < 8; r++) for (let c = 0; c < 7; c++) {
      const ch = sprite[r][G.dir < 0 ? 6 - c : c]
      if (ch === ".") continue
      const eye = ch === "e" && !(blink && r === 3)
      if (eye) { cx.shadowColor = C.brass; cx.shadowBlur = 6 }
      block(bx + c, by + r, eye ? C.brass : C.fg, 8)
      cx.shadowBlur = 0
    }

    // 10. pickups and celebration
    G.sparks.forEach((sp) => { cx.globalAlpha = 1 - sp.t / 0.9; block(sp.x, sp.y, C.brass, 4); cx.globalAlpha = 1 })
    G.pops.forEach((p) => {
      cx.globalAlpha = 1 - p.t / 1.3; cx.fillStyle = C.brass; cx.textAlign = "center"
      cx.fillText(p.text, cellX(p.x), cellY(g - 10) - p.t * 26); cx.globalAlpha = 1
    })
    if (G.got >= ITEMS.length) {
      cx.fillStyle = C.brass; cx.textAlign = "center"; cx.fillText(copy.allCollected, W / 2, cellY(R.bag + 3))
      if (!paused) for (let k = 0; k < 4; k++) {
        const a = t / 500 + k * 1.57
        block(bx + 3 + Math.cos(a) * 5, by + 2 + Math.sin(a) * 3, C.brass, 3)
      }
    }
  }

  const running = () => !paused && onScreen && document.visibilityState === "visible"
  function loop(t: number) {
    const dt = Math.min((t - (lastT || t)) / 1000, 0.05)
    lastT = t
    update(dt); draw(t)
    raf = running() ? requestAnimationFrame(loop) : 0
    if (!raf) lastT = 0
  }
  function kick() {
    if (!raf && running()) raf = requestAnimationFrame(loop)
  }
  // When the animation is stopped, items are collected at once and the frame is redrawn on demand.
  function still() {
    if (running()) return
    while (G.item && G.got < reached()) { G.got++; G.item = spawn(G.got) }
    reportGot()
    draw(performance.now())
  }

  const onClick = () => {
    if (G.jump !== 0) return
    G.jump = JUMP_SECONDS
    G.pops.push({ text: copy.hi, x: G.x + 3, t: 0 })
    if (!running()) still()
  }
  const onPointerMove = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect()
    pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top
  }
  const onVisibility = () => { kick(); still() }

  const resizeObserver = new ResizeObserver(() => { fit(); still() })
  const intersectionObserver = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; kick() })
  // The theme toggle flips data-theme on <html>; the colours are read from CSS, so read them again.
  const themeObserver = new MutationObserver(() => { readColors(); still() })

  canvas.addEventListener("click", onClick)
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  document.addEventListener("visibilitychange", onVisibility)
  resizeObserver.observe(canvas)
  intersectionObserver.observe(host)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  readColors(); fit(); still(); kick()

  return {
    setProgress(progress) {
      S.pct = progress.percent
      S.n = progress.sectionCount
      S.idx = progress.sectionIndex
      S.title = progress.sectionTitle
      still()
    },
    setPaused(next) {
      if (next === paused) return
      paused = next
      if (paused) { cancelAnimationFrame(raf); raf = 0; lastT = 0; still() }
      else kick()
    },
    destroy() {
      cancelAnimationFrame(raf)
      raf = 0
      canvas.removeEventListener("click", onClick)
      window.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("visibilitychange", onVisibility)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
    },
  }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches

export function ReadingPanel({ language, readMinutes }: { language: ArticleLanguage; readMinutes: number }) {
  const progress = useReadingProgress()
  const hostRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const panelRef = useRef<Panel | null>(null)
  // With reduced motion the panel stays paused, drawing still frames, unless the reader presses play.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)
  const [choice, setChoice] = useState<boolean | null>(null)
  const paused = choice ?? reducedMotion
  const [got, setGot] = useState(0)
  const copy = SECTION_COPY[language].panel

  useEffect(() => {
    const canvas = canvasRef.current, host = hostRef.current
    if (!canvas || !host) return
    const panel = createPanel({ canvas, host, readMinutes, copy, paused, onGot: setGot })
    panelRef.current = panel
    return () => {
      panel.destroy()
      panelRef.current = null
    }
    // The panel is created once per article; later changes reach it through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readMinutes, copy])

  useEffect(() => {
    panelRef.current?.setProgress(progress)
  }, [progress])

  useEffect(() => {
    panelRef.current?.setPaused(paused)
  }, [paused])

  // Turning reduced motion on overrides an earlier press of play.
  useEffect(() => subscribeReducedMotion(() => { if (prefersReducedMotion()) setChoice(null) }), [])

  return (
    <aside ref={hostRef} className="art-side" aria-label={copy.label}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="side-foot">
        <span className="label">{copy.caption(progress.percent, got, PANEL_ITEM_COUNT)}</span>
        <button className="side-btn" type="button" onClick={() => setChoice(!paused)}>
          {paused ? copy.play : copy.pause}
        </button>
      </div>
    </aside>
  )
}

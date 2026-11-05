'use client'

import { useEffect, useRef } from "react"

import { createRandom, cssVar, onThemeChange } from "@/lib/cover-art"

type Point = [number, number]

interface Edge {
  from: string
  to: string
  bend?: number
}

const NODES: Record<string, Point> = {
  START: [0.42, 0.5],
  plan: [0.52, 0.26],
  retrieve: [0.65, 0.12],
  tool_call: [0.67, 0.6],
  reflect: [0.79, 0.34],
  respond: [0.88, 0.68],
  END: [0.95, 0.22],
}

const EDGES: Edge[] = [
  { from: "START", to: "plan" },
  { from: "plan", to: "retrieve" },
  { from: "plan", to: "tool_call" },
  { from: "retrieve", to: "reflect" },
  { from: "tool_call", to: "reflect" },
  { from: "reflect", to: "plan", bend: 0.34 },
  { from: "reflect", to: "respond" },
  { from: "respond", to: "END" },
]

const NARROW_WIDTH = 760
const LEG_MS = 1050
const FAR_AWAY = -999

function startRun(canvas: HTMLCanvasElement, readout: HTMLElement, host: HTMLElement): () => void {
  const context = canvas.getContext("2d")
  if (!context) return () => {}
  const c = context

  const rand = createRandom(7)
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const mouse = { x: FAR_AWAY, y: FAR_AWAY }
  const stars = Array.from({ length: 70 }, () => ({ x: rand(), y: rand(), z: 0.3 + rand() * 0.7 }))
  const links = stars.map((star, i) =>
    stars
      .map((other, j): Point => [Math.hypot(star.x - other.x, star.y - other.y), j])
      .filter(([, j]) => j !== i)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2)
      .map(([, j]) => j)
  )

  let width = 0
  let height = 0
  let frame = 0
  let last = 0
  let progress = 0
  let loops = 0
  let node = "START"
  let leg: Edge | null = null
  let onScreen = true

  const fit = () => {
    const box = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = box.width
    height = box.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const position = (name: string): Point => {
    const [x, y] = NODES[name]
    return [(width < NARROW_WIDTH ? 0.1 + ((x - 0.42) / 0.53) * 0.8 : x) * width, y * height]
  }

  const control = (from: string, to: string, bend?: number): Point => {
    const [ax, ay] = position(from)
    const [bx, by] = position(to)
    const curve = bend || 0.1
    return [(ax + bx) / 2 - (by - ay) * curve, (ay + by) / 2 + (bx - ax) * curve]
  }

  const along = ({ from, to, bend }: Edge, k: number): Point => {
    const [ax, ay] = position(from)
    const [bx, by] = position(to)
    const [qx, qy] = control(from, to, bend)
    const u = 1 - k
    return [u * u * ax + 2 * u * k * qx + k * k * bx, u * u * ay + 2 * u * k * qy + k * k * by]
  }

  const nextNode = (from: string): string => {
    if (from === "START") return "plan"
    if (from === "plan") return rand() < 0.5 ? "retrieve" : "tool_call"
    if (from === "retrieve" || from === "tool_call") return "reflect"
    if (from === "reflect") {
      if (loops < 1 && rand() < 0.55) {
        loops++
        return "plan"
      }
      return "respond"
    }
    if (from === "respond") return "END"
    loops = 0
    return "START"
  }

  const advance = (from: string) => {
    const to = nextNode(from)
    node = to
    readout.textContent = to
    if (to === "START") {
      leg = null
      progress = -0.6
      return
    }
    leg = EDGES.find((edge) => edge.from === from && edge.to === to) ?? { from, to }
    progress = 0
  }

  const draw = () => {
    c.clearRect(0, 0, width, height)
    const rgb = cssVar("--ink-rgb")
    const hot = cssVar("--brass")
    const background = cssVar("--bg")
    const ink = (alpha: number) => `rgba(${rgb},${alpha})`

    const points = stars.map((star) => {
      const x = star.x * width
      const y = star.y * height
      const pull = Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / 190)
      return [x + (x - mouse.x) * pull * 0.16 * star.z, y + (y - mouse.y) * pull * 0.16 * star.z, pull]
    })

    c.lineWidth = 0.7
    links.forEach((targets, i) =>
      targets.forEach((j) => {
        const a = points[i]
        const b = points[j]
        c.beginPath()
        c.moveTo(a[0], a[1])
        c.lineTo(b[0], b[1])
        c.strokeStyle = ink(0.07 + Math.max(a[2], b[2]) * 0.3)
        c.stroke()
      })
    )
    points.forEach(([x, y, pull]) => {
      c.beginPath()
      c.arc(x, y, 1.2 + pull * 1.3, 0, 7)
      c.fillStyle = ink(0.28 + pull * 0.6)
      c.fill()
    })

    c.lineWidth = 1
    EDGES.forEach(({ from, to, bend }) => {
      const [ax, ay] = position(from)
      const [bx, by] = position(to)
      const [qx, qy] = control(from, to, bend)
      c.beginPath()
      c.moveTo(ax, ay)
      c.quadraticCurveTo(qx, qy, bx, by)
      c.strokeStyle = ink(0.3)
      if (bend) c.setLineDash([4, 6])
      c.stroke()
      c.setLineDash([])
    })

    if (leg) {
      const tailStart = Math.max(0, progress - 0.45)
      c.lineWidth = 1.6
      c.strokeStyle = hot
      c.beginPath()
      for (let k = tailStart; k <= progress; k += 0.02) {
        const [x, y] = along(leg, k)
        if (k === tailStart) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      c.stroke()
      const [x, y] = along(leg, progress)
      c.beginPath()
      c.arc(x, y, 3.4, 0, 7)
      c.fillStyle = hot
      c.fill()
    }

    c.font = `500 ${width < 560 ? 11 : 12.5}px ${cssVar("--mono")}`
    c.textBaseline = "middle"
    Object.keys(NODES).forEach((name) => {
      const [x, y] = position(name)
      const on = name === node
      const textWidth = c.measureText(name).width
      c.fillStyle = background
      c.fillRect(x - textWidth / 2 - 11, y - 14, textWidth + 22, 28)
      c.lineWidth = 1
      c.strokeStyle = on ? hot : ink(0.34)
      c.strokeRect(x - textWidth / 2 - 11, y - 14, textWidth + 22, 28)
      c.fillStyle = on ? hot : ink(0.82)
      c.fillText(name, x - textWidth / 2, y + 0.5)
    })
  }

  const tick = (now: number) => {
    const elapsed = Math.min(now - last, 60)
    last = now
    progress += elapsed / LEG_MS
    if (leg && progress >= 1) advance(leg.to)
    else if (!leg && progress >= 0) advance("START")
    draw()
    frame = window.requestAnimationFrame(tick)
  }

  const stop = () => {
    window.cancelAnimationFrame(frame)
    frame = 0
  }

  const syncRunning = () => {
    const shouldRun = !calm && onScreen && !document.hidden
    if (shouldRun && !frame) {
      last = performance.now()
      frame = window.requestAnimationFrame(tick)
    } else if (!shouldRun) {
      stop()
    }
  }

  const onMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect()
    mouse.x = event.clientX - box.left
    mouse.y = event.clientY - box.top
    if (calm) draw()
  }
  const onLeave = () => {
    mouse.x = FAR_AWAY
    mouse.y = FAR_AWAY
    if (calm) draw()
  }

  const sizer = new ResizeObserver(() => {
    fit()
    draw()
  })
  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    syncRunning()
  })
  const stopWatchingTheme = onThemeChange(draw)

  fit()
  advance("START")
  if (calm) progress = 0.6
  draw()
  sizer.observe(canvas)
  visibility.observe(canvas)
  host.addEventListener("pointermove", onMove)
  host.addEventListener("pointerleave", onLeave)
  document.addEventListener("visibilitychange", syncRunning)
  document.fonts?.ready.then(draw)
  syncRunning()

  return () => {
    stop()
    sizer.disconnect()
    visibility.disconnect()
    stopWatchingTheme()
    host.removeEventListener("pointermove", onMove)
    host.removeEventListener("pointerleave", onLeave)
    document.removeEventListener("visibilitychange", syncRunning)
  }
}

export function AgentRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const readout = readoutRef.current
    const host = canvas?.closest<HTMLElement>(".hero")
    if (!canvas || !readout || !host) return
    return startRun(canvas, readout, host)
  }, [])

  return (
    <>
      <div className="hero-art">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="一次 Agent 运行的动态示意：从 START 经过 plan、retrieve、tool_call、reflect、respond 到 END"
        />
      </div>
      <div className="readout" aria-hidden="true">
        <span>当前节点</span>
        <b ref={readoutRef}>START</b>
      </div>
    </>
  )
}

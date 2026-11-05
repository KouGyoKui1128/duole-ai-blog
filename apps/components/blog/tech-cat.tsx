'use client'

import { useEffect } from "react"

const NEKO_SCRIPT_URL = "https://louisabraham.github.io/nekojs/neko.js"
const CAT_SIZE = 32
const MOVE_SPEED = 720
const ARRIVAL_RADIUS = 6
const AUTO_ACTION_INTERVAL = 4200
const ACTION_DURATION = 900
const ANIMATION_FRAME_MS = 120

const actionPool = [
  { label: "neko --status=wash", state: "WASH" },
  { label: "neko --status=scratch", state: "SCRATCH" },
  { label: "neko --status=yawn", state: "YAWN" },
  { label: "neko --status=sleep", state: "SLEEP" },
]

type NekoStateMap = Record<string, number>

type NekoInstance = {
  behaviorMode: number
  element?: HTMLDivElement
  logicX: number
  logicY: number
  x: number
  y: number
  state: number
  tickCount: number
  setState: (state: number) => void
  start?: () => void
  stop?: () => void
  updateSprite?: () => void
  cycleBehavior?: () => void
  destroy?: () => void
}

type NekoConstructor = new (options?: Record<string, unknown>) => NekoInstance

declare global {
  interface Window {
    Neko?: NekoConstructor
    createNeko?: (options?: Record<string, unknown>) => NekoInstance
    NekoState?: NekoStateMap
    BehaviorMode?: Record<string, number>
    neko?: NekoInstance
  }
}

export function TechCat() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let script: HTMLScriptElement | null = null
    let actionTimer: number | null = null
    let autoActionTimer: number | null = null
    let animationFrame: number | null = null
    let lastFrameTime = 0
    let frameAccumulator = 0
    let currentActionState: number | null = null
    let isDestroyed = false

    const position = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    const clampTarget = (clientX: number, clientY: number) => ({
      x: Math.min(Math.max(clientX - CAT_SIZE / 2, 0), window.innerWidth - CAT_SIZE),
      y: Math.min(Math.max(clientY - CAT_SIZE / 2, 0), window.innerHeight - CAT_SIZE),
    })

    const applyPosition = (neko: NekoInstance) => {
      position.x = Math.min(Math.max(position.x, 0), window.innerWidth - CAT_SIZE)
      position.y = Math.min(Math.max(position.y, 0), window.innerHeight - CAT_SIZE)
      neko.x = position.x
      neko.y = position.y
      neko.logicX = position.x
      neko.logicY = position.y
      if (neko.element) {
        neko.element.style.left = `${Math.round(position.x)}px`
        neko.element.style.top = `${Math.round(position.y)}px`
      }
    }

    const setSpriteState = (neko: NekoInstance, state: number) => {
      if (neko.state !== state) {
        neko.setState(state)
      }
      neko.updateSprite?.()
    }

    const pickMoveState = (dx: number, dy: number, states: NekoStateMap) => {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (absX < 0.001 && absY < 0.001) {
        return states.STOP
      }
      if (absX <= absY * 0.45) {
        return dy < 0 ? states.U_MOVE : states.D_MOVE
      }
      if (absY <= absX * 0.45) {
        return dx < 0 ? states.L_MOVE : states.R_MOVE
      }
      if (dx > 0 && dy < 0) {
        return states.UR_MOVE
      }
      if (dx > 0 && dy > 0) {
        return states.DR_MOVE
      }
      if (dx < 0 && dy < 0) {
        return states.UL_MOVE
      }
      return states.DL_MOVE
    }

    const bootNeko = () => {
      if (!window.createNeko || !window.NekoState) {
        return
      }

      if (window.neko?.destroy) {
        window.neko.destroy()
      }

      const neko = window.createNeko({
        fps: 120,
        allowBehaviorChange: false,
      })

      window.neko = neko
      neko.stop?.()

      if (neko.element) {
        neko.element.classList.add("neko-container")
        neko.element.style.pointerEvents = "none"
      }

      const states = window.NekoState
      position.x = typeof neko.x === "number" ? neko.x : window.innerWidth - CAT_SIZE - 16
      position.y = typeof neko.y === "number" ? neko.y : window.innerHeight - CAT_SIZE - 16
      target.x = position.x
      target.y = position.y
      applyPosition(neko)
      setSpriteState(neko, states.STOP)

      const clearAction = () => {
        currentActionState = null
        if (actionTimer) {
          window.clearTimeout(actionTimer)
          actionTimer = null
        }
      }

      const triggerAction = () => {
        const chosen = actionPool[Math.floor(Math.random() * actionPool.length)]
        const stateCode = states[chosen.state]
        if (typeof stateCode !== "number") {
          return
        }
        currentActionState = stateCode
        setSpriteState(neko, stateCode)
        if (actionTimer) {
          window.clearTimeout(actionTimer)
        }
        actionTimer = window.setTimeout(() => {
          currentActionState = null
          actionTimer = null
        }, ACTION_DURATION)
      }

      const handleResize = () => {
        const nextTarget = clampTarget(target.x + CAT_SIZE / 2, target.y + CAT_SIZE / 2)
        target.x = nextTarget.x
        target.y = nextTarget.y
        applyPosition(neko)
      }

      const handleScreenPointerDown = (event: PointerEvent) => {
        const nextTarget = clampTarget(event.clientX, event.clientY)
        target.x = nextTarget.x
        target.y = nextTarget.y
        clearAction()
      }

      const tick = (timestamp: number) => {
        if (isDestroyed) {
          return
        }

        if (lastFrameTime === 0) {
          lastFrameTime = timestamp
        }

        const deltaMs = timestamp - lastFrameTime
        lastFrameTime = timestamp
        frameAccumulator += deltaMs

        if (currentActionState === null) {
          const dx = target.x - position.x
          const dy = target.y - position.y
          const distance = Math.hypot(dx, dy)

          if (distance > ARRIVAL_RADIUS) {
            const step = Math.min(distance, MOVE_SPEED * (deltaMs / 1000))
            position.x += (dx / distance) * step
            position.y += (dy / distance) * step
            setSpriteState(neko, pickMoveState(dx, dy, states))
          } else {
            position.x = target.x
            position.y = target.y
            setSpriteState(neko, states.STOP)
          }
        } else {
          setSpriteState(neko, currentActionState)
        }

        applyPosition(neko)

        while (frameAccumulator >= ANIMATION_FRAME_MS) {
          frameAccumulator -= ANIMATION_FRAME_MS
          neko.tickCount += 1
          neko.updateSprite?.()
        }

        animationFrame = window.requestAnimationFrame(tick)
      }

      document.addEventListener("pointerdown", handleScreenPointerDown)
      window.addEventListener("resize", handleResize)

      autoActionTimer = window.setInterval(() => {
        if (currentActionState !== null) {
          return
        }
        const idleDistance = Math.hypot(target.x - position.x, target.y - position.y)
        if (idleDistance <= ARRIVAL_RADIUS) {
          triggerAction()
        }
      }, AUTO_ACTION_INTERVAL)

      animationFrame = window.requestAnimationFrame(tick)

      return () => {
        document.removeEventListener("pointerdown", handleScreenPointerDown)
          window.removeEventListener("resize", handleResize)
      }
    }

    let disposeBoot: (() => void) | undefined

    if (window.createNeko) {
      disposeBoot = bootNeko()
    } else {
      script = document.createElement("script")
      script.src = NEKO_SCRIPT_URL
      script.async = true
      script.dataset.duoleNeko = "true"
      script.onload = () => {
        disposeBoot = bootNeko()
      }
      document.body.appendChild(script)
    }

    return () => {
      isDestroyed = true
      if (disposeBoot) {
        disposeBoot()
      }
      if (actionTimer) {
        window.clearTimeout(actionTimer)
      }
      if (autoActionTimer) {
        window.clearInterval(autoActionTimer)
      }
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      if (window.neko?.destroy) {
        window.neko.destroy()
      }
      window.neko = undefined
      document.querySelector<HTMLDivElement>(".neko-tip")?.remove()
      if (script?.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

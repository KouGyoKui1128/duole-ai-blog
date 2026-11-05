'use client'

import { useEffect, useRef } from "react"

import { onThemeChange, paintCover, type CoverKind } from "@/lib/cover-art"

interface GeneratedCoverProps {
  kind: CoverKind
  seed: string
  label: string
}

export function GeneratedCover({ kind, seed, label }: GeneratedCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const paint = () => paintCover(canvas, kind, seed)
    paint()
    const sizer = new ResizeObserver(paint)
    sizer.observe(canvas)
    const stopWatchingTheme = onThemeChange(paint)
    return () => {
      sizer.disconnect()
      stopWatchingTheme()
    }
  }, [kind, seed])

  return <canvas ref={canvasRef} role="img" aria-label={`${label}的封面图`} />
}

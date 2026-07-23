import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }
export function Dialog({ children, open, onOpenChange }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange?.(false)} />
      <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 z-10">
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>
}

export function DialogClose({ children, asChild }: { children?: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>
}

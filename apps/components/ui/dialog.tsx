"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  /** Called on Esc or a click on the backdrop; preventDefault() keeps the dialog open. */
  onDismiss?: (event: Event) => void
  /** Set false when there is no DialogDescription, so the content is not labelled by a missing element. */
  described?: boolean
  /** Called when focus would return to the trigger; preventDefault() to move focus or scroll yourself. */
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * A modal: Esc and a click on the backdrop close it, and focus stays inside while it is open.
 * Children are the dialog's content; give it a DialogTitle so screen readers can name it.
 */
export function Dialog({ children, open, onOpenChange, className, onDismiss, described = true, onCloseAutoFocus }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-border bg-background p-6 text-foreground shadow-lg focus:outline-none",
            className,
          )}
          onEscapeKeyDown={onDismiss}
          onPointerDownOutside={onDismiss}
          onCloseAutoFocus={onCloseAutoFocus}
          {...(described ? {} : { "aria-describedby": undefined })}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <DialogPrimitive.Trigger asChild={asChild}>{children}</DialogPrimitive.Trigger>
}

export function DialogClose({ children, asChild }: { children?: React.ReactNode; asChild?: boolean }) {
  return <DialogPrimitive.Close asChild={asChild}>{children}</DialogPrimitive.Close>
}

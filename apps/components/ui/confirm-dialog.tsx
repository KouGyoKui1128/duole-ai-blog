"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button, for actions like delete. */
  danger?: boolean
  /** While true the buttons are disabled and the dialog cannot be dismissed. */
  loading?: boolean
  onConfirm: () => void
}

/** Asks before doing something; the caller runs the action in onConfirm and closes the dialog when done. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "确定",
  cancelLabel = "取消",
  danger = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next)
      }}
      onDismiss={(event) => {
        if (loading) event.preventDefault()
      }}
      described={Boolean(description)}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
          {loading ? "处理中..." : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

interface NoticeDialogProps {
  open: boolean
  title: string
  description?: React.ReactNode
  /** Runs however the dialog is closed: the 确定 button, Esc, or the backdrop. */
  onClose: () => void
}

/** Tells the author something happened; one 确定 button. */
export function NoticeDialog({ open, title, description, onClose }: NoticeDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      described={Boolean(description)}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onClose}>确定</Button>
      </DialogFooter>
    </Dialog>
  )
}

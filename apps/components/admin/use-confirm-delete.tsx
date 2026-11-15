"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ConfirmDeleteOptions<T> {
  /** The name shown in 确定删除《…》？ */
  nameOf: (item: T) => string
  /** Calls the delete API; the dialog stays open, showing 处理中..., until it settles. */
  remove: (item: T) => Promise<void>
  onError: (message: string) => void
}

/** Ask with askToDelete(item), and render deleteDialog somewhere on the page. */
export function useConfirmDelete<T>({ nameOf, remove, onError }: ConfirmDeleteOptions<T>) {
  const [target, setTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirm = async () => {
    if (target === null) return
    setDeleting(true)
    try {
      await remove(target)
    } catch (err) {
      onError(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleting(false)
      setTarget(null)
    }
  }

  const deleteDialog = (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) setTarget(null)
      }}
      title={`确定删除《${target === null ? "" : nameOf(target)}》？`}
      description="此操作不可恢复"
      confirmLabel="删除"
      danger
      loading={deleting}
      onConfirm={confirm}
    />
  )

  return { askToDelete: (item: T) => setTarget(() => item), deleteDialog }
}

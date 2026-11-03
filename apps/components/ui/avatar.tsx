import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarProps = React.HTMLAttributes<HTMLDivElement>
export function Avatar({ className, ...props }: AvatarProps) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)} {...props} />
}

type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>
export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return <img className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
}

type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>
export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-foreground", className)} {...props} />
}

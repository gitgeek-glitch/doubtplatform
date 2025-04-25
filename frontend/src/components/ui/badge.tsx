import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return <div ref={ref} className={cn("badge", `badge-${variant}`, className)} {...props} />
})
Badge.displayName = "Badge"

export { Badge }

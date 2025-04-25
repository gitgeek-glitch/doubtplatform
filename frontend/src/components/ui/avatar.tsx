import type React from "react"
import { forwardRef, type ImgHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("avatar", className)} {...props} />
))
Avatar.displayName = "Avatar"

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
}

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = "", ...props }, ref) => (
    <img ref={ref} src={src || "/placeholder.svg"} alt={alt} className={cn("avatar-image", className)} {...props} />
  ),
)
AvatarImage.displayName = "AvatarImage"

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("avatar-fallback", className)} {...props} />
))
AvatarFallback.displayName = "AvatarFallback"

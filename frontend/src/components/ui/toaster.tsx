"use client"

import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="toaster-container">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={cn(
            "toast",
            toast.variant === "destructive" ? "toast-destructive" : "toast-default"
          )}
        >
          {toast.title && <h4 className="toast-title">{toast.title}</h4>}
          {toast.description && <p className="toast-description">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}

export function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

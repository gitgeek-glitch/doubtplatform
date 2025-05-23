"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { dismissToast } from "@/redux/slices/uiSlice"
import { X, CheckCircle, AlertCircle } from 'lucide-react'

// Helper function to combine class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export function Toaster() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector(state => state.ui.toasts)
  const [mounted, setMounted] = useState(false)
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-dismiss toasts after 3 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        dispatch(dismissToast(toast.id))
      }, 3000)
      
      timers.push(timer)
    })
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [toasts, dispatch])
  
  if (!mounted) {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "bg-background border shadow-lg rounded-md overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right",
            toast.variant === "destructive" 
              ? "border-red-500" 
              : "border-green-500"
          )}
        >
          <div className="flex items-start">
            <div className={cn(
              "h-full w-1.5 flex-shrink-0",
              toast.variant === "destructive" ? "bg-red-500" : "bg-green-500"
            )} />
            <div className="p-4 flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {toast.variant === "destructive" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                {toast.title && (
                  <h5 className="font-medium text-foreground mb-1">{toast.title}</h5>
                )}
                {toast.description && (
                  <p className="text-sm text-muted-foreground">{toast.description}</p>
                )}
              </div>
              <button 
                onClick={() => dispatch(dismissToast(toast.id))} 
                className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
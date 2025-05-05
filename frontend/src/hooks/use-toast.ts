"use client"

import { useState, useEffect } from "react"

// Event system for cross-component communication
type Listener = () => void
const listeners: Set<Listener> = new Set()

export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Shared toast state across components
let toastState: ToastProps[] = []

// Track toast IDs to prevent duplicates
const activeToastIds = new Set<string>()

// Helper functions to manage toast state
const addToast = (toast: Omit<ToastProps, "id">) => {
  // Create a unique ID for the toast based on content to prevent duplicates
  const contentHash = `${toast.title}-${toast.description}-${toast.variant || "default"}`

  // If a similar toast is already active, don't add another one
  if (activeToastIds.has(contentHash)) {
    return contentHash
  }

  const id = contentHash
  const newToast = { ...toast, id }

  // Remove any existing toasts with the same variant to prevent multiple status messages
  if (toast.variant) {
    toastState = toastState.filter((t) => t.variant !== toast.variant)
  }

  toastState = [...toastState, newToast]
  activeToastIds.add(contentHash)
  emitChange()

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    removeToast(id)
  }, 3000)

  return id
}

const removeToast = (id: string) => {
  toastState = toastState.filter((t) => t.id !== id)
  activeToastIds.delete(id)
  emitChange()
}

const emitChange = () => {
  listeners.forEach((listener) => listener())
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(toastState)

  useEffect(() => {
    const listener = () => {
      setToasts([...toastState])
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const toast = (props: Omit<ToastProps, "id">) => {
    return addToast(props)
  }

  const dismiss = (id: string) => {
    removeToast(id)
  }

  return { toast, dismiss, toasts }
}

"use client"

import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`rounded-lg p-4 shadow-lg ${toast.variant === "destructive" ? "bg-red-600" : "bg-gray-800"}`}
        >
          {toast.title && <h4 className="font-medium">{toast.title}</h4>}
          {toast.description && <p className="text-sm text-gray-300">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}

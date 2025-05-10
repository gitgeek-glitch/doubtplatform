"use client"

import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { addToast, dismissToast } from "@/redux/slices/uiSlice"

export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector(state => state.ui.toasts)

  const toast = (props: Omit<ToastProps, "id">) => {
    dispatch(addToast(props))
    return props.title || props.description || ""
  }

  const dismiss = (id: string) => {
    dispatch(dismissToast(id))
  }

  return { toast, dismiss, toasts }
}
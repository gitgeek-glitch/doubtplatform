export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export interface UIState {
  theme: 'dark' | 'light' | 'system'
  toasts: ToastProps[]
  activeToastIds: Set<string>
}
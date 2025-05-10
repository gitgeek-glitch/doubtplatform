import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface UIState {
  theme: 'dark' | 'light' | 'system'
  toasts: ToastProps[]
  activeToastIds: Set<string>
}

const initialState: UIState = {
  theme: (localStorage.getItem('vite-ui-theme') as 'dark' | 'light' | 'system') || 'dark',
  toasts: [],
  activeToastIds: new Set(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'dark' | 'light' | 'system'>) => {
      state.theme = action.payload
      localStorage.setItem('vite-ui-theme', action.payload)
    },
    addToast: (state, action: PayloadAction<Omit<ToastProps, 'id'>>) => {
      const toast = action.payload
      // Create a unique ID for the toast based on content to prevent duplicates
      const contentHash = `${toast.title}-${toast.description}-${toast.variant || 'default'}`
      
      // If a similar toast is already active, don't add another one
      if (state.activeToastIds.has(contentHash)) {
        return
      }
      
      const id = contentHash
      const newToast = { ...toast, id }
      
      // Remove any existing toasts with the same variant to prevent multiple status messages
      if (toast.variant) {
        state.toasts = state.toasts.filter((t) => t.variant !== toast.variant)
      }
      
      state.toasts.push(newToast)
      state.activeToastIds.add(contentHash)
      
      // Auto-dismiss will be handled in the component
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.toasts = state.toasts.filter((t) => t.id !== id)
      state.activeToastIds.delete(id)
    },
  },
})

export const { setTheme, addToast, dismissToast } = uiSlice.actions
export default uiSlice.reducer
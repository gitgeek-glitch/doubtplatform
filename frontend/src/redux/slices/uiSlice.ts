import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState, ToastProps } from '../types/uiTypes'

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
      const contentHash = `${toast.title}-${toast.description}-${toast.variant || 'default'}`
      
      if (state.activeToastIds.has(contentHash)) {
        return
      }
      
      const id = contentHash
      const newToast = { ...toast, id }
      
      if (toast.variant) {
        state.toasts = state.toasts.filter((t) => t.variant !== toast.variant)
      }
      
      state.toasts.push(newToast)
      state.activeToastIds.add(contentHash)
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
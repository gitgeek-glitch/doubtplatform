import { configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import questionsReducer from './slices/questionsSlice'
import usersReducer from './slices/usersSlice'
import leaderboardReducer from "./slices/leaderboardSlice"

// Enable MapSet to allow Sets and Maps in the Redux store
enableMapSet()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    questions: questionsReducer,
    users: usersReducer,
    leaderboard: leaderboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/addToast', 'ui/dismissToast'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.toasts', 'ui.activeToastIds'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
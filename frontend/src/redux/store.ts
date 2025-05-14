import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // Uses localStorage by default

import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import questionsReducer from './slices/questionsSlice'
import usersReducer from './slices/usersSlice'
import leaderboardReducer from './slices/leaderboardSlice'

// Enable Set and Map support in Redux state
enableMapSet()

// Persist configuration for auth slice only
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // whitelist fields you want to persist
}

// Combine all reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: uiReducer,
  questions: questionsReducer,
  users: usersReducer,
  leaderboard: leaderboardReducer,
})

// Create the store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'ui/addToast',
          'ui/dismissToast',
        ],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['ui.toasts', 'ui.activeToastIds'],
      },
    }),
})

// Persistor instance for Redux-Persist
export const persistor = persistStore(store)

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

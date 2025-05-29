"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "./redux/hooks"
import { rehydrateAuth } from "./redux/slices/authSlice"
import { checkAuthStatus } from "./redux/thunks/authThunks"
import { ThemeProvider } from "@/components/theme-provider"
import { LocomotiveScrollProvider } from "@/context/locomotive-context"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/navbar"
import HomePage from "@/pages/home"
import LandingPage from "@/pages/landing"
import QuestionDetailPage from "@/pages/question-detail"
import AskQuestionPage from "@/pages/ask-question"
import ProfilePage from "@/pages/profile"
import AuthPage from "@/pages/auth"
import NotFound from "@/pages/not-found"
import { ThemeToggle } from "./components/theme-toggle"
import { PersistGate } from "redux-persist/integration/react"
import { persistor } from "./redux/store"

// Simple loading component
const LoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <span className="ml-3">Loading...</span>
  </div>
)

// Protected route component that uses Redux state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)
  const [showLoading, setShowLoading] = useState(true)
  
  // Add timeout to prevent infinite loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 3000) // Show loading for max 3 seconds
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading && showLoading) {
    return <LoadingIndicator />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

// Public route that redirects authenticated users to home
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const [showLoading, setShowLoading] = useState(true)
  
  // Add timeout to prevent infinite loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 3000) // Show loading for max 3 seconds
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading && showLoading) {
    return <LoadingIndicator />
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

// Layout component that conditionally renders the navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const isAuthPage = location.pathname === "/auth"

  return (
    <div className="min-h-screen bg-background text-foreground" data-scroll-container>
      {!isAuthPage && <Navbar />}
      <main className="container mx-auto px-4 py-8">{children}</main>
      <Toaster />
      <ThemeToggle />
    </div>
  )
}

// Initialize authentication on app load
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((state) => state.auth)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // First rehydrate auth headers from persisted state
    dispatch(rehydrateAuth())

    // Then check auth status on initial load (verifies token validity)
    if (token) {
      dispatch(checkAuthStatus())
        .finally(() => {
          setInitialized(true)
        })
    } else {
      setInitialized(true)
    }
  }, [dispatch, token])

  if (!initialized) {
    return <LoadingIndicator />
  }

  return <>{children}</>
}

function App() {
  // Handle persistence rehydration completed callback
  const onBeforeLift = () => {
    console.log("Redux persistence loaded")
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="doubt-platform-theme">
      {/* Fix: Only use one method (function or loading prop) for PersistGate */}
      <PersistGate onBeforeLift={onBeforeLift} persistor={persistor}>
        {() => {
          return (
            <AuthInitializer>
              <Router>
                <LocomotiveScrollProvider>
                  <AppLayout>
                    <Routes>
                      {/* Public routes */}
                      <Route
                        path="/"
                        element={
                          <PublicOnlyRoute>
                            <LandingPage />
                          </PublicOnlyRoute>
                        }
                      />
                      <Route
                        path="/auth"
                        element={
                          <PublicOnlyRoute>
                            <AuthPage />
                          </PublicOnlyRoute>
                        }
                      />

                      {/* Protected routes */}
                      <Route
                        path="/home"
                        element={
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/question/:id"
                        element={
                          <ProtectedRoute>
                            <QuestionDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ask"
                        element={
                          <ProtectedRoute>
                            <AskQuestionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/:id"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 route */}
                      <Route path="/404" element={<NotFound />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </AppLayout>
                </LocomotiveScrollProvider>
              </Router>
            </AuthInitializer>
          );
        }}
      </PersistGate>
    </ThemeProvider>
  );
}

export default App
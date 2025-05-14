"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "./redux/hooks"
import { checkAuthStatus } from "./redux/slices/authSlice"
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

// Protected route component that uses Redux state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Public route that redirects authenticated users to home
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

// Layout component that conditionally renders the navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground" data-scroll-container>
      {!isAuthPage && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
      <ThemeToggle />
    </div>
  );
};

function App() {
  const dispatch = useAppDispatch()
  const { isLoading } = useAppSelector(state => state.auth)

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch])

  // Show global loading state during initial auth check
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="doubt-platform-theme">
      <PersistGate loading={<div className="flex items-center justify-center min-h-screen">Loading...</div>} persistor={persistor}>
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
      </PersistGate>
    </ThemeProvider>
  )
}

export default App

"use client"

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import HomePage from "@/pages/home"
import LandingPage from "@/pages/landing"
import QuestionDetailPage from "@/pages/question-detail"
import AskQuestionPage from "@/pages/ask-question"
import ProfilePage from "@/pages/profile"
import AuthPage from "@/pages/auth"
import { AuthProvider } from "@/context/auth-context"
import { LocomotiveScrollProvider } from "@/context/locomotive-context"
import NotFound from "@/pages/not-found"
import { ThemeToggle } from "./components/theme-toggle"
import { useAuth } from "@/context/auth-context"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

// Layout component that conditionally renders the navbar
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  
  return (
    <div className="min-h-screen bg-background text-foreground" data-scroll-container>
      {!isAuthPage && <Navbar />}
      <main className="container mx-auto px-4 py-8">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="doubt-platform-theme">
      <Router>
        <AuthProvider>
          <LocomotiveScrollProvider>
            <AppLayout />
          </LocomotiveScrollProvider>
        </AuthProvider>
      </Router>
      <ThemeToggle/>
    </ThemeProvider>
  )
}

export default App
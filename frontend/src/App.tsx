"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import HomePage from "@/pages/home"
import QuestionDetailPage from "@/pages/question-detail"
import AskQuestionPage from "@/pages/ask-question"
import ProfilePage from "@/pages/profile"
import AuthPage from "@/pages/auth"
import { AuthProvider } from "@/context/auth-context"
import { LocomotiveScrollProvider } from "@/context/locomotive-context"
import NotFound from "@/pages/not-found"
import { ThemeToggle } from "./components/theme-toggle"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="doubt-platform-theme">
      <Router>
        <AuthProvider>
          <LocomotiveScrollProvider>
            <div className="min-h-screen bg-background text-foreground" data-scroll-container>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/question/:id" element={<QuestionDetailPage />} />
                  <Route path="/ask" element={<AskQuestionPage />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </LocomotiveScrollProvider>
        </AuthProvider>
      </Router>
      <ThemeToggle/>
    </ThemeProvider>
  )
}

export default App

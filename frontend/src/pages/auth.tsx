"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  // Register form state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [registering, setRegistering] = useState(false)

  // Use useEffect for navigation instead of conditional rendering
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginEmail.trim() || !loginPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    if (!loginEmail.includes("@") || !loginEmail.endsWith(".ac.in")) {
      toast({
        title: "Invalid email",
        description: "Please use your college email (ending with .ac.in)",
        variant: "destructive",
      })
      return
    }

    try {
      setLoggingIn(true)
      await login(loginEmail, loginPassword)
      navigate("/")
    } catch (error) {
      // Error is handled in the auth context
      console.error("Login error:", error)
    } finally {
      setLoggingIn(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    if (!registerEmail.includes("@") || !registerEmail.endsWith(".ac.in")) {
      toast({
        title: "Invalid email",
        description: "Please use your college email (ending with .ac.in)",
        variant: "destructive",
      })
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setRegistering(true)
      await register(registerName, registerEmail, registerPassword)
      // Navigation will happen automatically via the useEffect when isAuthenticated changes
    } catch (error) {
      // Add explicit error logging
      console.error("Registration error:", error)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md space-y-8 p-8 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to DoubtSolve</h1>
          <p className="text-muted-foreground mt-2">Your college doubt-solving platform</p>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full bg-gray-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={loginEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="p-0 h-auto text-xs text-purple-400">
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={registerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">College Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={registerEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
                <p className="text-xs text-muted-foreground">Must be your institutional email ending with .ac.in</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={registering}>
                {registering ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
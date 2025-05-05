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
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginEmailValid, setLoginEmailValid] = useState(true)

  // Register form state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [registering, setRegistering] = useState(false)
  const [registerEmailValid, setRegisterEmailValid] = useState(true)

  // Password validation criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
    match: false,
  })

  // Validate email format
  const validateEmail = (email: string) => {
    return email.includes("@") && email.endsWith(".ac.in")
  }

  // Update login email validation
  useEffect(() => {
    if (loginEmail) {
      setLoginEmailValid(validateEmail(loginEmail))
    } else {
      setLoginEmailValid(true) // Don't show error for empty field
    }
  }, [loginEmail])

  // Update register email validation
  useEffect(() => {
    if (registerEmail) {
      setRegisterEmailValid(validateEmail(registerEmail))
    } else {
      setRegisterEmailValid(true) // Don't show error for empty field
    }
  }, [registerEmail])

  // Update password criteria validation
  useEffect(() => {
    setPasswordCriteria({
      length: registerPassword.length >= 6,
      letter: /[a-zA-Z]/.test(registerPassword),
      number: /[0-9]/.test(registerPassword),
      special: /[^a-zA-Z0-9]/.test(registerPassword),
      match: registerPassword === registerConfirmPassword && registerPassword !== "",
    })
  }, [registerPassword, registerConfirmPassword])

  // Use useEffect for navigation instead of conditional rendering
  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to ensure toast is shown before navigation
      setTimeout(() => {
        navigate("/home")
      }, 500)
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
    if (!validateEmail(loginEmail)) {
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

      
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
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
    if (!validateEmail(registerEmail)) {
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

    // Check all password criteria
    const allCriteriaMet = Object.values(passwordCriteria).every((criterion) => criterion)
    if (!allCriteriaMet) {
      toast({
        title: "Password requirements not met",
        description: "Please ensure your password meets all the requirements",
        variant: "destructive",
      })
      return
    }

    try {
      setRegistering(true)
      

      await register(registerName, registerEmail, registerPassword)
      
      // Show success toast - this might also be shown in auth-context
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      })
      
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: "Could not create your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="flex items-center mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Welcome to DoubtSolve</h1>
          <p className="auth-subtitle">Your college doubt-solving platform</p>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="auth-tabs-list">
            <TabsTrigger value="login" className="auth-tab-active">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="auth-tab-active">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="email" className="block">
                  College Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={loginEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                  className={cn("auth-input", !loginEmailValid && loginEmail && "auth-input-error")}
                  autoComplete="username"
                  required
                />
                {!loginEmailValid && loginEmail && (
                  <p className="auth-error-message">Please use your college email (ending with .ac.in)</p>
                )}
              </div>

              <div className="auth-field">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="block">
                    Password
                  </Label>
                  <Button variant="link" className="auth-forgot-password">
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                  className="auth-input"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="auth-submit" disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Not registered yet?{" "}
                <Button variant="link" onClick={() => setActiveTab("register")} className="auth-link">
                  Create an account
                </Button>
              </p>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="name" className="block">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={registerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-field">
                <Label htmlFor="register-email" className="block">
                  College Email
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={registerEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterEmail(e.target.value)}
                  className={cn("auth-input", !registerEmailValid && registerEmail && "auth-input-error")}
                  required
                />
                {!registerEmailValid && registerEmail && (
                  <p className="auth-error-message">Please use your college email (ending with .ac.in)</p>
                )}
                <p className="auth-hint">Must be your institutional email ending with .ac.in</p>
              </div>

              <div className="auth-field">
                <Label htmlFor="register-password" className="block">
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterPassword(e.target.value)}
                  className="auth-input"
                  required
                  autoComplete="new-password"
                />
                <div className="auth-password-criteria">
                  <p className="auth-password-criteria-title">Password must:</p>
                  <ul className="auth-password-criteria-list">
                    <li
                      className={cn(
                        "auth-password-criteria-item",
                        passwordCriteria.length ? "auth-criteria-met" : "auth-criteria-unmet",
                      )}
                    >
                      {passwordCriteria.length ? (
                        <CheckCircle2 className="auth-criteria-icon" />
                      ) : (
                        <XCircle className="auth-criteria-icon" />
                      )}
                      <span>Be at least 6 characters long</span>
                    </li>
                    <li
                      className={cn(
                        "auth-password-criteria-item",
                        passwordCriteria.letter ? "auth-criteria-met" : "auth-criteria-unmet",
                      )}
                    >
                      {passwordCriteria.letter ? (
                        <CheckCircle2 className="auth-criteria-icon" />
                      ) : (
                        <XCircle className="auth-criteria-icon" />
                      )}
                      <span>Contain at least one letter</span>
                    </li>
                    <li
                      className={cn(
                        "auth-password-criteria-item",
                        passwordCriteria.number ? "auth-criteria-met" : "auth-criteria-unmet",
                      )}
                    >
                      {passwordCriteria.number ? (
                        <CheckCircle2 className="auth-criteria-icon" />
                      ) : (
                        <XCircle className="auth-criteria-icon" />
                      )}
                      <span>Contain at least one number</span>
                    </li>
                    <li
                      className={cn(
                        "auth-password-criteria-item",
                        passwordCriteria.special ? "auth-criteria-met" : "auth-criteria-unmet",
                      )}
                    >
                      {passwordCriteria.special ? (
                        <CheckCircle2 className="auth-criteria-icon" />
                      ) : (
                        <XCircle className="auth-criteria-icon" />
                      )}
                      <span>Contain at least one special character</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="auth-field">
                <Label htmlFor="confirm-password" className="block">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterConfirmPassword(e.target.value)}
                  className={cn("auth-input", registerConfirmPassword && !passwordCriteria.match && "auth-input-error")}
                  required
                  autoComplete="new-password"
                />
                {registerConfirmPassword && !passwordCriteria.match && (
                  <p className="auth-error-message">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" className="auth-submit" disabled={registering}>
                {registering ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already a user?{" "}
                <Button variant="link" onClick={() => setActiveTab("login")} className="auth-link">
                  Sign in
                </Button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
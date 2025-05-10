"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { loginUser, registerUser, clearError } from "@/redux/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AuthPage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, error } = useAppSelector(state => state.auth)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])
  
  // Clear errors when switching tabs
  useEffect(() => {
    dispatch(clearError())
    setValidationErrors({})
  }, [activeTab, dispatch])
  
  // Check password strength
  useEffect(() => {
    const password = registerData.password
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    })
  }, [registerData.password])
  
  // Handle login form input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle register form input changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Validate login form
  const validateLoginForm = () => {
    const errors: Record<string, string> = {}
    
    if (!loginData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = "Email is invalid"
    } else if (!loginData.email.endsWith(".ac.in")) {
      errors.email = "Please use your college email (ending with .ac.in)"
    }
    
    if (!loginData.password) {
      errors.password = "Password is required"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Validate register form
  const validateRegisterForm = () => {
    const errors: Record<string, string> = {}
    
    if (!registerData.name.trim()) {
      errors.name = "Name is required"
    }
    
    if (!registerData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = "Email is invalid"
    } else if (!registerData.email.endsWith(".ac.in")) {
      errors.email = "Please use your college email (ending with .ac.in)"
    }
    
    if (!registerData.password) {
      errors.password = "Password is required"
    } else if (
      !passwordCriteria.length ||
      !passwordCriteria.uppercase ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.number
    ) {
      errors.password = "Password does not meet requirements"
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateLoginForm()) return
    
    try {
      const resultAction = await dispatch(loginUser(loginData))
      
      if (loginUser.fulfilled.match(resultAction)) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
        navigate("/")
      }
    } catch (error) {
      console.error("Login failed:", error)
    }
  }
  
  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateRegisterForm()) return
    
    try {
      const resultAction = await dispatch(registerUser({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      }))
      
      if (registerUser.fulfilled.match(resultAction)) {
        toast({
          title: "Registration successful",
          description: "Your account has been created",
        })
        navigate("/")
      }
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome to DoubtSolve</h1>
          <p className="auth-subtitle">Your college doubt-solving platform</p>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="auth-tabs-list">
            <TabsTrigger 
              value="login" 
              className={cn(activeTab === "login" && "auth-tab-active")}
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className={cn(activeTab === "register" && "auth-tab-active")}
            >
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className={cn("auth-input", validationErrors.email && "auth-input-error")}
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="auth-error-message">{validationErrors.email}</p>
                )}
              </div>

              <div className="auth-field">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="p-0 h-auto text-xs text-purple-400">
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className={cn("auth-input", validationErrors.password && "auth-input-error")}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                {validationErrors.password && (
                  <p className="auth-error-message">{validationErrors.password}</p>
                )}
              </div>

              {error && <p className="auth-error-message">{error}</p>}

              <Button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  className={cn("auth-input", validationErrors.name && "auth-input-error")}
                  required
                  disabled={isLoading}
                />
                {validationErrors.name && (
                  <p className="auth-error-message">{validationErrors.name}</p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="register-email">College Email</Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="studentname.is22@bmsce.ac.in"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className={cn("auth-input", validationErrors.email && "auth-input-error")}
                  required
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="auth-error-message">{validationErrors.email}</p>
                )}
                <p className="auth-hint">Must be your institutional email ending with .ac.in</p>
              </div>

              <div className="auth-field">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className={cn("auth-input", validationErrors.password && "auth-input-error")}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {validationErrors.password && (
                  <p className="auth-error-message">{validationErrors.password}</p>
                )}
                
                <div className="auth-password-criteria">
                  <p className="auth-password-criteria-title">Password must contain:</p>
                  <ul className="auth-password-criteria-list">
                    <li className={`auth-password-criteria-item ${passwordCriteria.length ? "auth-criteria-met" : "auth-criteria-unmet"}`}>
                      {passwordCriteria.length ? (
                        <Check className="auth-criteria-icon" />
                      ) : (
                        <X className="auth-criteria-icon" />
                      )}
                      At least 8 characters
                    </li>
                    <li className={`auth-password-criteria-item ${passwordCriteria.uppercase ? "auth-criteria-met" : "auth-criteria-unmet"}`}>
                      {passwordCriteria.uppercase ? (
                        <Check className="auth-criteria-icon" />
                      ) : (
                        <X className="auth-criteria-icon" />
                      )}
                      At least one uppercase letter
                    </li>
                    <li className={`auth-password-criteria-item ${passwordCriteria.lowercase ? "auth-criteria-met" : "auth-criteria-unmet"}`}>
                      {passwordCriteria.lowercase ? (
                        <Check className="auth-criteria-icon" />
                      ) : (
                        <X className="auth-criteria-icon" />
                      )}
                      At least one lowercase letter
                    </li>
                    <li className={`auth-password-criteria-item ${passwordCriteria.number ? "auth-criteria-met" : "auth-criteria-unmet"}`}>
                      {passwordCriteria.number ? (
                        <Check className="auth-criteria-icon" />
                      ) : (
                        <X className="auth-criteria-icon" />
                      )}
                      At least one number
                    </li>
                    <li className={`auth-password-criteria-item ${passwordCriteria.special ? "auth-criteria-met" : "auth-criteria-unmet"}`}>
                      {passwordCriteria.special ? (
                        <Check className="auth-criteria-icon" />
                      ) : (
                        <X className="auth-criteria-icon" />
                      )}
                      At least one special character (recommended)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="auth-field">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className={cn("auth-input", validationErrors.confirmPassword && "auth-input-error")}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {validationErrors.confirmPassword && (
                  <p className="auth-error-message">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {error && <p className="auth-error-message">{error}</p>}

              <Button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
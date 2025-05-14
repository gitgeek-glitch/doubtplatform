"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { loginUser, registerUser, clearError } from "@/redux/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AuthPage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, error } = useAppSelector(state => state.auth)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState(0)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

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
  
  // Handle rate limit countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (rateLimited && rateLimitRetryAfter > 0) {
      setRateLimitCountdown(rateLimitRetryAfter);
      
      intervalId = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            setRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [rateLimited, rateLimitRetryAfter]);
  
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

    if (rateLimited) {
      toast({
        title: "Rate limited",
        description: `Too many attempts. Please try again in ${rateLimitCountdown} seconds.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!validateLoginForm()) {
      toast({
        title: "Login failed",
        description: "Please check your inputs and try again.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const resultAction = await dispatch(loginUser(loginData))
      
      if (loginUser.fulfilled.match(resultAction)) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
        navigate("/")
      } else if (loginUser.rejected.match(resultAction)) {
        const error = resultAction.payload as { status?: number; message?: string };
        
        if (error?.status === 429) {
          setRateLimited(true);
          setRateLimitRetryAfter(30); // or get from response headers if provided
          toast({
            title: "Too many attempts",
            description: "Please wait before trying again",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login failed",
            description: error?.message || "An error occurred",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }
  
  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Don't attempt register if rate limited
    if (rateLimited) {
      toast({
        title: "Rate limited",
        description: `Too many attempts. Please try again in ${rateLimitCountdown} seconds.`,
        variant: "destructive"
      })
      return
    }
    
    if (!validateRegisterForm()) {
      toast({
        title: "Registration failed",
        description: "Please check your inputs and try again.",
        variant: "destructive"
      })
      return
    }
    
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
      } else if (registerUser.rejected.match(resultAction)) {
        // If rate limited, the toast is already shown by the rate limit effect
        if (!rateLimited) {
          toast({
            title: "Registration failed",
            description: error || "Could not create account",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  // Switch tab handler
  const handleSwitchTab = (tab: string) => {
    setActiveTab(tab)
  }
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="auth-back-link auth-back-button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
        </Button>
        
        <div className="auth-header">
          <h1 className="auth-title">Welcome to DoubtSolve</h1>
          <p className="auth-subtitle">Your college doubt-solving platform</p>
        </div>

        {rateLimited && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-4 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Too many attempts</h4>
              <p className="text-sm">
                Please wait {rateLimitCountdown} seconds before trying again.
              </p>
            </div>
          </div>
        )}

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
                  disabled={isLoading || rateLimited}
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
                  disabled={isLoading || rateLimited}
                />
                {validationErrors.password && (
                  <p className="auth-error-message">{validationErrors.password}</p>
                )}
              </div>

              {error && !rateLimited && <p className="auth-error-message">{error}</p>}

              <Button 
                type="submit" 
                className="auth-submit" 
                disabled={isLoading || rateLimited}
              >
                {isLoading ? "Signing in..." : rateLimited ? `Try again in ${rateLimitCountdown}s` : "Sign In"}
              </Button>

              <div className="auth-footer">
                <p>
                  Don't have an account?{" "}
                  <Button 
                    variant="link" 
                    className="auth-link p-0" 
                    onClick={() => handleSwitchTab("register")}
                  >
                    Register now
                  </Button>
                </p>
              </div>
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
                  disabled={isLoading || rateLimited}
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
                  disabled={isLoading || rateLimited}
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
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={cn("auth-input", validationErrors.password && "auth-input-error")}
                  required
                  autoComplete="new-password"
                  disabled={isLoading || rateLimited}
                />
                {validationErrors.password && (
                  <p className="auth-error-message">{validationErrors.password}</p>
                )}
                
                {(passwordFocused || registerData.password) && (
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
                )}
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
                  disabled={isLoading || rateLimited}
                />
                {validationErrors.confirmPassword && (
                  <p className="auth-error-message">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {error && !rateLimited && <p className="auth-error-message">{error}</p>}

              <Button 
                type="submit" 
                className="auth-submit" 
                disabled={isLoading || rateLimited}
              >
                {isLoading ? "Creating account..." : rateLimited ? `Try again in ${rateLimitCountdown}s` : "Create Account"}
              </Button>

              <div className="auth-footer">
                <p>
                  Already have an account?{" "}
                  <Button 
                    variant="link" 
                    className="auth-link p-0" 
                    onClick={() => handleSwitchTab("login")}
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
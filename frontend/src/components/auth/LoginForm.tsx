import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { loginUser } from "@/redux/thunks/authThunks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface LoginFormProps {
  isLoading: boolean
  setLocalLoading: (loading: boolean) => void
  onSwitchTab: () => void
}

export default function LoginForm({ isLoading, setLocalLoading, onSwitchTab }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) {
      toast({
        title: "Login failed",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setLocalLoading(true)
      const resultAction = await dispatch(loginUser(loginData))

      if (loginUser.fulfilled.match(resultAction)) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
        navigate("/home")
      } else if (loginUser.rejected.match(resultAction)) {
        const payload = resultAction.payload as any
        toast({
          title: "Login failed",
          description: payload?.message || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLocalLoading(false)
    }
  }

  return (
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
        {validationErrors.email && <p className="auth-error-message">{validationErrors.email}</p>}
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
        {validationErrors.password && <p className="auth-error-message">{validationErrors.password}</p>}
      </div>

      {error && <p className="auth-error-message">{error}</p>}

      <Button type="submit" className="auth-submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="auth-footer">
        <p>
          Don't have an account?{" "}
          <Button
            variant="link"
            className="auth-link p-0"
            onClick={onSwitchTab}
            disabled={isLoading}
          >
            Register now
          </Button>
        </p>
      </div>
    </form>
  )
}
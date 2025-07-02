import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { registerUser } from "@/redux/thunks/authThunks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import PasswordCriteria from "./PasswordCriteria"
import axios from "axios"

interface RegisterFormProps {
  isLoading: boolean
  setLocalLoading: (loading: boolean) => void
  onSwitchTab: () => void
}

export default function RegisterForm({ isLoading, setLocalLoading, onSwitchTab }: RegisterFormProps) {
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [emailVerification, setEmailVerification] = useState({
    isEmailValid: false,
    isVerificationSent: false,
    isEmailVerified: false,
    otp: "",
    isVerifying: false,
    isSendingCode: false,
    canResend: false,
    resendTimer: 0
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

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

  useEffect(() => {
    const isValidEmail = registerData.email &&
    /\S+@\S+\.\S+/.test(registerData.email) &&
    (registerData.email.endsWith(".ac.in") || registerData.email.endsWith(".edu"));
    
    setEmailVerification(prev => ({
      ...prev,
      isEmailValid: Boolean(isValidEmail)
    }))

    if (!isValidEmail) {
      setEmailVerification(prev => ({
        ...prev,
        isVerificationSent: false,
        isEmailVerified: false,
        otp: ""
      }))
    }
  }, [registerData.email])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (emailVerification.resendTimer > 0) {
      interval = setInterval(() => {
        setEmailVerification(prev => ({
          ...prev,
          resendTimer: prev.resendTimer - 1
        }))
      }, 1000)
    } else if (emailVerification.resendTimer === 0 && emailVerification.isVerificationSent) {
      setEmailVerification(prev => ({
        ...prev,
        canResend: true
      }))
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [emailVerification.resendTimer, emailVerification.isVerificationSent])

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setEmailVerification(prev => ({ ...prev, otp: value }))
    }
  }

  const sendVerificationCode = async () => {
    if (!emailVerification.isEmailValid) return

    try {
      setEmailVerification(prev => ({ ...prev, isSendingCode: true }))
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/send-verification`,
        { email: registerData.email }
      )

      if (response.data.success) {
        setEmailVerification(prev => ({
          ...prev,
          isVerificationSent: true,
          canResend: false,
          resendTimer: 60
        }))
        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Failed to send code",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setEmailVerification(prev => ({ ...prev, isSendingCode: false }))
    }
  }

  const verifyEmailCode = async () => {
    if (!emailVerification.otp || emailVerification.otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      })
      return
    }

    try {
      setEmailVerification(prev => ({ ...prev, isVerifying: true }))
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/verify-email`,
        { 
          email: registerData.email,
          otp: emailVerification.otp 
        }
      )

      if (response.data.success) {
        setEmailVerification(prev => ({
          ...prev,
          isEmailVerified: true
        }))
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified!",
        })
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.response?.data?.message || "Invalid verification code.",
        variant: "destructive",
      })
    } finally {
      setEmailVerification(prev => ({ ...prev, isVerifying: false }))
    }
  }

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {}

    if (!registerData.name.trim()) {
      errors.name = "Name is required"
    }

    if (!registerData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = "Email is invalid"
    } else if (!(registerData.email.endsWith(".ac.in") || registerData.email.endsWith(".edu"))) {
      errors.email = "Please use your college email (ending with .ac.in)"
    }

    if (!emailVerification.isEmailVerified) {
      errors.email = "Please verify your email first"
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRegisterForm()) {
      toast({
        title: "Registration failed",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setLocalLoading(true)
      const resultAction = await dispatch(
        registerUser({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      )

      if (registerUser.fulfilled.match(resultAction)) {
        toast({
          title: "Registration successful",
          description: "Your account has been created",
        })
        navigate("/home")
      } else if (registerUser.rejected.match(resultAction)) {
        const payload = resultAction.payload as any
        toast({
          title: "Registration failed",
          description: payload?.message || "Could not create account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLocalLoading(false)
    }
  }

  return (
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
        {validationErrors.name && <p className="auth-error-message">{validationErrors.name}</p>}
      </div>

      <div className="auth-field">
        <Label htmlFor="register-email">College Email</Label>
        <div className="space-y-3">
          <Input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter Your College Email"
            value={registerData.email}
            onChange={handleRegisterChange}
            className={cn(
              "auth-input", 
              validationErrors.email && "auth-input-error",
              emailVerification.isEmailVerified && "border-green-500"
            )}
            required
            disabled={isLoading || emailVerification.isEmailVerified}
          />
          
          {emailVerification.isEmailValid && !emailVerification.isEmailVerified && (
            <Button
              type="button"
              onClick={sendVerificationCode}
              disabled={emailVerification.isSendingCode || (emailVerification.isVerificationSent && !emailVerification.canResend)}
              className="w-full auth-submit text-white"
            >
              {emailVerification.isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : emailVerification.isVerificationSent && !emailVerification.canResend ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend in {emailVerification.resendTimer}s
                </>
              ) : emailVerification.canResend ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          )}

          {emailVerification.isVerificationSent && !emailVerification.isEmailVerified && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={emailVerification.otp}
                  onChange={handleOtpChange}
                  className="auth-input text-center tracking-wider font-mono"
                  maxLength={6}
                  disabled={emailVerification.isVerifying}
                />
                <Button
                  type="button"
                  onClick={verifyEmailCode}
                  disabled={emailVerification.isVerifying || emailVerification.otp.length !== 6}
                  className="auth-submit text-white px-6"
                >
                  {emailVerification.isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          )}

          {emailVerification.isEmailVerified && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              Email verified successfully
            </div>
          )}
        </div>
        
        {validationErrors.email && <p className="auth-error-message">{validationErrors.email}</p>}
        <p className="auth-hint">Must be your institutional email ending with .ac.in or .edu</p>
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
          disabled={isLoading}
        />
        {validationErrors.password && <p className="auth-error-message">{validationErrors.password}</p>}

        <PasswordCriteria 
          show={passwordFocused || registerData.password.length > 0}
          criteria={passwordCriteria}
        />
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

      <Button 
        type="submit" 
        className="auth-submit text-white" 
        disabled={isLoading || !emailVerification.isEmailVerified}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className="auth-footer">
        <p>
          Already have an account?{" "}
          <Button
            variant="link"
            className="auth-link p-0"
            onClick={onSwitchTab}
            disabled={isLoading}
          >
            Sign in
          </Button>
        </p>
      </div>
    </form>
  )
}
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import PasswordCriteria from "./PasswordCriteria"
import axios from "axios"

interface ForgotPasswordFormProps {
  isLoading: boolean
  setLocalLoading: (loading: boolean) => void
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ isLoading, onBackToLogin }: ForgotPasswordFormProps) {
  const { toast } = useToast()

  const [step, setStep] = useState<"email" | "otp" | "password">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [emailState, setEmailState] = useState({
    isValid: false,
    isSending: false,
    isSent: false,
    canResend: false,
    resendTimer: 0,
  })

  const [otpState, setOtpState] = useState({
    isVerifying: false,
    isVerified: false,
  })

  const [passwordState, setPasswordState] = useState({
    isResetting: false,
    focused: false,
    criteria: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Email validation effect
  useEffect(() => {
    const isValidEmail = email && /\S+@\S+\.\S+/.test(email) && (email.endsWith(".ac.in") || email.endsWith(".edu"))

    setEmailState((prev) => ({
      ...prev,
      isValid: Boolean(isValidEmail),
    }))
  }, [email])

  // Password criteria effect
  useEffect(() => {
    setPasswordState((prev) => ({
      ...prev,
      criteria: {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
      },
    }))
  }, [newPassword])

  // Resend timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (emailState.resendTimer > 0) {
      interval = setInterval(() => {
        setEmailState((prev) => ({
          ...prev,
          resendTimer: prev.resendTimer - 1,
        }))
      }, 1000)
    } else if (emailState.resendTimer === 0 && emailState.isSent) {
      setEmailState((prev) => ({
        ...prev,
        canResend: true,
      }))
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [emailState.resendTimer, emailState.isSent])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setOtp(value)
    }
  }

  const sendPasswordResetOTP = async () => {
    if (!emailState.isValid) return

    try {
      setEmailState((prev) => ({ ...prev, isSending: true }))

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/send-password-reset`, { email })

      if (response.data.success) {
        setEmailState((prev) => ({
          ...prev,
          isSent: true,
          canResend: false,
          resendTimer: 60,
        }))
        setStep("otp")
        toast({
          title: "Reset code sent",
          description: "Please check your email for the password reset code.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Failed to send reset code",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setEmailState((prev) => ({ ...prev, isSending: false }))
    }
  }

  const verifyPasswordResetOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit reset code.",
        variant: "destructive",
      })
      return
    }

    try {
      setOtpState((prev) => ({ ...prev, isVerifying: true }))

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-password-reset`, { email, otp })

      if (response.data.success) {
        setOtpState((prev) => ({ ...prev, isVerified: true }))
        setStep("password")
        toast({
          title: "Code verified",
          description: "Please enter your new password.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.response?.data?.message || "Invalid reset code.",
        variant: "destructive",
      })
    } finally {
      setOtpState((prev) => ({ ...prev, isVerifying: false }))
    }
  }

  const resetPassword = async () => {
    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = "New password is required"
    } else if (
      !passwordState.criteria.length ||
      !passwordState.criteria.uppercase ||
      !passwordState.criteria.lowercase ||
      !passwordState.criteria.number
    ) {
      errors.newPassword = "Password does not meet requirements"
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Password reset failed",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setPasswordState((prev) => ({ ...prev, isResetting: true }))

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword,
      })

      if (response.data.success) {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. Please login with your new password.",
        })
        onBackToLogin()
      }
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setPasswordState((prev) => ({ ...prev, isResetting: false }))
    }
  }

  if (step === "email") {
    return (
      <div className="auth-form">
        <div className="auth-field">
          <Label htmlFor="reset-email">College Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="Enter your college email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
            disabled={isLoading || emailState.isSending}
          />
          <p className="auth-hint">Enter the email address associated with your account</p>
        </div>

        <Button
          type="button"
          onClick={sendPasswordResetOTP}
          disabled={!emailState.isValid || emailState.isSending || isLoading}
          className="auth-submit text-white w-full"
        >
          {emailState.isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Reset Code...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Reset Code
            </>
          )}
        </Button>

        <div className="auth-footer">
          <Button
            variant="link"
            className="auth-link p-0"
            onClick={onBackToLogin}
            disabled={isLoading || emailState.isSending}
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  if (step === "otp") {
    return (
      <div className="auth-form">
        <div className="auth-field">
          <Label htmlFor="reset-otp">Verification Code</Label>
          <div className="flex gap-2">
            <Input
              id="reset-otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={handleOtpChange}
              className="auth-input text-center tracking-wider font-mono"
              maxLength={6}
              disabled={otpState.isVerifying || isLoading}
            />
            <Button
              type="button"
              onClick={verifyPasswordResetOTP}
              disabled={otpState.isVerifying || otp.length !== 6 || isLoading}
              className="auth-submit text-white px-6"
            >
              {otpState.isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
          <p className="auth-hint">Enter the 6-digit code sent to {email}</p>
        </div>

        {emailState.canResend && (
          <Button
            type="button"
            variant="outline"
            onClick={sendPasswordResetOTP}
            disabled={emailState.isSending || isLoading}
            className="w-full bg-transparent"
          >
            {emailState.isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend Code"
            )}
          </Button>
        )}

        {emailState.resendTimer > 0 && (
          <p className="text-center text-sm text-muted-foreground">Resend code in {emailState.resendTimer}s</p>
        )}

        <div className="auth-footer">
          <Button
            variant="link"
            className="auth-link p-0"
            onClick={onBackToLogin}
            disabled={isLoading || otpState.isVerifying}
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  if (step === "password") {
    return (
      <div className="auth-form">
        <div className="auth-field">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setPasswordState((prev) => ({ ...prev, focused: true }))}
              onBlur={() => setPasswordState((prev) => ({ ...prev, focused: false }))}
              className={cn("auth-input pr-10", validationErrors.newPassword && "auth-input-error")}
              required
              disabled={isLoading || passwordState.isResetting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || passwordState.isResetting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {validationErrors.newPassword && <p className="auth-error-message">{validationErrors.newPassword}</p>}

          <PasswordCriteria show={passwordState.focused || newPassword.length > 0} criteria={passwordState.criteria} />
        </div>

        <div className="auth-field">
          <Label htmlFor="confirm-new-password">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn("auth-input pr-10", validationErrors.confirmPassword && "auth-input-error")}
              required
              disabled={isLoading || passwordState.isResetting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading || passwordState.isResetting}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {validationErrors.confirmPassword && <p className="auth-error-message">{validationErrors.confirmPassword}</p>}
        </div>

        <Button
          type="button"
          onClick={resetPassword}
          disabled={passwordState.isResetting || isLoading}
          className="auth-submit text-white w-full"
        >
          {passwordState.isResetting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting Password...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        <div className="auth-footer">
          <Button
            variant="link"
            className="auth-link p-0"
            onClick={onBackToLogin}
            disabled={isLoading || passwordState.isResetting}
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return null
}
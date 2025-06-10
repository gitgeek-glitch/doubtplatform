"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { clearError } from "@/redux/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"

export default function AuthPage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/home")
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    dispatch(clearError())
  }, [activeTab, dispatch])

  const isFormLoading = isLoading || localLoading

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isFormLoading) {
      timeoutId = setTimeout(() => {
        setLocalLoading(false)
        dispatch(clearError())
        toast({
          title: "Operation timeout",
          description: "The request is taking longer than expected. Please try again.",
          variant: "destructive",
        })
      }, 10000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isFormLoading, toast, dispatch])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="auth-back-link auth-back-button">
          <ArrowLeft className="mr-2 h-4 w-4" />
        </Button>

        <div className="auth-header">
          <h1 className="auth-title">Welcome to CollegeQuora</h1>
          <p className="auth-subtitle">Your college QnA platform</p>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="auth-tabs-list">
            <TabsTrigger value="login" className={cn(activeTab === "login" && "auth-tab-active")}>
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className={cn(activeTab === "register" && "auth-tab-active")}>
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm 
              isLoading={isFormLoading}
              setLocalLoading={setLocalLoading}
              onSwitchTab={() => setActiveTab("register")}
            />
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <RegisterForm 
              isLoading={isFormLoading}
              setLocalLoading={setLocalLoading}
              onSwitchTab={() => setActiveTab("login")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
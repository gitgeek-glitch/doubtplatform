"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export interface User {
  _id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  reputation: number
  badges: string[]
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setLoading(false)
          return
        }

        const response = await api.get(`${import.meta.env.VITE_API_URL}/auth/me`)
        setUser(response.data.user)
      } catch (error) {
        console.error("Auth check error:", error)
        localStorage.removeItem("token")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      // Trim email to remove any whitespace
      const trimmedEmail = email.trim().toLowerCase()
      console.log("Attempting login with:", { email: trimmedEmail })
      
      const response = await api.post(`${import.meta.env.VITE_API_URL}/auth/login`, { 
        email: trimmedEmail, 
        password 
      })
      console.log(response)
      
      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.message || "Something went wrong"
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true)
      // Trim email to remove any whitespace
      const trimmedEmail = email.trim().toLowerCase()
      console.log("Attempting registration with:", { name, email: trimmedEmail })
      
      const response = await api.post(`${import.meta.env.VITE_API_URL}/auth/register`, { 
        name, 
        email: trimmedEmail, 
        password 
      })
      console.log(response)
      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      })
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMessage = error.response?.data?.message || "Something went wrong"
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
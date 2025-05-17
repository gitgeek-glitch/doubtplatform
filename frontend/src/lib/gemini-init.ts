"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function useGeminiInit() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    try {
      // Check if API key exists in environment variables
      const envApiKey = import.meta.env.VITE_GEMINI_API_KEY
      
      if (envApiKey) {
        // Store in localStorage for components that need it
        localStorage.setItem("GEMINI_API_KEY", envApiKey)
        setInitialized(true)
        
        // Dispatch a custom event
        const event = new Event("gemini-api-key-loaded")
        window.dispatchEvent(event)
      } else {
        // Fallback to localStorage
        const localStorageApiKey = localStorage.getItem("GEMINI_API_KEY")
        
        if (localStorageApiKey) {
          setInitialized(true)
          
          // Dispatch a custom event
          const event = new Event("gemini-api-key-loaded")
          window.dispatchEvent(event)
        } else {
          console.warn("Gemini API key not found in environment variables or localStorage")
        }
      }
    } catch (error) {
      console.error("Error initializing Gemini API key:", error)
    }
  }, [toast])

  return {
    initialized
  }
}
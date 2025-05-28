"use client"

import { useState } from "react"
import { checkContentModeration } from "@/lib/content-moderation"
import { useToast } from "@/hooks/use-toast"

export function useContentModeration() {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  /**
   * Checks if the content is appropriate and shows a toast notification if not
   * @param content The content to check
   * @returns A promise that resolves to true if the content is appropriate, false otherwise
   */
  const checkContent = async (content: string): Promise<boolean> => {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      console.warn("Gemini API key not configured, skipping content moderation")
      return true // Skip moderation if no API key
    }

    setIsChecking(true)

    try {
      const result = await checkContentModeration(content)

      if (!result.isAppropriate) {
        toast({
          title: "Please use appropriate language",
          description: result.reason || "Your content contains inappropriate language and cannot be posted.",
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking content:", error)
      
      // Show a warning toast but allow content to pass through
      toast({
        title: "Content moderation unavailable",
        description: "Unable to check content at this time. Please ensure your content is appropriate.",
        variant: "default",
      })
      
      return true
    } finally {
      setIsChecking(false)
    }
  }

  return {
    checkContent,
    isChecking
  }
}
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
    setIsChecking(true)

    try {
      const result = await checkContentModeration(content)

      if (!result.isAppropriate) {
        toast({
          title: "Please use appropriate language",
          description: "Your content contains inappropriate language and cannot be posted.",
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking content:", error)
      // In case of error, allow the content to pass through
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
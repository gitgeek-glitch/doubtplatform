import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAppDispatch } from "@/redux/hooks"
import { submitAnswer } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useContentModeration } from "@/hooks/use-content-moderation"

interface AnswerFormProps {
  questionId: string | undefined
  isAuthenticated: boolean
  onAnswerSubmitted: () => void
}

export function AnswerForm({ questionId, isAuthenticated, onAnswerSubmitted }: AnswerFormProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { checkContent, isChecking } = useContentModeration()
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to answer questions",
        variant: "destructive",
      })
      return
    }

    if (!answerContent.trim()) {
      toast({
        title: "Empty answer",
        description: "Please write something before submitting",
        variant: "destructive",
      })
      return
    }

    if (answerContent.trim().length < 20) {
      toast({
        title: "Answer too short",
        description: "Your answer must be at least 20 characters long",
        variant: "destructive",
      })
      return
    }

    const isContentAppropriate = await checkContent(answerContent)
    if (!isContentAppropriate) return

    if (!questionId) return

    try {
      setSubmitting(true)
      await dispatch(submitAnswer({ questionId, content: answerContent })).unwrap()
      setAnswerContent("")

      toast({
        title: "Answer submitted",
        description: "Your answer has been posted successfully",
      })

      onAnswerSubmitted()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your answer",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="question-detail-answer-form space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Answer</h3>

      <Textarea
        placeholder="Write your answer here... (Markdown supported)"
        className="question-detail-answer-textarea min-h-[150px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        value={answerContent}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswerContent(e.target.value)}
      />

      <div className="flex justify-end">
        <Button
          className="ask-question-submit"
          disabled={submitting || !isAuthenticated || !answerContent.trim() || isChecking}
          onClick={handleSubmitAnswer}
        >
          {submitting || isChecking ? "Processing..." : "Post Your Answer"}
        </Button>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          <Link to="/auth" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline">
            Sign in
          </Link>{" "}
          to post an answer
        </p>
      )}
    </div>
  )
}
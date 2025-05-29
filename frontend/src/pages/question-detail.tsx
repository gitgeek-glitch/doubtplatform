"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  fetchQuestionDetails,
  fetchVotes,
  deleteQuestion,
} from "@/redux/thunks/questionsThunks"
import { resetQuestionState } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QuestionHeader } from "@/components/question-detail/question-header"
import { QuestionContent } from "@/components/question-detail/question-content"
import { AnswersSection } from "@/components/question-detail/answers-section"
import { AnswerForm } from "@/components/question-detail/answer-form"
import { QuestionSidebar } from "@/components/question-detail/question-sidebar"
import { QuestionDetailSkeleton } from "@/components/question-detail/question-detail-skeleton"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import debounce from "lodash/debounce"

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const {
    currentQuestion: question,
    answers,
    relatedQuestions,
    loading,
    answerVotes,
  } = useAppSelector((state) => state.questions)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const fetchingRef = useRef<boolean>(false)

  const fetchQuestionWithDetails = useCallback(
    (forceRefresh = false) => {
      if (!id || fetchingRef.current) return

      const now = Date.now()
      if (forceRefresh || now - lastFetchTimeRef.current > 30000) {
        lastFetchTimeRef.current = now
        fetchingRef.current = true

        if (forceRefresh) {
          setIsRefreshing(true)
        }

        dispatch(fetchQuestionDetails(id))
          .unwrap()
          .then(() => {
            if (isAuthenticated) {
              return dispatch(fetchVotes(id)).unwrap()
            }
          })
          .then(() => {
            if (forceRefresh) {
              setIsRefreshing(false)
            }
            fetchingRef.current = false
          })
          .catch(() => {
            if (forceRefresh) {
              setIsRefreshing(false)
            }
            fetchingRef.current = false
          })
      }
    },
    [id, isAuthenticated, dispatch],
  )

  useEffect(() => {
    if (id) {
      fetchQuestionWithDetails(true)
    }

    return () => {
      dispatch(resetQuestionState())
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [id, dispatch, fetchQuestionWithDetails])

  useEffect(() => {
    if (!id) return

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    const interval = setInterval(() => {
      fetchQuestionWithDetails(false)
    }, 60000)

    refreshIntervalRef.current = interval

    return () => {
      clearInterval(interval)
    }
  }, [id, fetchQuestionWithDetails])

  useEffect(() => {
    if (!id) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        if (now - lastFetchTimeRef.current > 30000) {
          fetchQuestionWithDetails(false)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [id, fetchQuestionWithDetails])

  const handleRefresh = debounce(() => {
    const now = Date.now()
    if (now - lastFetchTimeRef.current > 5000) {
      fetchQuestionWithDetails(true)
    } else {
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, 500)

  const openDeleteQuestionDialog = () => {
    if (!isAuthenticated || !question || user?._id !== question.author._id) {
      toast({
        title: "Not authorized",
        description: "Only the question author can delete this question",
        variant: "destructive",
      })
      return
    }

    setShowDeleteQuestionDialog(true)
  }

  const handleDeleteQuestionConfirmed = async () => {
    try {
      setIsDeletingQuestion(true)

      const resultAction = await dispatch(deleteQuestion(id!))

      if (deleteQuestion.fulfilled.match(resultAction)) {
        toast({
          title: "Question deleted",
          description: "Your question has been deleted successfully",
        })

        navigate("/")
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the question",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the question",
        variant: "destructive",
      })
    } finally {
      setIsDeletingQuestion(false)
    }
  }

  if (loading && !question) {
    return <QuestionDetailSkeleton />
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Question not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The question you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="question-detail-grid">
        <div className="question-detail-main">
          <div className="space-y-6">
            <QuestionHeader
              question={question}
              isRefreshing={isRefreshing}
              isDeletingQuestion={isDeletingQuestion}
              onRefresh={handleRefresh}
              onDeleteQuestion={openDeleteQuestionDialog}
              user={user}
              isAuthenticated={isAuthenticated}
            />

            <QuestionContent question={question} />
          </div>

          <Separator className="bg-gray-300 dark:bg-gray-800" />

          <AnswersSection
            answers={answers}
            question={question}
            answerVotes={answerVotes}
            user={user}
            isAuthenticated={isAuthenticated}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onRefreshQuestionDetails={() => fetchQuestionWithDetails(true)}
          />

          <AnswerForm
            questionId={id}
            isAuthenticated={isAuthenticated}
            onAnswerSubmitted={() => fetchQuestionWithDetails(true)}
          />
        </div>

        <QuestionSidebar relatedQuestions={relatedQuestions} />
      </div>

      <ConfirmationDialog
        isOpen={showDeleteQuestionDialog}
        onClose={() => setShowDeleteQuestionDialog(false)}
        onConfirm={handleDeleteQuestionConfirmed}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone and will remove all associated answers."
        confirmText="Delete Question"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}
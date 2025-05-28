"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  fetchQuestionDetails,
  fetchVotes,
  voteAnswer,
  acceptAnswer,
  submitAnswer,
  resetQuestionState,
  deleteQuestion,
  deleteAnswer,
} from "@/redux/slices/questionsSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ThumbsUp, ThumbsDown, MessageSquare, Check, Share2, RefreshCw, Trash2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/markdown-renderer"
import debounce from "lodash/debounce"
import { useContentModeration } from "@/hooks/use-content-moderation"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const {
    currentQuestion: question,
    answers,
    relatedQuestions,
    loading,
    answerVotes,
  } = useAppSelector((state) => state.questions)
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const [votingAnswers, setVotingAnswers] = useState<Set<string>>(new Set())
  const lastFetchTimeRef = useRef<number>(0)
  const stableToast = useRef(toast)
  const fetchingRef = useRef<boolean>(false)
  const navigate = useNavigate()
  const { checkContent, isChecking } = useContentModeration()
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false)
  const [showDeleteAnswerDialog, setShowDeleteAnswerDialog] = useState(false)
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null)

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
              stableToast.current({
                title: "Refreshed",
                description: "Question and answers have been updated",
              })
            }
            fetchingRef.current = false
          })
          .catch(() => {
            if (forceRefresh) {
              setIsRefreshing(false)
              stableToast.current({
                title: "Error",
                description: "Failed to refresh question details",
                variant: "destructive",
              })
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

  const handleAnswerVote = async (answerId: string, value: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      })
      return
    }

    if (votingAnswers.has(answerId)) {
      return
    }

    try {
      setVotingAnswers((prev) => new Set(prev).add(answerId))

      const currentVote = answerVotes[answerId] || 0
      const finalValue = currentVote === value ? 0 : value

      await dispatch(voteAnswer({ answerId, value: finalValue })).unwrap()

      toast({
        title: "Vote registered",
        description: "Your vote has been recorded",
      })
    } catch (error: any) {
      const errorMessage = typeof error === "string" ? error : error?.message || "Unknown error"

      if (errorMessage.includes("409") || errorMessage.includes("Duplicate")) {
        toast({
          title: "Vote conflict",
          description: "Please refresh the page and try again",
          variant: "destructive",
        })
        setTimeout(() => {
          fetchQuestionWithDetails(true)
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: "Failed to register your vote",
          variant: "destructive",
        })
      }
    } finally {
      setTimeout(() => {
        setVotingAnswers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(answerId)
          return newSet
        })
      }, 1000)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    if (!isAuthenticated || !question || user?._id !== question.author._id) {
      toast({
        title: "Not authorized",
        description: "Only the question author can accept answers",
        variant: "destructive",
      })
      return
    }

    try {
      await dispatch(acceptAnswer(answerId)).unwrap()

      toast({
        title: "Answer accepted",
        description: "You've marked this answer as accepted",
      })

      fetchQuestionWithDetails(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept answer",
        variant: "destructive",
      })
    }
  }

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

    if (!id) return

    try {
      setSubmitting(true)
      await dispatch(submitAnswer({ questionId: id, content: answerContent })).unwrap()
      setAnswerContent("")

      toast({
        title: "Answer submitted",
        description: "Your answer has been posted successfully",
      })

      fetchQuestionWithDetails(true)
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

  const handleShareQuestion = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Question link copied to clipboard",
    })
  }

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

  const openDeleteAnswerDialog = (answerId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete answers",
        variant: "destructive",
      })
      return
    }

    const answer = answers.find((a) => a._id === answerId)
    if (!answer || (user?._id !== answer.author._id && user?._id !== question?.author._id)) {
      toast({
        title: "Not authorized",
        description: "You don't have permission to delete this answer",
        variant: "destructive",
      })
      return
    }

    setAnswerToDelete(answerId)
    setShowDeleteAnswerDialog(true)
  }

  const handleDeleteAnswerConfirmed = async () => {
    if (!answerToDelete) return

    try {
      setDeletingAnswerId(answerToDelete)

      const resultAction = await dispatch(deleteAnswer(answerToDelete))

      if (deleteAnswer.fulfilled.match(resultAction)) {
        toast({
          title: "Answer deleted",
          description: "The answer has been deleted successfully",
        })

        fetchQuestionWithDetails(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the answer",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the answer",
        variant: "destructive",
      })
    } finally {
      setDeletingAnswerId(null)
      setAnswerToDelete(null)
    }
  }

  if (loading && !question) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>

        <Separator />

        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Question not found</h2>
        <p className="text-muted-foreground mb-4">The question you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1
    if (!a.isAccepted && b.isAccepted) return 1
    return b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  })

  return (
    <>
      <div className="question-detail-grid">
        <div className="question-detail-main">
          <div className="space-y-6">
            <div className="question-detail-header">
              <h1 className="question-detail-title">{question.title}</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh question and answers"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
                <Button variant="outline" size="sm" className="question-detail-share" onClick={handleShareQuestion}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {isAuthenticated && user?._id === question.author._id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-gray-800 flex items-center gap-1"
                    onClick={openDeleteQuestionDialog}
                    disabled={isDeletingQuestion}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeletingQuestion ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Link to={`/?tag=${tag}`} key={tag}>
                  <Badge variant="outline" className="bg-gray-800/50 hover:bg-gray-800 border-gray-700">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>

            <div className="flex gap-6">
              <div className="question-detail-content">
                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={question.content} />
                </div>

                <div className="question-detail-author">
                  <div className="question-detail-author-card">
                    <div className="question-detail-author-info">
                      <p className="text-muted-foreground">
                        Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                      </p>
                      <Link to={`/profile/${question.author._id}`} className="question-detail-author-link">
                        {question.author.name}
                      </Link>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
                      <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="question-detail-answers-header">
                <MessageSquare className="h-5 w-5" />
                {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
              </h2>
              {answers.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              )}
            </div>

            {sortedAnswers.length > 0 ? (
              <div className="space-y-8">
                {sortedAnswers.map((answer) => (
                  <div
                    key={answer._id}
                    className={cn("question-detail-answer", answer.isAccepted && "question-detail-answer-accepted")}
                  >
                    <div className="flex gap-6">
                      <div className="question-detail-content">
                        <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={answer.content} />
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  answerVotes[answer._id] === 1 && "text-green-500 hover:text-green-400",
                                  votingAnswers.has(answer._id) && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAnswerVote(answer._id, 1)}
                                disabled={votingAnswers.has(answer._id)}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium">{answer.upvotes - answer.downvotes}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  answerVotes[answer._id] === -1 && "text-red-500 hover:text-red-400",
                                  votingAnswers.has(answer._id) && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAnswerVote(answer._id, -1)}
                                disabled={votingAnswers.has(answer._id)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                              {answer.isAccepted ? (
                                <div className="flex items-center text-green-500">
                                  <Check className="h-4 w-4" />
                                </div>
                              ) : (
                                user?._id === question.author._id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-green-500"
                                    onClick={() => handleAcceptAnswer(answer._id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )
                              )}
                            </div>
                          </div>

                          <div className="question-detail-author">
                            <div className="question-detail-author-card">
                              <div className="question-detail-author-info">
                                <p className="text-muted-foreground">
                                  Answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                                </p>
                                <Link to={`/profile/${answer.author._id}`} className="question-detail-author-link">
                                  {answer.author.name}
                                </Link>
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={answer.author.avatar || "/placeholder.svg"}
                                  alt={answer.author.name}
                                />
                                <AvatarFallback>{answer.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>

                        {isAuthenticated && (user?._id === answer.author._id || user?._id === question.author._id) && (
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-1"
                              onClick={() => openDeleteAnswerDialog(answer._id)}
                              disabled={deletingAnswerId === answer._id}
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingAnswerId === answer._id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="question-detail-no-answers">
                <p className="text-muted-foreground">No answers yet. Be the first to answer!</p>
              </div>
            )}
          </div>

          <div className="question-detail-answer-form">
            <h3 className="text-xl font-semibold">Your Answer</h3>

            <Textarea
              placeholder="Write your answer here... (Markdown supported)"
              className="question-detail-answer-textarea"
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
              <p className="text-sm text-muted-foreground text-center">
                <Link to="/auth" className="text-purple-400 hover:underline">
                  Sign in
                </Link>{" "}
                to post an answer
              </p>
            )}
          </div>
        </div>

        <div className="question-detail-sidebar">
          <div className="question-detail-sidebar-card">
            <h3 className="question-detail-sidebar-title">Related Questions</h3>
            {relatedQuestions.length > 0 ? (
              <ul className="question-detail-related-list">
                {relatedQuestions.map((q) => (
                  <li key={q._id}>
                    <Link to={`/question/${q._id}`} className="question-detail-related-link">
                      {q.title}
                    </Link>
                    <div className="question-detail-related-meta">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No related questions found</p>
            )}
          </div>

          <div className="question-detail-sidebar-card">
            <h3 className="question-detail-sidebar-title">Hot Tags</h3>
            <div className="question-detail-tag-cloud">
              {["dsa", "javascript", "react", "python", "algorithms", "database", "web"].map((tag) => (
                <Link to={`/?tag=${tag}`} key={tag}>
                  <Badge variant="outline" className="bg-gray-800/50 hover:bg-gray-800 border-gray-700">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
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

      <ConfirmationDialog
        isOpen={showDeleteAnswerDialog}
        onClose={() => {
          setShowDeleteAnswerDialog(false)
          setAnswerToDelete(null)
        }}
        onConfirm={handleDeleteAnswerConfirmed}
        title="Delete Answer"
        description="Are you sure you want to delete this answer? This action cannot be undone."
        confirmText="Delete Answer"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

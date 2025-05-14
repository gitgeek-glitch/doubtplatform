"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  fetchQuestionDetails,
  fetchVotes,
  voteQuestion,
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
import { ArrowUp, ArrowDown, MessageSquare, Check, Share2, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/markdown-renderer"

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
    questionVote,
    answerVotes,
  } = useAppSelector((state) => state.questions)
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const navigate = useNavigate()

  // Fetch question details on mount with cache busting
  const fetchQuestionWithDetails = (forceRefresh = false) => {
    if (!id) return

    const now = Date.now()
    // Only fetch if forced or if it's been more than 10 seconds since last fetch
    if (forceRefresh || now - lastFetchTimeRef.current > 10000) {
      lastFetchTimeRef.current = now

      if (forceRefresh) {
        setIsRefreshing(true)
      }

      dispatch(fetchQuestionDetails(id))
        .unwrap()
        .then(() => {
          if (isAuthenticated) {
            dispatch(fetchVotes(id))
          }
          if (forceRefresh) {
            setIsRefreshing(false)
            toast({
              title: "Refreshed",
              description: "Question and answers have been updated",
            })
          }
        })
        .catch((error) => {
          console.error("Error fetching question details:", error)
          if (forceRefresh) {
            setIsRefreshing(false)
            toast({
              title: "Error",
              description: "Failed to refresh question details",
              variant: "destructive",
            })
          }
        })
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchQuestionWithDetails(true)

    // Cleanup on unmount
    return () => {
      dispatch(resetQuestionState())
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [id, isAuthenticated, dispatch])

  // Set up polling for new answers
  useEffect(() => {
    if (!id) return

    // Poll for new answers every 15 seconds
    const interval = setInterval(() => {
      fetchQuestionWithDetails(false)
    }, 15000)

    setRefreshInterval(interval)

    // Clean up interval on unmount
    return () => {
      clearInterval(interval)
    }
  }, [id, dispatch])

  // Refresh answers when window regains focus
  useEffect(() => {
    if (!id) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchQuestionWithDetails(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [id, dispatch])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchQuestionWithDetails(true)
  }

  // Handle question vote
  const handleQuestionVote = async (value: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      })
      return
    }

    if (!id) return

    try {
      // If user already voted the same way, remove the vote
      const finalValue = questionVote === value ? 0 : value
      await dispatch(voteQuestion({ questionId: id, value: finalValue })).unwrap()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register your vote",
        variant: "destructive",
      })
    }
  }

  // Handle answer vote
  const handleAnswerVote = async (answerId: string, value: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      const currentVote = answerVotes[answerId] || 0
      // If user already voted the same way, remove the vote
      const finalValue = currentVote === value ? 0 : value

      await dispatch(voteAnswer({ answerId, value: finalValue })).unwrap()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register your vote",
        variant: "destructive",
      })
    }
  }

  // Handle accept answer
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

      // Refresh question details to ensure UI is up to date
      fetchQuestionWithDetails(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept answer",
        variant: "destructive",
      })
    }
  }

  // Handle submit answer
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

    if (!id) return

    try {
      setSubmitting(true)
      await dispatch(submitAnswer({ questionId: id, content: answerContent })).unwrap()
      setAnswerContent("")

      toast({
        title: "Answer submitted",
        description: "Your answer has been posted successfully",
      })

      // Refresh question details to show the new answer
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

  // Handle share question
  const handleShareQuestion = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Question link copied to clipboard",
    })
  }

  // Handle delete question
  const handleDeleteQuestion = async () => {
    if (!isAuthenticated || !question || user?._id !== question.author._id) {
      toast({
        title: "Not authorized",
        description: "Only the question author can delete this question",
        variant: "destructive",
      })
      return
    }

    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
        return
      }

      setIsDeletingQuestion(true)
      
      const resultAction = await dispatch(deleteQuestion(id!))
      
      if (deleteQuestion.fulfilled.match(resultAction)) {
        toast({
          title: "Question deleted",
          description: "Your question has been deleted successfully",
        })
        
        // Navigate back to home page
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

  // Handle delete answer
  const handleDeleteAnswer = async (answerId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete answers",
        variant: "destructive",
      })
      return
    }

    // Check if user is either the answer author or the question author
    const answer = answers.find((a) => a._id === answerId)
    if (!answer || (user?._id !== answer.author._id && user?._id !== question?.author._id)) {
      toast({
        title: "Not authorized",
        description: "You don't have permission to delete this answer",
        variant: "destructive",
      })
      return
    }

    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this answer? This action cannot be undone.")) {
        return
      }

      setDeletingAnswerId(answerId)
      
      const resultAction = await dispatch(deleteAnswer(answerId))
      
      if (deleteAnswer.fulfilled.match(resultAction)) {
        toast({
          title: "Answer deleted",
          description: "The answer has been deleted successfully",
        })
        
        // Refresh question details to update the UI
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

  // Sort answers: accepted first, then by votes
  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1
    if (!a.isAccepted && b.isAccepted) return 1
    return b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  })

  return (
    <div className="question-detail-grid">
      <div className="question-detail-main">
        {/* Question */}
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
                  onClick={handleDeleteQuestion}
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
            <div className="question-detail-vote-container">
              <Button
                variant="ghost"
                size="icon"
                className={cn("question-detail-vote-button", questionVote === 1 && "question-detail-vote-up")}
                onClick={() => handleQuestionVote(1)}
              >
                <ArrowUp className="h-6 w-6" />
              </Button>
              <span className="question-detail-vote-count">{question.upvotes - question.downvotes}</span>
              <Button
                variant="ghost"
                size="icon"
                className={cn("question-detail-vote-button", questionVote === -1 && "question-detail-vote-down")}
                onClick={() => handleQuestionVote(-1)}
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
            </div>

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

        {/* Answers */}
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
                    <div className="question-detail-vote-container">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "question-detail-vote-button",
                          answerVotes[answer._id] === 1 && "question-detail-vote-up",
                        )}
                        onClick={() => handleAnswerVote(answer._id, 1)}
                      >
                        <ArrowUp className="h-6 w-6" />
                      </Button>
                      <span className="question-detail-vote-count">{answer.upvotes - answer.downvotes}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "question-detail-vote-button",
                          answerVotes[answer._id] === -1 && "question-detail-vote-down",
                        )}
                        onClick={() => handleAnswerVote(answer._id, -1)}
                      >
                        <ArrowDown className="h-6 w-6" />
                      </Button>

                      {answer.isAccepted ? (
                        <div className="question-detail-accepted-indicator">
                          <Check className="h-6 w-6" />
                          <span className="text-xs">Accepted</span>
                        </div>
                      ) : (
                        user?._id === question.author._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="question-detail-accept-button"
                            onClick={() => handleAcceptAnswer(answer._id)}
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                        )
                      )}
                    </div>

                    <div className="question-detail-content">
                      <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer content={answer.content} />
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
                            <AvatarImage src={answer.author.avatar || "/placeholder.svg"} alt={answer.author.name} />
                            <AvatarFallback>{answer.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      
                      {isAuthenticated && (user?._id === answer.author._id || user?._id === question.author._id) && (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-1"
                            onClick={() => handleDeleteAnswer(answer._id)}
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

        {/* Answer form */}
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
              disabled={submitting || !isAuthenticated || !answerContent.trim()}
              onClick={handleSubmitAnswer}
            >
              {submitting ? "Submitting..." : "Post Your Answer"}
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

      {/* Sidebar */}
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
                    <Badge variant="outline" className="text-xs">
                      {q.upvotes - q.downvotes} votes
                    </Badge>
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
  )
}

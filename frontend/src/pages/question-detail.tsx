"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown, MessageSquare, Check, Share2 } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/markdown-renderer"

interface Author {
  _id: string
  name: string
  avatar?: string
  reputation: number
}

interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  upvotes: number
  downvotes: number
  author: Author
  createdAt: string
}

interface Answer {
  _id: string
  content: string
  upvotes: number
  downvotes: number
  author: Author
  isAccepted: boolean
  createdAt: string
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [relatedQuestions, setRelatedQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [questionVote, setQuestionVote] = useState(0)
  const [answerVotes, setAnswerVotes] = useState<Record<string, number>>({})

  useEffect(() => {
    if (id) {
      fetchQuestionDetails()
    }
  }, [id])

  const fetchQuestionDetails = async () => {
    try {
      setLoading(true)
      const [questionRes, answersRes, relatedRes] = await Promise.all([
        api.get(`/questions/${id}`),
        api.get(`/questions/${id}/answers`),
        api.get(`/questions/${id}/related`),
      ])

      setQuestion(questionRes.data)
      setAnswers(answersRes.data)
      setRelatedQuestions(relatedRes.data)

      // Initialize vote states
      if (isAuthenticated) {
        const votesRes = await api.get(`/questions/${id}/votes`)
        setQuestionVote(votesRes.data.questionVote || 0)

        const answerVotesObj: Record<string, number> = {}
        votesRes.data.answerVotes.forEach((vote: any) => {
          answerVotesObj[vote.answerId] = vote.value
        })
        setAnswerVotes(answerVotesObj)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load question details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionVote = async (value: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      // If user already voted the same way, remove the vote
      const finalValue = questionVote === value ? 0 : value

      await api.post(`/questions/${id}/vote`, { value: finalValue })

      setQuestionVote(finalValue)

      // Update question vote count
      if (question) {
        const updatedQuestion = { ...question }

        // Remove previous vote if any
        if (questionVote === 1) updatedQuestion.upvotes--
        if (questionVote === -1) updatedQuestion.downvotes--

        // Add new vote if not removing
        if (finalValue === 1) updatedQuestion.upvotes++
        if (finalValue === -1) updatedQuestion.downvotes++

        setQuestion(updatedQuestion)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register your vote",
        variant: "destructive",
      })
    }
  }

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

      await api.post(`/answers/${answerId}/vote`, { value: finalValue })

      setAnswerVotes((prev) => ({
        ...prev,
        [answerId]: finalValue,
      }))

      // Update answer vote count
      setAnswers((prev) =>
        prev.map((answer) => {
          if (answer._id === answerId) {
            const updatedAnswer = { ...answer }

            // Remove previous vote if any
            if (currentVote === 1) updatedAnswer.upvotes--
            if (currentVote === -1) updatedAnswer.downvotes--

            // Add new vote if not removing
            if (finalValue === 1) updatedAnswer.upvotes++
            if (finalValue === -1) updatedAnswer.downvotes++

            return updatedAnswer
          }
          return answer
        }),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register your vote",
        variant: "destructive",
      })
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
      await api.post(`/answers/${answerId}/accept`)

      setAnswers((prev) =>
        prev.map((answer) => ({
          ...answer,
          isAccepted: answer._id === answerId,
        })),
      )

      toast({
        title: "Answer accepted",
        description: "You've marked this answer as accepted",
      })
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

    try {
      setSubmitting(true)
      const response = await api.post(`/questions/${id}/answers`, {
        content: answerContent,
      })

      setAnswers((prev) => [...prev, response.data])
      setAnswerContent("")

      toast({
        title: "Answer submitted",
        description: "Your answer has been posted successfully",
      })
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

  if (loading) {
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
            <Button variant="outline" size="sm" className="question-detail-share" onClick={handleShareQuestion}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
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
          <h2 className="question-detail-answers-header">
            <MessageSquare className="h-5 w-5" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>

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
                        className={cn("question-detail-vote-button", answerVotes[answer._id] === 1 && "question-detail-vote-up")}
                        onClick={() => handleAnswerVote(answer._id, 1)}
                      >
                        <ArrowUp className="h-6 w-6" />
                      </Button>
                      <span className="question-detail-vote-count">{answer.upvotes - answer.downvotes}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("question-detail-vote-button", answerVotes[answer._id] === -1 && "question-detail-vote-down")}
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
              disabled={submitting || !isAuthenticated}
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
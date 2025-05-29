import { useState } from "react"
import { useAppDispatch } from "@/redux/hooks"
import { voteAnswer, acceptAnswer, deleteAnswer } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { MessageSquare, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AnswerCard } from "@/components/question-detail/answer-card"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface User {
  _id: string
  name: string
  avatar?: string
}

interface Answer {
  _id: string
  content: string
  author: User
  createdAt: string
  upvotes: number
  downvotes: number
  isAccepted: boolean
}

interface Question {
  _id: string
  author: User
}

interface AnswersSectionProps {
  answers: Answer[]
  question: Question
  answerVotes: Record<string, number>
  user: User | null
  isAuthenticated: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onRefreshQuestionDetails: () => void
}

export function AnswersSection({
  answers,
  question,
  answerVotes,
  user,
  isAuthenticated,
  isRefreshing,
  onRefresh,
  onRefreshQuestionDetails,
}: AnswersSectionProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [votingAnswers, setVotingAnswers] = useState<Set<string>>(new Set())
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const [showDeleteAnswerDialog, setShowDeleteAnswerDialog] = useState(false)
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null)

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
      const status = error?.status || error?.code
      const errorMessage = error?.message || error || "Unknown error"

      if (status === 409) {
        onRefreshQuestionDetails()
        return
      } else {
        toast({
          title: "Error",
          description: errorMessage,
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

      onRefreshQuestionDetails()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept answer",
        variant: "destructive",
      })
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

        onRefreshQuestionDetails()
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

  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1
    if (!a.isAccepted && b.isAccepted) return 1
    return b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  })

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="question-detail-answers-header text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>
          {answers.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          )}
        </div>

        {sortedAnswers.length > 0 ? (
          <div className="space-y-8">
            {sortedAnswers.map((answer) => (
              <AnswerCard
                key={answer._id}
                answer={answer}
                question={question}
                currentUserVote={answerVotes[answer._id] || 0}
                user={user}
                isAuthenticated={isAuthenticated}
                isVoting={votingAnswers.has(answer._id)}
                isDeleting={deletingAnswerId === answer._id}
                onVote={handleAnswerVote}
                onAccept={handleAcceptAnswer}
                onDelete={openDeleteAnswerDialog}
              />
            ))}
          </div>
        ) : (
          <div className="question-detail-no-answers">
            <p className="text-gray-600 dark:text-gray-400">No answers yet. Be the first to answer!</p>
          </div>
        )}
      </div>

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
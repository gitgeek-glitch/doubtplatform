import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Check, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/markdown-renderer"

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

interface AnswerCardProps {
  answer: Answer
  question: Question
  currentUserVote: number
  user: User | null
  isAuthenticated: boolean
  isVoting: boolean
  isDeleting: boolean
  onVote: (answerId: string, value: number) => void
  onAccept: (answerId: string) => void
  onDelete: (answerId: string) => void
}

export function AnswerCard({
  answer,
  question,
  currentUserVote,
  user,
  isAuthenticated,
  isVoting,
  isDeleting,
  onVote,
  onAccept,
  onDelete,
}: AnswerCardProps) {
  const netVotes = (answer.upvotes || 0) - (answer.downvotes || 0)

  return (
    <div
      className={cn(
        "question-detail-answer p-6 rounded-lg border", 
        answer.isAccepted 
          ? "question-detail-answer-accepted border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20" 
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      )}
    >
      <div className="flex gap-6">
        <div className="question-detail-content flex-1">
          <div className="prose prose-gray dark:prose-invert max-w-none">
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
                    currentUserVote === 1 && "text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400",
                    isVoting && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => onVote(answer._id, 1)}
                  disabled={isVoting}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[2rem] text-center text-gray-700 dark:text-gray-300">{netVotes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    currentUserVote === -1 && "text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400",
                    isVoting && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => onVote(answer._id, -1)}
                  disabled={isVoting}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                {answer.isAccepted ? (
                  <div className="flex items-center text-green-600 dark:text-green-500">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  isAuthenticated && user?._id === question.author._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"
                      onClick={() => onAccept(answer._id)}
                      title="Accept this answer"
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
                  <p className="text-gray-600 dark:text-gray-400">
                    Answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </p>
                  <Link 
                    to={`/profile/${answer.author._id}`} 
                    className="question-detail-author-link text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    {answer.author.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {isAuthenticated && (user?._id === answer.author._id || user?._id === question.author._id) && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                onClick={() => onDelete(answer._id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
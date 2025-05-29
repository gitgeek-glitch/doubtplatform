import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Share2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface User {
  _id: string
  name: string
  avatar?: string
}

interface Question {
  _id: string
  title: string
  tags: string[]
  author: User
}

interface QuestionHeaderProps {
  question: Question
  isRefreshing: boolean
  isDeletingQuestion: boolean
  onRefresh: () => void
  onDeleteQuestion: () => void
  user: User | null
  isAuthenticated: boolean
}

export function QuestionHeader({
  question,
  isRefreshing,
  isDeletingQuestion,
  onRefresh,
  onDeleteQuestion,
  user,
  isAuthenticated,
}: QuestionHeaderProps) {
  const { toast } = useToast()

  const handleShareQuestion = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Question link copied to clipboard",
    })
  }

  return (
    <div className="space-y-4">
      <div className="question-detail-header">
        <h1 className="question-detail-title text-gray-900 dark:text-gray-100">{question.title}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={onRefresh}
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
              className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-gray-300 dark:border-gray-800 flex items-center gap-1"
              onClick={onDeleteQuestion}
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
            <Badge variant="outline" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {tag}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
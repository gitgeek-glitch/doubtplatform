import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import MarkdownRenderer from "@/components/markdown-renderer"

interface User {
  _id: string
  name: string
  avatar?: string
}

interface Question {
  _id: string
  title: string
  content: string
  author: User
  createdAt: string
}

interface QuestionContentProps {
  question: Question
}

export function QuestionContent({ question }: QuestionContentProps) {
  return (
    <div className="flex gap-6">
      <div className="question-detail-content">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <MarkdownRenderer content={question.content} />
        </div>

        <div className="question-detail-author">
          <div className="question-detail-author-card">
            <div className="question-detail-author-info">
              <p className="text-gray-600 dark:text-gray-400">
                Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
              </p>
              <Link 
                to={`/profile/${question.author._id}`} 
                className="question-detail-author-link text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {question.author.name}
              </Link>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {question.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}
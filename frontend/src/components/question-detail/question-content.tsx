import { Link } from "react-router-dom"
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
                className="question-detail-author-link"
              >
                {question.author.name}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
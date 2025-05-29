import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface RelatedQuestion {
  _id: string
  title: string
  createdAt: string
}

interface QuestionSidebarProps {
  relatedQuestions: RelatedQuestion[]
}

export function QuestionSidebar({ relatedQuestions }: QuestionSidebarProps) {
  const hotTags = ["dsa", "javascript", "react", "python", "algorithms", "database", "web"]

  return (
    <div className="question-detail-sidebar space-y-6">
      <div className="question-detail-sidebar-card p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h3 className="question-detail-sidebar-title text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Related Questions
        </h3>
        {relatedQuestions.length > 0 ? (
          <ul className="question-detail-related-list space-y-3">
            {relatedQuestions.map((q) => (
              <li key={q._id}>
                <Link 
                  to={`/question/${q._id}`} 
                  className="question-detail-related-link text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline block"
                >
                  {q.title}
                </Link>
                <div className="question-detail-related-meta mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">No related questions found</p>
        )}
      </div>

      <div className="question-detail-sidebar-card p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h3 className="question-detail-sidebar-title text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Hot Tags
        </h3>
        <div className="question-detail-tag-cloud flex flex-wrap gap-2">
          {hotTags.map((tag) => (
            <Link to={`/?tag=${tag}`} key={tag}>
              <Badge variant="outline" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
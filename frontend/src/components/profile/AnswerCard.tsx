import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface AnswerCardProps {
  answer: any
}

export default function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <div className="profile-answer-card">
      <div className="mb-4">
        <Link to={`/question/${answer.question._id}`} className="profile-answer-title">
          {answer.question.title}
        </Link>
      </div>

      <div className="profile-answer-content">
        <p>{answer.content.substring(0, 200)}...</p>
      </div>

      <div className="profile-answer-meta">
        <div className="profile-answer-stats">
          <Badge variant="outline" className="profile-answer-badge">
            {answer.upvotes - answer.downvotes} votes
          </Badge>
          {answer.isAccepted && <Badge className="profile-answer-accepted">Accepted</Badge>}
        </div>

        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { deleteQuestion } from "@/redux/slices/questionsSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

interface QuestionCardProps {
  question: {
    _id: string
    title: string
    content: string
    tags: string[]
    upvotes: number
    downvotes: number
    answerCount: number
    viewCount?: number
    author: {
      _id: string
      name: string
      avatar?: string
    }
    createdAt: string
  }
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { toast } = useToast()
  const [votes, setVotes] = useState({
    upvotes: question.upvotes,
    downvotes: question.downvotes,
    userVote: 0, // 0: no vote, 1: upvote, -1: downvote
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleVote = async (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on questions",
        variant: "destructive",
      })
      return
    }

    try {
      const newVoteValue = voteType === "up" ? 1 : -1
      // If user already voted the same way, remove the vote
      const finalVoteValue = votes.userVote === newVoteValue ? 0 : newVoteValue

      await api.post(`/questions/${question._id}/vote`, { value: finalVoteValue })

      setVotes((prev) => {
        // Remove previous vote if any
        let newUpvotes = prev.upvotes
        let newDownvotes = prev.downvotes

        if (prev.userVote === 1) newUpvotes--
        if (prev.userVote === -1) newDownvotes--

        // Add new vote if not removing
        if (finalVoteValue === 1) newUpvotes++
        if (finalVoteValue === -1) newDownvotes++

        return {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: finalVoteValue,
        }
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register your vote",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuestion = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete questions",
        variant: "destructive",
      })
      return
    }

    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
        return
      }

      setIsDeleting(true)
      
      const resultAction = await dispatch(deleteQuestion(question._id))
      
      if (deleteQuestion.fulfilled.match(resultAction)) {
        toast({
          title: "Question deleted",
          description: "Your question has been deleted successfully",
        })
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
      setIsDeleting(false)
    }
  }

  // Truncate content for preview
  const truncatedContent = question.content.length > 150 ? question.content.substring(0, 150) + "..." : question.content

  return (
    <Card className="question-card">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start gap-4">
          <Link to={`/question/${question._id}`} className="question-card-title">
            {question.title}
          </Link>
          <div className="flex items-center gap-1 min-w-[100px]">
            <Button
              variant="ghost"
              size="icon"
              className={cn("question-card-vote-button", votes.userVote === 1 && "text-green-500")}
              onClick={() => handleVote("up")}
            >
              <ThumbsUp className="h-5 w-5" />
            </Button>
            <span className="font-medium text-lg">{votes.upvotes - votes.downvotes}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn("question-card-vote-button", votes.userVote === -1 && "text-red-500")}
              onClick={() => handleVote("down")}
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-muted-foreground mb-3">{truncatedContent}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {question.tags.map((tag) => (
            <Link to={`/?tag=${tag}`} key={tag}>
              <Badge variant="outline" className="question-card-tag">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${question.author._id}`} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
              <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{question.author.name}</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user?._id === question.author._id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-1"
              onClick={handleDeleteQuestion}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
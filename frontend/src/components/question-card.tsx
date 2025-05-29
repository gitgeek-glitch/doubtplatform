"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { deleteQuestion } from "@/redux/thunks/questionsThunks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface QuestionCardProps {
  question: {
    _id: string
    title: string
    content: string
    tags: string[]
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const openDeleteConfirmation = (e: React.MouseEvent) => {
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

    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
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

  const truncatedContent = question.content.length > 150 ? question.content.substring(0, 150) + "..." : question.content

  return (
    <>
      <Card className="question-card">
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start gap-4">
            <Link to={`/question/${question._id}`} className="question-card-title">
              {question.title}
            </Link>
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
                onClick={openDeleteConfirmation}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { X } from 'lucide-react'
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import MarkdownRenderer from "@/components/markdown-renderer"
import { cn } from "@/lib/utils"

export default function AskQuestionPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [previewTab, setPreviewTab] = useState("write")

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to ask a question",
        variant: "destructive",
      })
      navigate("/auth")
    }
  }, [isAuthenticated, navigate, toast])

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    } else if (tags.length >= 5) {
      toast({
        title: "Tag limit reached",
        description: "You can only add up to 5 tags",
        variant: "destructive",
      })
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your question",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please provide details for your question",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for your question",
        variant: "destructive",
      })
      return
    }

    if (tags.length === 0) {
      toast({
        title: "Tags required",
        description: "Please add at least one tag to your question",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post(`${import.meta.env.VITE_API_URL}/questions`, {
        title,
        content,
        category,
        tags,
      })

      toast({
        title: "Question posted",
        description: "Your question has been posted successfully",
      })

      navigate(`/question/${response.data._id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post your question",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Categories for the dropdown
  const categories = [
    { value: "dsa", label: "Data Structures & Algorithms" },
    { value: "maths", label: "Mathematics" },
    { value: "programming", label: "Programming" },
    { value: "web", label: "Web Development" },
    { value: "mobile", label: "Mobile Development" },
    { value: "ai", label: "AI & Machine Learning" },
    { value: "database", label: "Databases" },
    { value: "networking", label: "Networking" },
    { value: "os", label: "Operating Systems" },
    { value: "other", label: "Other" },
  ]

  return (
    <div className="ask-question-container">
      <h1 className="ask-question-title">Ask a Question</h1>

      <form onSubmit={handleSubmit} className="ask-question-form">
        <div className="ask-question-field">
          <label htmlFor="title" className="ask-question-label">
            Question Title
          </label>
          <Input
            id="title"
            placeholder="e.g. How to implement a binary search tree in JavaScript?"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            className="ask-question-input"
          />
        </div>

        <div className="ask-question-field">
          <label htmlFor="category" className="ask-question-label">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="ask-question-input">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ask-question-field">
          <label htmlFor="tags" className="ask-question-label">
            Tags (up to 5)
          </label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="ask-question-input"
            />
            <Button type="button" onClick={handleAddTag} variant="outline" className="border-gray-800">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="ask-question-tag-container">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="ask-question-tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ask-question-tag-remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="ask-question-field">
          <label htmlFor="content" className="ask-question-label">
            Question Details
          </label>
          <Tabs value={previewTab} onValueChange={setPreviewTab} className="ask-question-tabs">
            <TabsList className="ask-question-tabs-list">
              <TabsTrigger 
                value="write" 
                className={cn(previewTab === "write" && "ask-question-tab-active")}
              >
                Write
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className={cn(previewTab === "preview" && "ask-question-tab-active")}
              >
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-2">
              <Textarea
                id="content"
                placeholder="Describe your question in detail. Markdown is supported."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                className="ask-question-content"
              />
              <p className="ask-question-hint">
                Markdown and code formatting is supported. Use backticks for inline code and triple backticks for code
                blocks.
              </p>
            </TabsContent>
            <TabsContent value="preview" className="mt-2">
              <div className="ask-question-preview">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-muted-foreground">Nothing to preview</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="ask-question-submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Question"}
          </Button>
        </div>
      </form>
    </div>
  )
}

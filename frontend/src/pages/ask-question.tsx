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
import { X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import MarkdownRenderer from "@/components/markdown-renderer"

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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Question Title
          </label>
          <Input
            id="title"
            placeholder="e.g. How to implement a binary search tree in JavaScript?"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            className="bg-gray-900 border-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-gray-900 border-gray-800">
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

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags (up to 5)
          </label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="bg-gray-900 border-gray-800"
            />
            <Button type="button" onClick={handleAddTag} variant="outline" className="border-gray-800">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-gray-800 hover:bg-gray-700 gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full hover:bg-gray-600 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            Question Details
          </label>
          <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
            <TabsList className="grid grid-cols-2 bg-gray-900">
              <TabsTrigger value="write" className="data-[state=active]:bg-purple-600">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600">
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-2">
              <Textarea
                id="content"
                placeholder="Describe your question in detail. Markdown is supported."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                className="min-h-[300px] bg-gray-900 border-gray-800"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Markdown and code formatting is supported. Use backticks for inline code and triple backticks for code
                blocks.
              </p>
            </TabsContent>
            <TabsContent value="preview" className="mt-2">
              <div className="min-h-[300px] p-4 border rounded-md border-gray-800 bg-gray-900">
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
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={submitting}>
            {submitting ? "Posting..." : "Post Question"}
          </Button>
        </div>
      </form>
    </div>
  )
}

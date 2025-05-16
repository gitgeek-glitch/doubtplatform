"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { submitQuestion } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import MarkdownRenderer from "@/components/markdown-renderer"

export default function AskQuestionPage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector(state => state.auth)
  const { loading } = useAppSelector(state => state.questions)
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    currentTag: "",
  })
  
  const [activeTab, setActiveTab] = useState("write")
  
  // Redirect if not authenticated
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
  
  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }
  
  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, currentTag: e.target.value }))
  }
  
  // Add tag when Enter is pressed
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }
  
  // Add tag to the list
  const addTag = () => {
    const tag = formData.currentTag.trim().toLowerCase()
    
    if (!tag) return
    
    // Validate tag
    if (tag.length > 20) {
      toast({
        title: "Tag too long",
        description: "Tags must be less than 20 characters",
        variant: "destructive",
      })
      return
    }
    
    // Check if tag already exists
    if (formData.tags.includes(tag)) {
      toast({
        title: "Duplicate tag",
        description: "This tag has already been added",
        variant: "destructive",
      })
      return
    }
    
    // Limit number of tags
    if (formData.tags.length >= 5) {
      toast({
        title: "Too many tags",
        description: "You can only add up to 5 tags",
        variant: "destructive",
      })
      return
    }
    
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
      currentTag: "",
    }))
  }
  
  // Remove tag from the list
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }
  
  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      errors.title = "Title is required"
    } else if (formData.title.length < 10) {
      errors.title = "Title must be at least 10 characters"
    } else if (formData.title.length > 150) {
      errors.title = "Title must be less than 150 characters"
    }
    
    if (!formData.content.trim()) {
      errors.content = "Content is required"
    } else if (formData.content.length < 30) {
      errors.content = "Content must be at least 30 characters"
    }
    
    if (!formData.category) {
      errors.category = "Category is required"
    }
    
    if (formData.tags.length === 0) {
      errors.tags = "At least one tag is required"
    }
    
    // Show validation errors as toast notifications
    Object.values(errors).forEach(errorMessage => {
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      })
    })
    
    return Object.keys(errors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const resultAction = await dispatch(submitQuestion({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
      }))
      
      if (submitQuestion.fulfilled.match(resultAction)) {
        toast({
          title: "Question posted",
          description: "Your question has been posted successfully",
        })
        navigate(`/question/${resultAction.payload._id}`)
      }
    } catch (error) {
      console.error("Failed to post question:", error)
    }
  }
  
  return (
    <div className="ask-question-container">
      <h1 className="ask-question-title">Ask a Question</h1>
      
      <form className="ask-question-form" onSubmit={handleSubmit}>
        <div className="ask-question-field">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. How to implement a binary search tree in JavaScript?"
            className="ask-question-input"
            value={formData.title}
            onChange={handleChange}
          />
          <p className="ask-question-hint">
            Be specific and imagine you're asking a question to another person
          </p>
        </div>
        
        <div className="ask-question-field">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="ask-question-input">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
              <SelectItem value="web">Web Development</SelectItem>
              <SelectItem value="mobile">Mobile Development</SelectItem>
              <SelectItem value="ml">Machine Learning</SelectItem>
              <SelectItem value="database">Databases</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="ask-question-field">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="currentTag"
            placeholder="e.g. javascript, react, algorithms"
            className="ask-question-input"
            value={formData.currentTag}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
          />
          <div className="ask-question-tag-container">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="ask-question-tag">
                {tag}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ask-question-tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <p className="ask-question-hint">
            Add up to 5 tags to describe what your question is about
          </p>
        </div>
        
        <div className="ask-question-field">
          <Label htmlFor="content">Content</Label>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="ask-question-tabs">
            
            <TabsContent value="write">
              <Textarea
                id="content"
                name="content"
                placeholder="Describe your problem in detail. Markdown is supported."
                className="ask-question-content"
                value={formData.content}
                onChange={handleChange}
                rows={15}
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="ask-question-preview">
                {formData.content ? (
                  <div className="prose prose-invert max-w-none">
                    <MarkdownRenderer content={formData.content} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet...</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <p className="ask-question-hint">
            Include all the information someone would need to answer your question
          </p>
        </div>
        
        <Button type="submit" className="ask-question-submit" disabled={loading}>
          {loading ? "Posting..." : "Post Your Question"}
        </Button>
      </form>
    </div>
  )
}
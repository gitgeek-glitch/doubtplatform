import express from "express"
import Question from "../models/Question.js"
import Answer from "../models/Answer.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Get all questions with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const sort = req.query.sort || "latest"
    const category = req.query.category
    const search = req.query.search
    const tag = req.query.tag

    let query = {}
    if (category && category !== "all") {
      query.category = category
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ]
    }
    if (tag) {
      query.tags = tag
    }

    // Sort configuration
    let sortConfig = {}
    switch (sort) {
      case "latest":
        sortConfig = { createdAt: -1 }
        break
      case "popular":
        sortConfig = { upvotes: -1 }
        break
      default:
        sortConfig = { createdAt: -1 }
    }

    const questions = await Question.find(query)
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name avatar reputation")
      .lean()

    res.json({
      questions,
      hasMore: questions.length === limit,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get a single question by ID
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "name avatar reputation")
      .populate("answerCount")

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Increment view count
    question.viewCount += 1
    await question.save()

    res.json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a new question
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body

    const question = new Question({
      title,
      content,
      tags,
      category,
      author: req.user.id,
    })

    await question.save()

    // Populate author info
    await question.populate("author", "name avatar")

    res.status(201).json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update a question
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body

    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is the author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this question" })
    }

    // Update fields
    if (title) question.title = title
    if (content) question.content = content
    if (tags) question.tags = tags
    if (category) question.category = category

    await question.save()

    // Populate author info
    await question.populate("author", "name avatar")

    res.json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete a question
router.delete("/:id", auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is the author or an admin
    const user = await User.findById(req.user.id)
    if (question.author.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this question" })
    }

    // Delete all answers to this question
    await Answer.deleteMany({ question: req.params.id })

    // Delete all votes for this question
    await Vote.deleteMany({ question: req.params.id })

    // Delete the question
    await question.deleteOne()

    res.json({ message: "Question deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Vote on a question
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { value } = req.body

    if (![1, 0, -1].includes(value)) {
      return res.status(400).json({ message: "Invalid vote value" })
    }

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is voting on their own question
    if (question.author.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot vote on your own question" })
    }

    // Find existing vote
    let vote = await Vote.findOne({
      user: req.user.id,
      question: req.params.id,
    })

    if (vote) {
      // Update existing vote
      const oldValue = vote.value
      vote.value = value
      await vote.save()

      // Update question vote counts
      if (oldValue === 1 && value !== 1) question.upvotes -= 1
      if (oldValue === -1 && value !== -1) question.downvotes -= 1
      if (value === 1 && oldValue !== 1) question.upvotes += 1
      if (value === -1 && oldValue !== -1) question.downvotes += 1
    } else {
      // Create new vote
      vote = new Vote({
        user: req.user.id,
        question: req.params.id,
        value,
      })
      await vote.save()

      // Update question vote counts
      if (value === 1) question.upvotes += 1
      if (value === -1) question.downvotes += 1
    }

    await question.save()

    // Update author reputation
    const author = await User.findById(question.author)
    if (author) {
      // Calculate reputation change
      let repChange = 0
      if (vote.value === 1) repChange = 5
      else if (vote.value === -1) repChange = -2

      author.reputation += repChange
      await author.save()
    }

    res.json({ vote, question })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get answers for a question
router.get("/:id/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id })
      .sort({ upvotes: -1, createdAt: -1 }) // Sort by upvotes first, then by date
      .populate("author", "name avatar reputation")
      .lean()

    res.json(answers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add an answer to a question
router.post("/:id/answers", auth, async (req, res) => {
  try {
    const { content } = req.body

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const answer = new Answer({
      content,
      question: req.params.id,
      author: req.user.id,
    })

    await answer.save()

    // Populate author info
    await answer.populate("author", "name avatar reputation")

    res.status(201).json(answer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user's votes for a question and its answers
router.get("/:id/votes", auth, async (req, res) => {
  try {
    // Get question vote
    const questionVote = await Vote.findOne({
      user: req.user.id,
      question: req.params.id,
    })

    // Get answer votes
    const answers = await Answer.find({ question: req.params.id })
    const answerIds = answers.map((answer) => answer._id)

    const answerVotes = await Vote.find({
      user: req.user.id,
      answer: { $in: answerIds },
    })

    res.json({
      questionVote: questionVote ? questionVote.value : 0,
      answerVotes: answerVotes.map((vote) => ({
        answerId: vote.answer,
        value: vote.value,
      })),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get related questions
router.get("/:id/related", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Find related questions based on tags and category
    const relatedQuestions = await Question.find({
      _id: { $ne: req.params.id },
      $or: [{ tags: { $in: question.tags } }, { category: question.category }],
    })
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(5)
      .select("title upvotes downvotes createdAt")

    res.json(relatedQuestions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
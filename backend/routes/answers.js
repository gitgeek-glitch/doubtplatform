import express from "express"
import Answer from "../models/Answer.js"
import Question from "../models/Question.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Update an answer
router.put("/:id", auth, async (req, res) => {
  try {
    const { content } = req.body

    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this answer" })
    }

    // Update content
    answer.content = content

    await answer.save()

    // Populate author info
    await answer.populate("author", "name avatar")

    res.json(answer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete an answer
router.delete("/:id", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is the author or an admin
    const user = await User.findById(req.user.id)
    if (answer.author.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this answer" })
    }

    // If this is the accepted answer, update the question
    const question = await Question.findById(answer.question)
    if (question && question.acceptedAnswer && question.acceptedAnswer.toString() === req.params.id) {
      question.acceptedAnswer = null
      question.isSolved = false
      await question.save()
    }

    // Delete all votes for this answer
    await Vote.deleteMany({ answer: req.params.id })

    // Delete the answer
    await answer.deleteOne()

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Vote on an answer
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { value } = req.body

    if (![1, 0, -1].includes(value)) {
      return res.status(400).json({ message: "Invalid vote value" })
    }

    const answer = await Answer.findById(req.params.id)
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is voting on their own answer
    if (answer.author.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot vote on your own answer" })
    }

    // Find existing vote
    let vote = await Vote.findOne({
      user: req.user.id,
      answer: req.params.id,
    })

    if (vote) {
      // Update existing vote
      const oldValue = vote.value
      vote.value = value
      await vote.save()

      // Update answer vote counts
      if (oldValue === 1 && value !== 1) answer.upvotes -= 1
      if (oldValue === -1 && value !== -1) answer.downvotes -= 1
      if (value === 1 && oldValue !== 1) answer.upvotes += 1
      if (value === -1 && oldValue !== -1) answer.downvotes += 1
    } else {
      // Create new vote
      vote = new Vote({
        user: req.user.id,
        answer: req.params.id,
        value,
      })
      await vote.save()

      // Update answer vote counts
      if (value === 1) answer.upvotes += 1
      if (value === -1) answer.downvotes += 1
    }

    await answer.save()

    // Update author reputation
    const author = await User.findById(answer.author)
    if (author) {
      // Calculate reputation change
      let repChange = 0
      if (vote.value === 1) repChange = 10
      else if (vote.value === -1) repChange = -2

      author.reputation += repChange
      await author.save()
    }

    res.json({ vote, answer })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Accept an answer
router.post("/:id/accept", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    const question = await Question.findById(answer.question)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is the question author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the question author can accept answers" })
    }

    // If there's already an accepted answer, unaccept it
    if (question.acceptedAnswer) {
      const previousAccepted = await Answer.findById(question.acceptedAnswer)
      if (previousAccepted) {
        previousAccepted.isAccepted = false
        await previousAccepted.save()
      }
    }

    // Accept the new answer
    answer.isAccepted = true
    await answer.save()

    // Update question
    question.acceptedAnswer = answer._id
    question.isSolved = true
    await question.save()

    // Award reputation to answer author
    const author = await User.findById(answer.author)
    if (author) {
      author.reputation += 15

      // Check if user should get a badge
      if (!author.badges.includes("Problem Solver") && author.reputation >= 100) {
        author.badges.push("Problem Solver")
      }

      await author.save()
    }

    res.json({ answer, question })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
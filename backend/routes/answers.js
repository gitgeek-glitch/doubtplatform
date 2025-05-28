import express from "express"
import Answer from "../models/Answer.js"
import Question from "../models/Question.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"

const router = express.Router()

const clearCache = (pattern) => {
  const keys = cache.keys()
  const matchingKeys = keys.filter((key) => key.includes(pattern))
  matchingKeys.forEach((key) => cache.del(key))
}

router.put("/:id", auth, async (req, res) => {
  try {
    const { content } = req.body

    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this answer" })
    }

    answer.content = content
    await answer.save()
    await answer.populate("author", "name avatar")

    clearCache(`/api/questions/${answer.question}/answers`)

    res.json(answer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete("/:id", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    const user = await User.findById(req.user.id)
    if (answer.author.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this answer" })
    }

    const questionId = answer.question

    await Promise.all([
      Question.findOneAndUpdate(
        { _id: questionId, acceptedAnswer: req.params.id },
        { $set: { acceptedAnswer: null, isSolved: false } },
      ),
      Vote.deleteMany({ answer: req.params.id }),
      answer.deleteOne(),
    ])

    clearCache(`/api/questions/${questionId}/answers`)

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

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

    if (answer.author.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot vote on your own answer" })
    }

    let vote
    let oldValue = 0

    try {
      vote = await Vote.findOneAndUpdate(
        {
          user: req.user.id,
          answer: req.params.id,
        },
        { value },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      )

      const existingVote = await Vote.findOne({
        user: req.user.id,
        answer: req.params.id,
      }).lean()

      if (existingVote && existingVote.value !== value) {
        oldValue = existingVote.value
      }
    } catch (duplicateError) {
      if (duplicateError.code === 11000) {
        const existingVote = await Vote.findOne({
          user: req.user.id,
          answer: req.params.id,
        })

        if (existingVote) {
          oldValue = existingVote.value
          existingVote.value = value
          vote = await existingVote.save()
        } else {
          return res.status(409).json({
            message: "Vote conflict detected. Please refresh and try again.",
          })
        }
      } else {
        throw duplicateError
      }
    }

    const voteDiff = value - oldValue

    if (voteDiff !== 0) {
      const updateFields = {}

      if (oldValue === 1) updateFields.$inc = { upvotes: -1 }
      if (oldValue === -1) updateFields.$inc = { ...updateFields.$inc, downvotes: -1 }
      if (value === 1) updateFields.$inc = { ...updateFields.$inc, upvotes: 1 }
      if (value === -1) updateFields.$inc = { ...updateFields.$inc, downvotes: 1 }

      if (Object.keys(updateFields).length > 0) {
        await Answer.findByIdAndUpdate(req.params.id, updateFields)
      }

      User.findById(answer.author)
        .then((author) => {
          if (author) {
            let repChange = 0

            if (voteDiff > 0) {
              repChange = voteDiff === 1 ? (oldValue === -1 ? 12 : 10) : voteDiff === 2 ? 12 : voteDiff * 10
            } else if (voteDiff < 0) {
              repChange = voteDiff === -1 ? (oldValue === 1 ? -12 : -2) : voteDiff === -2 ? -12 : voteDiff * 2
            }

            if (repChange !== 0) {
              author.reputation += repChange
              return author.save()
            }
          }
        })
        .catch((err) => console.error("Error updating reputation:", err))
    }

    clearCache(`/api/questions/${answer.question}/answers`)

    const updatedAnswer = await Answer.findById(req.params.id)
    res.json({ vote, answer: updatedAnswer })
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        message: "Duplicate vote detected. Please refresh the page and try again.",
      })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
})

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

    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the question author can accept answers" })
    }

    const [previousAccepted] = await Promise.all([
      question.acceptedAnswer ? Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false }) : null,

      Answer.findByIdAndUpdate(answer._id, { isAccepted: true }, { new: true }),

      Question.findByIdAndUpdate(question._id, { acceptedAnswer: answer._id, isSolved: true }, { new: true }),
    ])

    User.findById(answer.author)
      .then((author) => {
        if (author) {
          author.reputation += 15

          if (!author.badges.includes("Problem Solver") && author.reputation >= 100) {
            author.badges.push("Problem Solver")
          }

          return author.save()
        }
      })
      .catch((err) => console.error("Error updating reputation:", err))

    clearCache(`/api/questions/${question._id}`)
    clearCache(`/api/questions/${question._id}/answers`)

    res.json({
      message: "Answer accepted successfully",
      answerId: answer._id,
      questionId: question._id,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router

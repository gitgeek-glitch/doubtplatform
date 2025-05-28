import express from "express"
import mongoose from "mongoose"
import Answer from "../models/Answer.js"
import Question from "../models/Question.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"

const router = express.Router()

const clearCache = (pattern) => {
  try {
    if (typeof cache !== "undefined" && cache && typeof cache.keys === "function") {
      const keys = cache.keys()
      const matchingKeys = keys.filter((key) => key.includes(pattern))
      matchingKeys.forEach((key) => cache.del(key))
    }
  } catch (error) {
    console.error("Cache clear error:", error)
  }
}

router.put("/:id", auth, async (req, res) => {
  try {
    const { content } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ message: "Content must be at least 20 characters long" })
    }

    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this answer" })
    }

    answer.content = content.trim()
    await answer.save()
    await answer.populate("author", "name avatar reputation")

    clearCache(`/api/questions/${answer.question}/answers`)

    res.json(answer)
  } catch (error) {
    console.error("Update answer error:", error)
    res.status(500).json({ message: "Failed to update answer" })
  }
})

router.delete("/:id", auth, async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const answer = await Answer.findById(req.params.id).session(session)

      if (!answer) {
        throw new Error("Answer not found")
      }

      const user = await User.findById(req.user.id).session(session)
      const question = await Question.findById(answer.question).session(session)

      if (
        answer.author.toString() !== req.user.id &&
        !user?.isAdmin &&
        question &&
        question.author.toString() !== req.user.id
      ) {
        throw new Error("Not authorized to delete this answer")
      }

      const questionId = answer.question

      await Vote.deleteMany({ answer: req.params.id }).session(session)

      if (question && question.acceptedAnswer && question.acceptedAnswer.toString() === req.params.id) {
        await Question.findByIdAndUpdate(
          questionId,
          { $unset: { acceptedAnswer: 1 }, $set: { isSolved: false } },
          { session },
        )
      }

      await Answer.findByIdAndDelete(req.params.id).session(session)

      clearCache(`/api/questions/${questionId}/answers`)
      clearCache(`/api/questions/${questionId}`)
    })

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    console.error("Delete answer error:", error)
    res.status(500).json({
      message:
        error.message === "Answer not found"
          ? "Answer not found"
          : error.message === "Not authorized to delete this answer"
            ? "Not authorized to delete this answer"
            : "Failed to delete answer",
    })
  } finally {
    await session.endSession()
  }
})

router.post("/:id/vote", auth, async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const result = await session.withTransaction(async () => {
      const { value } = req.body

      if (![-1, 0, 1].includes(value)) {
        throw new Error("Invalid vote value. Must be -1, 0, or 1")
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new Error("Invalid answer ID")
      }

      const answer = await Answer.findById(req.params.id).session(session)
      if (!answer) {
        throw new Error("Answer not found")
      }

      if (answer.author.toString() === req.user.id) {
        throw new Error("Cannot vote on your own answer")
      }

      const existingVote = await Vote.findOne({
        user: req.user.id,
        answer: req.params.id,
      }).session(session)

      const oldValue = existingVote ? existingVote.value : 0
      let newVote = null

      if (value === 0) {
        if (existingVote) {
          await Vote.findByIdAndDelete(existingVote._id).session(session)
        }
      } else {
        if (existingVote) {
          if (existingVote.value === value) {
            await Vote.findByIdAndDelete(existingVote._id).session(session)
          } else {
            existingVote.value = value
            newVote = await existingVote.save({ session })
          }
        } else {
          newVote = await Vote.create(
            [
              {
                user: req.user.id,
                answer: req.params.id,
                value,
              },
            ],
            { session },
          )
          newVote = newVote[0]
        }
      }

      const finalValue = newVote ? newVote.value : 0
      const voteDiff = finalValue - oldValue

      if (voteDiff !== 0) {
        const updateFields = {}

        if (oldValue === 1) updateFields.upvotes = -1
        if (oldValue === -1) updateFields.downvotes = -1
        if (finalValue === 1) updateFields.upvotes = (updateFields.upvotes || 0) + 1
        if (finalValue === -1) updateFields.downvotes = (updateFields.downvotes || 0) + 1

        if (Object.keys(updateFields).length > 0) {
          await Answer.findByIdAndUpdate(req.params.id, { $inc: updateFields }, { session, new: true })
        }

        const author = await User.findById(answer.author).session(session)
        if (author) {
          let repChange = 0
          if (voteDiff === 1) repChange = oldValue === -1 ? 12 : 10
          if (voteDiff === -1) repChange = oldValue === 1 ? -12 : -2
          if (voteDiff === 2) repChange = 12
          if (voteDiff === -2) repChange = -12

          if (repChange !== 0) {
            author.reputation = Math.max(0, author.reputation + repChange)
            await author.save({ session })
          }
        }
      }

      const updatedAnswer = await Answer.findById(req.params.id).session(session)

      return {
        vote: newVote ? { value: newVote.value } : null,
        answer: updatedAnswer,
        voteValue: finalValue,
      }
    })

    clearCache(`/api/questions/${result.answer.question}/answers`)
    clearCache(`/api/questions/${result.answer.question}/votes`)

    res.json({
      vote: result.vote,
      answer: result.answer,
    })
  } catch (error) {
    console.error("Vote error:", error)

    let statusCode = 500
    let message = "Failed to process vote"

    if (error.message.includes("Invalid vote value")) {
      statusCode = 400
      message = error.message
    } else if (error.message.includes("Invalid answer ID")) {
      statusCode = 400
      message = error.message
    } else if (error.message === "Answer not found") {
      statusCode = 404
      message = error.message
    } else if (error.message.includes("Cannot vote on your own answer")) {
      statusCode = 400
      message = error.message
    } else if (error.code === 11000) {
      statusCode = 409
      message = "Vote already exists"
    }

    res.status(statusCode).json({ message })
  } finally {
    await session.endSession()
  }
})

router.post("/:id/accept", auth, async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const result = await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new Error("Invalid answer ID")
      }

      const answer = await Answer.findById(req.params.id).session(session)
      if (!answer) {
        throw new Error("Answer not found")
      }

      const question = await Question.findById(answer.question).session(session)
      if (!question) {
        throw new Error("Question not found")
      }

      if (question.author.toString() !== req.user.id) {
        throw new Error("Only the question author can accept answers")
      }

      if (question.acceptedAnswer && question.acceptedAnswer.toString() !== req.params.id) {
        await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false }, { session })
      }

      await Answer.findByIdAndUpdate(answer._id, { isAccepted: true }, { session })

      await Question.findByIdAndUpdate(question._id, { acceptedAnswer: answer._id, isSolved: true }, { session })

      const author = await User.findById(answer.author).session(session)
      if (author) {
        author.reputation += 15

        if (!author.badges?.includes("Problem Solver") && author.reputation >= 100) {
          if (!author.badges) author.badges = []
          author.badges.push("Problem Solver")
        }

        await author.save({ session })
      }

      return {
        answerId: answer._id,
        questionId: question._id,
      }
    })

    clearCache(`/api/questions/${result.questionId}`)
    clearCache(`/api/questions/${result.questionId}/answers`)

    res.json({
      message: "Answer accepted successfully",
      answerId: result.answerId,
      questionId: result.questionId,
    })
  } catch (error) {
    console.error("Accept answer error:", error)

    let statusCode = 500
    let message = "Failed to accept answer"

    if (error.message.includes("Invalid answer ID")) {
      statusCode = 400
      message = error.message
    } else if (error.message === "Answer not found") {
      statusCode = 404
      message = error.message
    } else if (error.message === "Question not found") {
      statusCode = 404
      message = error.message
    } else if (error.message.includes("Only the question author")) {
      statusCode = 403
      message = error.message
    }

    res.status(statusCode).json({ message })
  } finally {
    await session.endSession()
  }
})

export default router

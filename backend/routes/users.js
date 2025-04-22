import express from "express"
import User from "../models/User.js"
import Question from "../models/Question.js"
import Answer from "../models/Answer.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("questionsCount")
      .populate("answersCount")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (name) user.name = name
    if (bio !== undefined) user.bio = bio
    if (avatar) user.avatar = avatar

    await user.save()

    // Return user data without password
    const userData = user.toObject()
    delete userData.password

    res.json(userData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user's questions
router.get("/:id/questions", async (req, res) => {
  try {
    const questions = await Question.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate("author", "name avatar")
      .populate("answerCount")

    res.json(questions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user's answers
router.get("/:id/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate("author", "name avatar")
      .populate({
        path: "question",
        select: "title _id",
      })

    res.json(answers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Save/unsave a question
router.post("/save-question/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if question is already saved
    const isSaved = user.savedQuestions.includes(req.params.id)

    if (isSaved) {
      // Unsave question
      user.savedQuestions = user.savedQuestions.filter((q) => q.toString() !== req.params.id)
    } else {
      // Save question
      user.savedQuestions.push(req.params.id)
    }

    await user.save()

    res.json({
      saved: !isSaved,
      savedQuestions: user.savedQuestions,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get saved questions
router.get("/saved-questions", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "savedQuestions",
      populate: {
        path: "author",
        select: "name avatar",
      },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user.savedQuestions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
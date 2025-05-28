import express from "express"
import mongoose from "mongoose"
import Question from "../models/Question.js"
import Answer from "../models/Answer.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"

const router = express.Router()

const cacheMiddleware =
  (duration = 300) =>
  (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) {
      return next()
    }

    try {
      if (typeof cache !== "undefined" && cache && typeof cache.get === "function") {
        const key = `__express__${req.originalUrl || req.url}`
        const cachedBody = cache.get(key)

        if (cachedBody) {
          return res.json(cachedBody)
        } else {
          const originalJson = res.json
          res.json = function (body) {
            try {
              cache.set(key, body, duration)
            } catch (error) {
              console.error("Cache set error:", error)
            }
            originalJson.call(this, body)
          }
        }
      }
    } catch (error) {
      console.error("Cache middleware error:", error)
    }

    next()
  }

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

router.get("/", cacheMiddleware(60), async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit) || 10))
    const sort = req.query.sort || "latest"
    const category = req.query.category
    const search = req.query.search
    const tag = req.query.tag
    const unanswered = req.query.unanswered === "true"

    const pipeline = []

    const matchStage = {}
    if (category && category !== "all") {
      matchStage.category = category
    }
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" }
      matchStage.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }]
    }
    if (tag && tag.trim()) {
      matchStage.tags = tag.trim()
    }

    pipeline.push({ $match: matchStage })

    pipeline.push({
      $lookup: {
        from: "answers",
        localField: "_id",
        foreignField: "question",
        as: "answers",
      },
    })

    pipeline.push({
      $addFields: {
        answerCount: { $size: "$answers" },
      },
    })

    if (unanswered) {
      pipeline.push({
        $match: { answerCount: 0 },
      })
    }

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { name: 1, avatar: 1, reputation: 1 } }],
      },
    })

    pipeline.push({
      $unwind: "$author",
    })

    pipeline.push({
      $project: {
        answers: 0,
      },
    })

    let sortConfig = {}
    switch (sort) {
      case "latest":
        sortConfig = { createdAt: -1 }
        break
      case "popular":
        sortConfig = { viewCount: -1, createdAt: -1 }
        break
      case "unanswered":
        sortConfig = { createdAt: -1 }
        break
      default:
        sortConfig = { createdAt: -1 }
    }

    pipeline.push({ $sort: sortConfig })

    const countPipeline = [...pipeline, { $count: "total" }]
    const [countResult] = await Question.aggregate(countPipeline)
    const totalCount = countResult?.total || 0

    pipeline.push({ $skip: (page - 1) * limit })
    pipeline.push({ $limit: limit })

    const questions = await Question.aggregate(pipeline)

    res.json({
      questions,
      hasMore: questions.length === limit && page * limit < totalCount,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Fetch questions error:", error)
    res.status(500).json({ message: "Failed to fetch questions" })
  }
})

router.get("/:id", cacheMiddleware(60), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid question ID" })
    }

    const question = await Question.findById(req.params.id).populate("author", "name avatar reputation").lean()

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    Question.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: false })
      .exec()
      .catch(() => {})

    res.json(question)
  } catch (error) {
    console.error("Fetch question error:", error)
    res.status(500).json({ message: "Failed to fetch question" })
  }
})

router.get("/:id/votes", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid question ID" })
    }

    const answers = await Answer.find({ question: req.params.id }).select("_id").lean()
    const answerIds = answers.map((answer) => answer._id)

    const answerVotes = await Vote.find({
      user: req.user.id,
      answer: { $in: answerIds },
    }).lean()

    res.json({
      answerVotes: answerVotes.map((vote) => ({
        answerId: vote.answer.toString(),
        value: vote.value,
      })),
    })
  } catch (error) {
    console.error("Fetch votes error:", error)
    res.status(500).json({ message: "Failed to fetch votes" })
  }
})

router.get("/:id/answers", cacheMiddleware(60), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid question ID" })
    }

    const answers = await Answer.find({ question: req.params.id })
      .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 })
      .populate("author", "name avatar reputation")
      .lean()

    res.json(answers)
  } catch (error) {
    console.error("Fetch answers error:", error)
    res.status(500).json({ message: "Failed to fetch answers" })
  }
})

router.get("/:id/related", cacheMiddleware(300), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid question ID" })
    }

    const question = await Question.findById(req.params.id).select("tags category").lean()
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const relatedQuestions = await Question.find({
      _id: { $ne: req.params.id },
      $or: [{ tags: { $in: question.tags } }, { category: question.category }],
    })
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(5)
      .select("title viewCount createdAt")
      .lean()

    res.json(relatedQuestions)
  } catch (error) {
    console.error("Fetch related questions error:", error)
    res.status(500).json({ message: "Failed to fetch related questions" })
  }
})

router.post("/", auth, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body

    if (!title || title.trim().length < 10) {
      return res.status(400).json({ message: "Title must be at least 10 characters long" })
    }

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ message: "Content must be at least 20 characters long" })
    }

    if (!Array.isArray(tags) || tags.length === 0 || tags.length > 5) {
      return res.status(400).json({ message: "Must have between 1 and 5 tags" })
    }

    const question = new Question({
      title: title.trim(),
      content: content.trim(),
      tags: tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      category,
      author: req.user.id,
    })

    await question.save()
    await question.populate("author", "name avatar reputation")

    clearCache("/api/questions")

    res.status(201).json(question)
  } catch (error) {
    console.error("Create question error:", error)
    res.status(500).json({ message: "Failed to create question" })
  }
})

router.post("/:id/answers", auth, async (req, res) => {
  try {
    const { content } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ message: "Answer must be at least 20 characters long" })
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid question ID" })
    }

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const answer = new Answer({
      content: content.trim(),
      question: req.params.id,
      author: req.user.id,
    })

    await answer.save()
    await answer.populate("author", "name avatar reputation")

    clearCache(`/api/questions/${req.params.id}/answers`)
    clearCache(`/api/questions/${req.params.id}`)

    res.status(201).json(answer)
  } catch (error) {
    console.error("Create answer error:", error)
    res.status(500).json({ message: "Failed to create answer" })
  }
})

router.delete("/:id", auth, async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new Error("Invalid question ID")
      }

      const question = await Question.findById(req.params.id).session(session)
      if (!question) {
        throw new Error("Question not found")
      }

      const user = await User.findById(req.user.id).session(session)
      if (question.author.toString() !== req.user.id && !user?.isAdmin) {
        throw new Error("Not authorized to delete this question")
      }

      const answers = await Answer.find({ question: req.params.id }).select("_id").session(session)
      const answerIds = answers.map((answer) => answer._id)

      await Vote.deleteMany({ answer: { $in: answerIds } }).session(session)
      await Answer.deleteMany({ question: req.params.id }).session(session)
      await Question.findByIdAndDelete(req.params.id).session(session)
    })

    clearCache(`/api/questions/${req.params.id}`)
    clearCache("/api/questions")

    res.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Delete question error:", error)

    let statusCode = 500
    let message = "Failed to delete question"

    if (error.message.includes("Invalid question ID")) {
      statusCode = 400
      message = error.message
    } else if (error.message === "Question not found") {
      statusCode = 404
      message = error.message
    } else if (error.message.includes("Not authorized")) {
      statusCode = 403
      message = error.message
    }

    res.status(statusCode).json({ message })
  } finally {
    await session.endSession()
  }
})

export default router

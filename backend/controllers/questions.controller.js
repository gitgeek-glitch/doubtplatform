import Question from "../models/Question.model.js"
import Answer from "../models/Answer.model.js"
import Vote from "../models/Vote.model.js"
import User from "../models/User.model.js"
import { cache } from "../server.js"

const clearCache = (pattern) => {
  const keys = cache.keys()
  const matchingKeys = keys.filter((key) => key.includes(pattern))
  matchingKeys.forEach((key) => cache.del(key))
}

export const getQuestions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const sort = req.query.sort || "latest"
    const category = req.query.category
    const search = req.query.search
    const tag = req.query.tag
    const unanswered = req.query.unanswered === "true"

    let pipeline = []

    const matchStage = {}
    if (category && category !== "all") {
      matchStage.category = category
    }
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ]
    }
    if (tag) {
      matchStage.tags = tag
    }

    pipeline.push({ $match: matchStage })

    pipeline.push({
      $lookup: {
        from: "answers",
        localField: "_id",
        foreignField: "question",
        as: "answers"
      }
    })

    pipeline.push({
      $addFields: {
        answerCount: { $size: "$answers" }
      }
    })

    if (unanswered) {
      pipeline.push({
        $match: { answerCount: 0 }
      })
    }

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
          { $project: { name: 1, avatar: 1, reputation: 1 } }
        ]
      }
    })

    pipeline.push({
      $unwind: "$author"
    })

    pipeline.push({
      $project: {
        answers: 0
      }
    })

    let sortConfig = {}
    switch (sort) {
      case "latest":
        sortConfig = { createdAt: -1 }
        break
      case "popular":
        sortConfig = { viewCount: -1 }
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
      hasMore: questions.length === limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "name avatar reputation")
      .populate("answerCount")
      .lean()

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    Question.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: false })
      .exec()
      .catch(() => {})

    res.json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createQuestion = async (req, res) => {
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
    await question.populate("author", "name avatar")

    clearCache("/api/questions")

    res.status(201).json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateQuestion = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body

    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this question" })
    }

    if (title) question.title = title
    if (content) question.content = content
    if (tags) question.tags = tags
    if (category) question.category = category

    await question.save()
    await question.populate("author", "name avatar")

    clearCache(`/api/questions/${req.params.id}`)
    clearCache("/api/questions")

    res.json(question)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const user = await User.findById(req.user.id)
    if (question.author.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this question" })
    }

    await Promise.all([
      Answer.deleteMany({ question: req.params.id }),
      question.deleteOne(),
    ])

    clearCache(`/api/questions/${req.params.id}`)
    clearCache("/api/questions")

    res.json({ message: "Question deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getQuestionAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id })
      .sort({ upvotedBy: -1, createdAt: -1 })
      .populate("author", "name avatar reputation")
      .lean()

    res.json(answers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createAnswer = async (req, res) => {
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
    await answer.populate("author", "name avatar reputation")

    clearCache(`/api/questions/${req.params.id}/answers`)

    res.status(201).json(answer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAnswerVotes = async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id }).select("_id")

    const answerIds = answers.map((answer) => answer._id)

    const answerVotes = await Vote.find({
      user: req.user.id,
      answer: { $in: answerIds },
    })

    res.json({
      answerVotes: answerVotes.map((vote) => ({
        answerId: vote.answer,
        value: vote.value,
      })),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRelatedQuestions = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).select("tags category")
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
    res.status(500).json({ message: error.message })
  }
}
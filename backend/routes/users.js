import express from "express"
import User from "../models/User.js"
import Question from "../models/Question.js"
import Answer from "../models/Answer.js"
import Vote from "../models/Vote.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Get leaderboard data - now based only on answer upvotes
router.get("/leaderboard", async (req, res) => {
  try {
    // Only aggregate votes on answers
    const answerVotes = await Vote.aggregate([
      { $match: { answer: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: "answers",
          localField: "answer",
          foreignField: "_id",
          as: "answerData",
        },
      },
      { $unwind: "$answerData" },
      {
        $group: {
          _id: "$answerData.author",
          upvotesReceived: {
            $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] },
          },
          downvotesReceived: {
            $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] },
          },
        },
      },
    ])

    // Convert to array for easier processing
    const votesArray = answerVotes.map(item => ({
      _id: item._id,
      upvotesReceived: item.upvotesReceived,
      downvotesReceived: item.downvotesReceived
    }))

    // Sort by upvotes received on answers
    votesArray.sort((a, b) => b.upvotesReceived - a.upvotesReceived)

    // Get user details for top users
    const userIds = votesArray.slice(0, 10).map((item) => item._id)
    const users = await User.find({ _id: { $in: userIds } }).select("name avatar reputation answerUpvotesReceived answerDownvotesReceived role")

    // Combine user details with vote data
    const leaderboardUsers = users.map((user) => {
      const voteData = votesArray.find((v) => v._id.toString() === user._id.toString())
      return {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        reputation: user.reputation,
        role: user.role,
        upvotesReceived: voteData?.upvotesReceived || 0,
        downvotesReceived: voteData?.downvotesReceived || 0,
      }
    })

    // Sort by upvotes received
    leaderboardUsers.sort((a, b) => b.upvotesReceived - a.upvotesReceived)

    // Calculate total upvotes and downvotes
    const totalUpvotes = votesArray.reduce((sum, item) => sum + item.upvotesReceived, 0)
    const totalDownvotes = votesArray.reduce((sum, item) => sum + item.downvotesReceived, 0)

    res.json({
      users: leaderboardUsers,
      totalUpvotes,
      totalDownvotes,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

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

// Get user votes distribution
router.get("/:id/votes-distribution", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    // Return the user's vote distribution data
    res.json({
      answerUpvotes: user.answerUpvotesReceived || 0,
      answerDownvotes: user.answerDownvotesReceived || 0,
      questionUpvotes: user.questionUpvotesReceived || 0,
      questionDownvotes: user.questionDownvotesReceived || 0
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user votes counts (internal, not exposed as API endpoint)
export const updateUserVoteCounts = async (userId) => {
  try {
    // Count upvotes and downvotes for questions
    const questionVotes = await Vote.aggregate([
      { 
        $lookup: {
          from: "questions",
          localField: "question",
          foreignField: "_id",
          as: "questionData"
        }
      },
      { $unwind: "$questionData" },
      { $match: { "questionData.author": mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } }
        }
      }
    ])

    // Count upvotes and downvotes for answers
    const answerVotes = await Vote.aggregate([
      { 
        $lookup: {
          from: "answers",
          localField: "answer",
          foreignField: "_id",
          as: "answerData"
        }
      },
      { $unwind: "$answerData" },
      { $match: { "answerData.author": mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } }
        }
      }
    ])

    // Update user
    const questionUpvotes = questionVotes.length > 0 ? questionVotes[0].upvotes : 0
    const questionDownvotes = questionVotes.length > 0 ? questionVotes[0].downvotes : 0
    const answerUpvotes = answerVotes.length > 0 ? answerVotes[0].upvotes : 0
    const answerDownvotes = answerVotes.length > 0 ? answerVotes[0].downvotes : 0

    await User.findByIdAndUpdate(userId, {
      questionUpvotesReceived: questionUpvotes,
      questionDownvotesReceived: questionDownvotes,
      answerUpvotesReceived: answerUpvotes,
      answerDownvotesReceived: answerDownvotes
    })

    return {
      questionUpvotes,
      questionDownvotes,
      answerUpvotes,
      answerDownvotes
    }
  } catch (error) {
    console.error("Error updating user vote counts:", error)
    throw error
  }
}

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
      .populate("author", "name avatar role")
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
      .populate("author", "name avatar role")
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
        select: "name avatar role",
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
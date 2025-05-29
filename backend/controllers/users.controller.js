import User from "../models/User.model.js"
import Question from "../models/Question.model.js"
import Answer from "../models/Answer.model.js"
import Vote from "../models/Vote.model.js"
import mongoose from "mongoose"

const updateUserVoteCounts = async (userId) => {
  try {
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
      { $match: { "answerData.author": new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } }
        }
      }
    ])

    const answerUpvotes = answerVotes.length > 0 ? answerVotes[0].upvotes : 0
    const answerDownvotes = answerVotes.length > 0 ? answerVotes[0].downvotes : 0

    await User.findByIdAndUpdate(userId, {
      answerUpvotesReceived: answerUpvotes,
      answerDownvotesReceived: answerDownvotes
    })

    return { answerUpvotes, answerDownvotes }
  } catch (error) {
    console.error("Error updating user vote counts:", error)
    throw error
  }
}

export const getLeaderboard = async (req, res) => {
  try {
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

    const votesArray = answerVotes.map(item => ({
      _id: item._id,
      upvotesReceived: item.upvotesReceived,
      downvotesReceived: item.downvotesReceived
    }))

    votesArray.sort((a, b) => b.upvotesReceived - a.upvotesReceived)

    const userIds = votesArray.slice(0, 10).map((item) => item._id)
    const users = await User.find({ _id: { $in: userIds } }).select("name avatar reputation answerUpvotesReceived answerDownvotesReceived role")

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

    leaderboardUsers.sort((a, b) => b.upvotesReceived - a.upvotesReceived)

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
}

export const getUserById = async (req, res) => {
  try {
    await updateUserVoteCounts(req.params.id)
    
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
}

export const getUserVotesDistribution = async (req, res) => {
  try {
    await updateUserVoteCounts(req.params.id)
    
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    res.json({
      answerUpvotes: user.answerUpvotesReceived || 0,
      answerDownvotes: user.answerDownvotesReceived || 0
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateProfile = async (req, res) => {
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

    const userData = user.toObject()
    delete userData.password

    res.json(userData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getUserQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate("author", "name avatar role")
      .populate("answerCount")

    res.json(questions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getUserAnswers = async (req, res) => {
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
}

export const saveQuestion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const question = await Question.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const isSaved = user.savedQuestions.includes(req.params.id)

    if (isSaved) {
      user.savedQuestions = user.savedQuestions.filter((q) => q.toString() !== req.params.id)
    } else {
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
}

export const getSavedQuestions = async (req, res) => {
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
}

export { updateUserVoteCounts }
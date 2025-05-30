import Answer from "../models/Answer.model.js"
import Question from "../models/Question.model.js"
import Vote from "../models/Vote.model.js"
import User from "../models/User.model.js"
import { cache } from "../server.js"

const clearCache = (pattern) => {
  const keys = cache.keys()
  const matchingKeys = keys.filter((key) => key.includes(pattern))
  matchingKeys.forEach((key) => cache.del(key))
}

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
      { $match: { "answerData.author": userId } },
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

export const updateAnswer = async (req, res) => {
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
}

export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('question')

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    const user = await User.findById(req.user.id)
    const isAnswerAuthor = answer.author.toString() === req.user.id
    const isQuestionAuthor = answer.question.author.toString() === req.user.id
    const isAdmin = user.isAdmin

    if (!isAnswerAuthor && !isQuestionAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this answer" })
    }

    const questionId = answer.question._id

    await Promise.all([
      Question.findOneAndUpdate(
        { _id: questionId, acceptedAnswer: req.params.id },
        { $set: { acceptedAnswer: null, isSolved: false } },
      ),
      Vote.deleteMany({ answer: req.params.id }),
      answer.deleteOne(),
    ])

    await updateUserVoteCounts(answer.author)

    clearCache(`/api/questions/${questionId}/answers`)

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const voteAnswer = async (req, res) => {
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

    const userId = req.user.id

    const existingVote = await Vote.findOne({
      user: userId,
      answer: req.params.id
    })

    const oldValue = existingVote ? existingVote.value : 0

    if (value === 0) {
      if (existingVote) {
        await Vote.deleteOne({ _id: existingVote._id })
      }
      await Answer.findByIdAndUpdate(req.params.id, {
        $pull: { upvotedBy: userId, downvotedBy: userId }
      })
    } else {
      if (existingVote) {
        existingVote.value = value
        await existingVote.save()
      } else {
        await Vote.create({
          user: userId,
          answer: req.params.id,
          value
        })
      }

      if (value === 1) {
        await Answer.findByIdAndUpdate(req.params.id, {
          $pull: { downvotedBy: userId },
          $addToSet: { upvotedBy: userId }
        })
      } else if (value === -1) {
        await Answer.findByIdAndUpdate(req.params.id, {
          $pull: { upvotedBy: userId },
          $addToSet: { downvotedBy: userId }
        })
      }
    }

    const voteDiff = value - oldValue

    if (voteDiff !== 0) {
      const author = await User.findById(answer.author)
      if (author) {
        let repChange = 0

        if (voteDiff > 0) {
          repChange = voteDiff === 1 ? (oldValue === -1 ? 12 : 10) : voteDiff === 2 ? 12 : voteDiff * 10
        } else if (voteDiff < 0) {
          repChange = voteDiff === -1 ? (oldValue === 1 ? -12 : -2) : voteDiff === -2 ? -12 : voteDiff * 2
        }

        if (repChange !== 0) {
          author.reputation += repChange
          await author.save()
        }
      }

      await updateUserVoteCounts(answer.author)
    }

    clearCache(`/api/questions/${answer.question}/answers`)

    const updatedAnswer = await Answer.findById(req.params.id).populate('upvotedBy downvotedBy', '_id')
    const responseAnswer = {
      ...updatedAnswer.toObject(),
      upvotes: updatedAnswer.upvotedBy.length,
      downvotes: updatedAnswer.downvotedBy.length
    }

    res.json({ 
      vote: { value }, 
      answer: responseAnswer 
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const acceptAnswer = async (req, res) => {
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

    const author = await User.findById(answer.author)
    if (author) {
      author.reputation += 15

      if (!author.badges.includes("Problem Solver") && author.reputation >= 100) {
        author.badges.push("Problem Solver")
      }

      await author.save()
    }

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
}
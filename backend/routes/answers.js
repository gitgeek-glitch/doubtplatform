import express from "express"
import Answer from "../models/Answer.js"
import Question from "../models/Question.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"

const router = express.Router()

// Clear cache when data changes
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

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

    // Clear related caches
    clearCache(`/api/questions/${answer.question}/answers`);

    res.json(answer)
  } catch (error) {
    console.error("Error updating answer:", error);
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

    const questionId = answer.question;

    // Use Promise.all for parallel operations
    await Promise.all([
      // If this is the accepted answer, update the question
      Question.findOneAndUpdate(
        { _id: questionId, acceptedAnswer: req.params.id },
        { $set: { acceptedAnswer: null, isSolved: false } }
      ),
      
      // Delete all votes for this answer
      Vote.deleteMany({ answer: req.params.id }),
      
      // Delete the answer
      answer.deleteOne()
    ]);

    // Clear related caches
    clearCache(`/api/questions/${questionId}/answers`);

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    console.error("Error deleting answer:", error);
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

    // Update author reputation in the background
    User.findById(answer.author).then(author => {
      if (author) {
        // Calculate reputation change
        let repChange = 0
        if (vote.value === 1) repChange = 10
        else if (vote.value === -1) repChange = -2

        author.reputation += repChange
        return author.save()
      }
    }).catch(err => console.error("Error updating reputation:", err));

    // Clear related caches
    clearCache(`/api/questions/${answer.question}/answers`);

    res.json({ vote, answer })
  } catch (error) {
    console.error("Error voting on answer:", error);
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

    // Use Promise.all for parallel operations
    const [previousAccepted] = await Promise.all([
      // If there's already an accepted answer, unaccept it
      question.acceptedAnswer ? 
        Answer.findByIdAndUpdate(
          question.acceptedAnswer,
          { isAccepted: false }
        ) : null,
      
      // Accept the new answer
      Answer.findByIdAndUpdate(
        answer._id,
        { isAccepted: true },
        { new: true }
      ),
      
      // Update question
      Question.findByIdAndUpdate(
        question._id,
        { acceptedAnswer: answer._id, isSolved: true },
        { new: true }
      )
    ]);

    // Award reputation to answer author in the background
    User.findById(answer.author).then(author => {
      if (author) {
        author.reputation += 15

        // Check if user should get a badge
        if (!author.badges.includes("Problem Solver") && author.reputation >= 100) {
          author.badges.push("Problem Solver")
        }

        return author.save()
      }
    }).catch(err => console.error("Error updating reputation:", err));

    // Clear related caches
    clearCache(`/api/questions/${question._id}`);
    clearCache(`/api/questions/${question._id}/answers`);

    res.json({ 
      message: "Answer accepted successfully",
      answerId: answer._id,
      questionId: question._id
    })
  } catch (error) {
    console.error("Error accepting answer:", error);
    res.status(500).json({ message: error.message })
  }
})

export default router
import express from "express"
import Question from "../models/Question.js"
import Answer from "../models/Answer.js"
import Vote from "../models/Vote.js"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"

const router = express.Router()

// Cache middleware for read operations
const cacheMiddleware = (duration = 300) => (req, res, next) => {
  // Skip cache for authenticated requests or non-GET requests
  if (req.method !== 'GET' || req.headers.authorization) {
    return next();
  }
  
  const key = `__express__${req.originalUrl || req.url}`;
  const cachedBody = cache.get(key);
  
  if (cachedBody) {
    return res.json(cachedBody);
  } else {
    const originalJson = res.json;
    res.json = function(body) {
      cache.set(key, body, duration);
      originalJson.call(this, body);
    };
    next();
  }
};

// Clear cache when data changes
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

// Get all questions with filtering and pagination
router.get("/", cacheMiddleware(60), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const sort = req.query.sort || "latest"
    const category = req.query.category
    const search = req.query.search
    const tag = req.query.tag

    let query = {}
    if (category && category !== "all") {
      query.category = category
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ]
    }
    if (tag) {
      query.tags = tag
    }

    // Sort configuration
    let sortConfig = {}
    switch (sort) {
      case "latest":
        sortConfig = { createdAt: -1 }
        break
      case "popular":
        sortConfig = { upvotes: -1 }
        break
      default:
        sortConfig = { createdAt: -1 }
    }

    // Use lean() for better performance
    const questions = await Question.find(query)
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name avatar reputation")
      .lean()

    // Get total count for pagination info (cached separately)
    const cacheKey = `count_${JSON.stringify(query)}`;
    let totalCount = cache.get(cacheKey);
    
    if (totalCount === undefined) {
      totalCount = await Question.countDocuments(query);
      cache.set(cacheKey, totalCount, 300); // Cache for 5 minutes
    }

    res.json({
      questions,
      hasMore: questions.length === limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    })
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: error.message })
  }
})

// Get a single question by ID
router.get("/:id", cacheMiddleware(60), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "name avatar reputation")
      .populate("answerCount")
      .lean()

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Update view count in the background without waiting
    Question.findByIdAndUpdate(
      req.params.id, 
      { $inc: { viewCount: 1 } },
      { new: false }
    ).exec()
    .catch(err => console.error("Error updating view count:", err));

    res.json(question)
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: error.message })
  }
})

// Create a new question
router.post("/", auth, async (req, res) => {
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

    // Populate author info
    await question.populate("author", "name avatar")

    // Clear cache for questions list
    clearCache('/api/questions');

    res.status(201).json(question)
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: error.message })
  }
})

// Update a question
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body

    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is the author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this question" })
    }

    // Update fields
    if (title) question.title = title
    if (content) question.content = content
    if (tags) question.tags = tags
    if (category) question.category = category

    await question.save()

    // Populate author info
    await question.populate("author", "name avatar")

    // Clear related caches
    clearCache(`/api/questions/${req.params.id}`);
    clearCache('/api/questions');

    res.json(question)
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: error.message })
  }
})

// Delete a question
router.delete("/:id", auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is the author or an admin
    const user = await User.findById(req.user.id)
    if (question.author.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this question" })
    }

    // Use Promise.all for parallel operations
    await Promise.all([
      // Delete all answers to this question
      Answer.deleteMany({ question: req.params.id }),
      // Delete all votes for this question
      Vote.deleteMany({ question: req.params.id }),
      // Delete the question
      question.deleteOne()
    ]);

    // Clear related caches
    clearCache(`/api/questions/${req.params.id}`);
    clearCache('/api/questions');

    res.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: error.message })
  }
})

// Vote on a question
// router.post("/:id/vote", auth, async (req, res) => {
//   try {
//     const { value } = req.body

//     if (![1, 0, -1].includes(value)) {
//       return res.status(400).json({ message: "Invalid vote value" })
//     }

//     const question = await Question.findById(req.params.id)
//     if (!question) {
//       return res.status(404).json({ message: "Question not found" })
//     }

//     // Check if user is voting on their own question
//     if (question.author.toString() === req.user.id) {
//       return res.status(400).json({ message: "Cannot vote on your own question" })
//     }

//     // Find existing vote
//     let vote = await Vote.findOne({
//       user: req.user.id,
//       question: req.params.id,
//     })

//     if (vote) {
//       // Update existing vote
//       const oldValue = vote.value
//       vote.value = value
//       await vote.save()

//       // Update question vote counts
//       if (oldValue === 1 && value !== 1) question.upvotes -= 1
//       if (oldValue === -1 && value !== -1) question.downvotes -= 1
//       if (value === 1 && oldValue !== 1) question.upvotes += 1
//       if (value === -1 && oldValue !== -1) question.downvotes += 1
//     } else {
//       // Create new vote
//       vote = new Vote({
//         user: req.user.id,
//         question: req.params.id,
//         value,
//       })
//       await vote.save()

//       // Update question vote counts
//       if (value === 1) question.upvotes += 1
//       if (value === -1) question.downvotes += 1
//     }

//     await question.save()

//     // Update author reputation in the background
//     User.findById(question.author).then(author => {
//       if (author) {
//         // Calculate reputation change
//         let repChange = 0
//         if (vote.value === 1) repChange = 5
//         else if (vote.value === -1) repChange = -2

//         author.reputation += repChange
//         return author.save()
//       }
//     }).catch(err => console.error("Error updating reputation:", err));

//     // Clear related caches
//     clearCache(`/api/questions/${req.params.id}`);

//     res.json({ vote, question })
//   } catch (error) {
//     console.error("Error voting on question:", error);
//     res.status(500).json({ message: error.message })
//   }
// })

// Get answers for a question
router.get("/:id/answers", cacheMiddleware(60), async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id })
      .sort({ upvotes: -1, createdAt: -1 }) // Sort by upvotes first, then by date
      .populate("author", "name avatar reputation")
      .lean()

    res.json(answers)
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ message: error.message })
  }
})

// Add an answer to a question
router.post("/:id/answers", auth, async (req, res) => {
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

    // Populate author info
    await answer.populate("author", "name avatar reputation")

    // Clear related caches
    clearCache(`/api/questions/${req.params.id}/answers`);

    res.status(201).json(answer)
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: error.message })
  }
})

// Get user's votes for a question and its answers
router.get("/:id/votes", auth, async (req, res) => {
  try {
    // Use Promise.all for parallel queries
    const [questionVote, answers] = await Promise.all([
      // Get question vote
      Vote.findOne({
        user: req.user.id,
        question: req.params.id,
      }),
      // Get answers
      Answer.find({ question: req.params.id }).select('_id')
    ]);

    const answerIds = answers.map(answer => answer._id);

    // Get answer votes
    const answerVotes = await Vote.find({
      user: req.user.id,
      answer: { $in: answerIds },
    });

    res.json({
      questionVote: questionVote ? questionVote.value : 0,
      answerVotes: answerVotes.map((vote) => ({
        answerId: vote.answer,
        value: vote.value,
      })),
    })
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ message: error.message })
  }
})

// Get related questions
router.get("/:id/related", cacheMiddleware(300), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).select('tags category');
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Find related questions based on tags and category
    const relatedQuestions = await Question.find({
      _id: { $ne: req.params.id },
      $or: [{ tags: { $in: question.tags } }, { category: question.category }],
    })
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(5)
      .select("title upvotes downvotes createdAt")
      .lean()

    res.json(relatedQuestions)
  } catch (error) {
    console.error("Error fetching related questions:", error);
    res.status(500).json({ message: error.message })
  }
})

export default router
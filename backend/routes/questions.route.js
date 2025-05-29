import express from "express"
import { auth } from "../middleware/auth.js"
import { cache } from "../server.js"
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionAnswers,
  createAnswer,
  getAnswerVotes,
  getRelatedQuestions
} from "../controllers/questions.controller.js"

const router = express.Router()

const cacheMiddleware =
  (duration = 300) =>
  (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) {
      return next()
    }

    const key = `__express__${req.originalUrl || req.url}`
    const cachedBody = cache.get(key)

    if (cachedBody) {
      return res.json(cachedBody)
    } else {
      const originalJson = res.json
      res.json = function (body) {
        cache.set(key, body, duration)
        originalJson.call(this, body)
      }
      next()
    }
  }

router.get("/", cacheMiddleware(60), getQuestions)
router.get("/:id", cacheMiddleware(60), getQuestionById)
router.post("/", auth, createQuestion)
router.put("/:id", auth, updateQuestion)
router.delete("/:id", auth, deleteQuestion)
router.get("/:id/answers", cacheMiddleware(60), getQuestionAnswers)
router.post("/:id/answers", auth, createAnswer)
router.get("/:id/votes", auth, getAnswerVotes)
router.get("/:id/related", cacheMiddleware(300), getRelatedQuestions)

export default router
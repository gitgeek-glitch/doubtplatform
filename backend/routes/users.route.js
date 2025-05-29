import express from "express"
import { 
  getLeaderboard, 
  getUserById, 
  getUserVotesDistribution, 
  updateProfile, 
  getUserQuestions, 
  getUserAnswers, 
  saveQuestion, 
  getSavedQuestions 
} from "../controllers/users.controller.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

router.get("/leaderboard", getLeaderboard)
router.get("/:id", getUserById)
router.get("/:id/votes-distribution", getUserVotesDistribution)
router.put("/profile", auth, updateProfile)
router.get("/:id/questions", getUserQuestions)
router.get("/:id/answers", getUserAnswers)
router.post("/save-question/:id", auth, saveQuestion)
router.get("/saved-questions", auth, getSavedQuestions)

export default router
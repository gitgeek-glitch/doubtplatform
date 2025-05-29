import express from "express"
import { auth } from "../middleware/auth.js"
import { 
  updateAnswer, 
  deleteAnswer, 
  voteAnswer, 
  acceptAnswer 
} from "../controllers/answers.controller.js"

const router = express.Router()

router.put("/:id", auth, updateAnswer)
router.delete("/:id", auth, deleteAnswer)
router.post("/:id/vote", auth, voteAnswer)
router.post("/:id/accept", auth, acceptAnswer)

export default router
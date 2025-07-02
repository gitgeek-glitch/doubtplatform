import express from "express"
import {
  register,
  login,
  getMe,
  sendVerificationCode,
  verifyEmail,
  sendPasswordResetCode,
  verifyPasswordResetOTP,
  resetPassword,
} from "../controllers/auth.controller.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Registration routes
router.post("/send-verification", sendVerificationCode)
router.post("/verify-email", verifyEmail)
router.post("/register", register)

// Login route
router.post("/login", login)

// Password reset routes
router.post("/send-password-reset", sendPasswordResetCode)
router.post("/verify-password-reset", verifyPasswordResetOTP)
router.post("/reset-password", resetPassword)

// Protected route
router.get("/me", auth, getMe)

export default router

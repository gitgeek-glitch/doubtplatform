import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import { cache } from "../server.js"
import { generateOTP, sendOTP, storeOTP, verifyOTP } from "../services/emailService.js"

const clearCache = (pattern) => {
  const keys = cache.keys()
  const matchingKeys = keys.filter((key) => key.includes(pattern))
  matchingKeys.forEach((key) => cache.del(key))
}

export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      })
    }

    if (!(email.endsWith(".ac.in") || email.endsWith(".edu"))) {
      return res.status(400).json({
        message: "Please use your college email ending with .ac.in",
        success: false,
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
        success: false,
      })
    }

    const otp = generateOTP()
    console.log(`Generated OTP for ${email}: ${otp}`)

    // Always store the OTP first
    storeOTP(email, otp)

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email credentials not configured, returning OTP for development")
      return res.status(200).json({
        message: "Email service not configured. Using development mode.",
        success: true,
        devMode: true,
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      })
    }

    try {
      await sendOTP(email, otp)
      console.log(`OTP sent successfully to ${email}`)

      res.status(200).json({
        message: "Verification code sent to your email",
        success: true,
      })
    } catch (emailError) {
      console.error("Email service error:", emailError)

      // Return success with development OTP for testing
      res.status(200).json({
        message: "Email service temporarily unavailable. Use development mode.",
        success: true,
        devMode: true,
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      })
    }
  } catch (error) {
    console.error("Send verification error:", error)
    res.status(500).json({
      message: "Internal server error. Please try again later.",
      success: false,
    })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      })
    }

    const verification = verifyOTP(email, otp)

    if (!verification.success) {
      return res.status(400).json({
        message: verification.message,
        success: false,
      })
    }

    res.status(200).json({
      message: "Email verified successfully",
      success: true,
    })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({
      message: "Email verification failed. Please try again.",
      success: false,
    })
  }
}

export const register = async (req, res) => {
  try {
    const { name, email, password, isEmailVerified } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (!isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email first" })
    }

    if (!(email.endsWith(".ac.in") || email.endsWith(".edu"))) {
      return res.status(400).json({ message: "Please use your college email" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = new User({
      name,
      email,
      password,
      badges: ["Newbie"],
    })

    await user.save()

    const jwtSecret = process.env.JWT_SECRET || "fallback_jwt_secret_for_development"
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "60d" })

    const userData = user.toObject()
    delete userData.password

    res.status(201).json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (!(email.endsWith(".ac.in") || email.endsWith(".edu"))) {
      return res.status(400).json({ message: "Please use your college email" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback_jwt_secret_for_development"
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "60d" })

    const userData = user.toObject()
    delete userData.password

    res.json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req, res) => {
  try {
    const cacheKey = `user_${req.user.id}`
    const cachedUser = cache.get(cacheKey)

    if (cachedUser) {
      return res.json({ user: cachedUser })
    }

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("questionsCount")
      .populate("answersCount")
      .lean()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    cache.set(cacheKey, user, 300)

    res.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: error.message })
  }
}

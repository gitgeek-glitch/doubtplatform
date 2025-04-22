import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Register a new user
router.post("/register", async (req, res) => {
  try {
    console.log("Register request received:", { ...req.body, password: "[REDACTED]" })
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if email is valid college email
    if (!email.endsWith(".ac.in")) {
      console.log("Invalid email format:", email)
      return res.status(400).json({ message: "Please use your college email" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return res.status(400).json({ message: "User already exists" })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      badges: ["Newbie"],
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" })

    // Return user data without password
    const userData = user.toObject()
    delete userData.password

    console.log("User registered successfully:", email)
    res.status(201).json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", { ...req.body, password: "[REDACTED]" })
    const { email, password } = req.body

    // Validate request body
    if (!email || !password) {
      console.log("Missing email or password")
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Check if email is valid college email
    if (!email.endsWith(".ac.in")) {
      console.log("Invalid email format:", email)
      return res.status(400).json({ message: "Please use your college email" })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      console.log("User not found:", email)
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      console.log("Password mismatch for user:", email)
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" })

    // Return user data without password
    const userData = user.toObject()
    delete userData.password

    console.log("Login successful for user:", email)
    res.json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("questionsCount")
      .populate("answersCount")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Error fetching current user:", error)
    res.status(500).json({ message: error.message })
  }
})

export default router
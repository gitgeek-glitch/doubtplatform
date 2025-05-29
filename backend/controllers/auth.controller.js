import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import { cache } from "../server.js"

const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

export const register = async (req, res) => {
  try {
    console.log("Register request received:", { ...req.body, password: "[REDACTED]" })
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (!email.endsWith(".ac.in")) {
      console.log("Invalid email format:", email)
      return res.status(400).json({ message: "Please use your college email" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return res.status(400).json({ message: "User already exists" })
    }

    const user = new User({
      name,
      email,
      password,
      badges: ["Newbie"],
    })

    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "60d" })

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
}

export const login = async (req, res) => {
  try {
    console.log("Login request received:", { ...req.body, password: "[REDACTED]" })
    const { email, password } = req.body

    if (!email || !password) {
      console.log("Missing email or password")
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (!email.endsWith(".ac.in")) {
      console.log("Invalid email format:", email)
      return res.status(400).json({ message: "Please use your college email" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      console.log("User not found:", email)
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      console.log("Password mismatch for user:", email)
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "60d" })

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
}

export const getMe = async (req, res) => {
  try {
    const cacheKey = `user_${req.user.id}`;
    const cachedUser = cache.get(cacheKey);
    
    if (cachedUser) {
      return res.json({ user: cachedUser });
    }
    
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("questionsCount")
      .populate("answersCount")
      .lean()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    cache.set(cacheKey, user, 300);
    
    res.json({ user })
  } catch (error) {
    console.error("Error fetching current user:", error)
    res.status(500).json({ message: error.message })
  }
}
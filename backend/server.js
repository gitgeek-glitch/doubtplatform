import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import morgan from "morgan"
import helmet from "helmet"
import compression from "compression"
import NodeCache from "node-cache"

// Import routes
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import questionRoutes from "./routes/questions.js"
import answerRoutes from "./routes/answers.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()

// Initialize cache with longer TTL (30 minutes) for better performance
export const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 })

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(compression()) // Compress responses
app.use(express.json({ limit: '10mb' })) // Increased payload size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Only use morgan in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"))
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/questions", questionRoutes)
app.use("/api/answers", answerRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

// General error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Connect to MongoDB with compatible options
const PORT = process.env.PORT || 5000
const MONGO = process.env.MONGO

// Updated MongoDB options with only supported options
const mongooseOptions = {
  maxPoolSize: 100,  // Significantly increased connections for higher throughput
  minPoolSize: 20,
  socketTimeoutMS: 120000, // Longer timeout
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority'
}

mongoose
  .connect(MONGO, mongooseOptions)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

// Add graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});
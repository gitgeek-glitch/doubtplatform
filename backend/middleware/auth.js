import jwt from "jsonwebtoken"

export const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Use a default JWT_SECRET if not provided in environment variables
    const jwtSecret = process.env.JWT_SECRET || "fallback_jwt_secret_for_development"

    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" })
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }

    res.status(401).json({ message: "Authentication failed" })
  }
}

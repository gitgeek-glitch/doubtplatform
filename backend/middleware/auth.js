import jwt from "jsonwebtoken"

export const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user from payload
    req.user = decoded

    next()
  } catch (error) {
    // More specific error handling
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" })
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" })
    }
    
    res.status(401).json({ message: "Authentication failed" })
  }
}
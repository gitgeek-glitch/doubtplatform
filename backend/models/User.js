import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\.ac\.in$/, "Please enter a valid college email address ending with .ac.in"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    reputation: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    savedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    console.error("Password comparison error:", error)
    return false
  }
}

// Virtual for questionsCount
userSchema.virtual("questionsCount", {
  ref: "Question",
  localField: "_id",
  foreignField: "author",
  count: true,
})

// Virtual for answersCount
userSchema.virtual("answersCount", {
  ref: "Answer",
  localField: "_id",
  foreignField: "author",
  count: true,
})

// Set virtuals to true in toJSON
userSchema.set("toJSON", { virtuals: true })
userSchema.set("toObject", { virtuals: true })

const User = mongoose.model("User", userSchema)

export default User
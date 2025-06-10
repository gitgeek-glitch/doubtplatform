import mongoose from "mongoose"
import bcrypt from "bcryptjs"

export const USER_ROLES = {
  NEWBIE: "Newbie",
  INTERMEDIATE: "Intermediate",
  EXPERT: "Expert",
  MASTER: "Master"
}

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
      match: [/.+@.+\.(ac\.in|edu)$/, "Please enter a valid college email address ending with .ac.in or .edu"],
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
    answerUpvotesReceived: {
      type: Number,
      default: 0,
    },
    answerDownvotesReceived: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.NEWBIE,
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

userSchema.pre("save", function (next) {
  if (!this.isModified("answerUpvotesReceived")) return next()
  
  const upvotes = this.answerUpvotesReceived;
  
  if (upvotes >= 1000) {
    this.role = USER_ROLES.MASTER;
  } else if (upvotes >= 500) {
    this.role = USER_ROLES.EXPERT;
  } else if (upvotes >= 100) {
    this.role = USER_ROLES.INTERMEDIATE;
  } else {
    this.role = USER_ROLES.NEWBIE;
  }
  
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    console.error("Password comparison error:", error)
    return false
  }
}

userSchema.virtual("questionsCount", {
  ref: "Question",
  localField: "_id",
  foreignField: "author",
  count: true,
})

userSchema.virtual("answersCount", {
  ref: "Answer",
  localField: "_id",
  foreignField: "author",
  count: true,
})

userSchema.set("toJSON", { virtuals: true })
userSchema.set("toObject", { virtuals: true })

const User = mongoose.model("User", userSchema)

export default User
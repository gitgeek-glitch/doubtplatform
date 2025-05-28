import mongoose from "mongoose"

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
    value: {
      type: Number,
      enum: [-1, 0, 1],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

voteSchema.index(
  { user: 1, question: 1 },
  {
    unique: true,
    partialFilterExpression: {
      question: { $exists: true, $ne: null },
      answer: { $exists: false },
    },
  },
)

voteSchema.index(
  { user: 1, answer: 1 },
  {
    unique: true,
    partialFilterExpression: {
      answer: { $exists: true, $ne: null },
      question: { $exists: false },
    },
  },
)

voteSchema.pre("save", function (next) {
  if (this.question && this.answer) {
    const err = new Error("Vote cannot be for both question and answer")
    return next(err)
  }

  if (!this.question && !this.answer) {
    const err = new Error("Vote must be for either a question or an answer")
    return next(err)
  }

  next()
})

const Vote = mongoose.model("Vote", voteSchema)

export default Vote

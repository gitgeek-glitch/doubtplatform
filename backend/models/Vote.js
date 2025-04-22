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

// Ensure a user can only vote once per question or answer
voteSchema.index({ user: 1, question: 1 }, { unique: true, sparse: true })
voteSchema.index({ user: 1, answer: 1 }, { unique: true, sparse: true })

const Vote = mongoose.model("Vote", voteSchema)

export default Vote

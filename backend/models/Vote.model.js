import mongoose from "mongoose"

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: true,
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

voteSchema.index({ user: 1, answer: 1 }, { unique: true })

const Vote = mongoose.model("Vote", voteSchema)

export default Vote
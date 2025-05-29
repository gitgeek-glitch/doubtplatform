import mongoose from "mongoose"

const answerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    downvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

answerSchema.virtual("upvotes").get(function() {
  return this.upvotedBy.length
})

answerSchema.virtual("downvotes").get(function() {
  return this.downvotedBy.length
})

answerSchema.set("toJSON", { virtuals: true })
answerSchema.set("toObject", { virtuals: true })

const Answer = mongoose.model("Answer", answerSchema)

export default Answer
import mongoose from "mongoose"

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    tags: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (tags) => tags.length > 0 && tags.length <= 5,
          message: "Questions must have between 1 and 5 tags",
        },
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ["dsa", "maths", "programming", "web", "mobile", "ai", "database", "networking", "os", "other"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isSolved: {
      type: Boolean,
      default: false,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

questionSchema.virtual("answerCount", {
  ref: "Answer",
  localField: "_id",
  foreignField: "question",
  count: true,
})

questionSchema.set("toJSON", { virtuals: true })
questionSchema.set("toObject", { virtuals: true })

questionSchema.index({ title: "text", content: "text", tags: "text" })

const Question = mongoose.model("Question", questionSchema)

export default Question

import mongoose, { Schema } from "mongoose";

// Define schema for comments on blog posts
const commentSchema = new Schema(
  {
    // The blog post on which this comment is made
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // The user who made this comment
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The actual comment content/text
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Number of likes on the comment
    likes: {
      type: Number,
      default: 0,
    },

    // Optional: Mark comment as deleted (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically track createdAt and updatedAt
    timestamps: true,
  }
);

// Export the Comment model
export const Comment = mongoose.model("Comment", commentSchema);

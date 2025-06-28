import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    postLiked: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },

    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.models("Like", likeSchema);

import mongoose, { Schema } from "mongoose";

const followerAndFollowingSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const FollowerAndFollowing = mongoose.model(
  "FollowerAndFollowing",
  followerAndFollowingSchema
);

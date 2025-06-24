// Import required modules
import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

// Define the schema for blog posts
const postSchema = new Schema(
  {
    // Blog post title
    title: {
      type: String,
      trim: true,
      required: true,
    },

    // URL-friendly version of the title
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Prevent duplicate slugs for SEO and routing
    },

    // Main content/body of the post
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional image URL to represent the blog visually
    featuredImage: {
      type: String,
    },

    // List of tags for filtering/search (e.g., ["nodejs", "mongodb"])
    tags: {
      type: [String],
      default: [],
    },

    // Reference to a Category document
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    // Author of the post (must be a registered user)
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Like count for the post (default is 0)
    likes: {
      type: Number,
      default: 0,
    },

    // List of comment references (each pointing to a Comment document)
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    // Flag to control whether post is publicly visible or not
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Timestamp of when the post was published
    publishedAt: {
      type: Date,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Pre-save middleware: Auto-generate slug from title
postSchema.pre("save", async function (next) {
  // Use regular function (not arrow) to access `this`
  if (this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true, // Convert to lowercase
      strict: true, // Remove special characters
      trim: true, // Remove extra spaces
    });
  }
  next();
});

// Export the Post model
export const Post = mongoose.model("Post", postSchema);

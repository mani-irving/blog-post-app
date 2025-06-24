import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

// Define schema for blog post categories
const categorySchema = new Schema(
  {
    // Name of the category (e.g., "Technology", "Health")
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    // Slugified version of the name (used in URLs)
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt & updatedAt
  }
);

// Pre-save hook: Generate slug from name before saving
categorySchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

// Export the Category model
export const Category = mongoose.model("Category", categorySchema);

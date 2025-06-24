import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

// Define the schema for User
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Prevent password from being returned in queries
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "https://example.com/default-profile-picture.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next(); // Continue saving
  } catch (error) {
    next(error); // Pass error to error handler
  }
});

// Custom method to compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
export const User = mongoose.model("User", userSchema);

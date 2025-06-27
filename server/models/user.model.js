import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Define the schema for the User model
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true, // Removes unwanted whitespace
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
      lowercase: true, // Ensures consistency
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Optional: Add regex validator to validate email format
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Prevents password from being returned in queries
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "https://example.com/default-profile-picture.png",
    },
    cloudinaryPublicId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true, // Can be used for soft deletes or deactivation
    },
    refreshToken: {
      type: String,
      select: false, // Prevents refresh token from leaking via accidental queries
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// 🔐 Middleware: Hash password before saving user to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if not modified

  try {
    const salt = await bcrypt.genSalt(10); // Recommended rounds
    this.password = await bcrypt.hash(this.password, salt); // Store hashed password
    next();
  } catch (error) {
    next(error); // Forward any errors
  }
});

// ✅ Instance Method: Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // Safety check
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🔑 Instance Method: Generate JWT Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};

// 🔁 Instance Method: Generate JWT Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};

// 🛡️ Security: Hide sensitive fields from JSON responses (e.g., APIs)
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

// Export the compiled model
export const User = mongoose.model("User", userSchema);

// server/controllers/user.controller.js
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Utility: Send token in cookie
const sendTokenInCookie = (res, user, statusCode = 200) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refreshToken in DB
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json(
      new ApiResponse(statusCode, "Logged in successfully", {
        user,
        accessToken,
      })
    );
};

// 🟢 REGISTER
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, dateOfBirth } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !username ||
    !email ||
    !password ||
    !dateOfBirth
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) throw new ApiError(409, "User already exists");

  const newUser = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    dateOfBirth,
  });

  sendTokenInCookie(res, newUser, 201);
});

// 🔐 LOGIN
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "All fields are required");

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  sendTokenInCookie(res, user, 200);
});

// 🚪 LOGOUT
export const logoutUser = asyncHandler(async (req, res) => {
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json(new ApiResponse(200, "Logged out successfully"));
});

// 🔁 REFRESH ACCESS TOKEN
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh Token missing");

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const newAccessToken = user.generateAccessToken();

  res
    .status(200)
    .cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "Access token refreshed", {
        accessToken: newAccessToken,
      })
    );
});

// server/controllers/user.controller.js (continued)

// 👤 GET CURRENT USER
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user; // This is set in auth.middleware.js
  res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
});

// 🛠️ UPDATE PROFILE
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updateFields = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    dateOfBirth: req.body.dateOfBirth,
    profilePicture: req.body.profilePicture, // If you're uploading to cloudinary and passing URL
  };

  // Remove undefined fields
  Object.keys(updateFields).forEach(
    (key) => updateFields[key] === undefined && delete updateFields[key]
  );

  const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, "Profile updated", updatedUser));
});

// 🔑 CHANGE PASSWORD
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isOldCorrect = await user.comparePassword(oldPassword);
  if (!isOldCorrect) throw new ApiError(401, "Old password is incorrect");

  user.password = newPassword;
  await user.save();

  res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});

// ❌ DELETE USER
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndDelete(userId);

  res.clearCookie("accessToken").clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, "User deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteUser,
};

// server/routes/user.routes.js

import express from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateEmail,
  updateProfilePicture,
  getUserFollowersAndFollowings,
  deleteUser,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @desc    User Registration Route
 * @route   POST /api/users/register
 * @access  Public
 * @usage   Allows a new user to register with optional profile picture
 */
router.route("/register").post(upload.single("profilePicture"), registerUser);

/**
 * @desc    User Login Route
 * @route   POST /api/users/login
 * @access  Public
 * @usage   Authenticates user and returns tokens
 */
router.route("/login").post(loginUser);

/**
 * @desc    Refresh JWT Access Token
 * @route   GET /api/users/refresh-access-token
 * @access  Protected
 */
router.route("/refresh-access-token").get(authMiddleware, refreshAccessToken);

/**
 * @desc    Change Current User's Password
 * @route   POST /api/users/change-current-password
 * @access  Protected
 */
router
  .route("/change-current-password")
  .post(authMiddleware, changeCurrentPassword);

/**
 * @desc    Get Current Logged-in User
 * @route   GET /api/users/get-current-user
 * @access  Protected
 */
router.route("/get-current-user").get(authMiddleware, getCurrentUser);

/**
 * @desc    Update Basic Account Details (name, bio, etc.)
 * @route   POST /api/users/update-account-details
 * @access  Protected
 */
router
  .route("/update-account-details")
  .post(authMiddleware, updateAccountDetails);

/**
 * @desc    Update User's Email Address
 * @route   POST /api/users/update-email
 * @access  Protected
 */
router.route("/update-email").post(authMiddleware, updateEmail);

/**
 * @desc    Upload/Update User's Profile Picture
 * @route   POST /api/users/upload-profile-pic
 * @access  Protected
 */
router
  .route("/upload-profile-pic")
  .post(authMiddleware, upload.single("profilePicture"), updateProfilePicture);

/**
 * @desc    Get Public Info: User's Followers and Followings
 * @route   POST /api/users/get-user-public-info
 * @access  Protected
 */
router
  .route("/get-user-public-info")
  .post(authMiddleware, getUserFollowersAndFollowings);

/**
 * @desc    Logout the Current User
 * @route   POST /api/users/logout
 * @access  Protected
 */
router.route("/logout").post(authMiddleware, logOutUser);

/**
 * @desc    Delete the Current Logged-in User Account
 * @route   POST /api/users/delete-user
 * @access  Protected
 */
router.route("/delete-user").post(authMiddleware, deleteUser);

export default router;

// Import necessary modules and middleware
import express from "express";
import {
  createPost,
  deletePost,
  editPost,
  togglePostVisibility,
} from "../controllers/post.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

// Initialize Express Router
const router = express.Router();

/**
 * @desc    Create a new post
 * @route   POST /api/v1/users/posts/create
 * @access  Protected
 * @middleware Auth (verifies JWT) + Multer (handles featured image upload)
 */
router
  .route("/create")
  .post(authMiddleware, upload.single("featuredImage"), createPost);

/**
 * @desc    Edit a post by ID
 * @route   PUT /api/v1/users/posts/:postId
 * @access  Protected
 */
router.route("/edit/:postId").put(authMiddleware, editPost);

/**
 * @route   PATCH /api/v1/users/posts/toggle/:postId
 * @desc    Toggle the visibility (public/private) of a post
 * @access  Protected (Only the post author can perform this action)
 */
router.patch("/toggle/:postId", authMiddleware, togglePostVisibility);

/**
 * @desc    Delete a post by its ID
 * @route   DELETE /api/v1/users/posts/delete/:postId
 * @access  Protected
 * @middleware Auth (verifies JWT)
 */
router.route("/delete/:postId").delete(authMiddleware, deletePost);

// Export the router to be used in the main app
export default router;

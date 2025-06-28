// Import necessary modules and middleware
import express from "express";
import { createPost, deletePost } from "../controllers/post.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

// Initialize Express Router
const router = express.Router();

/**
 * @desc    Create a new post
 * @route   POST /api/posts/create
 * @access  Protected
 * @middleware Auth (verifies JWT) + Multer (handles featured image upload)
 */
router
  .route("/create")
  .post(authMiddleware, upload.single("featuredImage"), createPost);

/**
 * @desc    Delete a post by its ID
 * @route   DELETE /api/posts/delete/:postId
 * @access  Protected
 * @middleware Auth (verifies JWT)
 */
router.route("/delete/:postId").delete(authMiddleware, deletePost);

// Export the router to be used in the main app
export default router;

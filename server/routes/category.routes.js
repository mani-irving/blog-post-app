import express from "express";
import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @desc    Fetch all categories (sorted alphabetically by name)
 * @route   GET /api/v1/categories/all
 * @access  Public
 */
router.route("/all").get(getAllCategories);

/**
 * @route   POST /api/v1/categories/create
 * @desc    Create a new category
 * @access  Protected (Only authenticated users can create)
 */
router.route("/create").post(authMiddleware, createCategory);

export default router;

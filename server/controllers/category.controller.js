import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Category } from "../models/category.model.js";

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories/create
 * @access  Protected
 */
const createCategory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  // Check if user is authenticated
  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const { categoryName } = req.body;

  // Validate input
  if (!categoryName?.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  // Normalize the category name (capitalize first letter, rest lowercase)
  const normalizeCategoryName = (name) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const normalizedCategoryName = normalizeCategoryName(categoryName.trim());

  // Check if category already exists
  const categoryExists = await Category.findOne({
    name: normalizedCategoryName,
  });

  if (categoryExists) {
    throw new ApiError(400, "Category already exists");
  }

  // Create and save new category
  const newCategory = await Category.create({
    name: normalizedCategoryName,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "New category created successfully", newCategory)
    );
});

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });

  if (!categories.length) {
    throw new ApiError(404, "No categories found");
  }

  const simplified = categories.map((cat) => ({
    id: cat._id,
    name: cat.name,
    slug: cat.slug,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Categories fetched successfully", simplified));
});

export { createCategory, getAllCategories };

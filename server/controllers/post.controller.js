import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import uploadOnCloudinary from "../utils/cloudinaryUploader.js";
import deleteOnCloudinary from "../utils/deleteOnCloudinary.js";
import express from "express";

/**
 * @desc    Create a new blog post
 * @route   POST /api/posts
 * @access  Private (Only authenticated users)
 */
const createPost = asyncHandler(async (req, res) => {
  // Step 1: Fetch the authenticated user from the database, excluding sensitive fields
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -isActive -cloudinaryPublicId"
  );

  // If user is not found or not logged in, return error
  if (!user) {
    throw new ApiError(400, "User must be logged in to create a post");
  }

  // Step 2: Extract post fields from request body
  const { title, content, category } = req.body;

  // Validate mandatory fields: title and content
  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  // Step 3: Validate category if provided (category is optional)
  let categoryExists;
  if (category?.trim()) {
    categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new ApiError(404, "Category not found");
    }
  }

  // Step 4: Handle featured image upload (optional)
  const featuredImageLocalFilePath = req.file?.path;
  let featuredImageUploadedOnCloudinaryObject = null;

  if (featuredImageLocalFilePath && featuredImageLocalFilePath.trim()) {
    featuredImageUploadedOnCloudinaryObject = await uploadOnCloudinary(
      featuredImageLocalFilePath
    );
  }

  // Step 5: Create and save the new post in the database
  const post = await Post.create({
    title,
    content,
    category: categoryExists?._id || undefined,
    featuredImage: featuredImageUploadedOnCloudinaryObject?.url || undefined,
    featuredImagePath:
      featuredImageUploadedOnCloudinaryObject?.public_id || undefined,
    author: user._id,
  });

  // Step 6: Send successful response with the created post
  return res
    .status(201)
    .json(new ApiResponse(201, "Post created successfully", post));
});

/**
 * @desc    Delete a post by ID (only by its author)
 * @route   DELETE /api/posts/:postId
 * @access  Protected
 */
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  // Ensure user is authenticated
  if (!userId) {
    throw new ApiError(401, "Unauthorized access");
  }

  // Validate postId param
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  // Fetch user (optional, only if needed for logic/debug)
  const user = await User.findById(userId).select(
    "-password -refreshToken -isActive"
  );

  // Fetch post from DB
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found with the given ID");
  }

  // Check ownership (authorization)
  if (post.author?.toString() !== user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // Delete associated image from Cloudinary if exists
  if (post.featuredImagePath) {
    await deleteOnCloudinary(post.featuredImagePath);
  }

  // Delete the post document
  await post.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, "Post deleted successfully"));
});

export { createPost, deletePost };

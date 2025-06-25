// server/routes/user.routes.js

import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logoutUser);

// 🔐 Protected Routes (Requires JWT)
router.get("/me", authMiddleware, getCurrentUser);
router.put("/update-profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteUser);

export default router;

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
} from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Public Routes
router.route("/register").post(upload.single("profilePicture"), registerUser);

router.route("/login").post(loginUser);

// 🔐 Protected Routes (Requires JWT)

router.route("/refresh-access-token").get(authMiddleware, refreshAccessToken);

router
  .route("/change-current-password")
  .post(authMiddleware, changeCurrentPassword);

router.route("/get-current-user").get(authMiddleware, getCurrentUser);

router
  .route("/update-account-details")
  .post(authMiddleware, updateAccountDetails);

router.route("/update-email").post(authMiddleware, updateEmail);

router
  .route("/upload-profile-pic")
  .post(authMiddleware, upload.single("profilePicture"), updateProfilePicture);

router.route("/logout").post(authMiddleware, logOutUser);

export default router;

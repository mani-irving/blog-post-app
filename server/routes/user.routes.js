// server/routes/user.routes.js

import express from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Public Routes
router
  .route("/register")
  .post(upload.fields([{ name: "profilePicture", maxCount: 1 }]), registerUser);

router.route("/login").post(loginUser);

// 🔐 Protected Routes (Requires JWT)
router.route("/logout").post(authMiddleware, logOutUser);

export default router;

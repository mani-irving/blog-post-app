// server/routes/user.routes.js

import express from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Public Routes
router
  .route("/register")
  .post(upload.fields([{ name: "profilePicture", maxCount: 1 }]), registerUser);

// 🔐 Protected Routes (Requires JWT)

export default router;

// server/middleware/upload.middleware.js

import multer from "multer";
import path from "path";
import fs from "fs";

// Step 1: Ensure /public/temp directory exists
const tempDir = path.join(process.cwd(), "public", "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Step 2: Define multer storage configuration
const storage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  // Use original file name with optional timestamp (if needed)
  filename: function (req, file, cb) {
    cb(null, file.originalname); // You can customize naming here
  },
});

// Step 3: Create the multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
  },
});

// server/middleware/upload.middleware.js

import multer from "multer";
import path from "path";
import fs from "fs";

// Step 1: Create the /public/temp folder if it doesn't exist
const tempDir = path.join(process.cwd(), "public", "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Step 2: Define storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir); // Files go to /public/temp
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

// Step 3: Create the multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

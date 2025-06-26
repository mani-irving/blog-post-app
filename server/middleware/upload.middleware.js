import multer from "multer";

// Define multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../server/public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Create the multer instance
export const upload = multer({
  storage,
});

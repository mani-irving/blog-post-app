// server/utils/cloudinaryUploader.js

import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

/**
 * Uploads file to Cloudinary and deletes local file after upload.
 * @param {string} localFilePath - File path in /public/temp before upload
 * @returns Cloudinary upload response or null
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Delete the local file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Delete local file even if upload fails
    fs.unlinkSync(localFilePath);
    return null;
  }
};
export default uploadOnCloudinary;

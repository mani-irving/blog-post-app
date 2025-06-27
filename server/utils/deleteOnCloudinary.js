import cloudinary from "../config/cloudinary.config.js";

const deleteOnCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;

    const response = await cloudinary.uploader.destroy(public_id);

    return response;
  } catch (error) {
    return null;
  }
};

export default deleteOnCloudinary;

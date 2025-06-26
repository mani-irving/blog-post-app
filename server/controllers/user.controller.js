import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinaryUploader.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const generateAccessTokenAndRefreshToken = async(userId) =>{
  try {
    const user = await User.findById(userId).select("-password -refreshToken -isActive -profilePicture");
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating the tokens");
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, dateOfBirth } =
    req.body;

  if (
    [firstName, lastName, username, email, password, dateOfBirth].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const profilePictureImagePath = req.files?.profilePicture[0]?.path;

  if (!profilePictureImagePath) {
    throw new ApiError(400, "Profile Image is required");
  }

  const profilePictureImageObjectFromClodinary = await uploadOnCloudinary(
    profilePictureImagePath
  );

  if (!profilePictureImageObjectFromClodinary) {
    throw new ApiError(500, "Error while uploading the Image on clodinary");
  }

  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    dateOfBirth,
    profilePicture: profilePictureImageObjectFromClodinary.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -isActive"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User registered Successfully", createdUser));
});

export { registerUser };

const loginUser = asyncHandler(async(req, res) =>{
  const {username, email, password} = req.body;
  if(!username && !email){
    throw new ApiError(400, "Either of username or email is required for login");
  }
  if(!(password.trim())
  {
    throw new ApiError(400, "Password must be present");
  }

  const user = await User.findOne({
    $or: [{username}, {email}],
  });

  if(!user){
    throw new ApiError(400, "User not registered or Invalid User");
  }

  const passwordValid = await user.comparePassword(password);

  if(!passwordValid){
    throw new ApiError(400, "Passowrd didn't matched");
  }

  const {accessToken, refreshToken} = generateAccessTokenAndRefreshToken();

  return res.status(200).cook

});

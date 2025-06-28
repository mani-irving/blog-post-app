// Import dependencies and utility modules
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinaryUploader.js";
import deleteOnCloudinary from "../utils/deleteOnCloudinary.js";
import { User } from "../models/user.model.js";

/**
 * Generates access and refresh tokens for a user.
 * Updates the user's refreshToken in DB.
 */
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      "-password -refreshToken -isActive -profilePicture"
    );
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating the tokens");
  }
};

/**
 * @desc Register a new user
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, dateOfBirth } =
    req.body;

  // Validate all required fields
  if (
    [firstName, lastName, username, email, password, dateOfBirth].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for existing user by username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  // Get uploaded profile picture path
  const profilePictureImagePath = req.file?.path;

  if (!profilePictureImagePath) {
    throw new ApiError(400, "Profile Image is required");
  }

  // Upload profile picture to Cloudinary
  const profilePictureImageObjectFromClodinary = await uploadOnCloudinary(
    profilePictureImagePath
  );

  if (!profilePictureImageObjectFromClodinary) {
    throw new ApiError(500, "Error while uploading the Image on Cloudinary");
  }

  // Create user in DB
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    dateOfBirth,
    profilePicture: profilePictureImageObjectFromClodinary.url,
    cloudinaryPublicId: profilePictureImageObjectFromClodinary?.public_id,
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

/**
 * @desc Login user with username/email and password
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(
      400,
      "Either of username or email is required for login"
    );
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user by username/email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "User not registered or Invalid User");
  }

  const passwordValid = await user.comparePassword(password);

  if (!passwordValid) {
    throw new ApiError(400, "Password didn't match");
  }

  // Generate tokens
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  user.isActive = true;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged In Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

/**
 * @desc Logout user and clear cookies + update DB
 * @route POST /api/users/logout
 * @access Protected
 */
const logOutUser = asyncHandler(async (req, res) => {
  let _id;

  try {
    _id = req.user?._id;
  } catch (error) {
    throw new ApiError(400, "User Id doesn't exist");
  }

  await User.findByIdAndUpdate(
    _id,
    {
      $unset: { refreshToken: 1 },
      $set: { isActive: false },
    },
    { new: true }
  );

  const user = await User.findById(_id).select("+isActive");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, `${user.firstName} logged Out Successfully`, {
        user,
      })
    );
});

/**
 * @desc Generate new access token from valid refresh token
 * @route GET /api/users/refresh-access-token
 * @access Protected
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      400,
      "Unauthorised Request, we need refreshToken to generate new accessToken"
    );
  }

  try {
    const isValidRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const _id = isValidRefreshToken._id;
    const user = await User.findById(_id).select("+refreshToken");

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(400, "Invalid or mismatched Refresh Token");
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(_id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, "Access Token Refreshed", {
          newAccessToken,
          newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

/**
 * @desc Change user password after validating old one
 * @route POST /api/users/change-current-password
 * @access Protected
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  const user = await User.findById(req.user?._id).select("+password");

  const passwordValid = await user.comparePassword(oldPassword);

  if (!passwordValid) {
    throw new ApiError(400, "Old password didn't match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

/**
 * @desc Get currently logged in user
 * @route GET /api/users/get-current-user
 * @access Protected
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -isActive"
  );

  if (!user) {
    throw new ApiError(400, "Couldn't find the current user");
  }

  return res.status(200).json(
    new ApiResponse(200, "Current user details fetched successfully", {
      user,
    })
  );
});

/**
 * @desc Update basic profile details
 * @route POST /api/users/update-account-details
 * @access Protected
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { firstName, lastName, username } = req.body;

  if (!firstName && !lastName && !username) {
    return res.status(400).json(new ApiResponse(400, "No fields to update"));
  }

  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(username && { username }),
      },
    },
    { new: true }
  ).select("-password -refreshToken -isActive");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User Details Updated Successfully",
        updatedUserDetails
      )
    );
});

/**
 * @desc Update user email
 * @route POST /api/users/update-email
 * @access Protected
 */
const updateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { email } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Email Updated Successfully", updatedUser));
});

/**
 * @desc Update user profile picture
 * @route POST /api/users/upload-profile-pic
 * @access Protected
 */
const updateProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -isActive"
  );

  if (!user) {
    throw new ApiError(400, "Unable to fetch user");
  }

  const defaultProfilePicture =
    "https://example.com/default-profile-picture.png";

  // Delete old picture from cloudinary if not default
  if (user.profilePicture !== defaultProfilePicture) {
    await deleteOnCloudinary(user.cloudinaryPublicId);
  }

  const localPath = req.file?.path;

  if (!localPath) {
    throw new ApiError(400, "No Profile Image found in request");
  }

  const uploadResult = await uploadOnCloudinary(localPath);

  if (!uploadResult.url) {
    throw new ApiError(500, "Error while uploading new image");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: uploadResult.url,
        cloudinaryPublicId: uploadResult.public_id,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile Picture updated successfully"));
});

/**
 * @desc Get followers and followings of a user
 * @route POST /api/users/get-user-public-info
 * @access Protected
 */
const getUserFollowersAndFollowings = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const accountPublicData = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "followerAndFollowings",
        localField: "_id",
        foreignField: "following",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "followerAndFollowings",
        localField: "_id",
        foreignField: "follower",
        as: "followings",
      },
    },
    {
      $addFields: {
        followersCount: { $size: "$followers" },
        followingsCount: { $size: "$followings" },
        isFollowing: {
          $cond: {
            if: { $in: [req.user?._id, "$followers.follower"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        firstName: 1,
        username: 1,
        followers: 1,
        followings: 1,
        isFollowing: 1,
        profilePicture: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!accountPublicData?.length) {
    throw new ApiError(404, "User Details doesn't exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Visited User Details fetched", accountPublicData[0])
    );
});

/**
 * @desc    Delete the currently logged-in user's account
 * @route   DELETE /api/users/delete
 * @access  Protected
 */
const deleteUser = asyncHandler(async (req, res) => {
  // Extract authenticated user ID from request
  const userId = req.user?._id;

  // Ensure the user is authenticated
  if (!userId) {
    throw new ApiError(400, "User isn't authenticated to delete the account");
  }

  // Fetch the user record from the database
  const user = await User.findById(userId).select(
    "-password -refreshToken -isActive"
  );

  // If user does not exist in DB
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  // Cloudinary default fallback profile image
  const defaultProfilePicture =
    "https://example.com/default-profile-picture.png";

  // Delete user's profile picture from Cloudinary if it's a custom one
  if (
    user.profilePicture !== defaultProfilePicture &&
    user.cloudinaryPublicId
  ) {
    await deleteOnCloudinary(user.cloudinaryPublicId);
  }

  // Permanently delete the user from the database
  await User.findByIdAndDelete(user._id);

  // Options to clear secure cookies
  const options = {
    httpOnly: true, // Prevents access via JS
    secure: true, // Ensures HTTPS-only transmission
  };

  // Clear authentication cookies and respond
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User deleted successfully"));
});

// Export all controller functions
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateEmail,
  updateProfilePicture,
  getUserFollowersAndFollowings,
  deleteUser,
};

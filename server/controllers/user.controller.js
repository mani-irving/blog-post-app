import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinaryUploader.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import deleteOnCloudinary from "../utils/deleteOnCloudinary.js";

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

  //It would be used when I would take multiple files from the request body and upload on temp location through multer.
  //In that case in middleware i need to use: upload.fields([{ name: "profilePicture", maxCount: 1 }, {...}, {...}])
  // const profilePictureImagePath = req.files?.profilePicture[0]?.path;

  // We would use this line when we wanted to fetch a single file's path uploaded through multer on temporary location (here "../public/temp")
  // Then before using this we would use the multer middleware in our /register route like: upload.single("file-Name-Same-As-Frontend-Input-Field-Attribute-Name")
  const profilePictureImagePath = req.file?.path;

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

  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "User not registered or Invalid User");
  }

  const passwordValid = await user.comparePassword(password);

  if (!passwordValid) {
    throw new ApiError(400, "Passowrd didn't matched");
  }

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
  const firstName = user.firstName;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, `${firstName} logged Out Successfully`, { user })
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      400,
      "Unauthorised Request, we need refreshToken to generate ne accessToken"
    );
  }

  try {
    const isValidRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!isValidRefreshToken) {
      throw new ApiError(400, "Invalid Refresh Token or expired Refresh Token");
    }

    const _id = isValidRefreshToken._id;
    const user = await User.findById(_id).select("+refreshToken");

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(
        400,
        "User's Refresh Token and incoming Refresh Token didn't matched, so we can't refresh new access token!!"
      );
    }

    const { newAccessToken, newRefreshToken } =
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
        new ApiResponse(
          200,
          "Access Token Refreshed after expiry along with Refresh Token",
          { newAccessToken, newRefreshToken }
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  const user = await User.findById(req.user?._id).select("+password"); // optional

  const passwordValid = await user.comparePassword(oldPassword);

  if (!passwordValid) {
    throw new ApiError(400, "Old password didn't matched");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -isActive"
  );

  if (!user) {
    throw new ApiError(400, "Couldn't able to find the current user");
  }

  return res.status(200).json(
    new ApiResponse(200, "Current user details fetched successfully", {
      user,
    })
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { firstName, lastName, username } = req.body;
  if (!firstName && !lastName && !username) {
    return res.status(400).json(new ApiResponse(400, "No fields to update"));
  }

  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...(req.body.firstName && { firstName: req.body.firstName }),
        ...(req.body.lastName && { firstName: req.body.lastName }),
        ...(req.body.username && { firstName: req.body.username }),
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

const updateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body?.email;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const userwithUpdatedEmail = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Email Updated Successfully", userwithUpdatedEmail)
    );
});

//Before executing this line in route handler we will use first authMiddleware and then multer Middleware
const updateProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -isActive"
  );

  if (!user) {
    throw new ApiError(400, "We aren't able to fetch the User");
  }

  const deafultProfilePicture =
    "https://example.com/default-profile-picture.png";

  let response;
  if (user.profilePicture !== deafultProfilePicture) {
    response = await deleteOnCloudinary(user.cloudinaryPublicId);
  }

  const localPathOfFileUploadedThroughMulter = req.file?.path;

  if (!localPathOfFileUploadedThroughMulter) {
    throw new ApiError(400, "No Profile Image found in request");
  }

  const cloudinaryObjectAfterUploading = await uploadOnCloudinary(
    localPathOfFileUploadedThroughMulter
  );

  if (!cloudinaryObjectAfterUploading.url) {
    throw new ApiError(500, "Something went wrong");
  }

  const cloudinaryURL = cloudinaryObjectAfterUploading?.url;
  const cloudinaryPublicId = cloudinaryObjectAfterUploading?.public_id;

  const updatedUserProfileObject = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: cloudinaryURL,
        cloudinaryPublicId: cloudinaryPublicId,
      },
    },
    { new: true }
  ).select("-password -refreshToken, -isActive");

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile Picture updated successfully"));
});

const getUserFollowersAndFollowings = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const accountPublicData = await User.aggregate([
    {
      $match: {
        username: username?.tolowerCase(),
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
        followersCount: { $size: $followers },
        followingsCount: { $size: $followings },
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
    throw new ApiError(404, "User Details doesn't exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Visited User Details fetched", accountPublicData[0])
    );
});
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
  accountPublicData,
};

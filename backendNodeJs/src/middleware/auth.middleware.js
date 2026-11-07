import { findUserById } from "../model/user.model.js";
import { generateAccessToken } from "../services/user.service.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyUser = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized access - no token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  if (!decodedToken?.id) {
    throw new ApiError(401, "Invalid token payload");
  }

  const user = await findUserById(decodedToken.id);
  if (!user || user.length === 0) {
    throw new ApiError(401, "User no longer exists");
  }

  const userRow = Array.isArray(user) ? user[0] : user;

  const userPayLoad = {
    id: userRow.id,
    email: userRow.email,
  };

  req.user = userPayLoad;
  next();
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await findUserById(decodedToken?.id);
  if (!user || (Array.isArray(user) && user.length === 0)) {
    throw new ApiError(404, "No user found for this token");
  }

  const newAccessToken = await generateAccessToken(decodedToken.id);

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
  });

  return res.status(200).json(new ApiResponse(200, "Token refreshed successfully", null));
});

export { verifyUser, refreshToken };

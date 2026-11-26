import {
  createUser,
  findUserByEmail,
  findUserById,
  updateProfileImage,
  updatePassword,
  updateUser,
  deleteUser,
  createPasswordReset,
  findLatestPasswordResetOtp,
  incrementOtpAttempts,
  resetOtpAttempts,
  markOTPused,
} from "../model/user.model.js";
import { db } from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  hashPassword,
  isPasswordCorrect,
  generateRefreshToken,
} from "../services/user.service.js";
import { sendMailOtp } from "../utils/sendOtp.js";
import { generateOtp } from "../utils/generateOtp.js";
import jwt from "jsonwebtoken";

const isProduction =
  process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : (process.env.COOKIE_SAMESITE || "lax"),
};

const isPromoActive = () => process.env.LAUNCH_UNLIMITED_CREDITS !== "false";

const buildUserPayload = (user) => {
  const promo = isPromoActive();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number,
    profileImage: user.profileImage,
    freeCredits: promo ? Math.max(999, user.free_credits ?? 0) : user.free_credits,
    subscriptionStatus: promo ? "active" : user.subscription_status,
  };
};

const generateAccessRefreshToken = async (userId) => {
  const refreshToken = await generateRefreshToken(userId);
  const accessToken = await generateAccessToken(userId);
  return { refreshToken, accessToken };
};

export const directLogin = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "No active session found. Please login with your credentials.");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await findUserById(decoded.id);

    if (!user) {
      throw new ApiError(401, "Session expired. User not found.");
    }

    const userPayload = buildUserPayload(user);

    return res
      .status(200)
      .json(new ApiResponse(200, "Direct login successful", userPayload));
  } catch (error) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Session expired. Please log in with email and password.");
    }

    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await findUserById(decodedRefresh.id);
    if (!user) {
      throw new ApiError(401, "Session invalid. Please log in again.");
    }

    const newAccessToken = await generateAccessToken(user.id);
    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
    });

    const userPayload = buildUserPayload(user);

    return res
      .status(200)
      .json(new ApiResponse(200, "Session restored successfully", userPayload));
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  const existUser = await findUserByEmail(email);
  if (existUser) {
    // If user already exists and password matches, sign them in directly!
    const isPassValid = await isPasswordCorrect(password, existUser.password_hash);
    if (isPassValid) {
      const { accessToken, refreshToken } = await generateAccessRefreshToken(existUser.id);
      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 10 * 24 * 60 * 60 * 1000,
      });
      const userPayload = buildUserPayload(existUser);
      return res.status(200).json(
        new ApiResponse(200, "Account already exists. Signed in successfully!", {
          user: userPayload,
          accessToken,
          requiresOtp: false,
        })
      );
    }
    throw new ApiError(409, "User with this email already exists. Please sign in with your password.");
  }

  const hashedPassword = await hashPassword(password);
  const result = await createUser(name, email, hashedPassword, phoneNumber || null);
  const userId = result.insertId;

  // Instant Launch Mode: Direct session activation (no email delivery wait times)
  const { accessToken, refreshToken } = await generateAccessRefreshToken(userId);

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 10 * 24 * 60 * 60 * 1000,
  });

  const createdUser = await findUserById(userId);
  const userPayload = buildUserPayload(createdUser);

  return res.status(201).json(
    new ApiResponse(201, "Account created successfully! Welcome to Resume Studio.", {
      user: userPayload,
      accessToken,
      requiresOtp: false,
    })
  );
});

export const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const otpRecord = await findLatestPasswordResetOtp(user.id);
  if (!otpRecord) {
    throw new ApiError(400, "No active OTP found or maximum attempts exceeded.");
  }

  const isExpired = new Date() > new Date(otpRecord.expiresAt);
  const isOtpValid = await isPasswordCorrect(otp.toString(), otpRecord.otp_hash);

  if (!isOtpValid || isExpired) {
    await incrementOtpAttempts(otpRecord.id);
    throw new ApiError(400, "Invalid OTP or OTP has expired.");
  }

  await markOTPused(otpRecord.id);

  const { accessToken, refreshToken } = await generateAccessRefreshToken(user.id);

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 10 * 24 * 60 * 60 * 1000,
  });

  const userPayload = buildUserPayload(user);

  return res.status(200).json(
    new ApiResponse(200, "Account verified and logged in successfully.", {
      user: userPayload,
      accessToken,
    })
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const comparePass = await isPasswordCorrect(password, user.password_hash);
  if (!comparePass) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(user.id);

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 10 * 24 * 60 * 60 * 1000,
  });

  const userPayload = buildUserPayload(user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Login successful", { user: userPayload, accessToken }));
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, "Logged out successfully", null));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, "If an account exists, an OTP has been sent.", null));
  }

  const otp = generateOtp();
  const otpHash = await hashPassword(otp.toString());
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createPasswordReset(user.id, otpHash, expiresAt);
  try {
    await sendMailOtp(user.email, otp);
  } catch (mailErr) {
    console.warn("Forgot password email delivery blocked by cloud firewall:", mailErr?.message || mailErr);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "If an account exists, an OTP has been sent.", null));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;

  if (!otp || !email) {
    throw new ApiError(400, "Both email and OTP are required.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const otpUserRecord = await findLatestPasswordResetOtp(user.id);
  if (!otpUserRecord) {
    throw new ApiError(400, "No active OTP found or maximum attempts exceeded.");
  }

  const isExpired = new Date() > new Date(otpUserRecord.expiresAt);
  const isOtpValid = await isPasswordCorrect(otp.toString(), otpUserRecord.otp_hash);

  if (!isOtpValid || isExpired) {
    await incrementOtpAttempts(otpUserRecord.id);
    throw new ApiError(400, "Invalid OTP or OTP has expired.");
  }

  const resetToken = jwt.sign(
    { id: user.id, purpose: "password_reset" },
    process.env.RESET_TOKEN_SECRET || "default_reset_secret_key",
    { expiresIn: process.env.RESET_TOKEN_EXPIRY || "15m" }
  );

  await markOTPused(otpUserRecord.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully.", { resetToken }));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, otp, email, newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required.");
  }

  let userId = null;

  // Option A: resetToken provided
  if (resetToken) {
    let decodeToken;
    try {
      decodeToken = jwt.verify(
        resetToken,
        process.env.RESET_TOKEN_SECRET || "default_reset_secret_key"
      );
    } catch (error) {
      throw new ApiError(401, "Invalid or expired reset token.");
    }

    if (decodeToken.purpose !== "password_reset") {
      throw new ApiError(401, "Invalid reset token purpose.");
    }
    userId = decodeToken.id;
  }
  // Option B: direct email and OTP provided
  else if (email && otp) {
    const user = await findUserByEmail(email);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const otpUserRecord = await findLatestPasswordResetOtp(user.id);
    if (!otpUserRecord) {
      throw new ApiError(400, "No active OTP found or maximum attempts exceeded.");
    }

    const isExpired = new Date() > new Date(otpUserRecord.expiresAt);
    const isOtpValid = await isPasswordCorrect(otp.toString(), otpUserRecord.otp_hash);

    if (!isOtpValid || isExpired) {
      await incrementOtpAttempts(otpUserRecord.id);
      throw new ApiError(400, "Invalid OTP or OTP has expired.");
    }

    await markOTPused(otpUserRecord.id);
    userId = user.id;
  }
  // Option C: Direct email and newPassword (instant reset mode without OTP)
  else if (email) {
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new ApiError(404, "No account found with this email address.");
    }
    userId = user.id;
  } else {
    throw new ApiError(400, "Account email and new password are required.");
  }

  const hashedPassword = await hashPassword(newPassword);
  const setNewPassword = await updatePassword(hashedPassword, userId);

  if (!setNewPassword || setNewPassword.affectedRows === 0) {
    throw new ApiError(500, "Failed to update password.");
  }

  // Fetch updated user to generate tokens and userPayload
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(500, "User not found after password update.");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(user.id);

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 10 * 24 * 60 * 60 * 1000,
  });

  const userPayload = buildUserPayload(user);

  return res.status(200).json(
    new ApiResponse(200, "Password updated successfully and session restored.", {
      user: userPayload,
      accessToken,
      refreshToken,
    })
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user?.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const userPayload = buildUserPayload(user);

  return res
    .status(200)
    .json(new ApiResponse(200, "User details fetched successfully.", userPayload));
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old password and new password are required.");
  }

  const userId = req.user?.id;
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const fullUser = await findUserByEmail(user.email);
  const isOldPassCorrect = await isPasswordCorrect(oldPassword, fullUser.password_hash);

  if (!isOldPassCorrect) {
    throw new ApiError(400, "Current password does not match.");
  }

  const hashNewPassword = await hashPassword(newPassword);
  const result = await updatePassword(hashNewPassword, userId);

  if (result.affectedRows === 0) {
    throw new ApiError(500, "Failed to update password.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully.", null));
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const { name, phoneNumber } = req.body;
  const userId = req.user?.id;

  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const updateResult = await updateUser(
    userId,
    name || user.name,
    phoneNumber !== undefined ? phoneNumber : user.phone_number
  );

  if (updateResult.affectedRows === 0) {
    throw new ApiError(500, "Update failed.");
  }

  if (req.file?.cloudinaryUrl) {
    await updateProfileImage(req.file.cloudinaryUrl, user.email);
  }

  const updatedUser = await findUserById(userId);
  const userPayload = buildUserPayload(updatedUser);

  return res
    .status(200)
    .json(new ApiResponse(200, "User details updated successfully.", userPayload));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const result = await deleteUser(userId);
  if (result.affectedRows === 0) {
    throw new ApiError(500, "Failed to delete account.");
  }

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, "Account deleted successfully.", null));
});

export {
  generateAccessRefreshToken,
};

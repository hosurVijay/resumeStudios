import { Router } from "express";
import {
  directLogin,
  registerUser,
  verifyRegistrationOtp,
  loginUser,
  logoutUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getCurrentUser,
  updateUserPassword,
  updateUserDetails,
  deleteAccount,
} from "../controller/user.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { upload, processUpload } from "../middleware/multer.middleware.js";
import { handleMulterError } from "../middleware/handleMulterError.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/verify-registration-otp").post(verifyRegistrationOtp);
router.route("/direct-login").post(directLogin);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUser, logoutUser);

router.route("/forgot-password").post(forgotPassword);
router.route("/verify-otp").post(verifyOtp);
router.route("/reset-password").post(resetPassword);

router.route("/me").get(verifyUser, getCurrentUser);
router.route("/update-password").patch(verifyUser, updateUserPassword);
router
  .route("/update-details")
  .patch(
    verifyUser,
    upload.single("profileImage"),
    handleMulterError,
    processUpload,
    updateUserDetails,
  );
router.route("/delete-account").delete(verifyUser, deleteAccount);

export default router;

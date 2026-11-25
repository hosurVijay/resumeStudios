import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../../public/uploads/profileImages");

// 1. Profile Image In-Memory Storage (No temporary files on disk)
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedType = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedType.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    const err = new ApiError(400, "Only JPEG, PNG, JPG, and WebP images are allowed");
    err.code = "INVALID_IMAGE_TYPE";
    return cb(err, false);
  }
};

// Multer upload middleware for images
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

// Middleware to upload in-memory image to Cloudinary with seamless local storage fallback
const processUpload = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // 1. Try uploading to Cloudinary
  try {
    const result = await uploadToCloudinary(req.file);
    if (result?.secure_url) {
      req.file.cloudinaryUrl = result.secure_url;
      req.file.publicId = result.public_id;
      return next();
    }
  } catch (error) {
    const detailMsg = error?.error?.message || error?.message || "Upload rejected by Cloudinary";
    console.warn(
      `Cloudinary upload failed (${detailMsg}). Falling back to local storage automatically.`
    );
  }

  // 2. Seamless local disk storage fallback (guarantees profile upload never fails)
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const rawExt = path.extname(req.file.originalname) || "";
    const ext = rawExt.length > 1 ? rawExt : ".jpg";
    const filename = `profile_${req.user?.id || Date.now()}_${Date.now()}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(targetPath, req.file.buffer);

    req.file.cloudinaryUrl = `/uploads/profileImages/${filename}`;
    req.file.publicId = filename;
  } catch (localError) {
    console.error("Local disk storage fallback failed:", localError);
    throw new ApiError(500, "Failed to save profile image to local storage.");
  }

  next();
});

// 2. Resume Upload Memory Storage (PDF & DOCX held in RAM for documentParser)
const resumeFilter = (req, file, cb) => {
  const allowedResumeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (allowedResumeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    const err = new ApiError(400, "Only PDF and DOCX files are allowed for resumes");
    err.code = "INVALID_FILE_TYPE";
    return cb(err, false);
  }
};

const uploadResume = multer({
  storage: multer.memoryStorage(),
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export { upload, processUpload, uploadResume };

import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Profile Image Disk Storage (Temporary before Cloudinary upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.parse(file.originalname).name.replace(/\s+/g, "_");
    cb(null, `${baseName}_${uniqueSuffix}${extension}`);
  },
});

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
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
});

// Middleware to upload the temp image to Cloudinary & auto-delete local file
const processUpload = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, "No file uploaded"));
  }

  try {
    const result = await uploadToCloudinary(req.file.path);
    if (!result) {
      throw new ApiError(500, "Cloudinary upload failed");
    }

    req.file.cloudinaryUrl = result.secure_url;
    req.file.publicId = result.public_id;
  } catch (error) {
    throw error;
  } finally {
    try {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Failed to delete the temporary file:", cleanupError);
    }
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

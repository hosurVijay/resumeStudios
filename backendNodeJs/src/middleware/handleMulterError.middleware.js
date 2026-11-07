import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return next(new ApiError(400, "File too large. Maximum size is 10MB."));
      case "LIMIT_FILE_COUNT":
        return next(new ApiError(400, "Too many files uploaded. Maximum is 2."));
      case "LIMIT_UNEXPECTED_FILE":
        return next(new ApiError(400, `Unexpected field '${err.field || "unknown"}' in file upload.`));
      default:
        return next(new ApiError(400, `File upload error: ${err.message}`));
    }
  }

  if (err.code === "INVALID_FILE_TYPE" || err.isCustomUploadError) {
    return next(new ApiError(400, err.message || "Invalid file type uploaded."));
  }

  next(err);
};

export { handleMulterError };

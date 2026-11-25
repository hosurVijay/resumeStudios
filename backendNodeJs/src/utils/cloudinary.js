import { v2 as cloudinary } from "cloudinary";

// Only for uploading user profile photos
const uploadToCloudinary = async (fileOrPath) => {
  try {
    if (!fileOrPath) return null;

    // Ensure config uses active, cleanly trimmed environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
      api_key: process.env.CLOUDINARY_API_KEY?.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
      secure: true,
    });

    let uploadPayload;
    if (typeof fileOrPath === "object" && fileOrPath.buffer) {
      // Memory storage: encode in-memory buffer as Data URI
      const mime = fileOrPath.mimetype || "image/jpeg";
      uploadPayload = `data:${mime};base64,${fileOrPath.buffer.toString("base64")}`;
    } else {
      uploadPayload = fileOrPath;
    }

    const response = await cloudinary.uploader.upload(uploadPayload, {
      resource_type: "image",
      folder: "resumestudio_profiles",
    });

    console.log("File upload to cloudinary successful:", response.secure_url);
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", {
      message: error?.message,
      http_code: error?.http_code,
      name: error?.name,
      errorDetail: error?.error,
    });
    throw error;
  }
};

export { uploadToCloudinary };

import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { ApiError } from "./apiError.js";
export const extractResumeText = async (fileBuffer, mimetype) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new ApiError(400, "Invalid file buffer provided.");
  }

  let rawText = "";

  try {
    if (mimetype === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      rawText = pdfData.text || "";
    } else if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = docxData.value || "";
    } else {
      throw new ApiError(
        400,
        "Unsupported file format. Please upload a PDF or DOCX file.",
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Text extraction failed:", error);
    throw new ApiError(
      500,
      "Failed to read resume text. The document may be corrupted or password-protected.",
    );
  }

  const cleanedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedText.length < 50) {
    throw new ApiError(
      400,
      "Unable to extract readable text. Please ensure your PDF is not an image scan or empty.",
    );
  }

  return cleanedText;
};

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { ApiError } from "./apiError.js";

/**
 * Extracts plain text from an uploaded resume buffer (PDF or DOCX).
 * Operates purely in-memory—no files are saved to disk.
 * 
 * @param {Buffer} fileBuffer - The in-memory buffer from req.file.buffer
 * @param {string} mimetype - The MIME type of the uploaded file
 * @returns {Promise<string>} Cleaned plain text from the resume
 */
export const extractResumeText = async (fileBuffer, mimetype) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new ApiError(400, "Invalid file buffer provided.");
  }

  let rawText = "";

  try {
    // 1. Handle PDF (pdf-parse v2)
    if (mimetype === "application/pdf") {
      const parser = new PDFParse({ data: fileBuffer });
      const pdfData = await parser.getText();
      rawText = pdfData.text || "";
    }
    // 2. Handle DOCX / DOC
    else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = docxData.value || "";
    } 
    else {
      throw new ApiError(400, "Unsupported file format. Please upload a PDF or DOCX file.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Text extraction failed:", error);
    throw new ApiError(500, "Failed to read resume text. The document may be corrupted or password-protected.");
  }

  // 3. Validation: Check if text is readable (handles scanned/image PDFs)
  const cleanedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedText.length < 50) {
    throw new ApiError(
      400,
      "Unable to extract readable text. Please ensure your PDF is not an image scan or empty."
    );
  }

  return cleanedText;
};

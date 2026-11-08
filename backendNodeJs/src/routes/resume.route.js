import { Router } from "express";
import {
  uploadAndAnalyzeResume,
  getMyResumes,
  deleteMyResume,
  getDashboardScoreHistory,
  getApplicationScoreHistory,
  submitEvidenceQnA,
  getEvidenceQnA,
  generateTailoredResume,
  approveVersion,
  exportResumeVersion,
} from "../controller/resume.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/multer.middleware.js";
import { handleMulterError } from "../middleware/handleMulterError.middleware.js";

const router = Router();

router.use(verifyUser);

router
  .route("/upload")
  .post(
    uploadResume.single("resume"),
    handleMulterError,
    uploadAndAnalyzeResume,
  );

router.route("/my-resumes").get(getMyResumes);
router.route("/:resumeId").delete(deleteMyResume);

router.route("/dashboard/score-history").get(getDashboardScoreHistory);
router
  .route("/applications/:applicationId/history")
  .get(getApplicationScoreHistory);

router
  .route("/applications/:applicationId/evidence")
  .get(getEvidenceQnA)
  .post(submitEvidenceQnA);

router.route("/applications/:applicationId/tailor").post(generateTailoredResume);
router
  .route("/applications/:applicationId/versions/:versionId/approve")
  .post(approveVersion);
router
  .route("/applications/:applicationId/versions/:versionId/export")
  .get(exportResumeVersion);

export default router;

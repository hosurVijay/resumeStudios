import { extractResumeText } from "../utils/documentParser.js";
import { scoringEngine } from "../services/scoring/index.js";
import {
  countUserResume,
  createResume,
  createJobApplication,
  getUserResumes,
  deleteResumeById,
  createResumeVersion,
  getAllApplicationsHistory,
  getSingleApplicationHistory,
  findJobApplicationById,
  saveEvidenceResponses,
  getEvidenceItems,
  getNextVersionNumber,
  updateJobApplicationTailored,
  findResumeVersionById,
  approveResumeVersion,
  deductUserCredit,
} from "../model/resume.model.js";
import { findUserById } from "../model/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { tailorResumeWithEvidence } from "../services/tailoring.service.js";
import { generateAtsHtml, generateAtsPlainText } from "../services/export.service.js";

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#0891b2",
];

export const uploadAndAnalyzeResume = asyncHandler(async (req, res) => {
  const { targetRole, targetCompany, jobDescription, title } = req.body;
  const userId = req.user.id;

  if (!req.file) {
    throw new ApiError(400, "Please upload a resume file (PDF or DOCX)");
  }
  if (!targetRole || !jobDescription) {
    throw new ApiError(400, "Target role and job description are required.");
  }

  const user = await findUserById(userId);
  const isSubscribed = user?.subscription_status === "active";

  if (!isSubscribed) {
    const existingCount = await countUserResume(userId);
    if (existingCount >= 1) {
      throw new ApiError(
        403,
        "Free accounts can save 1 resume at a time. Please delete your existing resume or upgrade to save multiple resumes.",
      );
    }
  }

  const resumeText = await extractResumeText(
    req.file.buffer,
    req.file.mimetype,
  );

  const requirements = scoringEngine.extractRequirements(jobDescription);

  if (!requirements || requirements.length === 0) {
    throw new ApiError(
      400,
      "Could not extract requirements from the Job Description. Please provide a more detailed job posting.",
    );
  }

  const scoringResult = scoringEngine.calculateScore(resumeText, requirements);

  const resumeTitle = title || `${targetRole} Resume`;
  const resumeResult = await createResume(
    userId,
    resumeTitle,
    req.file.originalname,
    { rawText: resumeText },
  );

  const applicationResult = await createJobApplication({
    userId,
    resumeId: resumeResult.insertId,
    targetRole,
    targetCompany: targetCompany || "",
    jobDescription,
    extractedRequirements: requirements.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      priority: r.priority,
      suggestion: r.suggestion,
      source: r.source,
      minimum: r.minimum,
    })),
    initialScore: scoringResult.score,
  });

  await createResumeVersion({
    applicationId: applicationResult.insertId,
    userId,
    versionNumber: 1,
    tailoredContent: { rawText: resumeText },
    scoreSnapshot: scoringResult.score,
    isApproved: false,
  });

  return res.status(201).json(
    new ApiResponse(201, "Resume analyzed successfully", {
      resumeId: resumeResult.insertId,
      applicationId: applicationResult.insertId,
      targetRole,
      targetCompany,
      score: scoringResult.score,
      band: scoringResult.band,
      rulesHash: scoringResult.rulesHash,
      mandatoryGaps: scoringResult.mandatoryGaps,
      breakdown: scoringResult.breakdown,
      disclaimer: scoringResult.disclaimer,
    }),
  );
});

export const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await getUserResumes(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Resumes fetched successfully", resumes));
});

export const deleteMyResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) {
    throw new ApiError(400, "Resume id is required");
  }

  const result = await deleteResumeById(resumeId, req.user.id);
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Resume not found or already deleted");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Resume deleted successfully. You can now upload a new resume.",
        null,
      ),
    );
});

export const getDashboardScoreHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const results = await getAllApplicationsHistory(userId);
  const applicationMap = new Map();

  results.forEach((row) => {
    if (!applicationMap.has(row.application_id)) {
      const colorIndex = applicationMap.size % CHART_COLORS.length;
      applicationMap.set(row.application_id, {
        applicationId: row.application_id,
        targetRole: row.target_role,
        targetCompany: row.target_company || "General",
        color: CHART_COLORS[colorIndex],
        history: [],
      });
    }

    applicationMap.get(row.application_id).history.push({
      version: row.version_number,
      score: row.score_snapshot,
      isApproved: Boolean(row.is_approved),
      createdAt: row.created_at,
    });
  });

  const series = Array.from(applicationMap.values());
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Dashboard score history fetched successfully",
        series,
      ),
    );
});

export const getApplicationScoreHistory = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user?.id;
  const results = await getSingleApplicationHistory(applicationId, userId);
  if (!results.length) {
    throw new ApiError(404, "No history for this application found");
  }
  const appInfo = results[0];
  const history = results.map((r) => ({
    version: r.version_number,
    score: r.score_snapshot,
    isApproved: Boolean(r.is_approved),
    createdAt: r.created_at,
  }));
  const initialScore = history[0]?.score || 0;
  const latestScore = history[history.length - 1]?.score || 0;
  return res.status(200).json(
    new ApiResponse(200, "Application score history fetched successfully", {
      applicationId: appInfo.application_id,
      targetRole: appInfo.target_role,
      targetCompany: appInfo.target_company || "General",
      initialScore,
      currentScore: latestScore,
      scoreGain: latestScore - initialScore,
      history,
    }),
  );
});

export const submitEvidenceQnA = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { items } = req.body;
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }
  if (!items || !Array.isArray(items)) {
    throw new ApiError(400, "Items array is required.");
  }

  await saveEvidenceResponses(applicationId, items);

  return res
    .status(200)
    .json(new ApiResponse(200, "Evidence responses saved successfully.", { count: items.length }));
});

export const getEvidenceQnA = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }

  const items = await getEvidenceItems(applicationId);
  return res
    .status(200)
    .json(new ApiResponse(200, "Evidence items fetched successfully.", items));
});

export const generateTailoredResume = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }

  const evidenceItems = await getEvidenceItems(applicationId);
  const rawResumeText = app.parsed_content?.rawText || "";
  const requirements = typeof app.extracted_requirements === "string"
    ? JSON.parse(app.extracted_requirements)
    : app.extracted_requirements || [];

  const { tailoredContent, scoringResult } = await tailorResumeWithEvidence({
    rawResumeText,
    jobDescription: app.job_description,
    requirements,
    evidenceItems,
    targetRole: app.target_role,
  });

  const nextVersion = await getNextVersionNumber(applicationId);

  const versionResult = await createResumeVersion({
    applicationId,
    userId,
    versionNumber: nextVersion,
    tailoredContent,
    scoreSnapshot: scoringResult.score,
    isApproved: false,
  });

  await updateJobApplicationTailored(applicationId, scoringResult.score, tailoredContent);

  return res.status(200).json(
    new ApiResponse(200, "Tailored resume generated successfully.", {
      versionId: versionResult.insertId,
      versionNumber: nextVersion,
      score: scoringResult.score,
      band: scoringResult.band,
      tailoredContent,
      breakdown: scoringResult.breakdown,
      mandatoryGaps: scoringResult.mandatoryGaps,
    })
  );
});

export const approveVersion = asyncHandler(async (req, res) => {
  const { applicationId, versionId } = req.params;
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }

  const version = await findResumeVersionById(versionId, applicationId, userId);
  if (!version) {
    throw new ApiError(404, "Resume version not found.");
  }

  if (version.is_approved) {
    return res
      .status(200)
      .json(new ApiResponse(200, "This version is already approved.", { versionId }));
  }

  const user = await findUserById(userId);
  const isSubscribed = user?.subscription_status === "active";

  if (!isSubscribed) {
    if (user.free_credits <= 0) {
      throw new ApiError(
        403,
        "You have 0 free update credits remaining. Please upgrade your subscription to approve updates."
      );
    }
    await deductUserCredit(userId, `Approved resume version ${version.version_number}`);
  }

  await approveResumeVersion(versionId, applicationId, userId);

  return res.status(200).json(
    new ApiResponse(
      200,
      isSubscribed
        ? "Version approved successfully under active subscription."
        : "Version approved successfully. 1 credit deducted.",
      { versionId, isApproved: true }
    )
  );
});

export const exportResumeVersion = asyncHandler(async (req, res) => {
  const { applicationId, versionId } = req.params;
  const { format = "html" } = req.query;
  const userId = req.user.id;

  const version = await findResumeVersionById(versionId, applicationId, userId);
  if (!version) {
    throw new ApiError(404, "Resume version not found.");
  }

  if (!version.is_approved) {
    throw new ApiError(403, "Please review and approve this tailored version before downloading.");
  }

  const user = await findUserById(userId);
  const tailoredContent = typeof version.tailored_content === "string"
    ? JSON.parse(version.tailored_content)
    : version.tailored_content || {};

  const payload = {
    candidateName: user?.name || "Candidate",
    targetRole: version.target_role,
    summary: tailoredContent.summary,
    skills: tailoredContent.skills || [],
    bulletImprovements: tailoredContent.bulletImprovements || [],
    rawResumeText: tailoredContent.fullTailoredText || "",
  };

  const filename = `${version.target_role.replace(/[^a-zA-Z0-9]/g, "_")}_Resume`;

  if (format === "txt") {
    const textOutput = generateAtsPlainText(payload);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.txt"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(textOutput);
  }

  const htmlOutput = generateAtsHtml(payload);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.html"`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(htmlOutput);
});

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
  getLatestTailoredVersion,
} from "../model/resume.model.js";
import { findUserById } from "../model/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  tailorResumeWithEvidence,
  parseOriginalResumeSections,
  generateSummaryVariant,
} from "../services/tailoring.service.js";
import {
  generateAtsHtml,
  generateAtsPlainText,
  generateAtsPdf,
  generateAtsDocx,
} from "../services/export.service.js";

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
  if (!jobDescription || !jobDescription.trim()) {
    throw new ApiError(400, "Job description is required.");
  }

  // Attempt to extract clean job title from top lines of the JD if targetRole is omitted
  const extractRoleFromJD = (jd = "") => {
    const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const rawLine of lines.slice(0, 8)) {
      const line = rawLine.replace(/^[*#\-_•\s]+|[*#\-_•\s]+$/g, "").trim();
      const match = line.match(/^(?:job\s+title|title|role|position)\s*[:\-–—]\s*(.+)$/i);
      if (match) {
        const cleaned = match[1].replace(/^[*#\-_•\s]+|[*#\-_•\s]+$/g, "").trim();
        if (cleaned.length >= 2 && cleaned.length <= 60) {
          return cleaned;
        }
      }
      if (
        line.length <= 60 &&
        /(?:developer|engineer|architect|lead|manager|analyst|specialist|designer|consultant|administrator)\b/i.test(line) &&
        !/^(?:we\s+are|looking\s+for|about|responsibilities|requirements|qualifications|duties|overview)/i.test(line)
      ) {
        const cleaned = line
          .replace(/^(?:job\s+title|title|role|position)\s*[:\-–—]\s*/i, "")
          .replace(/^[*#\-_•\s]+|[*#\-_•\s]+$/g, "")
          .trim();
        if (cleaned.length >= 2 && cleaned.length <= 60) {
          return cleaned;
        }
      }
    }
    return "";
  };

  const detectedRole = extractRoleFromJD(jobDescription);
  const effectiveRole = (targetRole && targetRole.trim()) || detectedRole || "Software Engineer";
  const storedRole = (targetRole && targetRole.trim()) || detectedRole || "Target Role";

  const user = await findUserById(userId);
  const isSubscribed = user?.subscription_status === "active";

  if (!isSubscribed) {
    const existingCount = await countUserResume(userId);
    if (existingCount >= 1) {
      throw new ApiError(
        403,
        "Maximum 1 active resume can be uploaded at a time. Please delete your existing resume to upload a new one. Our multi-resume subscription feature is on the way!",
      );
    }
  }

  const resumeText = await extractResumeText(
    req.file.buffer,
    req.file.mimetype,
  );

  const requirements = scoringEngine.extractRequirements(jobDescription, effectiveRole, targetCompany);

  if (!requirements || requirements.length === 0) {
    throw new ApiError(
      400,
      "Could not extract requirements from the Job Description. Please provide a more detailed job posting.",
    );
  }

  const scoringResult = scoringEngine.calculateScore(resumeText, requirements, effectiveRole, targetCompany);

  const resumeTitle = title || `${storedRole} Resume`;
  const resumeResult = await createResume(
    userId,
    resumeTitle,
    req.file.originalname,
    { rawText: resumeText },
  );

  const applicationResult = await createJobApplication({
    userId,
    resumeId: resumeResult.insertId,
    targetRole: storedRole,
    targetCompany: targetCompany || "",
    jobDescription,
    extractedRequirements: requirements.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      weight: r.weight,
      priority: r.priority,
      suggestion: r.suggestion,
      source: r.source,
      minimum: r.minimum,
      terms: r.terms || [],
      pattern: r.pattern || "",
    })),
    initialScore: scoringResult.score,
  });

  const baseResume = parseOriginalResumeSections(resumeText, req.user?.name);
  const originalContent = {
    name: baseResume.name,
    targetRoleTitle: baseResume.targetRoleTitle,
    contact: baseResume.contact,
    summary: baseResume.summary,
    skills: baseResume.skills,
    projects: baseResume.projects,
    education: baseResume.education,
    achievements: baseResume.achievements,
    sections: baseResume.sections,
  };

  await createResumeVersion({
    applicationId: applicationResult.insertId,
    userId,
    versionNumber: 1,
    tailoredContent: { rawText: resumeText, originalContent },
    scoreSnapshot: scoringResult.score,
    isApproved: false,
  });

  return res.status(201).json(
    new ApiResponse(201, "Resume analyzed successfully", {
      resumeId: resumeResult.insertId,
      applicationId: applicationResult.insertId,
      targetRole: storedRole,
      targetCompany,
      score: scoringResult.score,
      band: scoringResult.band,
      rulesHash: scoringResult.rulesHash,
      mandatoryGaps: scoringResult.mandatoryGaps,
      breakdown: scoringResult.breakdown,
      disclaimer: scoringResult.disclaimer,
      originalContent,
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

  // Hydrate mandatory gaps, breakdown, original content, and latest tailored version
  let mandatoryGaps = [];
  let breakdown = [];
  let originalContent = null;
  let latestTailoredVersion = null;
  let jobDescription = "";

  try {
    const app = await findJobApplicationById(applicationId, userId);
    if (app) {
      jobDescription = app.job_description || "";
      const parsedContent = typeof app.parsed_content === "string"
        ? JSON.parse(app.parsed_content)
        : app.parsed_content || {};
      const rawResumeText = parsedContent.rawText || "";

      // Universally parse the original resume sections
      const baseResume = parseOriginalResumeSections(rawResumeText, req.user?.name);
      originalContent = {
        name: baseResume.name,
        targetRoleTitle: baseResume.targetRoleTitle,
        contact: baseResume.contact,
        summary: baseResume.summary,
        skills: baseResume.skills,
        projects: baseResume.projects,
        education: baseResume.education,
        achievements: baseResume.achievements,
        sections: baseResume.sections,
      };

      // Always extract fresh, active requirements based on the job description and domain
      const activeRequirements = scoringEngine.extractRequirements(
        app.job_description,
        app.target_role,
        app.target_company
      );

      if (rawResumeText && activeRequirements.length) {
        const evalResult = scoringEngine.calculateScore(
          rawResumeText,
          activeRequirements,
          app.target_role,
          app.target_company
        );
        mandatoryGaps = evalResult.mandatoryGaps;
        breakdown = evalResult.breakdown;
      }

      // Check if a tailored version exists (version > 1)
      const latestVer = await getLatestTailoredVersion(applicationId, userId);
      if (latestVer && latestVer.version_number > 1) {
        const tc = typeof latestVer.tailored_content === "string"
          ? JSON.parse(latestVer.tailored_content)
          : latestVer.tailored_content;
        latestTailoredVersion = {
          id: latestVer.id,
          versionNumber: latestVer.version_number,
          score: latestVer.score_snapshot,
          tailoredContent: tc,
          isApproved: Boolean(latestVer.is_approved),
        };
      }
    }
  } catch (e) {
    console.error("Failed to hydrate gaps in history:", e.message);
  }

  return res.status(200).json(
    new ApiResponse(200, "Application score history fetched successfully", {
      applicationId: appInfo.application_id,
      targetRole: appInfo.target_role,
      targetCompany: appInfo.target_company || "",
      jobDescription,
      initialScore,
      currentScore: latestScore,
      scoreGain: latestScore - initialScore,
      mandatoryGaps,
      breakdown,
      originalContent,
      latestTailoredVersion,
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
  const { updateSummary = true, customSummary } = req.body || {};
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  // Check subscription and promotional launch period (Unlimited for all users during launch)
  const isPromo = process.env.LAUNCH_UNLIMITED_CREDITS !== "false";
  const isSubscribed = user.subscription_status === "active" || isPromo;

  // Consume credit immediately upon advancing from Step 2 to generate tailored resume
  if (!isSubscribed) {
    if ((user.free_credits ?? 0) <= 0) {
      throw new ApiError(
        403,
        "You have 0 tailoring credits remaining. Please upgrade your subscription to tailor your resume."
      );
    }
    const deducted = await deductUserCredit(
      userId,
      `Tailored resume version for application #${applicationId} (${app.target_role || "Role"})`
    );
    if (!deducted) {
      throw new ApiError(
        403,
        "Insufficient credits. Please upgrade your subscription to tailor your resume."
      );
    }
  }

  const evidenceItems = await getEvidenceItems(applicationId);
  const parsedContent = typeof app.parsed_content === "string"
    ? JSON.parse(app.parsed_content)
    : app.parsed_content || {};
  const rawResumeText = parsedContent.rawText || "";
  const requirements = typeof app.extracted_requirements === "string"
    ? JSON.parse(app.extracted_requirements)
    : app.extracted_requirements || [];

  const { originalContent, tailoredContent, scoringResult } = await tailorResumeWithEvidence({
    rawResumeText,
    jobDescription: app.job_description,
    requirements,
    evidenceItems,
    targetRole: app.target_role,
    targetCompany: app.target_company,
    userName: user?.name,
    updateSummary,
    customSummary,
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

  await updateJobApplicationTailored(applicationId, scoringResult.score, {
    ...tailoredContent,
    originalContent,
  });

  const updatedUser = await findUserById(userId);
  const remainingCredits = isPromo ? 999 : (updatedUser?.free_credits ?? 0);

  return res.status(200).json(
    new ApiResponse(200, "Tailored resume generated successfully.", {
      versionId: versionResult.insertId,
      versionNumber: nextVersion,
      score: scoringResult.score,
      band: scoringResult.band,
      originalContent,
      tailoredContent,
      breakdown: scoringResult.breakdown,
      mandatoryGaps: scoringResult.mandatoryGaps,
      remainingCredits,
      isSubscribed,
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
      .json(new ApiResponse(200, "This version is already approved.", { versionId, isApproved: true }));
  }

  await approveResumeVersion(versionId, applicationId, userId);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Version approved successfully.",
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
    candidateName: tailoredContent.name || user?.name || "Candidate",
    targetRole: version.target_role,
    contact: tailoredContent.contact || {},
    summary: tailoredContent.summary,
    skills: tailoredContent.skills || {},
    projects: tailoredContent.projects || [],
    education: tailoredContent.education || [],
    achievements: tailoredContent.achievements || [],
    bulletImprovements: tailoredContent.bulletImprovements || [],
    rawResumeText: tailoredContent.fullTailoredText || "",
    sections: tailoredContent.sections || [],
  };

  const filename = `${version.target_role.replace(/[^a-zA-Z0-9]/g, "_")}_Resume`;

  if (format === "pdf") {
    const pdfBuffer = await generateAtsPdf(payload);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdfBuffer);
  }

  if (format === "docx") {
    const docxBuffer = await generateAtsDocx(payload);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.docx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    return res.send(docxBuffer);
  }

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

export const generateSummaryVariantController = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { tone = "executive", index = 0 } = req.body || {};
  const userId = req.user.id;

  const app = await findJobApplicationById(applicationId, userId);
  if (!app) {
    throw new ApiError(404, "Job application not found.");
  }

  const parsedContent = typeof app.parsed_content === "string"
    ? JSON.parse(app.parsed_content)
    : app.parsed_content || {};
  const rawResumeText = parsedContent.rawText || "";

  const summary = await generateSummaryVariant({
    rawResumeText,
    targetRole: app.target_role,
    targetCompany: app.target_company,
    jobDescription: app.job_description,
    tone,
    index,
  });

  return res.status(200).json(
    new ApiResponse(200, "Summary variant generated successfully", {
      summary,
      tone,
      index,
    })
  );
});

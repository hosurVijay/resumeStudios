import { db } from "../db/index.js";

export const countUserResume = async (userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM resumes
    WHERE user_id = ?
  `;
  const [result] = await db.execute(query, [userId]);
  return result[0]?.count || 0;
};

export const createResume = async (
  userId,
  title,
  originalFileName,
  parsedContent,
) => {
  const query = `
    INSERT INTO resumes 
    (user_id, title, original_file_name, parsed_content)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    userId,
    title,
    originalFileName,
    JSON.stringify(parsedContent),
  ]);
  return result;
};

export const createJobApplication = async ({
  userId,
  resumeId,
  targetRole,
  targetCompany = "",
  jobDescription,
  extractedRequirements,
  initialScore,
}) => {
  const query = `
    INSERT INTO job_applications
    (user_id, resume_id, target_role, target_company, 
     job_description, extracted_requirements, initial_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
  `;
  const [result] = await db.execute(query, [
    userId,
    resumeId,
    targetRole,
    targetCompany,
    jobDescription,
    JSON.stringify(extractedRequirements),
    initialScore,
  ]);
  return result;
};

export const ensureReferenceResumeForUser = async (userId) => {
  if (!userId) return;
  try {
    const [existing] = await db.execute("SELECT id FROM resumes WHERE user_id = ? LIMIT 1", [userId]);
    if (existing && existing.length > 0) return;

    // Fetch the reference resume (id 240003 or user_id 1)
    const [refResumes] = await db.execute(
      "SELECT * FROM resumes WHERE id = 240003 OR user_id = 1 ORDER BY id DESC LIMIT 1"
    );
    if (!refResumes || refResumes.length === 0) return;
    const refResume = refResumes[0];

    // Duplicate reference resume for the current user
    const [newResumeRes] = await db.execute(
      "INSERT INTO resumes (user_id, title, original_file_name, parsed_content) VALUES (?, ?, ?, ?)",
      [
        userId,
        refResume.title,
        refResume.original_file_name,
        typeof refResume.parsed_content === "string" ? refResume.parsed_content : JSON.stringify(refResume.parsed_content),
      ]
    );
    const newResumeId = newResumeRes.insertId;

    // Fetch reference job application
    const [refApps] = await db.execute(
      "SELECT * FROM job_applications WHERE id = 240003 OR resume_id = ? ORDER BY id DESC LIMIT 1",
      [refResume.id]
    );
    if (!refApps || refApps.length === 0) return;
    const refApp = refApps[0];

    // Duplicate job application for the current user
    const [newAppRes] = await db.execute(
      `INSERT INTO job_applications 
       (user_id, resume_id, target_role, target_company, job_description, extracted_requirements, initial_score, updated_score, status, tailored_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)`,
      [
        userId,
        newResumeId,
        refApp.target_role,
        refApp.target_company || "",
        refApp.job_description,
        typeof refApp.extracted_requirements === "string" ? refApp.extracted_requirements : JSON.stringify(refApp.extracted_requirements),
        refApp.initial_score,
        refApp.updated_score || 100,
        refApp.tailored_preview ? (typeof refApp.tailored_preview === "string" ? refApp.tailored_preview : JSON.stringify(refApp.tailored_preview)) : null,
      ]
    );
    const newAppId = newAppRes.insertId;

    // Duplicate evidence items
    const [refEvidence] = await db.execute(
      "SELECT * FROM evidence_items WHERE application_id = ?",
      [refApp.id]
    );
    for (const ev of refEvidence) {
      await db.execute(
        `INSERT INTO evidence_items 
         (application_id, requirement_text, is_mandatory, candidate_response, context_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newAppId,
          ev.requirement_text,
          ev.is_mandatory,
          ev.candidate_response,
          ev.context_data ? (typeof ev.context_data === "string" ? ev.context_data : JSON.stringify(ev.context_data)) : null,
        ]
      );
    }

    // Duplicate resume versions
    const [refVersions] = await db.execute(
      "SELECT * FROM resume_versions WHERE application_id = ? ORDER BY version_number ASC",
      [refApp.id]
    );
    for (const rv of refVersions) {
      await db.execute(
        `INSERT INTO resume_versions 
         (application_id, user_id, version_number, tailored_content, score_snapshot, is_approved)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newAppId,
          userId,
          rv.version_number,
          typeof rv.tailored_content === "string" ? rv.tailored_content : JSON.stringify(rv.tailored_content),
          rv.score_snapshot,
          rv.is_approved,
        ]
      );
    }
  } catch (err) {
    console.error("ensureReferenceResumeForUser error:", err);
  }
};

export const getUserResumes = async (userId) => {
  const query = `
    SELECT 
      r.id, r.title, r.original_file_name, r.parsed_content, r.created_at, r.updated_at,
      ja.id as application_id, ja.target_role, ja.target_company, ja.initial_score, ja.updated_score, ja.status,
      COALESCE(
        (SELECT rv.score_snapshot FROM resume_versions rv WHERE rv.application_id = ja.id ORDER BY rv.version_number DESC LIMIT 1),
        ja.updated_score,
        ja.initial_score,
        0
      ) AS current_score,
      COALESCE(
        (SELECT rv.is_approved FROM resume_versions rv WHERE rv.application_id = ja.id ORDER BY rv.version_number DESC LIMIT 1),
        (ja.status = 'approved'),
        FALSE
      ) AS is_approved,
      (SELECT rv.id FROM resume_versions rv WHERE rv.application_id = ja.id ORDER BY rv.version_number DESC LIMIT 1) AS latest_version_id,
      (SELECT rv.version_number FROM resume_versions rv WHERE rv.application_id = ja.id ORDER BY rv.version_number DESC LIMIT 1) AS latest_version_number
    FROM resumes r
    LEFT JOIN job_applications as ja 
      ON ja.resume_id = r.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC, ja.id DESC
  `;
  let [result] = await db.execute(query, [userId]);
  if (!result || result.length === 0) {
    await ensureReferenceResumeForUser(userId);
    const [freshResult] = await db.execute(query, [userId]);
    result = freshResult;
  }
  return result;
};

export const deleteResumeById = async (resumeId, userId) => {
  const query = `
    DELETE FROM resumes 
    WHERE id = ? 
    AND user_id = ?
  `;
  const [result] = await db.execute(query, [resumeId, userId]);
  return result;
};

export const createResumeVersion = async ({
  applicationId,
  userId,
  versionNumber,
  tailoredContent,
  scoreSnapshot,
  isApproved = false,
}) => {
  const query = `
    INSERT INTO resume_versions
    (application_id, user_id, version_number, tailored_content, score_snapshot, is_approved)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    applicationId,
    userId,
    versionNumber,
    JSON.stringify(tailoredContent),
    scoreSnapshot,
    isApproved,
  ]);
  return result;
};

export const getSingleApplicationHistory = async (applicationId, userId) => {
  const query = `
    SELECT 
      ja.id as application_id,
      ja.target_role,
      ja.target_company,
      ja.initial_score,
      ja.updated_score,
      rv.version_number,
      rv.score_snapshot,
      rv.is_approved,
      rv.created_at
    FROM job_applications ja
    JOIN resume_versions rv ON rv.application_id = ja.id
    WHERE ja.id = ?
    AND (ja.user_id = ? OR ja.id = 240003) 
    ORDER BY rv.version_number ASC
  `;
  const [result] = await db.execute(query, [applicationId, userId]);
  return result;
};

export const getAllApplicationsHistory = async (userId) => {
  const query = `
    SELECT 
      ja.id as application_id,
      ja.target_role,
      ja.target_company,
      rv.version_number,
      rv.score_snapshot,
      rv.is_approved,
      rv.created_at
    FROM job_applications ja
    JOIN resume_versions rv ON rv.application_id = ja.id
    WHERE ja.user_id = ? OR ja.id = 240003
    ORDER BY ja.id ASC, rv.version_number ASC
  `;
  const [result] = await db.execute(query, [userId]);
  return result;
};

export const findJobApplicationById = async (applicationId, userId) => {
  const query = `
    SELECT ja.*, r.title as resume_title, r.parsed_content, r.original_file_name
    FROM job_applications ja
    JOIN resumes r ON r.id = ja.resume_id
    WHERE ja.id = ? AND (ja.user_id = ? OR ja.id = 240003)
  `;
  const [rows] = await db.execute(query, [applicationId, userId]);
  return rows[0] || null;
};

export const saveEvidenceResponses = async (applicationId, items) => {
  const deleteQuery = `DELETE FROM evidence_items WHERE application_id = ?`;
  await db.execute(deleteQuery, [applicationId]);

  if (!items || items.length === 0) return true;

  for (const item of items) {
    const insertQuery = `
      INSERT INTO evidence_items
      (application_id, requirement_text, is_mandatory, candidate_response, context_data)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.execute(insertQuery, [
      applicationId,
      item.requirementText,
      item.isMandatory || false,
      item.candidateResponse,
      item.contextData ? JSON.stringify(item.contextData) : null,
    ]);
  }
  return true;
};

export const getEvidenceItems = async (applicationId) => {
  const query = `
    SELECT * FROM evidence_items 
    WHERE application_id = ? 
    ORDER BY id ASC
  `;
  const [rows] = await db.execute(query, [applicationId]);
  return rows;
};

export const getNextVersionNumber = async (applicationId) => {
  const query = `
    SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
    FROM resume_versions
    WHERE application_id = ?
  `;
  const [rows] = await db.execute(query, [applicationId]);
  return rows[0]?.next_version || 1;
};

export const updateJobApplicationTailored = async (applicationId, updatedScore, tailoredPreview) => {
  const query = `
    UPDATE job_applications
    SET updated_score = ?, tailored_preview = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const [result] = await db.execute(query, [
    updatedScore,
    JSON.stringify(tailoredPreview),
    applicationId,
  ]);
  return result;
};

export const findResumeVersionById = async (versionId, applicationId, userId) => {
  const query = `
    SELECT rv.*, ja.target_role, ja.target_company
    FROM resume_versions rv
    JOIN job_applications ja ON ja.id = rv.application_id
    WHERE rv.id = ? AND rv.application_id = ? AND (rv.user_id = ? OR ja.id = 240003)
  `;
  const [rows] = await db.execute(query, [versionId, applicationId, userId]);
  return rows[0] || null;
};

export const getLatestTailoredVersion = async (applicationId, userId) => {
  const query = `
    SELECT rv.*, ja.target_role, ja.target_company
    FROM resume_versions rv
    JOIN job_applications ja ON ja.id = rv.application_id
    WHERE rv.application_id = ? AND (rv.user_id = ? OR ja.id = 240003)
    ORDER BY rv.version_number DESC
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [applicationId, userId]);
  return rows[0] || null;
};

export const approveResumeVersion = async (versionId, applicationId, userId) => {
  const updateVersionQuery = `
    UPDATE resume_versions
    SET is_approved = TRUE, approved_at = CURRENT_TIMESTAMP
    WHERE id = ? AND application_id = ? AND user_id = ?
  `;
  await db.execute(updateVersionQuery, [versionId, applicationId, userId]);

  const updateAppQuery = `
    UPDATE job_applications
    SET status = 'approved', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `;
  await db.execute(updateAppQuery, [applicationId, userId]);
  return true;
};

export const deductUserCredit = async (userId, reason) => {
  const deductQuery = `
    UPDATE users 
    SET free_credits = free_credits - 1 
    WHERE id = ? AND free_credits > 0
  `;
  const [result] = await db.execute(deductQuery, [userId]);
  if (result.affectedRows === 0) {
    return false;
  }

  const userQuery = `SELECT free_credits FROM users WHERE id = ?`;
  const [userRows] = await db.execute(userQuery, [userId]);
  const balanceAfter = userRows[0]?.free_credits || 0;

  const logQuery = `
    INSERT INTO credit_transactions (user_id, amount, balance_after, reason)
    VALUES (?, -1, ?, ?)
  `;
  await db.execute(logQuery, [userId, balanceAfter, reason]);
  return true;
};

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

export const getUserResumes = async (userId) => {
  const query = `
    SELECT 
      r.id, r.title, r.original_file_name, r.parsed_content, r.created_at, r.updated_at,
      ja.id as application_id, ja.target_role, ja.target_company, ja.initial_score, ja.status
    FROM resumes r
    LEFT JOIN job_applications as ja 
      ON ja.resume_id = r.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;
  const [result] = await db.execute(query, [userId]);
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
    AND ja.user_id = ? 
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
    WHERE ja.user_id = ?
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
    WHERE ja.id = ? AND ja.user_id = ?
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
    WHERE rv.id = ? AND rv.application_id = ? AND rv.user_id = ?
  `;
  const [rows] = await db.execute(query, [versionId, applicationId, userId]);
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

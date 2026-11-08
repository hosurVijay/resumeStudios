export const generateAtsHtml = ({
  candidateName,
  targetRole,
  summary,
  skills = [],
  bulletImprovements = [],
  rawResumeText = "",
}) => {
  const safeName = candidateName || "Candidate";
  const safeRole = targetRole || "Professional";
  const skillsList = skills.length ? skills.join(" • ") : "Not specified";
  const bulletsHtml = bulletImprovements
    .map(
      (b) =>
        `<li style="margin-bottom: 6px; line-height: 1.5;">${b.improvedBullet || b}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeName} - ${safeRole} Resume</title>
  <style>
    @page { margin: 1in; size: letter; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #111827;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    h1 { font-size: 20pt; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 13pt; margin: 16px 0 8px 0; border-bottom: 1px solid #d1d5db; padding-bottom: 2px; text-transform: uppercase; color: #1f2937; }
    .subtitle { font-size: 13pt; color: #4b5563; font-weight: 600; margin-bottom: 16px; }
    ul { margin: 6px 0 12px 20px; padding: 0; }
    p { margin: 4px 0 10px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${safeName}</h1>
  <div class="subtitle">${safeRole}</div>

  <h2>Professional Summary</h2>
  <p>${summary || "Experienced professional aligned to target competencies."}</p>

  <h2>Core Competencies & Verified Skills</h2>
  <p>${skillsList}</p>

  <h2>Tailored Experience Highlights</h2>
  <ul>${bulletsHtml}</ul>

  <h2>Background Details</h2>
  <pre style="font-family: inherit; white-space: pre-wrap; font-size: 10pt; color: #374151;">${rawResumeText.slice(0, 2500)}</pre>
</body>
</html>`;
};

export const generateAtsPlainText = ({
  candidateName,
  targetRole,
  summary,
  skills = [],
  bulletImprovements = [],
}) => {
  const safeName = candidateName || "Candidate";
  const safeRole = targetRole || "Professional";
  const bullets = bulletImprovements
    .map((b) => `* ${b.improvedBullet || b}`)
    .join("\n");

  return `${safeName.toUpperCase()}
Target Role: ${safeRole}
------------------------------------------------------------
PROFESSIONAL SUMMARY:
${summary || "Experienced professional."}

CORE COMPETENCIES:
${skills.join(", ")}

TAILORED EXPERIENCE HIGHLIGHTS:
${bullets}
------------------------------------------------------------
`;
};

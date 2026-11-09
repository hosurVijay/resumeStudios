import PDFDocument from "pdfkit";

export const generateAtsHtml = ({
  candidateName,
  targetRole,
  contact = {},
  summary = "",
  skills = {},
  projects = [],
  education = [],
  achievements = [],
  bulletImprovements = [],
  rawResumeText = "",
}) => {
  const safeName = candidateName || "Candidate";
  const safeRole = targetRole || "Software Engineer";

  const contactItems = [];
  if (contact.email) contactItems.push(`<a href="mailto:${contact.email}" style="color: inherit; text-decoration: none;">${contact.email}</a>`);
  if (contact.phone) contactItems.push(`<span>${contact.phone}</span>`);
  if (contact.linkedin) contactItems.push(`<a href="https://${contact.linkedin.replace(/^https?:\/\//, '')}" target="_blank" style="color: inherit; text-decoration: none;">${contact.linkedin}</a>`);
  if (contact.github) contactItems.push(`<a href="https://${contact.github.replace(/^https?:\/\//, '')}" target="_blank" style="color: inherit; text-decoration: none;">${contact.github}</a>`);
  if (contact.location) contactItems.push(`<span>${contact.location}</span>`);
  const contactHtml = contactItems.join(" • ");

  let skillsHtml = "";
  if (Array.isArray(skills)) {
    skillsHtml = `<p style="margin: 0; font-size: 10pt; line-height: 1.5; color: #334155;">${skills.join(" • ")}</p>`;
  } else if (typeof skills === "object" && skills !== null) {
    skillsHtml = Object.entries(skills)
      .map(([cat, list]) => {
        const items = Array.isArray(list) ? list.join(", ") : list;
        return `<div style="margin-bottom: 4px; font-size: 9.5pt;"><strong style="color: #0f172a;">${cat}:</strong> <span style="color: #334155;">${items}</span></div>`;
      })
      .join("");
  }

  let projectsHtml = "";
  if (projects && projects.length) {
    projectsHtml = projects
      .map((p) => {
        const bullets = (p.bullets || [])
          .map((b) => `<li style="margin-bottom: 4px; line-height: 1.45;">${b}</li>`)
          .join("");
        return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700; font-size: 10.5pt; color: #0f172a;">${p.name}${p.role ? ` — <span style="font-weight: 600; color: #475569;">${p.role}</span>` : ""}</span>
        </div>
        ${p.techStack ? `<div style="font-size: 9pt; color: #475569; font-style: italic; margin-bottom: 4px;">Tech Stack: ${p.techStack}</div>` : ""}
        <ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">
          ${bullets}
        </ul>
      </div>
    `;
      })
      .join("");
  } else if (bulletImprovements && bulletImprovements.length) {
    const bullets = bulletImprovements
      .map((b) => `<li style="margin-bottom: 4px; line-height: 1.45;">${b.improvedBullet || b}</li>`)
      .join("");
    projectsHtml = `<ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">${bullets}</ul>`;
  }

  const educationHtml = (education || [])
    .map(
      (e) => `
    <div style="margin-bottom: 8px;">
      <div style="font-weight: 700; font-size: 10pt; color: #0f172a;">${e.degree || ""}</div>
      <div style="font-size: 9pt; color: #334155;">${e.institution || ""}${e.details ? ` — <span style="color: #64748b;">${e.details}</span>` : ""}</div>
    </div>
  `
    )
    .join("");

  const achievementsHtml = (achievements || [])
    .map((a) => `<li style="margin-bottom: 4px; font-size: 9.5pt; color: #1e293b; line-height: 1.4;">${a}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} - Resume</title>
  <style>
    @page { margin: 0.5in 0.6in; size: letter; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      margin: 0 auto;
      max-width: 800px;
      padding: 32px;
    }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
    .name { font-size: 20pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0; color: #0f172a; }
    .role-title { font-size: 11pt; font-weight: 600; color: #2563eb; margin: 0 0 6px 0; }
    .contact-line { font-size: 9pt; color: #475569; }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 2px;
      margin: 14px 0 8px 0;
    }
    p { margin: 0 0 6px 0; }
    @media print {
      body { padding: 0; max-width: 100%; }
      .header { border-bottom-color: #000000; }
      .section-title { border-bottom-color: #333333; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name">${safeName}</h1>
    <div class="role-title">${safeRole}</div>
    ${contactHtml ? `<div class="contact-line">${contactHtml}</div>` : ""}
  </div>

  ${summary ? `
  <div class="section-title">Professional Summary</div>
  <p style="font-size: 9.5pt; text-align: justify; color: #334155; line-height: 1.5;">${summary}</p>
  ` : ""}

  ${skillsHtml ? `
  <div class="section-title">Technical Skills</div>
  ${skillsHtml}
  ` : ""}

  ${projectsHtml ? `
  <div class="section-title">Projects & Experience</div>
  ${projectsHtml}
  ` : ""}

  ${educationHtml ? `
  <div class="section-title">Education</div>
  ${educationHtml}
  ` : ""}

  ${achievementsHtml ? `
  <div class="section-title">Achievements & Awards</div>
  <ul style="margin: 4px 0 0 18px; padding: 0;">${achievementsHtml}</ul>
  ` : ""}
</body>
</html>`;
};

export const generateAtsPlainText = ({
  candidateName,
  targetRole,
  contact = {},
  summary = "",
  skills = {},
  projects = [],
  education = [],
  achievements = [],
  bulletImprovements = [],
}) => {
  const safeName = candidateName || "Candidate";
  const safeRole = targetRole || "Professional";

  const contactParts = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.linkedin) contactParts.push(contact.linkedin);
  if (contact.github) contactParts.push(contact.github);
  if (contact.location) contactParts.push(contact.location);

  let skillsText = "";
  if (Array.isArray(skills)) {
    skillsText = skills.join(", ");
  } else if (typeof skills === "object" && skills !== null) {
    skillsText = Object.entries(skills)
      .map(([cat, list]) => `${cat}: ${Array.isArray(list) ? list.join(", ") : list}`)
      .join("\n");
  }

  let projectsText = "";
  if (projects && projects.length) {
    projectsText = projects
      .map((p) => {
        const bText = (p.bullets || []).map((b) => `  * ${b}`).join("\n");
        return `${p.name}${p.role ? ` (${p.role})` : ""}\nTech Stack: ${p.techStack || ""}\n${bText}`;
      })
      .join("\n\n");
  } else if (bulletImprovements && bulletImprovements.length) {
    projectsText = bulletImprovements.map((b) => `* ${b.improvedBullet || b}`).join("\n");
  }

  const educationText = (education || [])
    .map((e) => `${e.degree || ""}\n${e.institution || ""} ${e.details || ""}`)
    .join("\n\n");

  const achievementsText = (achievements || []).map((a) => `* ${a}`).join("\n");

  return `${safeName.toUpperCase()}
${safeRole}
${contactParts.join(" | ")}
============================================================

PROFESSIONAL SUMMARY:
${summary || "Experienced professional aligned to target competencies."}

TECHNICAL SKILLS:
${skillsText}

PROJECTS & EXPERIENCE:
${projectsText}

EDUCATION:
${educationText}

ACHIEVEMENTS & AWARDS:
${achievementsText}
============================================================
`;
};

export const generateAtsPdf = ({
  candidateName,
  targetRole,
  contact = {},
  summary = "",
  skills = {},
  projects = [],
  education = [],
  achievements = [],
  bulletImprovements = [],
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const safeName = (candidateName || "Candidate").toUpperCase();
      const safeRole = targetRole || "Software Engineer";

      // Header - Name
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0f172a").text(safeName, { align: "center" });
      doc.moveDown(0.2);

      // Target Role
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#2563eb").text(safeRole, { align: "center" });
      doc.moveDown(0.2);

      // Contact info
      const contactParts = [];
      if (contact.email) contactParts.push(contact.email);
      if (contact.phone) contactParts.push(contact.phone);
      if (contact.linkedin) contactParts.push(contact.linkedin.replace(/^https?:\/\//, ""));
      if (contact.github) contactParts.push(contact.github.replace(/^https?:\/\//, ""));
      if (contact.location) contactParts.push(contact.location);

      if (contactParts.length) {
        doc.font("Helvetica").fontSize(9).fillColor("#475569").text(contactParts.join("  •  "), { align: "center" });
      }
      doc.moveDown(0.4);

      // Horizontal line under header
      const headerLineY = doc.y;
      doc.strokeColor("#94a3b8").lineWidth(1).moveTo(40, headerLineY).lineTo(doc.page.width - 40, headerLineY).stroke();
      doc.moveDown(0.4);

      const renderSectionHeader = (title) => {
        doc.moveDown(0.4);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#0f172a").text(title.toUpperCase());
        const lineY = doc.y + 1;
        doc.strokeColor("#cbd5e1").lineWidth(0.8).moveTo(40, lineY).lineTo(doc.page.width - 40, lineY).stroke();
        doc.moveDown(0.35);
      };

      // Professional Summary
      if (summary) {
        renderSectionHeader("Professional Summary");
        doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(summary, {
          align: "justify",
          lineGap: 2,
        });
      }

      // Technical Skills
      const hasSkills = skills && (Array.isArray(skills) ? skills.length : Object.keys(skills).length > 0);
      if (hasSkills) {
        renderSectionHeader("Technical Skills");
        if (Array.isArray(skills)) {
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(skills.join("  •  "), { lineGap: 2 });
        } else if (typeof skills === "object") {
          Object.entries(skills).forEach(([cat, list]) => {
            const items = Array.isArray(list) ? list.join(", ") : list;
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(`${cat}: `, {
              continued: true,
            });
            doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(items, { lineGap: 2 });
          });
        }
      }

      // Projects & Experience
      if (projects && projects.length) {
        renderSectionHeader("Projects & Experience");
        projects.forEach((p) => {
          doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(p.name, { continued: !!p.role });
          if (p.role) {
            doc.font("Helvetica").fontSize(9.5).fillColor("#64748b").text(` — ${p.role}`);
          }
          if (p.techStack) {
            doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#475569").text(`Tech Stack: ${p.techStack}`);
          }
          doc.moveDown(0.15);
          (p.bullets || []).forEach((b) => {
            doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${b}`, {
              indent: 10,
              lineGap: 1.5,
            });
          });
          doc.moveDown(0.3);
        });
      } else if (bulletImprovements && bulletImprovements.length) {
        renderSectionHeader("Projects & Experience");
        bulletImprovements.forEach((b) => {
          doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${b.improvedBullet || b}`, {
            indent: 10,
            lineGap: 1.5,
          });
        });
      }

      // Education
      if (education && education.length) {
        renderSectionHeader("Education");
        education.forEach((e) => {
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(e.degree || "");
          let instText = e.institution || "";
          if (e.details) instText += ` — ${e.details}`;
          doc.font("Helvetica").fontSize(9).fillColor("#475569").text(instText);
          doc.moveDown(0.2);
        });
      }

      // Achievements
      if (achievements && achievements.length) {
        renderSectionHeader("Achievements & Awards");
        achievements.forEach((a) => {
          doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`★  ${a}`, {
            indent: 10,
            lineGap: 1.5,
          });
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

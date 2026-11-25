import PDFDocument from "pdfkit";
import JSZip from "jszip";

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
  sections = [],
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

  // If authentic dynamic sections are provided, render them exactly as structured
  let bodyContentHtml = "";
  if (Array.isArray(sections) && sections.length > 0) {
    bodyContentHtml = sections
      .map((sec) => {
        if (!sec || !sec.title) return "";

        if (sec.type === "summary") {
          const text = sec.text || sec.rawContent || "";
          if (!text) return "";
          return `
            <div class="section-title">${sec.title}</div>
            <p style="font-size: 9.5pt; text-align: justify; color: #334155; line-height: 1.5;">${text}</p>
          `;
        }

        if (sec.type === "impact") {
          const bullets = (sec.bullets || [])
            .map((b) => `<li style="margin-bottom: 4px; line-height: 1.45;">${b}</li>`)
            .join("");
          if (!bullets) return "";
          return `
            <div class="section-title">${sec.title}</div>
            <ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">
              ${bullets}
            </ul>
          `;
        }

        if (sec.type === "expertise") {
          const items = (sec.items || []).join(" • ");
          if (!items) return "";
          return `
            <div class="section-title">${sec.title}</div>
            <p style="margin: 0; font-size: 9.5pt; line-height: 1.5; color: #334155;">${items}</p>
          `;
        }

        if (sec.type === "toolkit") {
          const categories = sec.categories || {};
          const catEntries = Object.entries(categories);
          if (!catEntries.length) return "";
          const catsHtml = catEntries
            .map(([cat, list]) => {
              const items = Array.isArray(list) ? list.join(", ") : list;
              return `<div style="margin-bottom: 4px; font-size: 9.5pt;"><strong style="color: #0f172a;">${cat}:</strong> <span style="color: #334155;">${items}</span></div>`;
            })
            .join("");
          return `
            <div class="section-title">${sec.title}</div>
            ${catsHtml}
          `;
        }

        if (sec.type === "skills") {
          const items = Array.isArray(sec.items) ? sec.items.join(" • ") : (sec.rawContent || "");
          if (!items) return "";
          return `
            <div class="section-title">${sec.title}</div>
            <p style="margin: 0; font-size: 10pt; line-height: 1.5; color: #334155;">${items}</p>
          `;
        }

        if (sec.type === "experience") {
          const projList = sec.projects || [];
          if (!projList.length) return "";
          const projsHtml = projList
            .map((p) => {
              const bullets = (p.bullets || [])
                .filter(Boolean)
                .map((b) => {
                  const str = typeof b === "string" ? b : b?.improvedBullet || "";
                  return str ? `<li style="margin-bottom: 4px; line-height: 1.45;">${str}</li>` : "";
                })
                .filter(Boolean)
                .join("");
              return `
                <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <span style="font-weight: 700; font-size: 10.5pt; color: #0f172a;">${p.name || "Project"}${p.role ? ` — <span style="font-weight: 600; color: #475569;">${p.role}</span>` : ""}</span>
                    ${p.period ? `<span style="font-size: 9pt; color: #64748b;">${p.period}</span>` : ""}
                  </div>
                  ${p.techStack ? `<div style="font-size: 9pt; color: #475569; font-style: italic; margin-bottom: 4px;">Tech Stack: ${p.techStack}</div>` : ""}
                  <ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">
                    ${bullets}
                  </ul>
                </div>
              `;
            })
            .join("");
          return `
            <div class="section-title">${sec.title}</div>
            ${projsHtml}
          `;
        }

        if (sec.type === "education") {
          const items = sec.items || [];
          if (!items.length) return "";
          const eduHtml = items
            .map((e) => {
              if (typeof e === "string") {
                return `<div style="margin-bottom: 6px; font-size: 9.5pt; color: #334155;">${e}</div>`;
              }
              return `
                <div style="margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <span style="font-weight: 700; font-size: 10pt; color: #0f172a;">${e.degree || ""}</span>
                    ${e.period ? `<span style="font-size: 9pt; color: #64748b;">${e.period}</span>` : ""}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 9pt; color: #334155;">
                    <span>${e.institution || ""}${e.location ? ` — ${e.location}` : ""}</span>
                    ${e.details ? `<span style="color: #64748b; font-weight: 500;">${e.details}</span>` : ""}
                  </div>
                </div>
              `;
            })
            .join("");
          return `
            <div class="section-title">${sec.title}</div>
            ${eduHtml}
          `;
        }

        if (sec.type === "recognition") {
          const bullets = (sec.bullets || [])
            .map((a) => `<li style="margin-bottom: 4px; font-size: 9.5pt; color: #1e293b; line-height: 1.4;">${a}</li>`)
            .join("");
          if (!bullets) return "";
          return `
            <div class="section-title">${sec.title}</div>
            <ul style="margin: 4px 0 0 18px; padding: 0;">${bullets}</ul>
          `;
        }

        // Custom / fallback section
        if (sec.rawLines && sec.rawLines.length) {
          const lines = sec.rawLines.map((l) => `<li style="margin-bottom: 4px;">${l}</li>`).join("");
          return `
            <div class="section-title">${sec.title}</div>
            <ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">${lines}</ul>
          `;
        }
        if (sec.rawContent) {
          return `
            <div class="section-title">${sec.title}</div>
            <p style="font-size: 9.5pt; color: #334155; line-height: 1.5;">${sec.rawContent}</p>
          `;
        }
        return "";
      })
      .join("");
  } else {
    // Legacy fallback rendering
    let skillsHtml = "";
    if (Array.isArray(skills) && skills.length > 0) {
      skillsHtml = `<p style="margin: 0; font-size: 10pt; line-height: 1.5; color: #334155;">${skills.join(" • ")}</p>`;
    } else if (typeof skills === "object" && skills !== null && Object.keys(skills).length > 0) {
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
        .filter(Boolean)
        .map((p) => {
          const bullets = (p.bullets || [])
            .filter(Boolean)
            .map((b) => {
              const str = typeof b === "string" ? b : b?.improvedBullet || "";
              return str ? `<li style="margin-bottom: 4px; line-height: 1.45;">${str}</li>` : "";
            })
            .filter(Boolean)
            .join("");
          return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-weight: 700; font-size: 10.5pt; color: #0f172a;">${p.name || "Project"}${p.role ? ` — <span style="font-weight: 600; color: #475569;">${p.role}</span>` : ""}</span>
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
        .filter(Boolean)
        .map((b) => {
          const str = typeof b === "string" ? b : b?.improvedBullet || "";
          return str ? `<li style="margin-bottom: 4px; line-height: 1.45;">${str}</li>` : "";
        })
        .filter(Boolean)
        .join("");
      projectsHtml = `<ul style="margin: 4px 0 6px 18px; padding: 0; font-size: 9.5pt; color: #1e293b;">${bullets}</ul>`;
    }

    const educationHtml = (education || [])
      .map((e) => {
        if (typeof e === "string") {
          return `<div style="margin-bottom: 6px; font-size: 9.5pt; color: #334155;">${e}</div>`;
        }
        return `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: 700; font-size: 10pt; color: #0f172a;">${e.degree || ""}</span>
              ${(e.period || e.year) ? `<span style="font-size: 9pt; color: #64748b;">${e.period || e.year}</span>` : ""}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 9pt; color: #334155;">
              <span>${e.institution || ""}${e.location ? ` — ${e.location}` : ""}</span>
              ${e.details ? `<span style="color: #64748b; font-weight: 500;">${e.details}</span>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    const achievementsHtml = (achievements || [])
      .map((a) => `<li style="margin-bottom: 4px; font-size: 9.5pt; color: #1e293b; line-height: 1.4;">${a}</li>`)
      .join("");

    bodyContentHtml = `
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
    `;
  }

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
    ${contactHtml ? `<div class="contact-line">${contactHtml}</div>` : ""}
  </div>

  ${bodyContentHtml}
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
  sections = [],
}) => {
  const safeName = candidateName || "Candidate";
  const safeRole = targetRole || "Professional";

  const contactParts = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.linkedin) contactParts.push(contact.linkedin);
  if (contact.github) contactParts.push(contact.github);
  if (contact.location) contactParts.push(contact.location);

  let bodyText = "";

  if (Array.isArray(sections) && sections.length > 0) {
    bodyText = sections
      .map((sec) => {
        if (!sec || !sec.title) return "";
        let contentStr = "";
        if (sec.type === "summary") {
          contentStr = sec.text || sec.rawContent || "";
        } else if (sec.type === "impact") {
          contentStr = (sec.bullets || []).map((b) => `* ${b}`).join("\n");
        } else if (sec.type === "expertise") {
          contentStr = (sec.items || []).join(", ");
        } else if (sec.type === "toolkit") {
          contentStr = Object.entries(sec.categories || {})
            .map(([cat, list]) => `${cat}: ${Array.isArray(list) ? list.join(", ") : list}`)
            .join("\n");
        } else if (sec.type === "skills") {
          contentStr = Array.isArray(sec.items) ? sec.items.join(", ") : (sec.rawContent || "");
        } else if (sec.type === "experience") {
          contentStr = (sec.projects || [])
            .map((p) => {
              const bText = (p.bullets || []).map((b) => `  * ${typeof b === "string" ? b : (b?.improvedBullet || "")}`).join("\n");
              return `${p.name}${p.role ? ` (${p.role})` : ""}${p.period ? ` [${p.period}]` : ""}\n${p.techStack ? `Tech Stack: ${p.techStack}\n` : ""}${bText}`;
            })
            .join("\n\n");
        } else if (sec.type === "education") {
          contentStr = (sec.items || [])
            .map((e) => {
              if (typeof e === "string") return e;
              let s = e.degree || "";
              if (e.period) s += ` [${e.period}]`;
              if (e.institution) s += `\n${e.institution}`;
              if (e.location) s += ` — ${e.location}`;
              if (e.details) s += ` (${e.details})`;
              return s;
            })
            .join("\n\n");
        } else if (sec.type === "recognition") {
          contentStr = (sec.bullets || []).map((a) => `* ${a}`).join("\n");
        } else {
          contentStr = sec.rawLines ? sec.rawLines.map((l) => `* ${l}`).join("\n") : (sec.rawContent || "");
        }
        return `${sec.title.toUpperCase()}:\n${contentStr}`;
      })
      .filter(Boolean)
      .join("\n\n");
  } else {
    let skillsText = "";
    if (Array.isArray(skills) && skills.length > 0) {
      skillsText = skills.join(", ");
    } else if (typeof skills === "object" && skills !== null && Object.keys(skills).length > 0) {
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
      .map((e) => {
        if (typeof e === "string") return e;
        let s = e.degree || "";
        if (e.period || e.year) s += ` [${e.period || e.year}]`;
        if (e.institution) s += `\n${e.institution}`;
        if (e.location) s += ` — ${e.location}`;
        if (e.details) s += ` (${e.details})`;
        return s;
      })
      .join("\n\n");

    const achievementsText = (achievements || []).map((a) => `* ${a}`).join("\n");

    const parts = [];
    if (summary) {
      parts.push(`PROFESSIONAL SUMMARY:\n${summary}`);
    }
    if (skillsText) {
      parts.push(`TECHNICAL SKILLS:\n${skillsText}`);
    }
    if (projectsText) {
      parts.push(`PROJECTS & EXPERIENCE:\n${projectsText}`);
    }
    if (educationText) {
      parts.push(`EDUCATION:\n${educationText}`);
    }
    if (achievementsText) {
      parts.push(`ACHIEVEMENTS & AWARDS:\n${achievementsText}`);
    }
    bodyText = parts.join("\n\n");
  }

  return `${safeName.toUpperCase()}
${contactParts.join(" | ")}
============================================================

${bodyText}
============================================================
`;
};

export const generateAtsDocx = async ({
  candidateName,
  targetRole,
  contact = {},
  summary = "",
  skills = {},
  projects = [],
  education = [],
  achievements = [],
  bulletImprovements = [],
  sections = [],
}) => {
  const safeName = (candidateName || "Candidate").toUpperCase();
  const safeRole = targetRole || "Software Engineer";

  const contactParts = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.linkedin) contactParts.push(contact.linkedin.replace(/^https?:\/\//, ""));
  if (contact.github) contactParts.push(contact.github.replace(/^https?:\/\//, ""));
  if (contact.location) contactParts.push(contact.location);

  const escapeXml = (unsafe = "") => {
    return String(unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const makeParagraph = (runs = [], options = {}) => {
    const { align = "left", before = 0, after = 100, borderBottom = null, indent = null } = options;
    let pPr = `<w:pPr>`;
    if (align && align !== "left") {
      pPr += `<w:jc w:val="${align}"/>`;
    }
    pPr += `<w:spacing w:before="${before}" w:after="${after}" w:line="260" w:lineRule="auto"/>`;
    if (indent) {
      pPr += `<w:ind w:left="${indent.left || 360}" w:hanging="${indent.hanging || 240}"/>`;
    }
    if (borderBottom) {
      pPr += `<w:pBdr><w:bottom w:val="single" w:sz="${borderBottom.sz || 8}" w:space="${borderBottom.space || 4}" w:color="${borderBottom.color || "0F4C3A"}"/></w:pBdr>`;
    }
    pPr += `</w:pPr>`;

    const runsXml = runs
      .map((r) => {
        if (typeof r === "string") {
          return `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">${escapeXml(r)}</w:t></w:r>`;
        }
        const { text = "", bold = false, italic = false, size = 21, color = "1E293B", font = "Calibri" } = r;
        return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>${bold ? "<w:b/>" : ""}${italic ? "<w:i/>" : ""}<w:sz w:val="${size}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
      })
      .join("");

    return `<w:p>${pPr}${runsXml}</w:p>`;
  };

  const makeSectionHeader = (title) => {
    return makeParagraph(
      [{ text: title.toUpperCase(), bold: true, size: 23, color: "0F4C3A" }],
      { before: 240, after: 80, borderBottom: { sz: 12, space: 4, color: "0F4C3A" } }
    );
  };

  const makeBulletPoint = (text) => {
    return makeParagraph(
      [
        { text: "• ", bold: true, size: 20, color: "0F4C3A" },
        { text: text, size: 20, color: "1E293B" }
      ],
      { indent: { left: 480, hanging: 240 }, after: 60 }
    );
  };

  const bodyParts = [];

  // Header - Name
  bodyParts.push(makeParagraph([{ text: safeName, bold: true, size: 36, color: "0F172A" }], { align: "center", after: 40 }));

  // Contact info
  if (contactParts.length) {
    bodyParts.push(
      makeParagraph(
        [{ text: contactParts.join("  •  "), size: 18, color: "64748B" }],
        { align: "center", after: 140, borderBottom: { sz: 6, space: 6, color: "CBD5E1" } }
      )
    );
  }

  // Dynamic Sections
  if (Array.isArray(sections) && sections.length > 0) {
    sections.forEach((sec) => {
      if (!sec || !sec.title) return;
      bodyParts.push(makeSectionHeader(sec.title));

      if (sec.type === "summary") {
        const text = sec.text || sec.rawContent || "";
        if (text) {
          bodyParts.push(makeParagraph([{ text, size: 21, color: "334155" }], { after: 120 }));
        }
      } else if (sec.type === "impact") {
        (sec.bullets || []).filter(Boolean).forEach((b) => {
          bodyParts.push(makeBulletPoint(b));
        });
      } else if (sec.type === "expertise") {
        const items = (sec.items || []).join("  •  ");
        if (items) {
          bodyParts.push(makeParagraph([{ text: items, size: 21, color: "334155" }], { after: 100 }));
        }
      } else if (sec.type === "toolkit") {
        const categories = sec.categories || {};
        Object.entries(categories).forEach(([cat, list]) => {
          const items = Array.isArray(list) ? list.join(", ") : list;
          bodyParts.push(
            makeParagraph(
              [
                { text: `${cat}: `, bold: true, size: 21, color: "0F172A" },
                { text: items, size: 21, color: "334155" }
              ],
              { after: 60 }
            )
          );
        });
      } else if (sec.type === "skills") {
        const items = Array.isArray(sec.items) ? sec.items.join("  •  ") : (sec.rawContent || "");
        if (items) {
          bodyParts.push(makeParagraph([{ text: items, size: 21, color: "334155" }], { after: 100 }));
        }
      } else if (sec.type === "experience") {
        const projList = sec.projects || [];
        projList.forEach((p) => {
          const headerRuns = [{ text: p.name || "Project", bold: true, size: 22, color: "0F172A" }];
          if (p.role) headerRuns.push({ text: ` — ${p.role}`, italic: true, size: 21, color: "475569" });
          if (p.period) headerRuns.push({ text: ` (${p.period})`, size: 19, color: "64748B" });
          bodyParts.push(makeParagraph(headerRuns, { after: 40 }));

          if (p.techStack) {
            bodyParts.push(makeParagraph([{ text: `Tech Stack: ${p.techStack}`, italic: true, size: 19, color: "475569" }], { after: 40 }));
          }

          (p.bullets || []).filter(Boolean).forEach((b) => {
            const str = typeof b === "string" ? b : b?.improvedBullet || "";
            if (str) bodyParts.push(makeBulletPoint(str));
          });
        });
      } else if (sec.type === "education") {
        const items = sec.items || [];
        items.forEach((e) => {
          if (typeof e === "string") {
            bodyParts.push(makeParagraph([{ text: e, size: 21, color: "334155" }], { after: 60 }));
          } else {
            const eduRuns = [{ text: e.degree || "", bold: true, size: 21, color: "0F172A" }];
            if (e.period) eduRuns.push({ text: ` (${e.period})`, size: 19, color: "64748B" });
            bodyParts.push(makeParagraph(eduRuns, { after: 20 }));

            const instLine = `${e.institution || ""}${e.location ? ` — ${e.location}` : ""}${e.details ? ` | ${e.details}` : ""}`;
            if (instLine) {
              bodyParts.push(makeParagraph([{ text: instLine, size: 19, color: "475569" }], { after: 60 }));
            }
          }
        });
      } else if (sec.type === "recognition") {
        (sec.bullets || []).filter(Boolean).forEach((a) => {
          bodyParts.push(makeBulletPoint(a));
        });
      } else {
        if (sec.rawLines && sec.rawLines.length) {
          sec.rawLines.forEach((l) => bodyParts.push(makeBulletPoint(l)));
        } else if (sec.rawContent) {
          bodyParts.push(makeParagraph([{ text: sec.rawContent, size: 21, color: "334155" }], { after: 80 }));
        }
      }
    });
  } else {
    // Legacy fallback
    if (summary) {
      bodyParts.push(makeSectionHeader("Professional Summary"));
      bodyParts.push(makeParagraph([{ text: summary, size: 21, color: "334155" }], { after: 120 }));
    }

    if (skills) {
      bodyParts.push(makeSectionHeader("Core Technical Skills"));
      if (Array.isArray(skills)) {
        bodyParts.push(makeParagraph([{ text: skills.join("  •  "), size: 21, color: "334155" }], { after: 100 }));
      } else if (typeof skills === "object") {
        Object.entries(skills).forEach(([cat, list]) => {
          const items = Array.isArray(list) ? list.join(", ") : list;
          bodyParts.push(
            makeParagraph(
              [
                { text: `${cat}: `, bold: true, size: 21, color: "0F172A" },
                { text: items, size: 21, color: "334155" }
              ],
              { after: 60 }
            )
          );
        });
      }
    }

    if (projects && projects.length) {
      bodyParts.push(makeSectionHeader("Work Experience & Key Projects"));
      projects.filter(Boolean).forEach((p) => {
        const headerRuns = [{ text: p.name || "Project", bold: true, size: 22, color: "0F172A" }];
        if (p.role) headerRuns.push({ text: ` — ${p.role}`, italic: true, size: 21, color: "475569" });
        if (p.period) headerRuns.push({ text: ` (${p.period})`, size: 19, color: "64748B" });
        bodyParts.push(makeParagraph(headerRuns, { after: 40 }));

        if (p.techStack) {
          bodyParts.push(makeParagraph([{ text: `Tech Stack: ${p.techStack}`, italic: true, size: 19, color: "475569" }], { after: 40 }));
        }

        (p.bullets || []).filter(Boolean).forEach((b) => {
          const str = typeof b === "string" ? b : b?.improvedBullet || "";
          if (str) bodyParts.push(makeBulletPoint(str));
        });
      });
    }

    if (education && education.length) {
      bodyParts.push(makeSectionHeader("Education & Credentials"));
      education.forEach((e) => {
        if (typeof e === "string") {
          bodyParts.push(makeParagraph([{ text: e, size: 21, color: "334155" }], { after: 60 }));
        } else {
          const eduRuns = [{ text: e.degree || "", bold: true, size: 21, color: "0F172A" }];
          if (e.period) eduRuns.push({ text: ` (${e.period})`, size: 19, color: "64748B" });
          bodyParts.push(makeParagraph(eduRuns, { after: 20 }));

          const instLine = `${e.institution || ""}${e.location ? ` — ${e.location}` : ""}`;
          if (instLine) {
            bodyParts.push(makeParagraph([{ text: instLine, size: 19, color: "475569" }], { after: 60 }));
          }
        }
      });
    }

    if (achievements && achievements.length) {
      bodyParts.push(makeSectionHeader("Achievements & Certifications"));
      achievements.forEach((a) => bodyParts.push(makeBulletPoint(a)));
    }
  }

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", documentXml);

  return await zip.generateAsync({ type: "nodebuffer" });
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
  sections = [],
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
      doc.moveDown(0.3);

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

      if (Array.isArray(sections) && sections.length > 0) {
        sections.forEach((sec) => {
          if (!sec || !sec.title) return;
          renderSectionHeader(sec.title);

          if (sec.type === "summary") {
            const summaryStr = sec.text || sec.rawContent || "";
            if (summaryStr) {
              doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(summaryStr, {
                align: "justify",
                lineGap: 2,
              });
            }
          } else if (sec.type === "impact") {
            (sec.bullets || []).filter(Boolean).forEach((b) => {
              doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${b}`, {
                indent: 10,
                lineGap: 1.5,
              });
            });
          } else if (sec.type === "expertise") {
            const items = (sec.items || []).join("  •  ");
            if (items) {
              doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(items, { lineGap: 2 });
            }
          } else if (sec.type === "toolkit") {
            Object.entries(sec.categories || {}).forEach(([cat, list]) => {
              const items = Array.isArray(list) ? list.join(", ") : list;
              doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(`${cat}: `, {
                continued: true,
              });
              doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(items, { lineGap: 2 });
            });
          } else if (sec.type === "skills") {
            const items = Array.isArray(sec.items) ? sec.items.join("  •  ") : (sec.rawContent || "");
            if (items) {
              doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(items, { lineGap: 2 });
            }
          } else if (sec.type === "experience") {
            (sec.projects || []).forEach((p) => {
              doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(p.name, { continued: !!p.role });
              if (p.role) {
                doc.font("Helvetica").fontSize(9.5).fillColor("#64748b").text(` — ${p.role}`);
              }
              if (p.period) {
                doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text(` [${p.period}]`);
              }
              if (p.techStack) {
                doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#475569").text(`Tech Stack: ${p.techStack}`);
              }
              doc.moveDown(0.15);
              (p.bullets || []).filter(Boolean).forEach((b) => {
                const bulletStr = typeof b === "string" ? b : b?.improvedBullet || "";
                if (bulletStr && typeof bulletStr === "string") {
                  doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${bulletStr}`, {
                    indent: 10,
                    lineGap: 1.5,
                  });
                }
              });
              doc.moveDown(0.3);
            });
          } else if (sec.type === "education") {
            (sec.items || []).forEach((e) => {
              if (typeof e === "string") {
                doc.font("Helvetica").fontSize(9).fillColor("#334155").text(e);
              } else {
                doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(e.degree || "", {
                  continued: !!e.period,
                });
                if (e.period) {
                  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text(`  [${e.period}]`);
                }
                let instText = e.institution || "";
                if (e.location) instText += ` (${e.location})`;
                if (e.details) instText += ` — ${e.details}`;
                if (instText) doc.font("Helvetica").fontSize(9).fillColor("#475569").text(instText);
              }
              doc.moveDown(0.2);
            });
          } else if (sec.type === "recognition") {
            (sec.bullets || []).forEach((a) => {
              doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`★  ${a}`, {
                indent: 10,
                lineGap: 1.5,
              });
            });
          } else {
            if (sec.rawLines) {
              sec.rawLines.forEach((l) => {
                doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${l}`, {
                  indent: 10,
                  lineGap: 1.5,
                });
              });
            } else if (sec.rawContent) {
              doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(sec.rawContent, { lineGap: 2 });
            }
          }
        });
      } else {
        // Legacy fallback
        if (summary) {
          renderSectionHeader("Professional Summary");
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(summary, {
            align: "justify",
            lineGap: 2,
          });
        }

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
            (p.bullets || []).filter(Boolean).forEach((b) => {
              const bulletStr = typeof b === "string" ? b : b?.improvedBullet || "";
              if (bulletStr && typeof bulletStr === "string") {
                doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${bulletStr}`, {
                  indent: 10,
                  lineGap: 1.5,
                });
              }
            });
            doc.moveDown(0.3);
          });
        } else if (bulletImprovements && bulletImprovements.length) {
          renderSectionHeader("Projects & Experience");
          bulletImprovements.filter(Boolean).forEach((b) => {
            const bulletStr = typeof b === "string" ? b : b?.improvedBullet || "";
            if (bulletStr && typeof bulletStr === "string") {
              doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`•  ${bulletStr}`, {
                indent: 10,
                lineGap: 1.5,
              });
            }
          });
        }

        if (education && education.length) {
          renderSectionHeader("Education");
          education.forEach((e) => {
            if (typeof e === "string") {
              doc.font("Helvetica").fontSize(9).fillColor("#334155").text(e);
            } else {
              doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(e.degree || "", {
                continued: !!(e.period || e.year),
              });
              if (e.period || e.year) {
                doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text(`  [${e.period || e.year}]`);
              }
              let instText = e.institution || "";
              if (e.location) instText += ` (${e.location})`;
              if (e.details) instText += ` — ${e.details}`;
              if (instText) doc.font("Helvetica").fontSize(9).fillColor("#475569").text(instText);
            }
            doc.moveDown(0.2);
          });
        }

        if (achievements && achievements.length) {
          renderSectionHeader("Achievements & Awards");
          achievements.forEach((a) => {
            doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(`★  ${a}`, {
              indent: 10,
              lineGap: 1.5,
            });
          });
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

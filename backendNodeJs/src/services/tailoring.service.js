import { scoringEngine } from "./scoring/index.js";

/**
 * Universally parses ANY resume text into structured sections.
 * STRICT TRUTH-PRESERVATION: Extracts the exact sections, original titles, and structure
 * as uploaded by the candidate without forcing arbitrary sections (like fake "Technical Skills").
 */
export const parseOriginalResumeSections = (rawResumeText = "", defaultName = "") => {
  const normalizedText = String(rawResumeText || "")
    .replace(/(PROJECTS|EDUCATION|TECHNICAL SKILLS|ACHIEVEMENTS|ABOUT ME|EXPERIENCE|WORK EXPERIENCE)([A-Z])/g, "$1\n$2")
    .replace(/(SOFT SKILLS)([A-Z])/g, "$1\n$2");

  const PAGE_MARKER_REGEX = /^\s*(?:--\s*\d+\s*(?:of|[-–—/]+)\s*\d+\s*--|--\s*\d+\s*--|-\s*\d+\s*-|\bpage\s+\d+(?:\s*(?:of|\/|-)\s*\d+)?\b|\b\d+\s*(?:of|\/)\s*\d+\b|undefined)\s*$/i;

  const lines = normalizedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !PAGE_MARKER_REGEX.test(l));

  // 1. Dynamic Name and Contact Extraction
  let name = "";
  let targetRoleTitle = "";
  let contact = { email: "", phone: "", linkedin: "", github: "", location: "" };

  // Scan top 25 lines for contact info (handles both single-column and multi-column PDFs)
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const l = lines[i];
    const email = l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phone = l.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/);
    const linkedin = l.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const github = l.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    if (email && !contact.email) contact.email = email[0];
    if (phone && !contact.phone) contact.phone = phone[0];
    if (linkedin && !contact.linkedin) contact.linkedin = linkedin[0];
    if (github && !contact.github) contact.github = github[0];
  }

  // Name and target role extraction from top 6 lines
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (/@|http|linkedin|\+?\d[\d\s\-]{8,}/.test(l)) continue;
    if (/engineering student|experienced in|passionate|dedicated|software engineer with/i.test(l)) continue;

    if (!name) {
      if (l.includes("|")) {
        const parts = l.split("|").map((s) => s.trim());
        let potName = parts[0];
        // Check if role title was concatenated with name on PDF extraction (e.g. HOSURFULL-STACK DEVELOPER)
        const roleJoinMatch = potName.match(/^(.*?)(FULL-STACK|SOFTWARE|FRONTEND|BACKEND|WEB|MOBILE|DEVOPS|DATA|PRODUCT|PROJECT|PROGRAM|CONSULTANT|SPECIALIST|ANALYST|ARCHITECT|LEAD|MANAGER)(.*)$/i);
        if (roleJoinMatch && roleJoinMatch[1].trim().length >= 3) {
          name = roleJoinMatch[1].trim();
          targetRoleTitle = `${roleJoinMatch[2]}${roleJoinMatch[3]} | ${parts.slice(1).join(" | ")}`.trim();
          break;
        }
        potName = potName.replace(/,\s*(?:pmp|csm|phd|mba|ms|bs|btech)\b/i, "").trim();
        if (potName.length >= 3 && potName.length <= 40) {
          name = parts[0].trim();
          targetRoleTitle = parts.slice(1).join(" | ").trim();
          break;
        }
      } else if (l.length >= 3 && l.length <= 45 && !/resume|curriculum|about\s+me|summary/i.test(l)) {
        name = l.trim();
      }
    } else if (!targetRoleTitle && (l.includes("|") || /developer|engineer|manager|architect|lead|analyst|specialist|designer/i.test(l)) && l.length <= 60) {
      targetRoleTitle = l.trim();
      break;
    }
  }
  if (!name && defaultName) name = defaultName;
  if (!name) name = "Candidate";

  // Location extraction
  const locRegex = /\b(?:Bengaluru|Bangalore|Karnataka|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Belgaum|Boston|New York|San Francisco|Seattle|Austin|Chicago|London|Toronto|Vancouver|Berlin|Singapore|India|USA|UK|Canada)\b/i;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (locRegex.test(lines[i]) && !/@|http|github|linkedin|education|project/i.test(lines[i])) {
      contact.location = lines[i].replace(/[•|]/g, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  // 2. Dynamic Authentic Section Boundary Parsing
  // Recognizes all standard, modern, academic, technical, and executive resume sections across all formats
  const KNOWN_SECTIONS_MAP = [
    { type: "summary", regex: /^(?:executive\s+summary|professional\s+summary|summary\s+of\s+qualifications|career\s+summary|summary|profile|professional\s+profile|about\s+me|career\s+objective|objective|overview)\s*:?$/i },
    { type: "impact", regex: /^(?:leadership\s+impact|key\s+impact|impact|career\s+highlights|executive\s+highlights|selected\s+accomplishments)\s*:?$/i },
    { type: "expertise", regex: /^(?:core\s+expertise|areas\s+of\s+expertise|key\s+competencies|core\s+competencies|competencies|professional\s+skills|soft\s+skills|domain\s+expertise)\s*:?$/i },
    { type: "toolkit", regex: /^(?:technical\s+toolkit|technical\s+skills|toolkit|technologies|technical\s+proficiencies|skills\s*&\s*tools|skills\s*&\s*technologies|technical\s+expertise|skills|it\s+skills)\s*:?$/i },
    { type: "experience", regex: /^(?:professional\s+experience|work\s+experience|experience|employment\s+history|work\s+history|career\s+history|professional\s+background|projects|key\s+projects|academic\s+projects|personal\s+projects|selected\s+projects)\s*:?$/i },
    { type: "education", regex: /^(?:education\s*&\s*certifications|education\s+and\s+training|education|academic\s+background|academic\s+qualifications|academics|academic\s+credentials|qualifications)\s*:?$/i },
    { type: "recognition", regex: /^(?:recognition|awards\s*&\s*recognition|honors\s*&\s*awards|awards|achievements|honors|key\s+achievements|accolades)\s*:?$/i },
    { type: "certifications", regex: /^(?:certifications|licenses\s*&\s*certifications|certificates|professional\s+certifications|credentials|licenses)\s*:?$/i },
    { type: "publications", regex: /^(?:publications|patents\s*&\s*publications|publications\s*&\s*research|research\s+papers|research|patents)\s*:?$/i },
    { type: "volunteer", regex: /^(?:volunteer\s+experience|volunteering|community\s+service|community\s+involvement|volunteer\s+involvement|leadership\s*&\s*activities)\s*:?$/i },
    { type: "languages", regex: /^(?:languages|language\s+proficiencies|known\s+languages)\s*:?$/i },
  ];

  const rawSections = [];
  let curSection = null;
  const preHeaderLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page markers (e.g. "-- 1 of 2 --", "--2--2--", "- 2 -", "Page 2 of 2")
    if (PAGE_MARKER_REGEX.test(line)) continue;

    // Skip contact lines
    if (/@|linkedin\.com\b|\+91\b|^\+?\d[\d\s\-]{8,}$/.test(line)) continue;

    // Skip candidate name repetition or page repeated headers (e.g. "KRISHNA SAGAR B S | Engineering Leadership...")
    if (name) {
      const lineLower = line.toLowerCase();
      const nameLower = name.toLowerCase();
      if (lineLower === nameLower) continue;
      if (lineLower.startsWith(nameLower) && (line.includes("|") || line.length <= name.length + 10)) continue;
    }
    if (targetRoleTitle) {
      const lineLower = line.toLowerCase();
      const roleLower = targetRoleTitle.toLowerCase();
      if (lineLower.includes(roleLower) && line.includes("|")) continue;
    }

    const matchedKnown = KNOWN_SECTIONS_MAP.find((k) => k.regex.test(line));

    // Guard against year/date snippets being mistaken for section headers (e.g. "2025)", "2023 - 2027")
    const isDateSnippet =
      /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{4})[)\s–—\-]*$/i.test(line) ||
      /^\(?\d{4}\s*[-–—]\s*(?:\d{4}|present)\)?$/i.test(line) ||
      /^\(?\d{1,2}\/\d{4}\)?$/i.test(line) ||
      /^\d{4}\)?$/i.test(line);

    // Guard against universities, colleges, institutions or degree names being mistaken for section headers
    const isCompanyOrInstitution =
      /\b(?:institute|university|college|school|academy|polytechnic|bachelor|master|degree|class\s+(?:x|xii|\d+)|ltd|pvt|inc|corp|llc)\b/i.test(line);

    const hasLetters = /[a-zA-Z]{3,}/.test(line);

    const isStandaloneHeader =
      !isDateSnippet &&
      !isCompanyOrInstitution &&
      hasLetters &&
      line.length >= 3 &&
      line.length <= 40 &&
      !/[.,;]$/.test(line) &&
      !/^[•\-*]|\d+\.\s+/.test(line) &&
      (
        matchedKnown ||
        (line === line.toUpperCase() && !line.includes("@") && !line.includes("http")) ||
        (/^[A-Z][a-zA-Z\s&/'-]{2,35}$/.test(line) && /\b(?:experience|history|background|summary|profile|skills|toolkit|expertise|competencies|projects|education|certifications|awards|honors|publications|patents|contributions|activities|involvement|languages|interests|affiliations|references|coursework)\b/i.test(line))
      );

    if (matchedKnown || isStandaloneHeader) {
      if (curSection && curSection.lines.length > 0) {
        rawSections.push(curSection);
      }
      curSection = {
        title: line,
        type: matchedKnown ? matchedKnown.type : "custom",
        lines: [],
      };
    } else if (curSection) {
      curSection.lines.push(line);
    } else {
      preHeaderLines.push(line);
    }
  }
  if (curSection && curSection.lines.length > 0) {
    rawSections.push(curSection);
  }

  // Pre-header summary capture (e.g. summary paragraph right after contact info before first header)
  if (preHeaderLines.length > 0) {
    const summaryCandidate = preHeaderLines.join(" ").trim();
    if (summaryCandidate.length > 30) {
      rawSections.unshift({
        title: "Professional Summary",
        type: "summary",
        lines: preHeaderLines,
      });
    }
  }

  // Parse structured details for each authentic section
  let summaryText = "";
  let toolkitSkills = null;
  let experienceProjects = [];
  let educationItems = [];
  let achievementBullets = [];

  const parsedSections = rawSections.map((sec) => {
    const rawContent = sec.lines.join("\n");

    if (sec.type === "summary") {
      const text = sec.lines.join(" ").trim();
      summaryText = text;
      return { ...sec, text, rawContent };
    }

    if (sec.type === "impact" || sec.type === "recognition") {
      const bullets = [];
      let cur = "";
      sec.lines.forEach((l) => {
        if (/^[•\-*]|\d+\.\s+/.test(l)) {
          if (cur) bullets.push(cur);
          cur = l.replace(/^[•\-*]\s*|\d+\.\s*/, "").trim();
        } else if (cur) {
          cur += " " + l;
        } else {
          cur = l;
        }
      });
      if (cur) bullets.push(cur);
      if (sec.type === "impact" || !achievementBullets.length) {
        achievementBullets = bullets;
      }
      return { ...sec, bullets, rawContent };
    }

    if (sec.type === "expertise") {
      const items = rawContent
        .split(/[|\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { ...sec, items, rawContent };
    }

    if (sec.type === "toolkit") {
      const categories = {};
      const KNOWN_CAT_REGEX = /^(?:programming(?:\s+languages)?|web(?:\s+development)?|frontend|backend|databases?|ai\/ml|ai\s+tools|machine\s+learning|deep\s+learning|data\s+science|tools|developer\s+tools|frameworks(?:\s*&\s*libraries)?|libraries|cloud(?:\s*&\s*(?:devops|data))?|devops|delivery\s*&\s*devops|engineering|platforms|operating\s+systems|methodologies|soft\s+skills|core\s+competencies)\s*:?$/i;

      let currentCategory = null;

      for (let i = 0; i < sec.lines.length; i++) {
        const l = sec.lines[i].trim();
        if (!l) continue;

        if (l.includes(":")) {
          const colonIdx = l.indexOf(":");
          const cat = l.slice(0, colonIdx).trim();
          const itemsStr = l.slice(colonIdx + 1).trim();
          const items = itemsStr.split(/[,•|]+/).map((s) => s.trim()).filter(Boolean);
          if (cat) {
            categories[cat] = (categories[cat] || []).concat(items);
            currentCategory = cat;
          }
          continue;
        }

        const isKnownCat = KNOWN_CAT_REGEX.test(l);
        const isShortHeader = l.length <= 25 && !l.includes(",") && i + 1 < sec.lines.length && (sec.lines[i + 1].includes(",") || sec.lines[i + 1].length > 15);

        if (isKnownCat || isShortHeader) {
          currentCategory = l.replace(/:$/, "").trim();
          if (!categories[currentCategory]) {
            categories[currentCategory] = [];
          }
          continue;
        }

        const items = l.split(/[,•|]+/).map((s) => s.trim()).filter(Boolean);
        if (currentCategory && categories[currentCategory]) {
          categories[currentCategory].push(...items);
        } else {
          currentCategory = "General";
          categories[currentCategory] = (categories[currentCategory] || []).concat(items);
        }
      }

      if (Object.keys(categories).length === 0) {
        categories[sec.title] = rawContent.split(/[,•|\n]+/).map((s) => s.trim()).filter(Boolean);
      }
      toolkitSkills = categories;
      return { ...sec, categories, rawContent };
    }

    if (sec.type === "experience") {
      const projects = [];
      let curProj = null;

      sec.lines.forEach((l) => {
        const isBullet = /^[•\-*]|\d+\.\s+/.test(l);
        const hasDate = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b.*(?:\d{4}|present)/i.test(l);
        const isPlatformSubtitle =
          curProj && !hasDate && !isBullet &&
          (l.includes("Platforms") || l.includes("years)") || l.includes("Banking") || curProj.bullets.length === 0);

        if (isPlatformSubtitle) {
          curProj.role = curProj.role ? `${curProj.role} • ${l}` : l;
        } else if (!isBullet && (l.includes("|") || hasDate || (l.length < 60 && !/[.,;]$/.test(l) && curProj === null))) {
          if (curProj) projects.push(curProj);
          const parts = l.split("|").map((s) => s.trim());
          const pName = parts[0] || "Experience";
          let role = parts.slice(1).join(" | ");
          let period = "";
          if (hasDate) {
            const dateMatch = l.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}|present)/i);
            if (dateMatch) {
              period = dateMatch[0];
              role = role.replace(dateMatch[0], "").trim().replace(/[-|]\s*$/, "").trim();
            }
          }
          curProj = { name: pName, role, period, techStack: "", bullets: [] };
        } else if (isBullet && curProj) {
          curProj.bullets.push(l.replace(/^[•\-*]\s*|\d+\.\s*/, "").trim());
        } else if (curProj && curProj.bullets.length > 0) {
          curProj.bullets[curProj.bullets.length - 1] += " " + l;
        } else if (curProj) {
          if (!curProj.role) curProj.role = l;
          else curProj.role += " • " + l;
        }
      });
      if (curProj) projects.push(curProj);
      experienceProjects = [...experienceProjects, ...projects];
      return { ...sec, projects, rawContent };
    }

    if (sec.type === "education") {
      const isDegreeLine = (l) =>
        /\b(?:bachelor|master|b\.?e\b|b\.?tech\b|m\.?tech\b|b\.?s\b|m\.?s\b|ph\.?d\b|diploma\b|class\s+(?:x|xii|\d+)\b|associate\b)/i.test(l);
      const isInstLine = (l) =>
        /\b(?:institute|university|college|school|academy|polytechnic|mandir|vidyalaya|campus)\b/i.test(l) ||
        /^[A-Z\s]{4,}$/.test(l);
      const isGradeLine = (l) =>
        /\b(?:cgpa|percentage|gpa|grade|score|marks|percent)\b/i.test(l) || /^\d{1,2}(?:\.\d+)?%$/.test(l);
      const isDateLine = (l) =>
        /^(?:\d{4}|\d{4}\s*[-–—]\s*(?:\d{4}|present))\b/i.test(l);
      const isLocLine = (l) =>
        /\b(?:bengaluru|bangalore|karnataka|belgaum|mumbai|delhi|hyderabad|pune|chennai|kolkata|india|usa|boston|ny)\b/i.test(l);

      const items = [];
      let curEntry = null;

      sec.lines.forEach((l) => {
        const trimmed = l.trim().replace(/,\s*$/, "");
        if (!trimmed) return;

        if (isDegreeLine(trimmed)) {
          if (curEntry) items.push(curEntry);
          let degree = trimmed;
          let institution = "";
          if (trimmed.includes(",")) {
            const parts = trimmed.split(",");
            degree = parts[0].trim();
            institution = parts.slice(1).join(", ").trim();
          }
          curEntry = { degree, institution, details: "", period: "", location: "" };
        } else if (curEntry) {
          if (!curEntry.institution && isInstLine(trimmed)) {
            curEntry.institution = trimmed;
          } else if (isGradeLine(trimmed)) {
            curEntry.details = curEntry.details ? `${curEntry.details} • ${trimmed}` : trimmed;
          } else if (isDateLine(trimmed)) {
            curEntry.period = trimmed;
          } else if (isLocLine(trimmed)) {
            curEntry.location = trimmed;
          } else if (!curEntry.institution) {
            curEntry.institution = trimmed;
          } else {
            curEntry.details = curEntry.details ? `${curEntry.details} • ${trimmed}` : trimmed;
          }
        } else {
          curEntry = { degree: trimmed, institution: "", details: "", period: "", location: "" };
        }
      });
      if (curEntry) items.push(curEntry);

      educationItems = [...educationItems, ...items];
      return { ...sec, items, rawContent };
    }

    return { ...sec, rawContent };
  });

  return {
    name,
    targetRoleTitle,
    contact,
    summary: summaryText,
    education: educationItems,
    projects: experienceProjects,
    skills: toolkitSkills, // NULL if resume has no skills section!
    achievements: achievementBullets,
    sections: parsedSections, // THE 100% AUTHENTIC ORDERED SECTIONS LIST
  };
};

const buildPrompt = (rawResumeText, jobDescription, verifiedEvidence, targetRole, baseResume) => {
  return `
You are an expert ATS resume tailoring engine with a STRICT truth-preservation protocol.
Your job is to tailor the candidate's resume for the target role: "${targetRole}".

CRITICAL INSTRUCTIONS:
1. Preserve the candidate's authentic information extracted from their resume:
   - Candidate Name: "${baseResume.name}"
   - Contact Info: ${JSON.stringify(baseResume.contact)}
   - Education: ${JSON.stringify(baseResume.education)}
   - Projects: ${JSON.stringify(baseResume.projects)}
   - Achievements: ${JSON.stringify(baseResume.achievements)}
2. TAILOR ONLY the Professional Summary to directly target "${targetRole}", emphasizing the candidate's verified skills and project achievements.
3. ORGANIZE AND PRIORITIZE the Technical Skills into clean groupings relevant to "${targetRole}", while keeping all of the candidate's skills.
4. If verified evidence is provided below, incorporate it into the matching project bullets.
5. NEVER remove Education, Projects, Contact info, or Achievements.

Return ONLY a valid JSON object matching this structure:
{
  "name": "${baseResume.name}",
  "contact": ${JSON.stringify(baseResume.contact)},
  "summary": "Tailored 3-4 sentence professional summary highlighting candidate background and verified capabilities for ${targetRole}",
  "skills": ${JSON.stringify(baseResume.skills)},
  "projects": ${JSON.stringify(baseResume.projects)},
  "education": ${JSON.stringify(baseResume.education)},
  "achievements": ${JSON.stringify(baseResume.achievements)}
}

Target Role: ${targetRole}
Job Description:
${jobDescription.slice(0, 3000)}

Candidate Verified Evidence:
${JSON.stringify(verifiedEvidence, null, 2)}

Original Resume Text:
${rawResumeText.slice(0, 4500)}
`;
};

export const isWorkSentence = (str) => {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  if (s.length > 20 && /\s+/.test(s)) {
    if (
      /\b(?:worked|working|intern|internship|duration|months?|years?|handled|handling|merge|conflict|conflicts|connection|database connection|team|using|built|developed|created|managed|engineered|designed|implemented|responsible|assisted|helped|supported)\b/i.test(
        s
      )
    ) {
      return true;
    }
  }
  if (
    /^(?:worked|built|handled|developed|created|designed|managed|implemented|collaborated|completed)\s+/i.test(
      s
    )
  ) {
    return true;
  }
  return false;
};

export const extractCleanTech = (techUsed = "", req = "") => {
  const t = (techUsed || "").trim();
  const r = (req || "").trim();

  // If techUsed is concise, not a work sentence, and not a category label
  const isCategory =
    /^(?:databases?|tools?|programming|web\s+development|ai\/ml|internship|experience|skills?)$/i;

  if (
    t &&
    !isWorkSentence(t) &&
    !isCategory.test(t) &&
    t.length <= 25 &&
    t.split(/\s+/).length <= 3
  ) {
    return t;
  }

  // Look for known technologies in both inputs
  const combined = `${t} ${r}`.toLowerCase();
  const knownTechs = [
    "Python",
    "JavaScript",
    "TypeScript",
    "React.js",
    "Node.js",
    "Express.js",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Git",
    "GitHub",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Linux",
    "REST APIs",
    "GraphQL",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Machine Learning",
    "Deep Learning",
    "FastAPI",
    "Tailwind CSS",
    "HTML",
    "CSS",
    "Next.js",
    "CI/CD",
    "Postman",
  ];
  for (const kt of knownTechs) {
    const ktLower = kt.toLowerCase();
    const regex = new RegExp(`\\b${ktLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(combined)) {
      return kt;
    }
  }

  if (
    r &&
    !isWorkSentence(r) &&
    !isCategory.test(r) &&
    r.length <= 25 &&
    r.split(/\s+/).length <= 3
  ) {
    return r;
  }

  return "";
};

export const generateProfessionalBullet = ({
  tech,
  task = "",
  outcome = "",
  index = 0,
  targetRole = "",
  projectName = "",
}) => {
  const cleanTech = (tech || "").trim();
  const cleanTask = (task || "").trim();
  const rawOutcome = (outcome || "").trim();

  // Polish outcome if provided
  let outcomePhrase = "";
  if (rawOutcome) {
    const stripped = rawOutcome
      .replace(/^(achieving|resulting in|cutting|reducing|increasing|scaling to|by)\s*/i, "")
      .trim();
    if (/^\d+%|\b\d+x\b|\b\d+\s*(?:ms|seconds|users|req|requests|k|million)\b/i.test(stripped)) {
      outcomePhrase = `, improving performance by ${stripped}`;
    } else {
      outcomePhrase = `, achieving ${stripped}`;
    }
  }

  // Check if candidate provided a meaningful task description
  const isMinimal =
    !cleanTask ||
    cleanTask.length < 8 ||
    /^(yes|done|used|worked|implemented|ok|none|na|caching|api|pipeline|code)$/i.test(cleanTask) ||
    cleanTask.toLowerCase() === cleanTech.toLowerCase();

  if (!isMinimal) {
    let polishedTask = cleanTask.replace(/\.+$/, "");

    // 1. High-impact transforms for common candidate internship & teamwork phrasing
    if (
      /^(?:worked\s+with|worked\s+at|interned\s+at)\s+([a-z0-9\s]+?)\s+as\s+(?:an?\s+)?intern\s*(?:for\s+(.*))?$/i.test(
        polishedTask
      )
    ) {
      return polishedTask.replace(
        /^(?:worked\s+with|worked\s+at|interned\s+at)\s+([a-z0-9\s]+?)\s+as\s+(?:an?\s+)?intern\s*(?:for\s+(.*))?$/i,
        (m, comp, dur) => {
          const c = comp
            .trim()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const cleanDur = dur
            ? dur
                .replace(/^(?:for\s+)?(?:a\s+)?(?:duration\s+of\s*)?/, "")
                .replace(/\s+of\s+duration$/i, "")
                .trim()
            : "";
          return `Completed an engineering internship at ${c}${
            cleanDur ? ` for ${cleanDur}` : ""
          }, contributing to production feature delivery and sprint objectives${outcomePhrase}.`;
        }
      );
    }

    if (
      /^(?:worked\s+with\s+(?:a\s+)?team|worked\s+in\s+(?:a\s+)?team)\s+(?:using|with)?\s*(.*)$/i.test(
        polishedTask
      )
    ) {
      if (/git/i.test(polishedTask) && /conflict|merge/i.test(polishedTask)) {
        return `Collaborated with engineering team utilizing Git for distributed version control, managing branch integrations and resolving complex merge conflicts${outcomePhrase}.`;
      }
      return polishedTask.replace(
        /^(?:worked\s+with\s+(?:a\s+)?team|worked\s+in\s+(?:a\s+)?team)\s+(?:using|with)?\s*(.*)$/i,
        (m, rest) => {
          return `Collaborated with engineering team utilizing ${rest.trim()}, streamlining delivery workflows and sprint milestones${outcomePhrase}.`;
        }
      );
    }

    if (/^(?:worked\s+on\s+([a-z0-9\s]+?)\s+to\s+handle\s+(.*))$/i.test(polishedTask)) {
      return polishedTask.replace(
        /^(?:worked\s+on\s+([a-z0-9\s]+?)\s+to\s+handle\s+(.*))$/i,
        (m, t, rest) => {
          const capT = t
            .trim()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          return `Engineered and optimized ${capT} to handle ${rest.trim()}, streamlining query latency and connection efficiency${outcomePhrase}.`;
        }
      );
    }

    const weakVerbMap = [
      [/^(?:built|created|made)\s+/i, "Engineered "],
      [/^(?:worked on|helped with|contributed to|assisted in)\s+/i, "Collaborated on the implementation of "],
      [/^(?:worked with|worked as|worked at)\s+/i, "Contributed as "],
      [/^(?:used|using|utilized|applied)\s+/i, "Leveraged "],
      [/^(?:setup|set up|configured)\s+/i, "Configured and provisioned "],
      [/^(?:improved|optimized|sped up|made faster)\s+/i, "Refactored and optimized "],
      [/^(?:tested|automated tests? for)\s+/i, "Implemented automated testing suites for "],
      [/^(?:deployed|shipped|released)\s+/i, "Orchestrated the continuous deployment of "],
      [/^(?:designed|architected)\s+/i, "Architected "],
      [/^(?:maintained|fixed|debugged)\s+/i, "Resolved critical bottlenecks and maintained "],
    ];

    for (const [regex, replacement] of weakVerbMap) {
      if (regex.test(polishedTask)) {
        polishedTask = polishedTask.replace(regex, replacement);
        break;
      }
    }

    polishedTask = polishedTask.charAt(0).toUpperCase() + polishedTask.slice(1);

    // Only append tech if not already mentioned or implied
    const techWords = cleanTech
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !/^(and|for|with|the|via|using)$/i.test(w));
    const alreadyMentionsTech = techWords.some((w) => polishedTask.toLowerCase().includes(w));

    if (cleanTech && !alreadyMentionsTech) {
      if (/utilizing|leveraging|using|with|via|through/i.test(polishedTask)) {
        return `${polishedTask}${outcomePhrase}.`;
      }
      return `${polishedTask} utilizing ${cleanTech}${outcomePhrase}.`;
    }

    return `${polishedTask}${outcomePhrase}.`;
  }

  // If candidate didn't provide a task, synthesize an executive bullet based on tech domain
  const t = cleanTech.toLowerCase();
  const i = Math.abs(index);

  // 1. DevOps / Cloud / Containers / CI/CD
  if (/docker|kubernetes|k8s|aws|gcp|azure|terraform|helm|ci\/cd|pipeline|ansible|linux|prometheus|grafana|cloud/i.test(t)) {
    const patterns = [
      `Orchestrated containerized microservices and automated deployment workflows utilizing ${cleanTech}${outcomePhrase || ", reinforcing system availability and zero-downtime rollouts"}.`,
      `Architected resilient cloud infrastructure and deployment pipelines leveraging ${cleanTech}${outcomePhrase || ", enforcing high availability and automated failover capabilities"}.`,
      `Automated continuous integration and infrastructure provisioning with ${cleanTech}${outcomePhrase || ", accelerating release velocity and deployment consistency"}.`,
      `Streamlined observability and system reliability utilizing ${cleanTech}${outcomePhrase || ", ensuring predictable performance across distributed environments"}.`,
    ];
    return patterns[i % patterns.length];
  }

  // 2. AI / ML / Deep Learning / Data Science
  if (/pytorch|tensorflow|keras|jax|scikit|nlp|vision|llm|langchain|rag|model|embedding|deep\s*learning|hugging\s*face|transformers|pandas|numpy/i.test(t)) {
    const patterns = [
      `Trained, benchmarked, and deployed high-performance machine learning models utilizing ${cleanTech}${outcomePhrase || ", advancing intelligent automated inference across workloads"}.`,
      `Engineered neural architecture and predictive analytics pipelines leveraging ${cleanTech}${outcomePhrase || ", optimizing evaluation accuracy and inference latency"}.`,
      `Fine-tuned and integrated state-of-the-art model architectures with ${cleanTech} into production workflows${outcomePhrase || ", elevating classification and prediction accuracy"}.`,
      `Designed end-to-end data transformation and feature evaluation pipelines utilizing ${cleanTech}${outcomePhrase || ", bolstering model convergence and benchmark scores"}.`,
    ];
    return patterns[i % patterns.length];
  }

  // 3. Frontend / Web / UI
  if (/react|next|vue|angular|typescript|tailwind|css|html|frontend|redux|ui|ux|client/i.test(t)) {
    const patterns = [
      `Developed modern, responsive component architectures utilizing ${cleanTech}${outcomePhrase || ", delivering intuitive, accessible client-facing user interfaces"}.`,
      `Engineered high-performance web applications leveraging ${cleanTech}${outcomePhrase || ", optimizing Core Web Vitals and interactive render performance"}.`,
      `Crafted modular UI design systems and state-management workflows with ${cleanTech}${outcomePhrase || ", enhancing component reusability and maintainability across pages"}.`,
      `Refactored and modernized client interfaces utilizing ${cleanTech}${outcomePhrase || ", ensuring seamless cross-browser responsiveness and performance"}.`,
    ];
    return patterns[i % patterns.length];
  }

  // 4. Testing / Security / Auth
  if (/jest|cypress|selenium|pytest|testing|test|security|oauth|jwt|auth|zero\s*trust|encryption|iam/i.test(t)) {
    const patterns = [
      `Implemented comprehensive end-to-end automated testing suites with ${cleanTech}${outcomePhrase || ", elevating test coverage and preventing production regressions"}.`,
      `Hardened enterprise application security utilizing ${cleanTech}${outcomePhrase || ", enforcing zero-trust role-based access controls and robust session verification"}.`,
      `Established automated quality verification gates leveraging ${cleanTech}${outcomePhrase || ", streamlining release confidence across engineering sprints"}.`,
      `Secured distributed service communications utilizing ${cleanTech}${outcomePhrase || ", safeguarding sensitive transactional data and credential lifecycles"}.`,
    ];
    return patterns[i % patterns.length];
  }

  // 5. Backend / APIs / Databases (Default for Backend / Full-stack)
  const backendPatterns = [
    `Engineered high-throughput, low-latency API services using ${cleanTech}${outcomePhrase || ", streamlining asynchronous request processing and database query efficiency"}.`,
    `Designed and implemented scalable backend architectures leveraging ${cleanTech}${outcomePhrase || ", ensuring high concurrency and strict transactional integrity"}.`,
    `Optimized distributed data pipelines and caching layers utilizing ${cleanTech}${outcomePhrase || ", eliminating data bottlenecks and enhancing query response times"}.`,
    `Developed robust, resilient microservice endpoints in ${cleanTech}${outcomePhrase || ", maintaining clean separation of concerns and production stability"}.`,
  ];
  return backendPatterns[i % backendPatterns.length];
};

export const generateSummaryVariant = async ({
  rawResumeText = "",
  targetRole = "",
  targetCompany = "",
  jobDescription = "",
  baseResume = null,
  tone = "executive",
  index = 0,
}) => {
  const safeRole = targetRole || "Software Engineer";
  const parsed = baseResume || parseOriginalResumeSections(rawResumeText);
  const company = targetCompany ? `@ ${targetCompany}` : "";

  // Extract key skills
  const skillsList = [];
  if (parsed.skills) {
    Object.values(parsed.skills).forEach((list) => {
      const arr = Array.isArray(list) ? list : String(list).split(/,\s*/);
      arr.forEach((s) => {
        const clean = s.trim();
        if (clean.length >= 2 && !skillsList.includes(clean) && skillsList.length < 8) {
          skillsList.push(clean);
        }
      });
    });
  }
  const topSkills = skillsList.slice(0, 5).join(", ") || "full-stack development, cloud architecture, and modern software design";
  const projNames = (parsed.projects || []).filter(Boolean).slice(0, 2).map((p) => p.name).filter(Boolean);
  const projStr = projNames.length > 0 ? ` across ${projNames.join(" and ")}` : "";

  // If Gemini API is available, ask for a role-tailored summary matching tone
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const prompt = `Generate a compelling, truth-preserving ATS professional summary (3-4 sentences, max 80 words) for candidate "${parsed.name || "Candidate"}" applying for "${safeRole}" ${company}.
Tone style: ${tone} (Options: executive leadership, technical architecture, metrics-driven outcomes, agile product delivery).
Candidate verified skills: ${topSkills}.
Projects: ${projNames.join(", ")}.
Job Description context: ${jobDescription.slice(0, 800)}.
Original summary: ${parsed.summary || "None"}.
Provide ONLY the paragraph text of the summary, no markdown, no quotes, no conversational filler.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length >= 40) {
          return text.replace(/^["']|["']$/g, "").trim();
        }
      }
    } catch {
      // fallback to high-impact template pool
    }
  }

  // High-impact synthesized templates based on tone
  const templates = {
    executive: [
      `Accomplished ${safeRole} with a strong track record of driving ${topSkills}${projStr}. Proven ability to align technical roadmaps with strategic business objectives, leading high-performance cross-functional engineering sprints and delivering scalable, enterprise-grade platforms.`,
      `Strategic ${safeRole} experienced in engineering delivery, systems architecture, and technical leadership. Demonstrated success architecting resilient solutions leveraging ${topSkills}${projStr}, empowering distributed engineering teams and driving operational excellence.`,
    ],
    technical: [
      `Hands-on ${safeRole} specializing in end-to-end software architecture, ${topSkills}, and resilient systems design${projStr}. Adept at designing scalable cloud-native microservices, optimizing low-latency database queries, and enforcing clean code practices to deliver robust production-grade systems.`,
      `Technically proficient ${safeRole} with deep expertise in full-lifecycle system implementation using ${topSkills}. Passionate about building maintainable architectures${projStr}, optimizing query performance, and implementing strict test automation across release cycles.`,
    ],
    results: [
      `Performance-driven ${safeRole} with demonstrated success in architecting and delivering high-impact systems leveraging ${topSkills}${projStr}. Recognized for driving measurable operational outcomes, reducing system latency, and spearheading seamless continuous deployment workflows for ${targetCompany || "competitive tech environments"}.`,
      `Results-oriented ${safeRole} focused on delivering quantifiable performance enhancements and zero-downtime rollouts. Leveraged ${topSkills}${projStr} to cut infrastructure bottlenecks, optimize asynchronous workflows, and accelerate deployment frequency.`,
    ],
    product: [
      `Solution-oriented ${safeRole} with extensive experience bridging technical implementation and user-centric product requirements${projStr}. Experienced in leading agile iterations, modernizing legacy modules, and deploying mission-critical systems utilizing ${topSkills} for the ${safeRole} role.`,
      `Customer-focused ${safeRole} combining deep domain expertise in ${topSkills} with agile execution${projStr}. Adept at translating complex product requirements into robust, high-performance software features delivered on schedule.`,
    ],
  };

  const pool = templates[tone] || templates.executive;
  const picked = pool[Math.abs(index) % pool.length];
  return picked;
};

export const tailorResumeWithEvidence = async ({
  rawResumeText,
  jobDescription,
  requirements,
  evidenceItems,
  targetRole,
  targetCompany = "",
  userName = "",
  updateSummary = true,
  customSummary = null,
}) => {
  // 1. Universally parse the candidate's raw resume into structured baseline sections
  const baseResume = parseOriginalResumeSections(rawResumeText, userName);

  const verifiedEvidence = (evidenceItems || []).filter(
    (e) =>
      e.candidate_response === "yes" ||
      e.candidate_response === "limited" ||
      e.candidateResponse === "yes" ||
      e.candidateResponse === "limited"
  );

  let structuredTailored = null;

  // 2. Call Gemini for high-level ATS tailoring if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const prompt = buildPrompt(rawResumeText, jobDescription, verifiedEvidence, targetRole, baseResume);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          structuredTailored = JSON.parse(text);
        }
      }
    } catch {
      structuredTailored = null;
    }
  }

  // 3. Fallback summary
  const safeRole = targetRole || "Software Engineer";
  const defaultSummary = `Dedicated ${safeRole} with demonstrated hands-on competencies in practical system implementation, technical problem-solving, and full-stack software development. Seeking to leverage verified competencies for the ${safeRole} role.`;

  // 4. Truth-Preserving Resume Section Architecture:
  // STRICT POLICY: Keep the whole resume as uploaded. Only modify sections where explicitly requested!
  // Do NOT arbitrarily rewrite or add skills to the technical skills section.
  const finalName = baseResume.name || userName || "Candidate";
  const finalContact = baseResume.contact;
  const finalSkills = JSON.parse(JSON.stringify(baseResume.skills || {}));
  const finalEducation = baseResume.education || [];
  const finalAchievements = baseResume.achievements || [];

  const rawProjects = baseResume.projects || [];
  let finalProjects = rawProjects
    .filter(Boolean)
    .map((p) => {
      if (typeof p === "string") {
        return { name: p, role: "", techStack: "", bullets: [] };
      }
      return {
        name: p?.name || "Project",
        role: p?.role || "",
        techStack: p?.techStack || "",
        bullets: Array.isArray(p?.bullets)
          ? p.bullets.filter((b) => b !== null && b !== undefined).map(String)
          : p?.bullet
          ? [String(p.bullet)]
          : [],
      };
    });

  const modifiedBulletTexts = [];

  // 5. INJECT VERIFIED EVIDENCE: Update matching Project bullets ONLY where requested
  if (verifiedEvidence.length > 0) {
    verifiedEvidence.forEach((e, evidenceIdx) => {
      const req = e.requirement_text || e.requirementText || "";
      const ctx =
        typeof e.context_data === "string"
          ? JSON.parse(e.context_data || "{}")
          : e.context_data || e.contextData || {};

      const task = (ctx.whatDone || ctx.task || "").trim();
      const outcome = (ctx.measurableOutcomes || ctx.outcome || "").trim();
      const where = (ctx.where || "").trim();
      const techUsed = (ctx.techUsed || "").trim();

      // Determine clean tech keyword and effective task
      const cleanTech = extractCleanTech(techUsed, req);
      let effectiveTask = task;
      if (!effectiveTask || effectiveTask.length < 8) {
        if (isWorkSentence(techUsed)) {
          effectiveTask = techUsed;
        } else if (isWorkSentence(req)) {
          effectiveTask = req;
        }
      }

      // Formulate clean, professional bullet
      const bullet = generateProfessionalBullet({
        tech: cleanTech || req,
        task: effectiveTask,
        outcome,
        index: evidenceIdx,
        targetRole,
        projectName: where,
      });

      if (!bullet) return;
      modifiedBulletTexts.push(bullet);

      // Match to existing Project / Company Section
      // STRICT RULE: Keep all resume sections exactly as uploaded, NEVER add a new project or section!
      let matchedProj = null;
      if (finalProjects.length > 0) {
        if (where) {
          const whereLower = where.trim().toLowerCase();
          matchedProj = finalProjects.find((p) => {
            const pNameLower = (p.name || "").trim().toLowerCase();
            const pRoleLower = (p.role || "").trim().toLowerCase();
            return (
              pNameLower === whereLower ||
              pNameLower.includes(whereLower) ||
              whereLower.includes(pNameLower) ||
              (whereLower.length >= 3 && pRoleLower.includes(whereLower))
            );
          });
        }
        // If no direct match or no where specified, assign to the existing primary project
        if (!matchedProj) {
          matchedProj = finalProjects[0];
        }
      }

      if (matchedProj) {
        // 1. Edit work done (bullets) within this existing company/project
        if (!Array.isArray(matchedProj.bullets)) matchedProj.bullets = [];
        matchedProj.bullets.push(bullet);

        // 2. Edit skills used (techStack) within this existing company/project ONLY
        // STRICT RULE: Only add concise technology keywords (e.g. Redis, Git), NEVER full sentences or work descriptions!
        if (cleanTech && cleanTech.length >= 2 && !isWorkSentence(cleanTech)) {
          const currentTechs = (matchedProj.techStack || "")
            .split(/[,•|;]\s*/)
            .map((t) => t.trim())
            .filter(Boolean);
          const techLower = cleanTech.toLowerCase();
          if (!currentTechs.some((t) => t.toLowerCase() === techLower)) {
            currentTechs.push(cleanTech);
            matchedProj.techStack = currentTechs.join(", ");
          }
        }
      }
    });
  }

  // 6. Dynamic ATS-tailored summary reflecting verified competencies
  let finalSummary;
  if (updateSummary === false) {
    finalSummary = baseResume.summary || structuredTailored?.summary || defaultSummary;
  } else if (customSummary && typeof customSummary === "string" && customSummary.trim().length > 0) {
    finalSummary = customSummary.trim();
  } else {
    finalSummary = structuredTailored?.summary?.trim();
    if (!finalSummary || finalSummary === defaultSummary) {
      const verifiedSkillsList = [];
      Object.values(finalSkills).forEach((list) => {
        const arr = Array.isArray(list) ? list : String(list).split(/,\s*/);
        arr.forEach((s) => {
          if (s && s.length >= 2 && verifiedSkillsList.length < 8) verifiedSkillsList.push(s);
        });
      });
      const projNames = finalProjects.filter(Boolean).slice(0, 2).map((p) => p?.name).filter(Boolean);
      const projStr = projNames.length > 0 ? ` with practical implementation across ${projNames.join(" and ")}` : "";
      finalSummary = `Dedicated ${safeRole} with demonstrated hands-on competencies in ${verifiedSkillsList.slice(0, 5).join(", ")}${projStr}. Experienced in end-to-end technical problem-solving, architectural implementation, and measurable results delivery, seeking to leverage verified capabilities for the ${safeRole} role.`;
    }
  }


  // Collect all bullets for scoring recalculation safely without any null values
  const allBullets = [];
  finalProjects.filter(Boolean).forEach((p) => {
    const list = Array.isArray(p.bullets) ? p.bullets : [];
    list.filter((b) => b !== null && b !== undefined && String(b).trim().length > 0).forEach((b) => {
      allBullets.push({ skill: p.name || "Project", improvedBullet: String(b) });
    });
  });

  const skillsFlat = Object.values(finalSkills).flat().join(", ");

  const combinedTailoredText = [
    rawResumeText,
    `\n\n[TAILORED PROFESSIONAL SUMMARY]\n${finalSummary}`,
    `\n\n[CONFIRMED SKILLS]\n${skillsFlat}`,
    `\n\n[VERIFIED PROJECTS & HIGHLIGHTS]\n` +
      finalProjects
        .filter(Boolean)
        .map(
          (p) =>
            `Project: ${p.name || ""} | Role: ${p.role || ""} | Tech: ${p.techStack || ""}\n` +
            (Array.isArray(p.bullets) ? p.bullets : [])
              .filter((b) => b !== null && b !== undefined && String(b).trim().length > 0)
              .map((b) => `• ${b}`)
              .join("\n")
        )
        .join("\n\n"),
  ].join("\n");

  // Calculate updated score using verified evidence to upgrade status and lift gatekeeping caps
  const updatedScoringResult = scoringEngine.calculateScore(
    combinedTailoredText,
    requirements,
    targetRole,
    targetCompany,
    verifiedEvidence
  );

  // Clone authentic sections list for tailoring
  const finalSections = JSON.parse(JSON.stringify(baseResume.sections || []));

  if (updateSummary && finalSummary !== baseResume.summary) {
    const sumSec = finalSections.find((s) => s.type === "summary");
    if (sumSec) {
      sumSec.text = finalSummary;
      sumSec.rawContent = finalSummary;
    }
  }

  // Sync tailored projects back into their authentic experience section(s)
  finalSections.forEach((s) => {
    if (s.type === "experience" && Array.isArray(s.projects)) {
      s.projects = s.projects.map((p) => {
        const found = finalProjects.find((fp) => fp.name === p.name);
        return found || p;
      });
    }
  });

  // 5b. STRICT TRUTH-PRESERVING POLICY: Keep candidate's uploaded Technical Skills 100% genuine and pristine!
  // Any candidate work accomplishments or project evidence belongs STRICTLY in their Project / Company (Experience) section.
  // NEVER inject work sentences, internship notes, or arbitrary candidate responses into the general Technical Skills section.
  let targetSkillSection = finalSections.find((s) => s.type === "toolkit");
  if (!targetSkillSection) {
    targetSkillSection = finalSections.find((s) => s.type === "skills");
  }
  if (!targetSkillSection) {
    targetSkillSection = finalSections.find((s) => s.type === "expertise");
  }
  if (!targetSkillSection) {
    targetSkillSection = finalSections.find((s) => /skill|toolkit|technolog|proficienc|competenc/i.test(s.title));
  }

  const enrichedSkillsList = [];

  if (targetSkillSection) {
    targetSkillSection.isEnriched = false;
    targetSkillSection.enrichedSkills = [];
    if (baseResume.skills && typeof baseResume.skills === "object" && Object.keys(baseResume.skills).length > 0) {
      targetSkillSection.categories = JSON.parse(JSON.stringify(baseResume.skills));
      targetSkillSection.rawContent = Object.entries(targetSkillSection.categories)
        .map(([cat, list]) => `${cat}: ${Array.isArray(list) ? list.join(", ") : list}`)
        .join("\n");
    }
  }

  return {
    originalContent: {
      name: baseResume.name,
      targetRoleTitle: baseResume.targetRoleTitle,
      contact: baseResume.contact,
      summary: baseResume.summary,
      skills: baseResume.skills,
      projects: baseResume.projects,
      education: baseResume.education,
      achievements: baseResume.achievements,
      sections: baseResume.sections,
    },
    tailoredContent: {
      name: finalName,
      targetRoleTitle: baseResume.targetRoleTitle,
      contact: finalContact,
      summary: finalSummary,
      skills: JSON.parse(JSON.stringify(baseResume.skills || {})),
      projects: finalProjects,
      education: finalEducation,
      achievements: finalAchievements,
      sections: finalSections,
      bulletImprovements: allBullets,
      modifiedBulletTexts: modifiedBulletTexts,
      modifiedSections: {
        summary: Boolean(updateSummary && finalSummary !== baseResume.summary),
        skills: false,
        enrichedSkillSection: null,
        enrichedSkills: [],
        education: false,
        achievements: false,
        modifiedBullets: modifiedBulletTexts,
      },
      fullTailoredText: combinedTailoredText,
    },
    scoringResult: updatedScoringResult,
  };
};

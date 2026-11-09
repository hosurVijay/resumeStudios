import { scoringEngine } from "./scoring/index.js";

/**
 * Universally parses ANY resume text into structured sections.
 * Works dynamically across different resume formats, colleges, countries, and domains.
 */
export const parseOriginalResumeSections = (rawResumeText = "", defaultName = "") => {
  // Pre-clean headers that may have been glued by PDF extraction (e.g. PROJECTSAI -> PROJECTS\nAI)
  const normalizedText = String(rawResumeText || "")
    .replace(/(PROJECTS|EDUCATION|TECHNICAL SKILLS|ACHIEVEMENTS|ABOUT ME|EXPERIENCE|WORK EXPERIENCE)([A-Z])/g, "$1\n$2")
    .replace(/(SOFT SKILLS)([A-Z])/g, "$1\n$2");

  const lines = normalizedText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Dynamic Name Extraction: Inspect top lines before contact/sections
  let name = "";
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (/@|http|www|\.com|\.in|\.edu|\d{5,}/.test(line)) continue;
    if (/^(resume|curriculum|vitae|cv|profile|summary|contact|about\s+me)/i.test(line)) continue;
    const clean = line
      .replace(/(?:full[- ]?stack|software|engineer|developer|architect|designer|lead|manager|node\.js|python|react).*$/i, "")
      .trim();
    if (clean.length >= 3 && clean.length <= 50 && !/^[0-9+() -]+$/.test(clean)) {
      name = clean;
      break;
    }
  }
  if (!name || /^candidate$/i.test(name)) {
    name = defaultName || "Candidate";
  }

  // 2. Dynamic Contact Extraction
  const emailMatch = normalizedText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = normalizedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);
  const linkedinMatch = normalizedText.match(/(?:(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w.-]+)/i);
  const githubMatch = normalizedText.match(/(?:(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+)/i);

  let location = "";
  const locRegex = /\b(?:Bengaluru|Bangalore|Karnataka|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Belgaum|Boston|New York|San Francisco|Seattle|Austin|Chicago|London|Toronto|Vancouver|Berlin|Singapore|India|USA|UK|Canada)\b/i;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (
      locRegex.test(lines[i]) &&
      !/@|http|github|linkedin|education|project|degree|bachelor|b\.e|cgpa|\d{4}\s*[-–]\s*\d{4}/i.test(lines[i])
    ) {
      location = lines[i].replace(/[•|]/g, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const contact = {
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    github: githubMatch ? githubMatch[0] : "",
    location: location,
  };

  // 3. Dynamic Section Boundary Parsing
  const SECTION_PATTERNS = [
    { key: "summary", regex: /^(?:about\s+me|professional\s+summary|executive\s+summary|summary|profile|objective)\b/i },
    { key: "education", regex: /^(?:education|academic\s+background|academics|qualifications|academic\s+profile)\b/i },
    { key: "skills", regex: /^(?:technical\s+skills|skills\s*&?\s*competencies|skills|technologies|core\s+competencies|technical\s+proficiencies)\b/i },
    { key: "projects", regex: /^(?:projects|experience|work\s+experience|professional\s+experience|employment\s+history|key\s+projects)\b/i },
    { key: "achievements", regex: /^(?:achievements|awards|honors|accolades|certifications|awards\s*&\s*achievements)\b/i },
    { key: "softSkills", regex: /^(?:soft\s+skills|core\s+strengths|interpersonal\s+skills)\b/i },
  ];

  const sections = {};
  let currentKey = null;
  let buffer = [];

  for (const line of lines) {
    const matched =
      line.length <= 45 &&
      !/^[•\-*]|\d+\.\s+/.test(line) &&
      SECTION_PATTERNS.find((p) => p.regex.test(line));
    if (matched) {
      if (currentKey) {
        sections[currentKey] = buffer.join("\n");
      }
      currentKey = matched.key;
      buffer = [];
    } else if (currentKey) {
      buffer.push(line);
    }
  }
  if (currentKey && buffer.length) {
    sections[currentKey] = buffer.join("\n");
  }

  // 3b. Dynamic Summary Extraction
  let summary = sections.summary ? sections.summary.trim() : "";
  if (!summary) {
    const introLines = [];
    for (let i = 1; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      if (/^(?:education|technical\s+skills|skills|projects|experience|achievements|about\s+me)\b/i.test(line)) {
        break;
      }
      if (!/@|http|www|\.com|\.in|\d{10}/.test(line) && line.length > 20) {
        introLines.push(line);
      }
    }
    if (introLines.length) {
      summary = introLines.join(" ");
    }
  }

  // 4. Dynamic Education Extraction
  const education = [];
  if (sections.education) {
    const eduLines = sections.education.split("\n").map((l) => l.trim()).filter(Boolean);
    let currentDegree = null;
    let currentInst = "";
    let currentDetails = "";

    const DEGREE_REGEX = /(?:bachelor|master|b\.e\.|b\.tech|b\.s\.|m\.s\.|m\.tech|ph\.d\.|class\s+xii|class\s+x|diploma|associate|higher\s+secondary|secondary|icse|cbse)/i;

    for (const el of eduLines) {
      if (DEGREE_REGEX.test(el)) {
        if (currentDegree) {
          education.push({ degree: currentDegree, institution: currentInst, details: currentDetails });
          currentInst = "";
          currentDetails = "";
        }
        currentDegree = el;
      } else if (currentDegree) {
        if (!currentInst) {
          currentInst = el.split("|")[0].trim();
          if (el.includes("|")) {
            currentDetails = el.slice(el.indexOf("|") + 1).trim();
          }
        } else {
          currentDetails += (currentDetails ? " | " : "") + el;
        }
      }
    }
    if (currentDegree) {
      education.push({ degree: currentDegree, institution: currentInst, details: currentDetails });
    }
  }

  // 5. Dynamic Projects & Experience Extraction
  const projects = [];
  const ACTION_VERBS = /\b(?:led|built|developed|designed|handled|trained|implemented|created|engineered|benchmarked|architected|deployed|optimized|configured|automated|integrated|spearheaded|evaluated|analyzed|modeled|orchestrated)\b/i;

  if (sections.projects) {
    const projLines = sections.projects.split("\n").map((l) => l.trim()).filter(Boolean);
    let curProject = null;

    for (let i = 0; i < projLines.length; i++) {
      const pl = projLines[i];
      const isTechStack = /^tech(?:nology|\s+stack)?\s*:/i.test(pl);
      const isExplicitBullet = /^[•\-*]|\d+\.\s+/.test(pl);
      const startsWithActionVerb = ACTION_VERBS.test(pl.split(/\s+/).slice(0, 3).join(" "));

      if (isTechStack) {
        if (curProject) {
          curProject.techStack = pl.replace(/^tech(?:nology|\s+stack)?\s*:\s*/i, "").trim();
        }
        continue;
      }

      // Check if line is a role/subtitle line right below project name
      if (
        curProject &&
        curProject.bullets.length === 0 &&
        !curProject.role &&
        (/^(?:team\s+lead|lead|frontend|backend|full\s*stack|developer|engineer|intern|contributor)\b/i.test(pl) ||
          (pl.includes("|") && pl.length < 75))
      ) {
        curProject.role = pl;
        continue;
      }

      // Check if line is a bullet point
      if (isExplicitBullet || (curProject && startsWithActionVerb)) {
        const cleanedBullet = pl.replace(/^[•\-*]\s*|\d+\.\s*/, "").trim();
        curProject.bullets.push(cleanedBullet);
        continue;
      }

      // Check if line is a continuation of the previous bullet
      if (curProject && curProject.bullets.length > 0) {
        const lastBulletIdx = curProject.bullets.length - 1;
        const isDistinctTitle =
          pl.length < 80 &&
          !/[.,;]$/.test(pl) &&
          (/platform|screening|detection|system|pipeline|application|app|service|tracker|dashboard/i.test(pl) ||
            (i + 1 < projLines.length && /^tech(?:nology|\s+stack)?\s*:/i.test(projLines[i + 1])));

        if (!isDistinctTitle) {
          curProject.bullets[lastBulletIdx] += " " + pl;
          continue;
        }
      }

      // New project title
      if (curProject) projects.push(curProject);
      curProject = {
        name: pl.split("|")[0].trim(),
        role: pl.includes("|") ? pl.slice(pl.indexOf("|") + 1).trim() : "",
        techStack: "",
        bullets: [],
      };
    }
    if (curProject) projects.push(curProject);
  }

  // 6. Dynamic Skills Extraction
  const skills = {};
  if (sections.skills) {
    const skillLines = sections.skills.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const sl of skillLines) {
      if (sl.includes(":")) {
        const colonIdx = sl.indexOf(":");
        const cat = sl.slice(0, colonIdx).trim();
        const items = sl.slice(colonIdx + 1).split(/[,•|]+/).map((s) => s.trim()).filter(Boolean);
        if (cat && items.length) {
          skills[cat] = items;
        }
      }
    }
    if (Object.keys(skills).length === 0) {
      skills["Technical Skills"] = sections.skills
        .split(/[,•|\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 35);
    }
  }

  // 7. Dynamic Achievements Extraction
  const achievements = [];
  if (sections.achievements) {
    const achLines = sections.achievements.split("\n").map((l) => l.trim()).filter(Boolean);
    let curAch = "";
    for (const al of achLines) {
      if (/^-\s*\d+\s+of\s+\d+\s*-/i.test(al) || /^(?:page\s+\d+|http)/i.test(al)) continue;
      if (/^[•\-*]|\d+\.\s+/.test(al) || al.startsWith("1st") || al.startsWith("Top")) {
        if (curAch) achievements.push(curAch);
        curAch = al.replace(/^[•\-*]\s*|\d+\.\s*/, "").trim();
      } else if (curAch) {
        curAch += " " + al;
      } else {
        curAch = al;
      }
    }
    if (curAch) achievements.push(curAch);
  }

  return { name, contact, summary, education, projects, skills, achievements };
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

export const tailorResumeWithEvidence = async ({
  rawResumeText,
  jobDescription,
  requirements,
  evidenceItems,
  targetRole,
  targetCompany = "",
  userName = "",
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
          generationConfig: { responseMimeType: "application/json" },
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

  // 4. Safe Merging
  let finalName =
    structuredTailored?.name &&
    !/^candidate$/i.test(structuredTailored.name) &&
    !/^full name$/i.test(structuredTailored.name)
      ? structuredTailored.name
      : baseResume.name;

  if (!finalName || /^candidate$/i.test(finalName)) {
    finalName = userName || "Candidate";
  }

  const finalContact = {
    email: structuredTailored?.contact?.email || baseResume.contact.email,
    phone: structuredTailored?.contact?.phone || baseResume.contact.phone,
    linkedin: structuredTailored?.contact?.linkedin || baseResume.contact.linkedin,
    github: structuredTailored?.contact?.github || baseResume.contact.github,
    location: structuredTailored?.contact?.location || baseResume.contact.location,
  };

  // Deep clone skills and projects to guarantee clean modifications
  let finalSkills =
    structuredTailored?.skills && Object.keys(structuredTailored.skills).length > 0
      ? JSON.parse(JSON.stringify(structuredTailored.skills))
      : JSON.parse(JSON.stringify(baseResume.skills));

  let finalProjects =
    structuredTailored?.projects && structuredTailored.projects.length > 0
      ? JSON.parse(JSON.stringify(structuredTailored.projects))
      : JSON.parse(JSON.stringify(baseResume.projects));

  // 5. INJECT VERIFIED EVIDENCE: Update Technical Skills & Projects
  if (verifiedEvidence.length > 0) {
    const skillCategories = Object.keys(finalSkills);

    verifiedEvidence.forEach((e) => {
      const req = e.requirement_text || e.requirementText || "";
      const ctx =
        typeof e.context_data === "string"
          ? JSON.parse(e.context_data || "{}")
          : e.context_data || e.contextData || {};

      // 5a. Extract technical skills from requirement label and context
      const candidateTerms = [];
      const bracketMatch = req.match(/\(([^)]+)\)/);
      if (bracketMatch) {
        bracketMatch[1].split(/[\/,|]+/).forEach((t) => {
          const clean = t.trim();
          if (clean.length >= 2 && !/^(etc|and|or)$/i.test(clean)) candidateTerms.push(clean);
        });
      } else {
        req.split(/[\/,|&]+/).forEach((t) => {
          const clean = t.trim();
          if (
            clean.length >= 2 &&
            clean.length <= 25 &&
            !/^(frameworks|libraries|models|engineering|development|systems|production|commercial)$/i.test(clean)
          ) {
            candidateTerms.push(clean);
          }
        });
      }

      // Check context text for known technologies
      const techKeywords = [
        "Docker",
        "Kubernetes",
        "PyTorch",
        "TensorFlow",
        "FastAPI",
        "Flask",
        "JAX",
        "MLOps",
        "ONNX",
        "Triton",
        "React",
        "Node.js",
        "Express",
        "MongoDB",
        "MySQL",
        "PostgreSQL",
        "AWS",
        "GCP",
        "Azure",
        "CI/CD",
        "Redis",
        "Kafka",
        "Git",
        "Linux",
        "REST APIs",
      ];
      techKeywords.forEach((tech) => {
        const regex = new RegExp(`(?<!\\w)${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\w)`, "i");
        if (regex.test(ctx.whatDone || "") || regex.test(ctx.where || "")) {
          candidateTerms.push(tech);
        }
      });

      const uniqueTerms = Array.from(new Set(candidateTerms));

      // 5b. Update Skills section cleanly in appropriate category
      if (uniqueTerms.length > 0) {
        if (Array.isArray(finalSkills)) {
          uniqueTerms.forEach((term) => {
            if (!finalSkills.some((s) => s.toLowerCase() === term.toLowerCase())) {
              finalSkills.push(term);
            }
          });
        } else if (typeof finalSkills === "object" && finalSkills !== null) {
          uniqueTerms.forEach((term) => {
            const termLower = term.toLowerCase();
            const exists = Object.values(finalSkills).some((list) => {
              const arr = Array.isArray(list) ? list : String(list).split(/,\s*/);
              return arr.some((s) => s.toLowerCase() === termLower);
            });
            if (exists) return;

            // Determine target category
            let targetCategory = null;
            if (/pytorch|tensorflow|jax|keras|onnx|cv|nlp|scikit|model/i.test(term)) {
              targetCategory = skillCategories.find((c) =>
                /\b(?:ai|ml|machine\s*learning|deep\s*learning)\b/i.test(c)
              );
            } else if (/docker|k8s|kubernetes|aws|gcp|ci\/cd|mlops|linux|git/i.test(term)) {
              targetCategory =
                skillCategories.find((c) => /^tools\b/i.test(c)) ||
                skillCategories.find((c) => /\b(?:devops|cloud|platform|infrastructure)\b/i.test(c)) ||
                skillCategories.find((c) => /\btools\b/i.test(c));
            } else if (/fastapi|flask|node|express|react|api/i.test(term)) {
              targetCategory = skillCategories.find((c) =>
                /\b(?:web|backend|frameworks|development)\b/i.test(c)
              );
            }

            if (!targetCategory) {
              targetCategory =
                skillCategories.find((c) => /\b(?:tools|technical\s*skills|ai\/ml)\b/i.test(c)) ||
                skillCategories[0] ||
                "Technical Skills";
            }

            if (!Array.isArray(finalSkills[targetCategory])) {
              finalSkills[targetCategory] =
                typeof finalSkills[targetCategory] === "string"
                  ? finalSkills[targetCategory].split(/,\s*/)
                  : [];
            }

            finalSkills[targetCategory].push(term);
          });
        }
      }

      // 5c. Formulate High-Impact Action Bullet
      const task = (ctx.whatDone || ctx.task || "").trim();
      const outcome = (ctx.measurableOutcomes || ctx.outcome || "").trim();
      const where = (ctx.where || "").trim();

      let bullet = "";
      if (task) {
        const capitalizedTask = task.charAt(0).toUpperCase() + task.slice(1);
        if (outcome) {
          const cleanOutcome = outcome.replace(/^(achieving|resulting in|cutting|reducing|increasing|scaling to)\s*/i, "");
          bullet = `${capitalizedTask}, achieving ${cleanOutcome}.`;
        } else {
          bullet = `${capitalizedTask}.`;
        }
      } else {
        const cleanReq = uniqueTerms.length > 0 ? uniqueTerms.join("/") : req;
        bullet = `Leveraged ${cleanReq} in system architecture and evaluation${outcome ? `, achieving ${outcome}` : ""}.`;
      }

      // 5d. Match to Project
      let matchedProj = null;
      if (where && finalProjects.length > 0) {
        const whereLower = where.toLowerCase();
        matchedProj = finalProjects.find((p) => {
          const pNameLower = (p.name || "").toLowerCase();
          return pNameLower.includes(whereLower) || whereLower.includes(pNameLower);
        });
      }

      if (matchedProj) {
        if (!matchedProj.bullets) matchedProj.bullets = [];
        matchedProj.bullets.push(bullet);
        if (uniqueTerms.length > 0) {
          const existingTech = matchedProj.techStack || "";
          const newTechs = uniqueTerms.filter((t) => !existingTech.toLowerCase().includes(t.toLowerCase()));
          if (newTechs.length) {
            matchedProj.techStack = existingTech ? `${existingTech}, ${newTechs.join(", ")}` : newTechs.join(", ");
          }
        }
      } else if (where && where.length >= 3 && !/^(project|previous|college|various|self)$/i.test(where)) {
        finalProjects.push({
          name: where,
          role: "Core Contributor",
          techStack: uniqueTerms.join(", "),
          bullets: [bullet],
        });
      } else if (finalProjects.length > 0) {
        if (!finalProjects[0].bullets) finalProjects[0].bullets = [];
        finalProjects[0].bullets.push(bullet);
      } else {
        finalProjects.push({
          name: `${targetRole || "Engineering"} Project`,
          role: "Lead Developer",
          techStack: uniqueTerms.join(", "),
          bullets: [bullet],
        });
      }
    });
  }

  // 6. Dynamic ATS-tailored summary reflecting verified competencies
  let finalSummary = structuredTailored?.summary?.trim();
  if (!finalSummary || finalSummary === defaultSummary) {
    const verifiedSkillsList = [];
    Object.values(finalSkills).forEach((list) => {
      const arr = Array.isArray(list) ? list : String(list).split(/,\s*/);
      arr.forEach((s) => {
        if (s && s.length >= 2 && verifiedSkillsList.length < 8) verifiedSkillsList.push(s);
      });
    });
    const projNames = finalProjects.slice(0, 2).map((p) => p.name).filter(Boolean);
    const projStr = projNames.length > 0 ? ` with practical implementation across ${projNames.join(" and ")}` : "";
    finalSummary = `Dedicated ${safeRole} with demonstrated hands-on competencies in ${verifiedSkillsList.slice(0, 5).join(", ")}${projStr}. Experienced in end-to-end technical problem-solving, architectural implementation, and measurable results delivery, seeking to leverage verified capabilities for the ${safeRole} role.`;
  }

  const finalEducation =
    structuredTailored?.education && structuredTailored.education.length > 0
      ? structuredTailored.education
      : baseResume.education;

  const finalAchievements =
    structuredTailored?.achievements && structuredTailored.achievements.length > 0
      ? structuredTailored.achievements
      : baseResume.achievements;

  // Collect all bullets for scoring recalculation
  const allBullets = [];
  finalProjects.forEach((p) => {
    (p.bullets || []).forEach((b) => allBullets.push({ skill: p.name, improvedBullet: b }));
  });

  const skillsFlat = Object.values(finalSkills).flat().join(", ");

  const combinedTailoredText = [
    rawResumeText,
    `\n\n[TAILORED PROFESSIONAL SUMMARY]\n${finalSummary}`,
    `\n\n[CONFIRMED SKILLS]\n${skillsFlat}`,
    `\n\n[VERIFIED PROJECTS & HIGHLIGHTS]\n` +
      finalProjects
        .map(
          (p) =>
            `Project: ${p.name} | Role: ${p.role || ""} | Tech: ${p.techStack || ""}\n` +
            (p.bullets || []).map((b) => `• ${b}`).join("\n")
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

  return {
    originalContent: {
      name: baseResume.name,
      contact: baseResume.contact,
      summary: baseResume.summary,
      skills: baseResume.skills,
      projects: baseResume.projects,
      education: baseResume.education,
      achievements: baseResume.achievements,
    },
    tailoredContent: {
      name: finalName,
      contact: finalContact,
      summary: finalSummary,
      skills: finalSkills,
      projects: finalProjects,
      education: finalEducation,
      achievements: finalAchievements,
      bulletImprovements: allBullets,
      fullTailoredText: combinedTailoredText,
    },
    scoringResult: updatedScoringResult,
  };
};

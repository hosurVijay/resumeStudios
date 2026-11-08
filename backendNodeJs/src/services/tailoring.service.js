import { scoringEngine } from "./scoring/index.js";

const buildPrompt = (rawResumeText, jobDescription, verifiedEvidence, targetRole) => {
  return `
You are an expert ATS resume tailoring engine with a STRICT truthfulness protocol.
Rules:
1. NEVER invent any companies, job titles, dates, certifications, degrees, or false metrics.
2. ONLY incorporate skills and experiences that are confirmed in the Candidate Verified Evidence below.
3. For each verified evidence item, generate an improved bullet point using the format: [Action Verb] + [Specific context/task] + [Measurable outcome or candidate-stated impact].
4. Return ONLY a valid JSON object with the following structure:
{
  "summary": "Tailored 3-4 sentence professional summary aligned to the target role",
  "skills": ["Skill 1", "Skill 2"],
  "bulletImprovements": [
    {
      "skill": "Requirement name",
      "improvedBullet": "Action verb + Context + Measurable result"
    }
  ]
}

Target Role: ${targetRole}
Job Description:
${jobDescription.slice(0, 2000)}

Candidate Verified Evidence:
${JSON.stringify(verifiedEvidence, null, 2)}

Original Resume Text:
${rawResumeText.slice(0, 3000)}
`;
};

const algorithmicTailorFallback = (rawResumeText, verifiedEvidence, targetRole) => {
  const verifiedSkills = verifiedEvidence.map((e) => e.requirement_text || e.requirementText);
  const summary = `Results-driven professional with demonstrated competence in ${verifiedSkills.slice(0, 4).join(", ")}, seeking to leverage verified hands-on background for the ${targetRole} position.`;

  const bulletImprovements = verifiedEvidence.map((e) => {
    const req = e.requirement_text || e.requirementText;
    const ctx = typeof e.context_data === "string" ? JSON.parse(e.context_data || "{}") : e.context_data || e.contextData || {};
    const task = ctx.whatDone || ctx.task || `applied ${req} in project execution`;
    const outcome = ctx.measurableOutcomes || ctx.outcome || "enhancing delivery speed and system reliability";
    const where = ctx.where ? ` at ${ctx.where}` : "";
    return {
      skill: req,
      improvedBullet: `Leveraged ${req} to ${task}${where}, successfully ${outcome}.`,
    };
  });

  return {
    summary,
    skills: verifiedSkills,
    bulletImprovements,
  };
};

export const tailorResumeWithEvidence = async ({
  rawResumeText,
  jobDescription,
  requirements,
  evidenceItems,
  targetRole,
}) => {
  const verifiedEvidence = (evidenceItems || []).filter(
    (e) => (e.candidate_response === "yes" || e.candidate_response === "limited" || e.candidateResponse === "yes" || e.candidateResponse === "limited")
  );

  let structuredTailored = null;

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = buildPrompt(rawResumeText, jobDescription, verifiedEvidence, targetRole);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
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

  if (!structuredTailored) {
    structuredTailored = algorithmicTailorFallback(rawResumeText, verifiedEvidence, targetRole);
  }

  const newTextParts = [
    rawResumeText,
    `\n\n[TAILORED PROFESSIONAL SUMMARY]\n${structuredTailored.summary}`,
    `\n\n[CONFIRMED SKILLS]\n${(structuredTailored.skills || []).join(", ")}`,
    `\n\n[VERIFIED HIGHLIGHTS]\n` +
      (structuredTailored.bulletImprovements || [])
        .map((b) => `• ${b.improvedBullet}`)
        .join("\n"),
  ];
  const combinedTailoredText = newTextParts.join("\n");

  const updatedScoringResult = scoringEngine.calculateScore(
    combinedTailoredText,
    requirements
  );

  return {
    tailoredContent: {
      summary: structuredTailored.summary,
      skills: structuredTailored.skills || [],
      bulletImprovements: structuredTailored.bulletImprovements || [],
      fullTailoredText: combinedTailoredText,
    },
    scoringResult: updatedScoringResult,
  };
};

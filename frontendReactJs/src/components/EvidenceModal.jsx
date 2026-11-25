import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  Plus,
  Info,
  X,
} from "lucide-react";

/**
 * Extracts a concise, clean single technology or skill keyword from a requirement phrase
 * (e.g. "Backend Architecture & REST APIs" -> "REST APIs", "Containerization with Docker" -> "Docker")
 */
export const extractCleanSkill = (label = "") => {
  if (!label || typeof label !== "string") return "";
  let str = label.trim();

  // Known specific skills, tools, and frameworks (ordered by length descending)
  const knownSkills = [
    "REST APIs", "REST API", "GraphQL", "gRPC", "WebSockets", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Redis", "MongoDB", "PostgreSQL", "MySQL", "SQL", "SQLite", "DynamoDB", "Cassandra",
    "React.js", "React", "Node.js", "Express.js", "Next.js", "Vue.js", "Angular",
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", ".NET", "Golang", "Go", "Rust",
    "Git", "GitHub", "GitLab", "CI/CD", "Linux", "Unix", "Bash", "Terraform", "Ansible",
    "TensorFlow", "PyTorch", "Scikit-learn", "Machine Learning", "Deep Learning", "NLP",
    "FastAPI", "Django", "Flask", "Spring Boot", "Tailwind CSS", "HTML", "CSS", "Postman",
    "Jest", "Cypress", "Selenium", "Kafka", "RabbitMQ", "Elasticsearch", "Nginx", "Microservices"
  ];

  const sorted = [...knownSkills].sort((a, b) => b.length - a.length);
  for (const skill of sorted) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:\\b|^)${escaped}(?:\\b|$)`, "i");
    if (regex.test(str)) {
      return skill;
    }
  }

  // Check parenthesized skill: e.g. "Cloud Computing (AWS)" -> "AWS"
  const parenMatch = str.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].trim().length >= 2 && parenMatch[1].trim().length <= 25) {
    return parenMatch[1].trim();
  }

  // Strip category & fluff prefixes
  str = str.replace(
    /^(?:backend|frontend|fullstack|software|cloud|data|system|web|devops|mobile)\s+(?:architecture|development|engineering|design|infrastructure|frameworks?|technologies|tools?)?\s*(?:&|\/|\+|and|with|using|in)?\s*/i,
    ""
  );
  str = str.replace(/^(?:experience|proficiency|hands-on|knowledge|expertise)\s+(?:with|in|of)?\s*/i, "");
  str = str.replace(/^(?:tools?|technologies|frameworks?|languages?)\s*(?:&|\/|:|\-)?\s*/i, "");

  // If there's an '&', '/', 'with', or 'using', take the focused specific tool part
  if (/&|\/|\bwith\b|\busing\b/i.test(str)) {
    const parts = str.split(/&|\/|\bwith\b|\busing\b/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      str = parts[parts.length - 1];
    }
  }

  // Keep concise: pick last 1-2 words
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length > 2) {
    str = words.slice(-2).join(" ");
  }

  return str.trim() || label.trim();
};

export default function EvidenceModal({
  requirements = [],
  initialAnswers = [],
  existingProjects = [],
  updateSummary = true,
  summaryPreview = "",
  onSave,
  onClose,
  isSubmitting = false,
}) {
  const [answers, setAnswers] = useState(() => {
    const map = {};
    initialAnswers.forEach((ans) => {
      const label = ans.requirement_text || ans.requirementText;
      const cleanSkill = extractCleanSkill(label);
      const ctx =
        typeof ans.context_data === "string"
          ? JSON.parse(ans.context_data || "{}")
          : ans.context_data || ans.contextData || {};

      const existingTech = ctx.techUsed !== undefined ? ctx.techUsed : cleanSkill;
      // If existing tech contains fluff prefix like 'Backend Architecture &', use clean skill
      const finalTech =
        !existingTech ||
        existingTech === label ||
        /^(?:backend|frontend|fullstack|cloud|data|system)\s+/i.test(existingTech)
          ? cleanSkill
          : existingTech;

      map[label] = {
        response: ans.candidate_response || ans.candidateResponse || "skip",
        context: {
          where: ctx.where || (existingProjects[0]?.name || ""),
          techUsed: finalTech,
          whatDone: ctx.whatDone || ctx.task || "",
          measurableOutcomes: ctx.measurableOutcomes || ctx.outcome || "",
        },
      };
    });
    return map;
  });

  const handleResponseChange = (reqText, responseType) => {
    setAnswers((prev) => {
      const existing = prev[reqText] || {};
      const defaultWhere = existingProjects[0]?.name || "";
      const cleanSkill = extractCleanSkill(reqText);
      const existingTech = existing.context?.techUsed;
      const finalTech =
        !existingTech ||
        existingTech === reqText ||
        /^(?:backend|frontend|fullstack|cloud|data|system)\s+/i.test(existingTech)
          ? cleanSkill
          : existingTech;

      return {
        ...prev,
        [reqText]: {
          response: responseType,
          context: existing.context?.where
            ? { ...existing.context, techUsed: finalTech }
            : {
                where: defaultWhere,
                techUsed: finalTech,
                whatDone: "",
                measurableOutcomes: "",
              },
        },
      };
    });
  };

  const handleContextChange = (reqText, field, val) => {
    setAnswers((prev) => {
      const existing = prev[reqText] || { response: "yes", context: {} };
      return {
        ...prev,
        [reqText]: {
          ...existing,
          context: {
            ...existing.context,
            [field]: val,
          },
        },
      };
    });
  };

  const handleProjectSelect = (reqText, val) => {
    setAnswers((prev) => ({
      ...prev,
      [reqText]: {
        ...prev[reqText],
        context: {
          ...prev[reqText]?.context,
          where: val,
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = requirements.map((req) => {
      const reqLabel = req.label || req.requirementText;
      const cleanSkill = extractCleanSkill(reqLabel);
      const state = answers[reqLabel] || {};
      const ctx = state.context || {};

      const existingTech = ctx.techUsed !== undefined ? ctx.techUsed : cleanSkill;
      const finalTech =
        !existingTech ||
        existingTech === reqLabel ||
        /^(?:backend|frontend|fullstack|cloud|data|system)\s+/i.test(existingTech)
          ? cleanSkill
          : existingTech;

      return {
        requirementText: reqLabel,
        isMandatory: req.priority === "mandatory" || req.isMandatory || false,
        candidateResponse: state.response || "skip",
        contextData: {
          where: ctx.where || existingProjects[0]?.name || "",
          techUsed: finalTech,
          whatDone: ctx.whatDone || "",
          measurableOutcomes: ctx.measurableOutcomes || "",
        },
      };
    });
    onSave(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Truth-Preserving Evidence Interview
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Attach missing skills and requirements directly to your genuine company experience. We enhance your authentic accomplishments into recruiter-grade action bullets with zero hallucinated dates or roles.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {summaryPreview && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">
                Summary Setting:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {updateSummary ? "Tailored ATS Summary (Active)" : "Original Resume Summary Preserved"}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 italic max-w-xs truncate hidden sm:inline">
              "{summaryPreview.slice(0, 50)}..."
            </span>
          </div>
        )}

        {/* Requirements Form List */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {requirements.map((req, idx) => {
            const reqLabel = req.label || req.requirementText;
            const current = answers[reqLabel] || { response: "skip", context: {} };
            const isMandatory = req.priority === "mandatory" || req.isMandatory;
            const currentWhere = current.context?.where || "";
            const isCustomWhere = current.context?.isCustomWhere;

            // Find matching project from existing projects
            const matchedExistingProject =
              !isCustomWhere && currentWhere && existingProjects.length > 0
                ? existingProjects.find(
                    (p) =>
                      (p.name || "").toLowerCase() === currentWhere.toLowerCase() ||
                      (p.name || "").toLowerCase().includes(currentWhere.toLowerCase())
                  )
                : null;

            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-3.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {reqLabel}
                      </span>
                      {isMandatory ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
                          Mandatory Gap
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          Preferred Skill
                        </span>
                      )}
                    </div>
                    {req.suggestion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        💡 {req.suggestion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Candidate Response Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "yes")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.response === "yes"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Yes, Hands-on</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "limited")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.response === "limited"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Limited / Basic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "no")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.response === "no"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>No Experience</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "skip")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      current.response === "skip"
                        ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-700"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Skip Gap</span>
                  </button>
                </div>

                {/* Evidence Context Section */}
                {(current.response === "yes" || current.response === "limited") && (
                  <div className="pt-3 space-y-3 bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                    {/* 1. Project / Company Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Which company or project on your resume does this belong to?
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Integrates directly into selected section
                        </span>
                      </div>

                      {existingProjects.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={currentWhere || existingProjects[0]?.name || ""}
                            onChange={(e) => handleProjectSelect(reqLabel, e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                          >
                            {existingProjects.map((p, pIdx) => (
                              <option key={pIdx} value={p.name}>
                                {p.name} {p.role ? `• ${p.role}` : ""}
                              </option>
                            ))}
                          </select>

                          {/* Existing section content preview card */}
                          {matchedExistingProject && (
                            <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#0F4C3A] dark:text-emerald-300 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5" />
                                  Existing Section: {matchedExistingProject.name}
                                </span>
                                {matchedExistingProject.role && (
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                    {matchedExistingProject.role}
                                  </span>
                                )}
                              </div>

                              {/* Skills / Tech Used in this Section */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                                  Skills / Technologies used in this section:
                                </label>
                                <input
                                  type="text"
                                  value={
                                    current.context?.techUsed !== undefined &&
                                    current.context.techUsed !== reqLabel &&
                                    !/^(?:backend|frontend|fullstack|cloud|data|system)\s+/i.test(current.context.techUsed)
                                      ? current.context.techUsed
                                      : extractCleanSkill(reqLabel)
                                  }
                                  onChange={(e) => handleContextChange(reqLabel, "techUsed", e.target.value)}
                                  placeholder="e.g. REST APIs, Redis, Docker"
                                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20"
                                />
                                {matchedExistingProject.techStack && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                                    Current section tech stack: <span className="italic">{matchedExistingProject.techStack}</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                                🔒 100% Section Preservation: No new sections are created. This skill and accomplishment will be integrated directly into {matchedExistingProject.name} without altering your general Technical Skills list.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentWhere}
                          onChange={(e) => handleContextChange(reqLabel, "where", e.target.value)}
                          placeholder="Company or Project name (e.g. Acme Corp, AI Search Engine)"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                        />
                      )}
                    </div>

                    {/* 2. Specific Task / Work Done */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Specific task / work accomplished with {extractCleanSkill(reqLabel) || reqLabel}
                        </label>
                        <input
                          type="text"
                          value={current.context?.whatDone || ""}
                          onChange={(e) => handleContextChange(reqLabel, "whatDone", e.target.value)}
                          placeholder="e.g. built microservice API, automated deployment pipelines"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Brief summary is fine—our engine refines it into executive phrasing.
                        </span>
                      </div>

                      {/* 3. Measurable Outcome */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Measurable outcome (Optional)
                        </label>
                        <input
                          type="text"
                          value={current.context?.measurableOutcomes || ""}
                          onChange={(e) =>
                            handleContextChange(reqLabel, "measurableOutcomes", e.target.value)
                          }
                          placeholder="e.g. reduced latency by 35%, scaled to 10k users"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Optional metrics make the resulting bullet point stand out to recruiters.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>{isSubmitting ? "Synthesizing Evidence..." : "Confirm & Tailor Resume"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

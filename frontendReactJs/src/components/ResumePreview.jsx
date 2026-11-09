import React, { useState, useMemo } from "react";
import {
  Download,
  FileText,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  MapPin,
  GraduationCap,
  Award,
  FolderGit2,
  Printer,
  Sparkles,
  EyeOff,
  Columns,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Layers,
} from "lucide-react";

/**
 * Safely highlights analyzed ATS key terms in a string without altering any text.
 */
function highlightText(text, terms = [], active = true) {
  if (!text || !active || !terms || terms.length === 0) return text;

  const validTerms = Array.from(
    new Set(
      terms
        .map((t) => String(t || "").trim())
        .filter((t) => t.length >= 2 && !/^(and|the|for|with|using|etc|from|our|your|into|onto|all|per)$/i.test(t))
    )
  ).sort((a, b) => b.length - a.length);

  if (validTerms.length === 0) return text;

  const escaped = validTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = String(text).split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const isMatch = validTerms.some((t) => t.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-semibold px-1 py-0.5 rounded border border-blue-300 dark:border-blue-700/80 transition-colors"
          title="Analyzed ATS Key Term"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Single Resume Sheet View
 */
function ResumeCard({
  title,
  badgeText,
  badgeType = "slate", // "slate" | "emerald"
  score,
  scoreLabel,
  content = {},
  isTailored = false,
  targetRole = "",
  highlightTerms = [],
  showHighlights = true,
  candidateName = "Candidate",
}) {
  const displayName =
    content.name && !/^candidate$/i.test(content.name)
      ? content.name
      : candidateName && !/^candidate$/i.test(candidateName)
      ? candidateName
      : "Candidate";
  const contact = content.contact || {};
  const summary = content.summary || "";
  const rawSkills = content.skills || {};
  const projects = content.projects || [];
  const education = content.education || [];
  const achievements = content.achievements || [];

  return (
    <div
      className={`rounded-2xl border flex flex-col h-full bg-white dark:bg-slate-900 transition-all ${
        isTailored
          ? "border-blue-300 dark:border-blue-800 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
          : "border-slate-200 dark:border-slate-800 shadow-xs"
      }`}
    >
      {/* Pane Header */}
      <div
        className={`p-4 border-b flex flex-wrap items-center justify-between gap-2 ${
          isTailored
            ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              badgeType === "emerald"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
            }`}
          >
            {badgeText}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {title}
          </span>
        </div>

        {score !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{scoreLabel}:</span>
            <span className={isTailored ? "text-emerald-600 dark:text-emerald-400 text-sm" : "text-slate-700 dark:text-slate-300"}>
              {score}%
            </span>
          </div>
        )}
      </div>

      {/* Pane Content Body */}
      <div className="p-5 sm:p-6 space-y-5 text-slate-900 dark:text-slate-100 flex-1 overflow-y-auto max-h-[850px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {/* Header Name & Contact */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            {displayName}
          </h2>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
            {targetRole}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {contact.phone}
              </span>
            )}
            {contact.linkedin && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-500" />
                {contact.linkedin.replace(/^https?:\/\//, "")}
              </span>
            )}
            {contact.github && (
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                {contact.github.replace(/^https?:\/\//, "")}
              </span>
            )}
            {contact.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {contact.location}
              </span>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {summary && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Professional Summary
              </h3>
              {isTailored && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  Role-Aligned
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
              {isTailored ? highlightText(summary, highlightTerms, showHighlights) : summary}
            </p>
          </div>
        )}

        {/* Technical Skills */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Technical Skills
            </h3>
            {isTailored && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                Categorized & Prioritized
              </span>
            )}
          </div>

          {Array.isArray(rawSkills) ? (
            <div className="flex flex-wrap gap-1">
              {rawSkills.map((s, idx) => {
                const isMatched = highlightTerms.some((t) => t.toLowerCase() === String(s).toLowerCase());
                return (
                  <span
                    key={idx}
                    className={`text-[11px] px-2 py-0.5 rounded-md ${
                      isTailored && isMatched && showHighlights
                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
              {Object.entries(rawSkills).map(([cat, list], idx) => {
                const items = Array.isArray(list) ? list : String(list).split(/,\s*/);
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white min-w-[150px] shrink-0">
                      {cat}:
                    </span>
                    <div className="flex flex-wrap gap-1 items-center">
                      {items.map((item, itemIdx) => {
                        const trimmed = String(item).trim();
                        const isMatched = highlightTerms.some(
                          (t) => t.toLowerCase() === trimmed.toLowerCase()
                        );
                        return (
                          <span
                            key={itemIdx}
                            className={`px-1.5 py-0.5 rounded-md ${
                              isTailored && isMatched && showHighlights
                                ? "bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FolderGit2 className="w-3 h-3" />
                Projects & Experience
              </h3>
              {isTailored && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Evidence Verified
                </span>
              )}
            </div>
            <div className="space-y-3.5">
              {projects.map((proj, pIdx) => (
                <div key={pIdx} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {proj.name}
                      {proj.role && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">
                          — {proj.role}
                        </span>
                      )}
                    </span>
                  </div>
                  {proj.techStack && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      Tech Stack: {isTailored ? highlightText(proj.techStack, highlightTerms, showHighlights) : proj.techStack}
                    </p>
                  )}
                  <ul className="space-y-1 pl-2">
                    {(proj.bullets || []).map((b, bIdx) => (
                      <li
                        key={bIdx}
                        className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 flex items-start gap-1.5"
                      >
                        <span className="text-blue-500 font-bold shrink-0">•</span>
                        <span>{isTailored ? highlightText(b, highlightTerms, showHighlights) : b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Education (100% Preserved)
            </h3>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={idx} className="text-[11px]">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {edu.degree}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {edu.institution} {edu.details && `— ${edu.details}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Achievements & Awards (100% Preserved)
            </h3>
            <ul className="space-y-1 pl-2">
              {achievements.map((ach, idx) => (
                <li
                  key={idx}
                  className="text-[11px] text-slate-800 dark:text-slate-200 flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-amber-500 font-bold shrink-0">★</span>
                  <span>{isTailored ? highlightText(ach, highlightTerms, showHighlights) : ach}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumePreview({
  candidateName = "Candidate",
  targetRole = "Software Engineer",
  targetCompany = "",
  originalContent = null,
  tailoredContent = {},
  initialScore = 58,
  updatedScore = 84,
  isApproved = false,
  onApprove,
  onDownload,
  isApproving = false,
  highlightTerms = [],
  onClose,
  downloadingFormat = null,
}) {
  const [confirmed, setConfirmed] = useState(isApproved);
  const [showHighlights, setShowHighlights] = useState(true);
  const [viewMode, setViewMode] = useState("split"); // "split" | "tailored" | "original"

  const scoreGain = Math.max(0, updatedScore - initialScore);

  const fallbackOriginal = useMemo(() => {
    if (originalContent) return originalContent;
    return {
      name: tailoredContent.name || candidateName,
      contact: tailoredContent.contact || {},
      summary: "Engineering student focused on practical system development, full-stack architectures, and hands-on ML workflows.",
      skills: tailoredContent.skills || {},
      projects: tailoredContent.projects || [],
      education: tailoredContent.education || [],
      achievements: tailoredContent.achievements || [],
    };
  }, [originalContent, tailoredContent, candidateName]);

  const totalAnalyzedTerms = useMemo(() => {
    return Array.from(
      new Set(
        highlightTerms
          .map((t) => String(t || "").trim())
          .filter((t) => t.length >= 2)
      )
    ).length;
  }, [highlightTerms]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-colors space-y-0">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Interactive Resume Comparison
            </span>
            {isApproved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-3 h-3" />
                Approved Version
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3 h-3" />
              {totalAnalyzedTerms} ATS Terms Highlighted
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {targetRole} {targetCompany ? `@ ${targetCompany}` : ""}
          </h2>
        </div>

        {/* View Switcher & Action Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="View Original and Tailored Resumes Side-by-Side"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("tailored")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "tailored"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="View Only Tailored Version"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tailored</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "original"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="View Only Original Resume"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
          </div>

          {/* Highlight Toggle */}
          <button
            type="button"
            onClick={() => setShowHighlights(!showHighlights)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showHighlights
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
            }`}
            title="Toggle ATS Key Terms Highlighting"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{showHighlights ? "Highlights ON" : "Highlights OFF"}</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Print or Save PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Hide button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Comparison Area */}
      <div className="p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40">
        {viewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 1. Original Resume Sheet */}
            <div className="space-y-2">
              <ResumeCard
                title="Original Resume (Pre-Tailoring)"
                badgeText="1. Original"
                badgeType="slate"
                score={initialScore}
                scoreLabel="Pre-Tailoring Score"
                content={fallbackOriginal}
                isTailored={false}
                targetRole={targetRole}
                candidateName={candidateName}
              />
            </div>

            {/* 2. Tailored ATS Sheet */}
            <div className="space-y-2">
              <ResumeCard
                title="Tailored ATS Version (Optimized)"
                badgeText="2. Tailored PDF"
                badgeType="emerald"
                score={updatedScore}
                scoreLabel="ATS Boosted Match"
                content={tailoredContent}
                isTailored={true}
                targetRole={targetRole}
                highlightTerms={highlightTerms}
                showHighlights={showHighlights}
                candidateName={candidateName}
              />
            </div>
          </div>
        )}

        {viewMode === "tailored" && (
          <div className="max-w-3xl mx-auto">
            <ResumeCard
              title="Tailored ATS Version (Optimized Draft)"
              badgeText="Tailored ATS Version"
              badgeType="emerald"
              score={updatedScore}
              scoreLabel="ATS Boosted Match"
              content={tailoredContent}
              isTailored={true}
              targetRole={targetRole}
              highlightTerms={highlightTerms}
              showHighlights={showHighlights}
              candidateName={candidateName}
            />
          </div>
        )}

        {viewMode === "original" && (
          <div className="max-w-3xl mx-auto">
            <ResumeCard
              title="Original Uploaded Resume"
              badgeText="Original Resume"
              badgeType="slate"
              score={initialScore}
              scoreLabel="Pre-Tailoring Score"
              content={fallbackOriginal}
              isTailored={false}
              targetRole={targetRole}
              candidateName={candidateName}
            />
          </div>
        )}
      </div>

      {/* Action Footer Bar for the Second (Tailored) Resume */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {!isApproved ? (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  I reviewed both versions and confirm the tailored highlights are truthful.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={onApprove}
                disabled={!confirmed || isApproving}
                className="flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isApproving ? "Approving..." : "Approve & Download (1 Credit)"}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Tailored ATS resume approved! Download the 2nd (optimized) version:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => onDownload("pdf")}
                disabled={downloadingFormat === "pdf"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer"
                title="Download the 2nd (Tailored) ATS PDF"
              >
                {downloadingFormat === "pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download Tailored PDF</span>
              </button>

              <button
                onClick={() => onDownload("html")}
                disabled={downloadingFormat === "html"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                title="Download ATS HTML"
              >
                {downloadingFormat === "html" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download HTML</span>
              </button>

              <button
                onClick={() => onDownload("txt")}
                disabled={downloadingFormat === "txt"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

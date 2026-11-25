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
          className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-semibold px-1 py-0.5 rounded border border-emerald-300 dark:border-emerald-700/80 transition-colors"
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
  originalContent = null,
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

  const originalBulletsSet = useMemo(() => {
    const set = new Set();
    if (originalContent?.projects && Array.isArray(originalContent.projects)) {
      originalContent.projects.forEach((p) => {
        if (Array.isArray(p?.bullets)) {
          p.bullets.forEach((b) => {
            const str = typeof b === "string" ? b.trim() : (b?.improvedBullet || "").trim();
            if (str) set.add(str);
          });
        }
      });
    }
    return set;
  }, [originalContent]);

  const isSummaryModified = useMemo(() => {
    if (!isTailored || !content.summary) return false;
    if (content?.modifiedSections?.summary !== undefined) {
      return Boolean(content.modifiedSections.summary);
    }
    const orig = (originalContent?.summary || "").trim();
    const curr = content.summary.trim();
    return Boolean(orig && curr && curr !== orig);
  }, [isTailored, content.summary, content?.modifiedSections, originalContent]);

  return (
    <div
      className={`rounded-2xl border flex flex-col h-full bg-white dark:bg-slate-900 transition-all ${
        isTailored
          ? "border-emerald-300 dark:border-emerald-800 shadow-md shadow-emerald-500/5 ring-1 ring-[#0F4C3A]/20"
          : "border-slate-200 dark:border-slate-800 shadow-xs"
      }`}
    >
      {/* Pane Header */}
      <div
        className={`p-4 border-b flex flex-wrap items-center justify-between gap-2 ${
          isTailored
            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
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
          <p className="text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400 mt-0.5">
            {content.targetRoleTitle || targetRole}
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
                <Globe className="w-3 h-3 text-[#0F4C3A] dark:text-emerald-400" />
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

        {/* Authentic Dynamic Sections Rendering */}
        {Array.isArray(content.sections) && content.sections.length > 0 ? (
          content.sections.map((sec, sIdx) => {
            // 1. Summary Section (e.g. EXECUTIVE SUMMARY / PROFESSIONAL SUMMARY)
            if (sec.type === "summary") {
              const summaryTextVal = sec.text || sec.rawContent || "";
              if (!summaryTextVal) return null;
              return (
                <div key={sIdx}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {sec.title}
                      {isTailored && isSummaryModified && showHighlights && (
                        <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                          ✨ Tailored for Role
                        </span>
                      )}
                      {isTailored && !isSummaryModified && showHighlights && (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          🔒 Original Preserved
                        </span>
                      )}
                    </h3>
                  </div>
                  <div
                    className={
                      isTailored && isSummaryModified && showHighlights
                        ? "p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 transition-all shadow-2xs"
                        : ""
                    }
                  >
                    <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
                      {isTailored ? highlightText(summaryTextVal, highlightTerms, showHighlights) : summaryTextVal}
                    </p>
                  </div>
                </div>
              );
            }

            // 2. Impact / Leadership Highlights Section
            if (sec.type === "impact") {
              const bullets = sec.bullets || [];
              if (!bullets.length) return null;
              return (
                <div key={sIdx}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {sec.title}
                      {showHighlights && (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          🔒 100% Preserved as Uploaded
                        </span>
                      )}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {bullets.map((b, bIdx) => (
                      <li key={bIdx} className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                        <span className="text-[#0F4C3A] dark:text-emerald-400 font-bold shrink-0">•</span>
                        <span>{isTailored ? highlightText(b, highlightTerms, showHighlights) : b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            // 3. Core Expertise / Competencies Section
            if (sec.type === "expertise") {
              const items = sec.items || [];
              if (!items.length) return null;
              return (
                <div key={sIdx}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {sec.title}
                      {isTailored && sec.isEnriched && showHighlights ? (
                        <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                          ✨ Enriched with Evidence
                        </span>
                      ) : showHighlights ? (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          🔒 100% Preserved as Uploaded
                        </span>
                      ) : null}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((item, iIdx) => {
                      const isAddedSkill = Boolean(
                        isTailored &&
                        Array.isArray(sec.enrichedSkills) &&
                        sec.enrichedSkills.some((es) => es.toLowerCase() === String(item).trim().toLowerCase())
                      );

                      if (isTailored && isAddedSkill && showHighlights) {
                        return (
                          <span
                            key={iIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <span>{highlightText(item, highlightTerms, showHighlights)}</span>
                            <span className="text-[9px] text-[#0F4C3A] dark:text-emerald-400">✨</span>
                          </span>
                        );
                      }

                      return (
                        <span
                          key={iIdx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {isTailored ? highlightText(item, highlightTerms, showHighlights) : item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 4. Technical Toolkit / Technologies Section
            if (sec.type === "toolkit") {
              const cats = sec.categories || {};
              if (!Object.keys(cats).length) return null;
              return (
                <div key={sIdx}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {sec.title}
                      {isTailored && sec.isEnriched && showHighlights ? (
                        <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                          ✨ Enriched with Evidence
                        </span>
                      ) : showHighlights ? (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          🔒 100% Preserved as Uploaded
                        </span>
                      ) : null}
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                    {Object.entries(cats).map(([cat, list], cIdx) => {
                      const items = Array.isArray(list) ? list : String(list).split(/,\s*/);
                      return (
                        <div key={cIdx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white min-w-[150px] shrink-0">
                            {cat}:
                          </span>
                          <div className="flex flex-wrap gap-1 items-center">
                            {items.map((item, itemIdx) => {
                              const trimmed = String(item).trim();
                              const isAddedSkill = Boolean(
                                isTailored &&
                                Array.isArray(sec.enrichedSkills) &&
                                sec.enrichedSkills.some((es) => es.toLowerCase() === trimmed.toLowerCase())
                              );

                              if (isTailored && isAddedSkill && showHighlights) {
                                return (
                                  <span
                                    key={itemIdx}
                                    className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>{highlightText(trimmed, highlightTerms, showHighlights)}</span>
                                    <span className="text-[9px] text-[#0F4C3A] dark:text-emerald-400">✨</span>
                                  </span>
                                );
                              }

                              return (
                                <span
                                  key={itemIdx}
                                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
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
                </div>
              );
            }

            // 5. Experience & Projects Section
            if (sec.type === "experience") {
              const projList = sec.projects || content.projects || [];
              if (!projList.length) return null;
              return (
                <div key={sIdx}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FolderGit2 className="w-3 h-3" />
                      {sec.title}
                    </h3>
                    {isTailored && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        Evidence Verified
                      </span>
                    )}
                  </div>
                  <div className="space-y-3.5">
                    {projList.filter(Boolean).map((proj, pIdx) => (
                      <div key={pIdx} className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {proj?.name || "Project"}
                            {proj?.role && (
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">
                                — {proj.role}
                              </span>
                            )}
                          </span>
                          {proj?.period && (
                            <span className="text-[10px] font-medium text-slate-400">
                              {proj.period}
                            </span>
                          )}
                        </div>
                        {proj?.techStack && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            Tech Stack: {isTailored ? highlightText(proj.techStack, highlightTerms, showHighlights) : proj.techStack}
                          </p>
                        )}
                        <ul className="space-y-1.5 pl-1">
                          {(proj?.bullets || []).filter(Boolean).map((b, bIdx) => {
                            const bulletText = typeof b === "string" ? b : (b?.improvedBullet || String(b || ""));
                            if (!bulletText) return null;

                            const isModifiedBullet = Boolean(
                              isTailored &&
                              (
                                (originalBulletsSet.size > 0 && !originalBulletsSet.has(bulletText.trim())) ||
                                (Array.isArray(content?.modifiedBulletTexts) && content.modifiedBulletTexts.includes(bulletText.trim()))
                              )
                            );

                            if (isTailored && isModifiedBullet && showHighlights) {
                              return (
                                <li
                                  key={bIdx}
                                  className="text-[11px] leading-relaxed p-2 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 flex items-start gap-2 shadow-2xs transition-all"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-xs">✨</span>
                                  <div className="space-y-0.5">
                                    <span>{highlightText(bulletText, highlightTerms, showHighlights)}</span>
                                    <span className="block text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 uppercase tracking-wider bg-emerald-100/90 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded w-fit">
                                      Tailored from Candidate Evidence
                                    </span>
                                  </div>
                                </li>
                              );
                            }

                            return (
                              <li
                                key={bIdx}
                                className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 flex items-start gap-1.5"
                              >
                                <span className="text-[#0F4C3A] dark:text-emerald-400 font-bold shrink-0">•</span>
                                <span>{isTailored ? highlightText(bulletText, highlightTerms, showHighlights) : bulletText}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // 6. Education Section
            if (sec.type === "education") {
              const eduItems = sec.items || content.education || [];
              if (!eduItems.length) return null;
              return (
                <div key={sIdx}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {sec.title}
                    </span>
                    {showHighlights && (
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        🔒 100% Preserved as Uploaded
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2 text-[11px]">
                    {eduItems.map((edu, idx) => {
                      if (typeof edu === "string") {
                        return (
                          <p key={idx} className="leading-relaxed text-slate-800 dark:text-slate-200">
                            {edu}
                          </p>
                        );
                      }
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {edu.degree}
                            </span>
                            {edu.period && (
                              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0">
                                {edu.period}
                              </span>
                            )}
                          </div>
                          {(edu.institution || edu.location || edu.details) && (
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                              <span>
                                {edu.institution}
                                {edu.location ? ` — ${edu.location}` : ""}
                              </span>
                              {edu.details && (
                                <span className="font-medium text-slate-700 dark:text-slate-200 shrink-0">
                                  {edu.details}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 7. Recognition / Awards Section
            if (sec.type === "recognition") {
              const bullets = sec.bullets || [];
              if (!bullets.length) return null;
              return (
                <div key={sIdx}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {sec.title}
                    </span>
                    {showHighlights && (
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        🔒 100% Preserved as Uploaded
                      </span>
                    )}
                  </h3>
                  <ul className="space-y-1 pl-1">
                    {bullets.map((ach, idx) => (
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
              );
            }

            // 8. Custom Authentic Section
            return (
              <div key={sIdx}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2 flex items-center justify-between">
                  <span>{sec.title}</span>
                  {showHighlights && (
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      🔒 100% Preserved as Uploaded
                    </span>
                  )}
                </h3>
                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {sec.rawContent || sec.text || ""}
                </p>
              </div>
            );
          })
        ) : (
          /* Fallback for legacy data without sections list */
          <>
            {summary && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Professional Summary
                    {isTailored && isSummaryModified && showHighlights && (
                      <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                        ✨ Tailored for Role
                      </span>
                    )}
                    {isTailored && !isSummaryModified && showHighlights && (
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        🔒 Original Preserved
                      </span>
                    )}
                  </h3>
                </div>
                <div
                  className={
                    isTailored && isSummaryModified && showHighlights
                      ? "p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 transition-all shadow-2xs"
                      : ""
                  }
                >
                  <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
                    {isTailored ? highlightText(summary, highlightTerms, showHighlights) : summary}
                  </p>
                </div>
              </div>
            )}

            {/* Technical Skills - ONLY rendered if skills exist */}
            {rawSkills && typeof rawSkills === "object" && Object.keys(rawSkills).length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Technical Skills
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      🔒 100% Preserved as Uploaded
                    </span>
                  </h3>
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
                              ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-semibold"
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
                              return (
                                <span
                                  key={itemIdx}
                                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
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
            )}

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
                  {projects.filter(Boolean).map((proj, pIdx) => (
                    <div key={pIdx} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {proj?.name || "Project"}
                          {proj?.role && (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">
                              — {proj.role}
                            </span>
                          )}
                        </span>
                      </div>
                      {proj?.techStack && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          Tech Stack: {isTailored ? highlightText(proj.techStack, highlightTerms, showHighlights) : proj.techStack}
                        </p>
                      )}
                      <ul className="space-y-1.5 pl-1">
                        {(proj?.bullets || [])
                          .filter(Boolean)
                          .map((b, bIdx) => {
                            const bulletText = typeof b === "string" ? b : (b?.improvedBullet || String(b || ""));
                            if (!bulletText) return null;

                            const isModifiedBullet = Boolean(
                              isTailored &&
                              (
                                (originalBulletsSet.size > 0 && !originalBulletsSet.has(bulletText.trim())) ||
                                (Array.isArray(content?.modifiedBulletTexts) && content.modifiedBulletTexts.includes(bulletText.trim()))
                              )
                            );

                            if (isTailored && isModifiedBullet && showHighlights) {
                              return (
                                <li
                                  key={bIdx}
                                  className="text-[11px] leading-relaxed p-2 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 flex items-start gap-2 shadow-2xs transition-all"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-xs">✨</span>
                                  <div className="space-y-0.5">
                                    <span>{highlightText(bulletText, highlightTerms, showHighlights)}</span>
                                    <span className="block text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-300 uppercase tracking-wider bg-emerald-100/90 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded w-fit">
                                      Tailored from Candidate Evidence
                                    </span>
                                  </div>
                                </li>
                              );
                            }

                            return (
                              <li
                                key={bIdx}
                                className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 flex items-start gap-1.5"
                              >
                                <span className="text-[#0F4C3A] dark:text-emerald-400 font-bold shrink-0">•</span>
                                <span>{isTailored ? highlightText(bulletText, highlightTerms, showHighlights) : bulletText}</span>
                              </li>
                            );
                          })}
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
                <div className="space-y-2 text-[11px]">
                  {education.map((edu, idx) => {
                    if (typeof edu === "string") {
                      return (
                        <p key={idx} className="leading-relaxed text-slate-800 dark:text-slate-200">
                          {edu}
                        </p>
                      );
                    }
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {edu.degree}
                          </span>
                          {edu.period && (
                            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0">
                              {edu.period}
                            </span>
                          )}
                        </div>
                        {(edu.institution || edu.location || edu.details) && (
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span>
                              {edu.institution}
                              {edu.location ? ` — ${edu.location}` : ""}
                            </span>
                            {edu.details && (
                              <span className="font-medium text-slate-700 dark:text-slate-200 shrink-0">
                                {edu.details}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          </>
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
  isTruthConfirmed,
  onTruthConfirmedChange,
}) {
  const [localConfirmed, setLocalConfirmed] = useState(isApproved);
  const confirmed = isTruthConfirmed !== undefined ? isTruthConfirmed : localConfirmed;
  const setConfirmed = onTruthConfirmedChange || setLocalConfirmed;

  const [showHighlights, setShowHighlights] = useState(true);
  const [viewMode, setViewMode] = useState("split"); // "split" | "tailored" | "original"

  const scoreGain = Math.max(0, updatedScore - initialScore);

  const fallbackOriginal = useMemo(() => {
    if (originalContent) return originalContent;
    return {
      name: tailoredContent.name || candidateName,
      contact: tailoredContent.contact || {},
      summary: tailoredContent.summary || "",
      skills: tailoredContent.skills || {},
      projects: tailoredContent.projects || [],
      education: tailoredContent.education || [],
      achievements: tailoredContent.achievements || [],
      sections: tailoredContent.sections || [],
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400">
              Interactive Resume Comparison
            </span>
            {isApproved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-3 h-3" />
                Approved Version
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                  ? "bg-white dark:bg-slate-700 text-[#0F4C3A] dark:text-emerald-300 shadow-xs"
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
                  ? "bg-white dark:bg-slate-700 text-[#0F4C3A] dark:text-emerald-300 shadow-xs"
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
                  ? "bg-white dark:bg-slate-700 text-[#0F4C3A] dark:text-emerald-300 shadow-xs"
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
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#0F4C3A] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
            }`}
            title="Toggle ATS Key Terms Highlighting"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
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
        {/* Highlight Changes Legend / Preservation Banner */}
        {showHighlights && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
              <span>
                <strong className="font-bold">Highlight Changes: ON</strong> — Verified additions (tailored summary & candidate evidence bullets) are highlighted in emerald.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                🔒 Technical Skills, Education & Contact 100% Preserved
              </span>
            </div>
          </div>
        )}

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
                originalContent={fallbackOriginal}
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
              originalContent={fallbackOriginal}
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
                  className="w-4 h-4 rounded-sm text-[#0F4C3A] focus:ring-[#0F4C3A]/20 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
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
                className="flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0F4C3A] hover:bg-[#0A382A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
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
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all cursor-pointer"
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
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#0A382A] text-white shadow-xs transition-colors cursor-pointer"
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

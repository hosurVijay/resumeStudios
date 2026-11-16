import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Building2,
  GraduationCap,
  Award,
  Layers,
  Briefcase,
  AlertTriangle,
  Clock,
  Printer,
  ChevronDown,
} from "lucide-react";
import { api } from "../api/client.js";
import { toast } from "../components/Toast.jsx";
import ScoreGraph from "../components/ScoreGraph.jsx";

export default function ResumeViewer() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appData, setAppData] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [activeTab, setActiveTab] = useState("resume"); // 'resume' | 'audit' | 'jd'

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    setError("");

    api
      .get(`/resumes/applications/${applicationId}/history`)
      .then((res) => {
        if (res.data?.data) {
          setAppData(res.data.data);
        } else {
          setError("No application record found.");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load resume details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId]);

  // Determine display resume: tailored version if exists, else original parsed resume
  const resumeContent = useMemo(() => {
    if (!appData) return null;
    if (appData.latestTailoredVersion?.tailoredContent) {
      return appData.latestTailoredVersion.tailoredContent;
    }
    return appData.originalContent || null;
  }, [appData]);

  const isTailored = Boolean(appData?.latestTailoredVersion && appData.latestTailoredVersion.versionNumber > 1);
  const isApproved = Boolean(appData?.latestTailoredVersion?.isApproved);
  const initialScore = Number(appData?.initialScore) || 0;
  const currentScore = Number(appData?.currentScore ?? appData?.latestTailoredVersion?.score ?? initialScore) || 0;
  const scoreGain = Math.max(0, currentScore - initialScore);

  const handleDownload = async (format) => {
    if (!appData?.latestTailoredVersion?.id) {
      toast.error("Tailored version not found to download. Please open Studio to generate tailored version.");
      return;
    }

    setDownloadingFormat(format);
    try {
      const response = await api.get(
        `/resumes/applications/${applicationId}/versions/${appData.latestTailoredVersion.id}/export?format=${format}`,
        { responseType: "blob" }
      );

      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : format === "txt"
          ? "text/plain;charset=utf-8"
          : "text/html;charset=utf-8";

      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeRole = (appData.targetRole || "Tailored").replace(/[^a-zA-Z0-9]/g, "_");
      link.href = blobUrl;
      link.download = `${safeRole}_Resume.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Exported ${format.toUpperCase()} successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading saved resume details...</p>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resume Not Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error || "Could not retrieve resume data."}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#0F4C3A] text-white hover:bg-[#0A382A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Format skills safely
  const formattedSkills = (() => {
    const s = resumeContent?.skills;
    if (!s) return null;
    if (Array.isArray(s)) return { "Core Skills": s };
    if (typeof s === "object") return s;
    return { "Core Skills": [String(s)] };
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F4C3A] dark:text-emerald-400 uppercase tracking-wider">
                {appData.targetCompany || "General Application"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isApproved
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : isTailored
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                }`}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Approved & Tailored</span>
                  </>
                ) : isTailored ? (
                  <>
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Tailored Version</span>
                  </>
                ) : (
                  <span>Baseline Resume</span>
                )}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {appData.targetRole}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {appData.latestTailoredVersion?.id && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloadingFormat === "pdf"}
                className="flex items-center gap-1.5 text-xs font-bold bg-[#0F4C3A] hover:bg-[#0A382A] text-white px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingFormat === "pdf" ? "Exporting..." : "Download PDF"}</span>
              </button>

              <button
                onClick={() => handleDownload("html")}
                disabled={downloadingFormat === "html"}
                className="flex items-center gap-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>HTML</span>
              </button>

              <button
                onClick={() => handleDownload("txt")}
                disabled={downloadingFormat === "txt"}
                className="flex items-center gap-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>TXT</span>
              </button>
            </div>
          )}

          <Link
            to={`/studio?appId=${applicationId}`}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 px-3.5 py-2 rounded-xl transition-colors"
          >
            <span>Edit in Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Current ATS Match
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{currentScore}%</span>
              {scoreGain > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <TrendingUp className="w-3 h-3" />
                  +{scoreGain}%
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Baseline vs. Tailored
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {initialScore}% <span className="text-slate-400">➔</span> {currentScore}%
            </div>
            <span className="text-[10px] text-slate-400">
              {isTailored ? "Verified through Evidence Q&A" : "Pending tailoring in Studio"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Verification Protocol
            </span>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              Zero Hallucinations
            </div>
            <span className="text-[10px] text-slate-400">Authentic facts & dates preserved</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("resume")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "resume"
              ? "bg-[#0F4C3A] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>ATS Resume Preview</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#0F4C3A] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ATS Audit & Breakdown</span>
        </button>

        {appData.jobDescription && (
          <button
            onClick={() => setActiveTab("jd")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "jd"
                ? "bg-[#0F4C3A] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Target Job Description</span>
          </button>
        )}
      </div>

      {/* Tab 1: ATS Resume Preview Document */}
      {activeTab === "resume" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
          {/* Candidate Header */}
          <div className="text-center space-y-2 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {resumeContent?.name || "Candidate Name"}
            </h2>

            {/* Contact details line */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              {resumeContent?.contact?.email && <span>{resumeContent.contact.email}</span>}
              {resumeContent?.contact?.phone && (
                <>
                  <span>•</span>
                  <span>{resumeContent.contact.phone}</span>
                </>
              )}
              {resumeContent?.contact?.location && (
                <>
                  <span>•</span>
                  <span>{resumeContent.contact.location}</span>
                </>
              )}
              {resumeContent?.contact?.linkedin && (
                <>
                  <span>•</span>
                  <a
                    href={resumeContent.contact.linkedin.startsWith("http") ? resumeContent.contact.linkedin : `https://${resumeContent.contact.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-[#0F4C3A] dark:text-emerald-400 font-medium"
                  >
                    LinkedIn
                  </a>
                </>
              )}
              {resumeContent?.contact?.github && (
                <>
                  <span>•</span>
                  <a
                    href={resumeContent.contact.github.startsWith("http") ? resumeContent.contact.github : `https://${resumeContent.contact.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-[#0F4C3A] dark:text-emerald-400 font-medium"
                  >
                    GitHub
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {resumeContent?.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-1">
                Professional Summary
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {resumeContent.summary}
              </p>
            </div>
          )}

          {/* Technical Skills */}
          {formattedSkills && Object.keys(formattedSkills).length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-1">
                Technical Skills & Competencies
              </h3>
              <div className="space-y-2 text-xs">
                {Object.entries(formattedSkills).map(([cat, items], idx) => {
                  const itemsList = Array.isArray(items)
                    ? items.join(", ")
                    : typeof items === "string"
                    ? items
                    : "";
                  if (!itemsList) return null;

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                      <span className="font-bold text-slate-900 dark:text-white min-w-[140px] shrink-0">
                        {cat}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        {itemsList}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience & Projects */}
          {Array.isArray(resumeContent?.projects) && resumeContent.projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-1">
                Professional Experience & Projects
              </h3>
              <div className="space-y-4">
                {resumeContent.projects.map((proj, pIdx) => (
                  <div key={pIdx} className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {proj.name}
                      </h4>
                      {proj.role && (
                        <span className="text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400">
                          {proj.role}
                        </span>
                      )}
                    </div>

                    {proj.techStack && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <strong className="text-slate-700 dark:text-slate-300 font-sans">Technologies:</strong>{" "}
                        {proj.techStack}
                      </div>
                    )}

                    {Array.isArray(proj.bullets) && proj.bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {Array.isArray(resumeContent?.education) && resumeContent.education.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-1">
                Education
              </h3>
              <div className="space-y-2">
                {resumeContent.education.map((edu, eIdx) => (
                  <div key={eIdx} className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {edu.degree || edu.institution}
                      </span>
                      {edu.institution && edu.degree && (
                        <span className="text-slate-600 dark:text-slate-400"> • {edu.institution}</span>
                      )}
                    </div>
                    {edu.year && <span className="text-slate-500 font-medium">{edu.year}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {Array.isArray(resumeContent?.achievements) && resumeContent.achievements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-950 pb-1">
                Honors & Certifications
              </h3>
              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {resumeContent.achievements.map((ach, aIdx) => (
                  <li key={aIdx}>{ach}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: ATS Audit & Breakdown */}
      {activeTab === "audit" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Breakdown cards */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Requirement Alignment Breakdown
            </h3>
            <div className="space-y-3">
              {(appData.breakdown || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "satisfied"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : item.status === "partial"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.suggestion && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Target Job Description */}
      {activeTab === "jd" && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Job Description</h3>
            <span className="text-xs text-slate-400">
              Role: {appData.targetRole} {appData.targetCompany ? `• ${appData.targetCompany}` : ""}
            </span>
          </div>
          <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-[500px] overflow-y-auto">
            {appData.jobDescription}
          </pre>
        </div>
      )}
    </div>
  );
}

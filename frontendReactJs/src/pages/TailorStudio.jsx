import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  UploadCloud,
  FileText,
  Briefcase,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Download,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "../api/client.js";
import { updateCredits } from "../store/authSlice.js";
import ScoreRing from "../components/ScoreRing.jsx";
import EvidenceModal from "../components/EvidenceModal.jsx";
import ResumePreview from "../components/ResumePreview.jsx";

export default function TailorStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);

  const existingAppId = searchParams.get("appId");

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysisResult, setAnalysisResult] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [savingEvidence, setSavingEvidence] = useState(false);

  const [tailoredData, setTailoredData] = useState(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  // Preview hidden by default with view button
  const [showPreview, setShowPreview] = useState(false);
  const [isTruthConfirmed, setIsTruthConfirmed] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  useEffect(() => {
    if (existingAppId) {
      setLoading(true);
      api
        .get(`/resumes/applications/${existingAppId}/history`)
        .then((res) => {
          const data = res.data.data;
          setAnalysisResult({
            applicationId: data.applicationId,
            targetRole: data.targetRole,
            targetCompany: data.targetCompany,
            jobDescription: data.jobDescription,
            score: data.initialScore,
            mandatoryGaps: data.mandatoryGaps || [],
            breakdown: data.breakdown || [],
          });
          setTargetRole(data.targetRole);
          setTargetCompany(data.targetCompany || "");
          if (data.jobDescription) {
            setJobDescription(data.jobDescription);
          }

          if (data.latestTailoredVersion) {
            setTailoredData({
              versionId: data.latestTailoredVersion.id,
              versionNumber: data.latestTailoredVersion.versionNumber,
              score: data.latestTailoredVersion.score,
              tailoredContent: data.latestTailoredVersion.tailoredContent,
              originalContent: data.originalContent,
            });
            setIsApproved(Boolean(data.latestTailoredVersion.isApproved));
            setIsTruthConfirmed(Boolean(data.latestTailoredVersion.isApproved));
            setStep(3);
          } else {
            setStep(2);
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to load application details.");
        })
        .finally(() => setLoading(false));
    }
  }, [existingAppId]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF or DOCX resume file.");
      return;
    }
    if (!targetRole.trim() || !jobDescription.trim()) {
      setError("Target role and job description are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole);
      formData.append("targetCompany", targetCompany);
      formData.append("jobDescription", jobDescription);

      const response = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysisResult(response.data.data);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || "Analysis failed. Please check your file and job posting."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvidenceModal = async () => {
    if (!analysisResult?.applicationId) return;
    setError("");
    try {
      const res = await api.get(`/resumes/applications/${analysisResult.applicationId}/evidence`);
      setEvidenceItems(res.data.data || []);
    } catch {}
    setShowEvidenceModal(true);
  };

  const handleSaveEvidence = async (items) => {
    if (!analysisResult?.applicationId) return;
    setSavingEvidence(true);

    try {
      await api.post(`/resumes/applications/${analysisResult.applicationId}/evidence`, { items });
      setShowEvidenceModal(false);
      handleGenerateTailored();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save evidence.");
    } finally {
      setSavingEvidence(false);
    }
  };

  const handleGenerateTailored = async () => {
    if (!analysisResult?.applicationId) return;
    setError("");
    setTailoringLoading(true);
    setStep(3);
    setShowPreview(false); // keep preview hidden by default

    try {
      const response = await api.post(`/resumes/applications/${analysisResult.applicationId}/tailor`);
      setTailoredData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Tailoring failed.");
    } finally {
      setTailoringLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!analysisResult?.applicationId || !tailoredData?.versionId) return;
    setApproving(true);

    try {
      await api.post(
        `/resumes/applications/${analysisResult.applicationId}/versions/${tailoredData.versionId}/approve`
      );

      setIsApproved(true);
      setIsTruthConfirmed(true);
      if (userData?.subscriptionStatus !== "active" && userData?.freeCredits > 0) {
        dispatch(updateCredits(userData.freeCredits - 1));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  const handleDownload = async (format = "pdf") => {
    if (!analysisResult?.applicationId || !tailoredData?.versionId) return;
    setDownloadingFormat(format);
    try {
      const response = await api.get(
        `/resumes/applications/${analysisResult.applicationId}/versions/${tailoredData.versionId}/export?format=${format}`,
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
      const safeRole = (analysisResult.targetRole || "Tailored").replace(/[^a-zA-Z0-9]/g, "_");
      link.href = blobUrl;
      link.download = `${safeRole}_Resume.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback to window.open
      const url = `/api/v1/resumes/applications/${analysisResult.applicationId}/versions/${tailoredData.versionId}/export?format=${format}`;
      window.open(url, "_blank");
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Extract key terms required or analyzed by our model
  const highlightTerms = useMemo(() => {
    const terms = new Set();

    // From analysisResult breakdown and mandatoryGaps
    (analysisResult?.breakdown || []).forEach((b) => {
      if (b.label) {
        b.label.split(/[,/|&]+/).forEach((t) => {
          const cleaned = t.trim();
          if (cleaned.length >= 2) terms.add(cleaned);
        });
      }
      if (Array.isArray(b.terms)) {
        b.terms.forEach((t) => {
          const cleaned = String(t).trim();
          if (cleaned.length >= 2) terms.add(cleaned);
        });
      }
    });

    (analysisResult?.mandatoryGaps || []).forEach((g) => {
      if (g.requirement) {
        g.requirement.split(/[,/|&]+/).forEach((t) => {
          const cleaned = t.trim();
          if (cleaned.length >= 2) terms.add(cleaned);
        });
      }
    });

    // From tailoredContent skills
    const skills = tailoredData?.tailoredContent?.skills;
    if (skills) {
      if (Array.isArray(skills)) {
        skills.forEach((s) => terms.add(String(s).trim()));
      } else if (typeof skills === "object") {
        Object.values(skills).forEach((list) => {
          if (Array.isArray(list)) {
            list.forEach((s) => terms.add(String(s).trim()));
          } else if (typeof list === "string") {
            list.split(/[,/|&]+/).forEach((s) => terms.add(s.trim()));
          }
        });
      }
    }

    // From candidate verified evidence
    (evidenceItems || []).forEach((e) => {
      const req = e.requirement_text || e.requirementText;
      if (req) {
        req.split(/[,/|&()]+/).forEach((t) => {
          const cleaned = t.trim();
          if (cleaned.length >= 2) terms.add(cleaned);
        });
      }
      const ctx =
        typeof e.context_data === "string"
          ? JSON.parse(e.context_data || "{}")
          : e.context_data || e.contextData || {};
      if (ctx.where && ctx.where.length >= 2) terms.add(ctx.where.trim());
    });

    // Role-specific terms
    if (analysisResult?.targetRole) {
      analysisResult.targetRole.split(/\s+/).forEach((w) => {
        if (w.length >= 2 && !/^(engineer|developer|lead|senior|junior|intern)$/i.test(w)) {
          terms.add(w);
        }
      });
    }

    return Array.from(terms).filter(
      (t) => t.length >= 2 && !/^(and|the|for|with|using|etc|from|our|your|into|onto|all|per)$/i.test(t)
    );
  }, [analysisResult, tailoredData, evidenceItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Resume Tailoring Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step {step} of 3: {step === 1 ? "Upload & JD" : step === 2 ? "Gap Analysis & Evidence" : "Review & Approval"}
          </p>
        </div>

        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleUploadAndAnalyze} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. Upload Candidate Resume
            </h2>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors relative">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
              {file ? (
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Click or drag to replace</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Drop your resume here, or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Supports PDF and DOCX (Parsed in-memory only)</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Job Role *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Company (Optional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Stripe / Google"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Job Description *
              </label>
              <textarea
                required
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. Our LLD engine will extract mandatory vs. preferred requirements..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>{loading ? "Analyzing Alignment & Extracting Gaps..." : "Analyze Alignment & Find Gaps"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 2 && analysisResult && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Initial Alignment Assessment
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {analysisResult.targetRole} {analysisResult.targetCompany ? `@ ${analysisResult.targetCompany}` : ""}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Based on your uploaded resume and job description, our deterministic scoring engine identified key gaps. Complete the evidence interview to verify your hands-on competencies.
              </p>
            </div>

            <ScoreRing score={analysisResult.score || 0} size={120} label="Pre-Tailoring" />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Identified Skill & Competency Gaps
              </h3>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {analysisResult.mandatoryGaps?.length || 0} Mandatory Gaps
              </span>
            </div>

            <div className="space-y-2.5">
              {analysisResult.mandatoryGaps?.length > 0 ? (
                analysisResult.mandatoryGaps.map((gap, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                      gap.status === "missing"
                        ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                        : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          gap.status === "missing" ? "text-rose-600" : "text-amber-600"
                        }`}
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {gap.requirement}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              gap.status === "missing"
                                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {gap.status === "missing" ? "Missing Domain Pillar" : "Surface Keyword Only"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">{gap.reason}</p>
                        {gap.suggestion && (
                          <p className="text-[11px] text-blue-700 dark:text-blue-300 italic pt-0.5">
                            💡 Tip: {gap.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  No strict mandatory gaps detected. Proceed to review preferred enhancements.
                </p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              {tailoredData ? (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>View Tailored Resume (Step 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleOpenEvidenceModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Verify Real Evidence (Q&A Interview)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          {tailoringLoading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Synthesizing Verified Evidence...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Applying truth-preserving rephrasing and recalculating alignment score using confirmed candidate facts.
              </p>
            </div>
          ) : tailoredData ? (
            <div className="space-y-6">
              {/* Step 3 Review & Approval Control Hub */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Step 3 of 3: Tailoring Complete</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analysisResult?.targetRole} {analysisResult?.targetCompany ? `@ ${analysisResult.targetCompany}` : ""}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                      Your resume has been tailored with verified evidence. Key competencies and requirements are highlighted. Click "View Resume Preview" to inspect the tailored draft.
                    </p>
                  </div>

                  {/* Score pill */}
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pre-Tailoring</span>
                      <span className="text-base font-bold text-slate-500 line-through">{analysisResult?.score || 58}%</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Tailored Match</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{tailoredData?.score || 84}%</span>
                    </div>
                    <div className="pl-2 border-l border-slate-200 dark:border-slate-700 text-left">
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{Math.max(0, (tailoredData?.score || 84) - (analysisResult?.score || 58))}% ATS Boost
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview Trigger Bar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {showPreview ? "Live ATS Tailored Preview (Visible)" : "ATS Tailored Preview (Hidden)"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {showPreview
                          ? "Preview is currently displayed below. You can inspect all highlighted terms or hide it."
                          : "Preview is hidden by default. Click the button to inspect the tailored resume."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Hide Preview</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>View Resume Preview</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Approval & Export Hub */}
                <div className="pt-2">
                  {!isApproved ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isTruthConfirmed}
                          onChange={(e) => setIsTruthConfirmed(e.target.checked)}
                          className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          I confirm that all bullet points and claims are factually truthful.
                        </span>
                      </label>

                      <button
                        onClick={handleApprove}
                        disabled={!isTruthConfirmed || approving}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{approving ? "Approving..." : "Approve & Freeze Version (1 Credit)"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Version approved and frozen. Choose your export format:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleDownload("pdf")}
                          disabled={downloadingFormat === "pdf"}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all cursor-pointer"
                          title="Download ATS-compliant PDF resume"
                        >
                          {downloadingFormat === "pdf" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download PDF</span>
                        </button>

                        <button
                          onClick={() => handleDownload("html")}
                          disabled={downloadingFormat === "html"}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                          title="Download ATS HTML resume"
                        >
                          {downloadingFormat === "html" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download HTML</span>
                        </button>

                        <button
                          onClick={() => handleDownload("txt")}
                          disabled={downloadingFormat === "txt"}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>TXT</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible Preview Section */}
              {showPreview && (
                <div className="animate-in fade-in duration-200">
                  <ResumePreview
                    candidateName={userData?.name || "Candidate"}
                    targetRole={analysisResult?.targetRole}
                    targetCompany={analysisResult?.targetCompany}
                    originalContent={tailoredData.originalContent || tailoredData.tailoredContent?.originalContent}
                    tailoredContent={tailoredData.tailoredContent}
                    initialScore={analysisResult?.score || 58}
                    updatedScore={tailoredData.score || 84}
                    isApproved={isApproved}
                    onApprove={handleApprove}
                    onDownload={handleDownload}
                    isApproving={approving}
                    highlightTerms={highlightTerms}
                    onClose={() => setShowPreview(false)}
                    downloadingFormat={downloadingFormat}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {showEvidenceModal && (
        <EvidenceModal
          requirements={
            analysisResult?.breakdown?.filter(
              (r) => r.status === "missing" || r.status === "partial" || r.status === "uncertain"
            ) || []
          }
          initialAnswers={evidenceItems}
          onSave={handleSaveEvidence}
          onClose={() => setShowEvidenceModal(false)}
          isSubmitting={savingEvidence}
        />
      )}
    </div>
  );
}

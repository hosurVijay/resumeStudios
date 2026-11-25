import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
  RefreshCw,
  Copy,
  Check,
  Edit3,
  SlidersHorizontal,
  Columns,
  ExternalLink,
} from "lucide-react";
import { api } from "../api/client.js";
import { updateCredits } from "../store/authSlice.js";
import ScoreRing from "../components/ScoreRing.jsx";
import EvidenceModal from "../components/EvidenceModal.jsx";
import ResumePreview from "../components/ResumePreview.jsx";
import { toast } from "../components/Toast.jsx";

const summaryToneLabels = {
  executive: "Executive Leadership",
  technical: "Technical & Systems",
  results: "Metrics & Impact",
  product: "Product & Agile",
};

const generateClientSummaryVariant = ({
  targetRole = "",
  targetCompany = "",
  skills = {},
  projects = [],
  tone = "executive",
  index = 0,
}) => {
  const safeRole = targetRole || "Software Engineer";
  const skillsList = [];
  if (skills) {
    Object.values(skills).forEach((list) => {
      const arr = Array.isArray(list) ? list : String(list).split(/,\s*/);
      arr.forEach((s) => {
        const clean = s.trim();
        if (clean.length >= 2 && !skillsList.includes(clean) && skillsList.length < 8) {
          skillsList.push(clean);
        }
      });
    });
  }
  const topSkills =
    skillsList.slice(0, 5).join(", ") ||
    "scalable architectures, cloud infrastructure, and modern software implementation";
  const projNames = (projects || [])
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.name || p)
    .filter(Boolean);
  const projStr = projNames.length > 0 ? ` across ${projNames.join(" and ")}` : "";
  const companyStr = targetCompany ? ` targeting ${targetCompany}` : "";

  const templates = {
    executive: [
      `Accomplished ${safeRole} with a proven track record of driving ${topSkills}${projStr}. Proven ability to align technical roadmaps with strategic business objectives, leading high-performance cross-functional engineering sprints and delivering scalable, enterprise-grade platforms${companyStr}.`,
      `Strategic ${safeRole} experienced in engineering delivery, systems architecture, and technical leadership. Demonstrated success architecting resilient solutions leveraging ${topSkills}${projStr}, empowering distributed engineering teams and driving operational excellence.`,
    ],
    technical: [
      `Hands-on ${safeRole} specializing in end-to-end software architecture, ${topSkills}, and resilient systems design${projStr}. Adept at designing scalable cloud-native microservices, optimizing low-latency database queries, and enforcing clean code practices to deliver robust production-grade systems${companyStr}.`,
      `Technically proficient ${safeRole} with deep expertise in full-lifecycle system implementation using ${topSkills}. Passionate about building maintainable architectures${projStr}, optimizing query performance, and implementing strict test automation across release cycles.`,
    ],
    results: [
      `Performance-driven ${safeRole} with demonstrated success in architecting and delivering high-impact systems leveraging ${topSkills}${projStr}. Recognized for driving measurable operational outcomes, reducing system latency, and spearheading seamless continuous deployment workflows${companyStr}.`,
      `Results-oriented ${safeRole} focused on delivering quantifiable performance enhancements and zero-downtime rollouts. Leveraged ${topSkills}${projStr} to cut infrastructure bottlenecks, optimize asynchronous workflows, and accelerate deployment frequency.`,
    ],
    product: [
      `Solution-oriented ${safeRole} with extensive experience bridging technical implementation and user-centric product requirements${projStr}. Experienced in leading agile iterations, modernizing legacy modules, and deploying mission-critical systems utilizing ${topSkills} for the ${safeRole} role${companyStr}.`,
      `Customer-focused ${safeRole} combining deep domain expertise in ${topSkills} with agile execution${projStr}. Adept at translating complex product requirements into robust, high-performance software features delivered on schedule.`,
    ],
  };

  const pool = templates[tone] || templates.executive;
  return pool[Math.abs(index) % pool.length];
};

export default function TailorStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const isPro = userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100;

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

  // Side-by-side live preview visible by default
  const [showPreview, setShowPreview] = useState(true);
  const [isTruthConfirmed, setIsTruthConfirmed] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [activeSavedApp, setActiveSavedApp] = useState(null);

  // Professional Summary Tailoring States
  const [updateSummary, setUpdateSummary] = useState(true);
  const [activeSummary, setActiveSummary] = useState("");
  const [summaryTone, setSummaryTone] = useState("executive");
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Step 1 Uploaded Resume Live Preview State
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

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
            originalContent: data.originalContent,
          });
          setTargetRole(data.targetRole);
          setTargetCompany(data.targetCompany || "");
          if (data.jobDescription) {
            setJobDescription(data.jobDescription);
          }

          // Hydrate summary state
          if (data.latestTailoredVersion?.tailoredContent?.summary) {
            setActiveSummary(data.latestTailoredVersion.tailoredContent.summary);
            setUpdateSummary(true);
          } else {
            const initialTailored = generateClientSummaryVariant({
              targetRole: data.targetRole,
              targetCompany: data.targetCompany,
              skills: data.originalContent?.skills,
              projects: data.originalContent?.projects,
              tone: "executive",
              index: 0,
            });
            setActiveSummary(initialTailored);
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
            setShowPreview(true);
            setStep(3);
          } else {
            setStep(2);
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to load application details.");
        })
        .finally(() => setLoading(false));
    } else {
      const pendingJd = sessionStorage.getItem("pending_jd");
      if (pendingJd) {
        setJobDescription(pendingJd);
        sessionStorage.removeItem("pending_jd");
      }
      api
        .get("/resumes/my-resumes")
        .then((res) => {
          if (res.data?.data && res.data.data.length > 0) {
            setActiveSavedApp(res.data.data[0]);
          }
        })
        .catch(() => {});
    }
  }, [existingAppId]);

  const currentPreviewText = useMemo(() => {
    if (updateSummary) {
      return activeSummary || "Generating tailored professional summary...";
    }
    return (
      analysisResult?.originalContent?.summary ||
      "No summary found in original resume. Switching to 'Yes' will automatically synthesize an ATS-tailored summary."
    );
  }, [updateSummary, activeSummary, analysisResult]);

  const handleReloadSummary = async (newTone) => {
    const selectedTone = newTone || summaryTone;
    const nextIdx = summaryIndex + 1;
    setSummaryIndex(nextIdx);
    setRegeneratingSummary(true);

    try {
      if (analysisResult?.applicationId) {
        const res = await api.post(
          `/resumes/applications/${analysisResult.applicationId}/generate-summary`,
          { tone: selectedTone, index: nextIdx }
        );
        if (res.data?.data?.summary) {
          setActiveSummary(res.data.data.summary);
          toast.success(`Reloaded ${summaryToneLabels[selectedTone] || ""} summary!`);
          setRegeneratingSummary(false);
          return;
        }
      }
    } catch {
      // Local fallback
    }

    const clientSummary = generateClientSummaryVariant({
      targetRole: analysisResult?.targetRole || targetRole,
      targetCompany: analysisResult?.targetCompany || targetCompany,
      skills: analysisResult?.originalContent?.skills,
      projects: analysisResult?.originalContent?.projects,
      tone: selectedTone,
      index: nextIdx,
    });
    setActiveSummary(clientSummary);
    toast.success(`Reloaded ${summaryToneLabels[selectedTone] || ""} summary!`);
    setRegeneratingSummary(false);
  };

  const handleSelectTone = (toneKey) => {
    setSummaryTone(toneKey);
    handleReloadSummary(toneKey);
  };

  const handleCopySummary = () => {
    const textToCopy = updateSummary
      ? activeSummary
      : (analysisResult?.originalContent?.summary || "");
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedSummary(true);
      toast.success("Summary copied to clipboard!");
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

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
    if (!jobDescription.trim()) {
      setError("Job description is required.");
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

      const data = response.data.data;
      setAnalysisResult(data);
      const initialTailored = generateClientSummaryVariant({
        targetRole: data.targetRole,
        targetCompany: data.targetCompany,
        skills: data.originalContent?.skills,
        projects: data.originalContent?.projects,
        tone: "executive",
        index: 0,
      });
      setActiveSummary(initialTailored);
      setUpdateSummary(true);
      setSummaryTone("executive");
      setSummaryIndex(0);
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
      toast.success("Verified evidence saved successfully!");
      handleGenerateTailored();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save evidence.");
    } finally {
      setSavingEvidence(false);
    }
  };

  const handleGenerateTailored = async () => {
    if (!analysisResult?.applicationId) return;

    const isSubscribed = isPro;
    const availableCredits = userData?.freeCredits ?? 0;

    if (!isSubscribed && availableCredits <= 0) {
      toast.error("You have 0 tailoring credits remaining. Please upgrade or purchase credits to tailor your resume.");
      navigate("/pricing");
      return;
    }

    setError("");
    setTailoringLoading(true);
    setShowPreview(true); // show side-by-side live preview by default

    try {
      const finalSummaryToSave = updateSummary
        ? activeSummary
        : (analysisResult?.originalContent?.summary || "");

      const response = await api.post(`/resumes/applications/${analysisResult.applicationId}/tailor`, {
        updateSummary,
        customSummary: finalSummaryToSave,
      });
      const data = response.data?.data;
      setTailoredData(data);
      setStep(3);

      // Immediately deduct and sync credits in Redux so navbar reflects change instantly
      if (typeof data?.remainingCredits === "number") {
        dispatch(updateCredits(data.remainingCredits));
      } else if (!isSubscribed && availableCredits > 0) {
        dispatch(updateCredits(availableCredits - 1));
      }

      toast.success("Tailored resume generated successfully!");
    } catch (err) {
      setStep(2);
      setError(err.response?.data?.message || "Tailoring failed.");
      toast.error(err.response?.data?.message || "Tailoring failed.");
      if (err.response?.status === 403) {
        navigate("/pricing");
      }
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
      toast.success("Resume approved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed.");
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
          : format === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
            <Sparkles className="w-5 h-5 text-[#0F4C3A] dark:text-emerald-400" />
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
        <>
          {activeSavedApp && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#0F4C3A] dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Active Resume: {activeSavedApp.target_role || activeSavedApp.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ATS Score: <span className="font-bold text-[#0F4C3A] dark:text-emerald-400">{activeSavedApp.current_score || activeSavedApp.initial_score}%</span> · {activeSavedApp.is_approved ? "Approved Version 2" : "Tailored Version"}
                  </p>
                  {!existingAppId && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                      Maximum 1 resume can be active at a time. Delete this resume from Dashboard to upload a new one. Multi-resume subscription plans are on the way!
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/resume/${activeSavedApp.application_id}`}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  View Saved
                </Link>
                <button
                  type="button"
                  onClick={() => navigate(`/studio?appId=${activeSavedApp.application_id}`)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0A382A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Continue Tailoring →
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (6 cols): Upload Form, Target Role & Job Description */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6">
              <form onSubmit={handleUploadAndAnalyze} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      1. Upload Candidate Resume
                    </h2>
                    {file && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        File Selected
                      </span>
                    )}
                  </div>

                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                    file
                      ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-[#0F4C3A]"
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className={`w-10 h-10 mx-auto mb-2 ${file ? "text-emerald-600 dark:text-emerald-400" : "text-[#0F4C3A] dark:text-emerald-400"}`} />
                    {file ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB • Click or drag to replace
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleClearFile}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer relative z-10"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove file</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Drop your resume here, or <span className="text-[#0F4C3A] dark:text-emerald-400 underline">browse files</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Supports PDF and DOCX (Parsed in-memory only)</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Job Role (Optional)
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          placeholder="e.g. Senior Backend Engineer (or leave blank to auto-detect from JD)"
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
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
                          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
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
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] disabled:opacity-50 text-white py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <span>{loading ? "Analyzing Alignment & Extracting Gaps..." : "Analyze Alignment & Find Gaps"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column (6 cols): Uploaded Resume Live Side Preview */}
            <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Uploaded Resume Preview</span>
                      {file && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          Active Document
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                      {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "Preview of your uploaded file appears here."}
                    </p>
                  </div>
                </div>

                {file && filePreviewUrl && (
                  <a
                    href={filePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0F4C3A] dark:hover:text-emerald-300 text-xs font-semibold transition-all shadow-2xs"
                    title="Open uploaded resume in a new tab"
                  >
                    <span>Full Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Preview Document Sheet */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden shadow-xs min-h-[580px] flex flex-col justify-center">
                {file ? (
                  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={`${filePreviewUrl}#toolbar=0&navpanes=0`}
                      title="Uploaded Candidate Resume Preview"
                      className="w-full h-[650px] border-0 bg-white"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-3 my-auto">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs border border-blue-200 dark:border-blue-900">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-sm mx-auto">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Microsoft Word Document (.docx)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2">
                          Our LLD parsing engine will extract text, contact info, authentic sections, and skills in-memory upon clicking Analyze.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center space-y-3 my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-dashed border-slate-300 dark:border-slate-700">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-xs mx-auto">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Resume Preview Panel
                      </h4>
                      <p className="text-xs text-slate-400">
                        Drop or select your PDF or DOCX file on the left to inspect your uploaded resume side-by-side while entering target role details.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {step === 2 && analysisResult && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C3A] dark:text-emerald-400">
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

          {/* Professional Summary Tailoring Section with Live Side-by-Side Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#0F4C3A] dark:text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Professional Summary Adaptation
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ATS Recommended
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adapt your executive summary to emphasize target keywords and verified competencies, or keep your original text untouched.
                  </p>
                </div>
              </div>
            </div>

            {/* Two-column layout: Left = Choice & Controls; Right (SIDE) = Live Preview every time */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 cols): Choice, Tones, Reload, Edit */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Would you like to change your summary for this role?
                  </span>

                  {/* Radio 1: Yes */}
                  <label
                    onClick={() => setUpdateSummary(true)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      updateSummary
                        ? "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 ring-1 ring-[#0F4C3A]/20"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="summary_choice"
                      checked={updateSummary}
                      onChange={() => setUpdateSummary(true)}
                      className="mt-0.5 text-[#0F4C3A] focus:ring-[#0F4C3A]"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Yes, tailor summary for this role
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Synthesizes an ATS-targeted summary emphasizing verified skills, role alignment, and quantified outcomes.
                      </p>
                    </div>
                  </label>

                  {/* Radio 2: No */}
                  <label
                    onClick={() => setUpdateSummary(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      !updateSummary
                        ? "bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 ring-1 ring-amber-500/20"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="summary_choice"
                      checked={!updateSummary}
                      onChange={() => setUpdateSummary(false)}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        No, keep original resume summary
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Retains your original resume summary word-for-word without any modifications.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Controls when updateSummary === true */}
                {updateSummary && (
                  <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
                        Tone & Style
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReloadSummary()}
                        disabled={regeneratingSummary}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-[#0F4C3A] dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-2xs"
                        title="Reload alternative summary"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSummary ? "animate-spin" : ""}`} />
                        <span>{regeneratingSummary ? "Reloading..." : "Reload New Summary"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(summaryToneLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectTone(key)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-left truncate ${
                            summaryTone === key
                              ? "bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsManualEdit(!isManualEdit)}
                        className="text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isManualEdit ? "Close manual editor" : "Manually fine-tune summary text"}</span>
                      </button>

                      {isManualEdit && (
                        <div className="mt-2.5 space-y-1.5">
                          <textarea
                            rows={4}
                            value={activeSummary}
                            onChange={(e) => setActiveSummary(e.target.value)}
                            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]"
                            placeholder="Type or edit your professional summary directly..."
                          />
                          <p className="text-[10px] text-slate-400">
                            Edits reflect instantly in the live preview on the right.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (7 cols): SIDE PREVIEW SHOWN EVERY TIME */}
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-5 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          updateSummary
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-[#0F4C3A] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                            : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                        }`}
                      >
                        {updateSummary ? "Live Tailored Preview" : "Original Resume Summary"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {currentPreviewText.split(/\s+/).filter(Boolean).length} words · {currentPreviewText.length} chars
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCopySummary}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Copy summary text"
                      >
                        {copiedSummary ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {updateSummary && (
                        <button
                          type="button"
                          onClick={() => handleReloadSummary()}
                          disabled={regeneratingSummary}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F4C3A] dark:hover:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Reload alternative summary variant"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSummary ? "animate-spin text-[#0F4C3A]" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[120px] flex flex-col justify-center">
                    {currentPreviewText ? (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic selection:bg-emerald-100">
                          "{currentPreviewText}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        No summary provided in original resume.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="truncate">
                      Target Role: <strong className="text-slate-700 dark:text-slate-200">{analysisResult.targetRole || "Target Role"}</strong>
                    </span>
                    <span className={`font-semibold shrink-0 ${updateSummary ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                      {updateSummary ? "✓ Will be exported in tailored resume" : "ℹ️ Original text will be preserved"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic pt-0.5">
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
                <button
                  type="button"
                  onClick={handleGenerateTailored}
                  disabled={tailoringLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{tailoringLoading ? "Generating..." : "Tailor Direct"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleOpenEvidenceModal}
                disabled={tailoringLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] text-white px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Verify Evidence & Tailor</span>
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
              <Loader2 className="w-10 h-10 animate-spin text-[#0F4C3A]" />
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
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
                      <span>Step 3 of 3: Tailoring Complete</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analysisResult?.targetRole} {analysisResult?.targetCompany ? `@ ${analysisResult.targetCompany}` : ""}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                      Your resume has been tailored with verified evidence. Compare your authentic uploaded resume (left) and the tailored ATS draft (right) side-by-side in real time below.
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
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Columns className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Side-by-Side Live Resume Comparison
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                          Live Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {showPreview
                          ? "Side-by-side preview active below: Authentic original (left) vs. ATS-tailored draft (right)."
                          : "Preview is currently collapsed. Click the button to inspect the side-by-side live comparison."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#0A382A] text-white shadow-sm transition-all cursor-pointer"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Collapse Preview</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>View Side-by-Side Preview</span>
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
                          className="w-4 h-4 rounded-sm text-[#0F4C3A] focus:ring-[#0F4C3A]/20 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          I confirm that all bullet points and claims are factually truthful.
                        </span>
                      </label>

                      <button
                        onClick={handleApprove}
                        disabled={!isTruthConfirmed || approving}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0F4C3A] hover:bg-[#0A382A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{approving ? "Approving..." : "Approve & Freeze Version"}</span>
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
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all cursor-pointer"
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
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#0F4C3A] hover:bg-[#0A382A] text-white shadow-sm transition-all cursor-pointer"
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
                          onClick={() => handleDownload("docx")}
                          disabled={downloadingFormat === "docx"}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Download ATS Word DOCX resume"
                        >
                          {downloadingFormat === "docx" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span>DOCX (Word)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Side-by-Side Resume Comparison */}
              {showPreview && (
                <div className="animate-in fade-in duration-200">
                  <ResumePreview
                    candidateName={userData?.name || "Candidate"}
                    targetRole={analysisResult?.targetRole}
                    targetCompany={analysisResult?.targetCompany}
                    originalContent={tailoredData.originalContent || analysisResult?.originalContent || tailoredData.tailoredContent?.originalContent}
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
                    isTruthConfirmed={isTruthConfirmed}
                    onTruthConfirmedChange={setIsTruthConfirmed}
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
          existingProjects={
            analysisResult?.originalContent?.projects ||
            tailoredData?.tailoredContent?.projects ||
            tailoredData?.originalContent?.projects ||
            []
          }
          updateSummary={updateSummary}
          summaryPreview={currentPreviewText}
          onSave={handleSaveEvidence}
          onClose={() => setShowEvidenceModal(false)}
          isSubmitting={savingEvidence}
        />
      )}
    </div>
  );
}

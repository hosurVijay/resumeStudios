import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  FileText,
  Trash2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
  CheckCircle,
  Eye,
} from "lucide-react";
import ScoreGraph from "../components/ScoreGraph.jsx";
import { setResumes, setDashboardSeries } from "../store/resumeSlice.js";
import { updateCredits } from "../store/authSlice.js";
import { api } from "../api/client.js";
import { toast } from "../components/Toast.jsx";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData } = useSelector((state) => state.auth);
  const { resumes, dashboardSeries } = useSelector((state) => state.resume);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resumesRes, historyRes] = await Promise.all([
        api.get("/resumes/my-resumes"),
        api.get("/resumes/dashboard/score-history"),
      ]);

      dispatch(setResumes(resumesRes.data.data || []));
      dispatch(setDashboardSeries(historyRes.data.data || []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume? This will free up your account slot.")) {
      return;
    }

    setDeletingId(resumeId);
    try {
      await api.delete(`/resumes/${resumeId}`);
      toast.success("Resume deleted successfully. Account slot freed.");
      await loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resume.");
    } finally {
      setDeletingId(null);
    }
  };

  const isFree = userData?.subscriptionStatus !== "active";
  const hasResume = resumes.length > 0;
  const canUpload = !isFree || !hasResume;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {userData?.name || "Candidate"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track your truth-preserving resume adaptations and ATS performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
            <span>{userData?.freeCredits ?? 3} Free Updates Left</span>
          </div>

          <Link
            to="/studio"
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-sm transition-all ${
              canUpload
                ? "bg-[#0F4C3A] hover:bg-[#0A382A] shadow-sm hover:scale-[1.02]"
                : "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-80"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tailor New Resume</span>
          </Link>
        </div>
      </div>

      {isFree && hasResume && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Free accounts can save 1 resume at a time. To tailor for another job description, delete your existing resume or upgrade to Pro.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <ScoreGraph series={dashboardSeries} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
            My Resumes & Job Applications
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {resumes.length} saved
          </span>
        </div>

        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Resumes Tailored Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your base resume and paste a target job description to get your gap analysis and ATS alignment score.
            </p>
            <Link
              to="/studio"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] text-white px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tailor Your First Resume</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((item) => {
              const initialScore = Number(item.initial_score) || 0;
              const displayScore = Number(item.current_score ?? item.updated_score ?? item.initial_score) || 0;
              const hasScoreGain = displayScore > initialScore;
              const scoreGain = displayScore - initialScore;
              const isApproved = item.status === "approved" || Boolean(item.is_approved);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400 truncate">
                        {item.target_company || "General Application"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isApproved
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : hasScoreGain
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Approved</span>
                          </>
                        ) : hasScoreGain ? (
                          <>
                            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>Tailored</span>
                          </>
                        ) : (
                          <span>Draft</span>
                        )}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                      {item.target_role || item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      File: {item.original_file_name || "resume.pdf"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        ATS Score
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-black text-slate-900 dark:text-white text-lg">
                          {displayScore}%
                        </span>
                        {hasScoreGain && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <TrendingUp className="w-2.5 h-2.5" />
                            +{scoreGain}%
                          </span>
                        )}
                      </div>
                      {hasScoreGain && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Initial: {initialScore}%
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.application_id && (
                        <>
                          <Link
                            to={`/resume/${item.application_id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs"
                            title="View saved resume"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
                          <Link
                            to={`/studio?appId=${item.application_id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Open in studio"
                          >
                            <span>Studio</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteResume(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

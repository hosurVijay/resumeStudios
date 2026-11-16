import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Lock,
  Download,
  LayoutDashboard,
  Cpu,
  Layers,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Target,
  MessageSquareCheck,
  FileSpreadsheet,
  Check,
  X,
  PlusCircle,
} from "lucide-react";
import ScoreGraph from "../components/ScoreGraph.jsx";
import { api } from "../api/client.js";

const BENCHMARK_SERIES = [
  {
    applicationId: "benchmark-trajectory",
    targetRole: "Full Stack Engineer",
    targetCompany: "Sample Benchmark",
    color: "#0F4C3A",
    history: [
      { version: 1, score: 54, isApproved: false },
      { version: 2, score: 73, isApproved: false },
      { version: 3, score: 91, isApproved: true },
    ],
  },
  {
    applicationId: "benchmark-trajectory-2",
    targetRole: "Cloud & Systems Specialist",
    targetCompany: "Enterprise Baseline",
    color: "#059669",
    history: [
      { version: 1, score: 48, isApproved: false },
      { version: 2, score: 68, isApproved: false },
      { version: 3, score: 86, isApproved: true },
    ],
  },
];

export default function Landing() {
  const { status: authStatus, userData } = useSelector((state) => state.auth);
  const [userSeries, setUserSeries] = useState([]);

  useEffect(() => {
    if (authStatus) {
      api
        .get("/resumes/dashboard/score-history")
        .then((res) => {
          if (res.data?.data && Array.isArray(res.data.data)) {
            setUserSeries(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [authStatus]);

  return (
    <div className="space-y-16 sm:space-y-24 py-10 sm:py-16">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
          <span>Truth-Preserving AI Resume Tailoring</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Pass ATS screenings without{" "}
          <span className="text-[#0F4C3A] dark:text-emerald-400 underline decoration-emerald-300 dark:decoration-emerald-700 decoration-wavy decoration-2 underline-offset-8">
            hallucinating fake claims
          </span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Generic AI tools invent metrics and jobs that fail technical interviews. ResumeStudio elicits your real hands-on evidence, aligns it to your target Job Description, and generates ATS-ready resumes you can defend with total confidence.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {authStatus && userData ? (
            <>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A382A] text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/studio"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
                <span>Tailor New Resume</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A382A] text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span>Start Free (3 Credits)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <span>Candidate Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Micro-Trust Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
            100% In-Memory Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
            Zero Fake Claims
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
            Deterministic ATS Scoring
          </span>
        </div>
      </section>

      {/* 2. Why We Do It: The Industry Problem vs. ResumeStudio */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#0F4C3A] dark:text-emerald-400 uppercase">
            WHY RESUMESTUDIO EXISTS
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            The Problem With AI Resume Builders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Recruiters are rejecting candidates because AI tools invent false achievements that crumble under scrutiny.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Generic AI Builders */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3>Generic AI & ChatGPT Wrappers</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              They pad your resume by inventing statistics ("increased revenue by 300%"), adding technologies you've never touched, and generating fake roles that fail background checks.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Fabricates fake metrics and responsibilities you cannot defend</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Injects random keywords without verifiable project context</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Risks immediate disqualification during technical interview rounds</span>
              </li>
            </ul>
          </div>

          {/* Card: ResumeStudio Guarantee */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-[#0F4C3A] dark:text-emerald-400 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3>The ResumeStudio Truth Guarantee</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We never fabricate experience. When a skill is missing, our Evidence Interview asks you how you've actually used it, reframing your genuine achievements to match the job requirements.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Hallucination: Every claim is confirmed by candidate evidence</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Deterministic ATS Scoring with gatekeeping caps on mandatory requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Side-by-side verification before approving and downloading</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. What We Do: The 3-Step Protocol */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#0F4C3A] dark:text-emerald-400 uppercase">
            HOW IT WORKS
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            The Truth-Preserving Tailoring Protocol
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            From initial resume parsing to final ATS approval in three transparent steps.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950/90 space-y-3.5 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
                Target JD Analysis
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed font-normal">
                Upload your resume and paste the target job description. Our deterministic engine categorizes mandatory vs. preferred requirements and calculates your true baseline ATS match score.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950/90 space-y-3.5 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MessageSquareCheck className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
                Evidence Q&A Interview
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed font-normal">
                For missing competencies, an interactive interview asks: "What task did you accomplish?", "Which project was this in?", and "What was the measurable outcome?". Zero unverified claims.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950/90 space-y-3.5 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
                Review & ATS Export
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed font-normal">
                Inspect side-by-side original vs. tailored versions with highlighted key terms. Confirm factual accuracy and export clean, ATS-compliant PDF, HTML, and text formats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How Unique We Are: Feature Innovations */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#0F4C3A] dark:text-emerald-400 uppercase">
            UNIQUE CAPABILITIES
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered For Candidates Who Value Integrity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Four core architectural pillars that set ResumeStudio apart from standard AI tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Deterministic Scoring Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unlike LLMs that give arbitrary scores, our engine uses deterministic rule sets. Missing mandatory skills cap your alignment score until substantiated by verified evidence.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Version Evolution Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track how your alignment climbs from initial upload (e.g. 52%) to evidence verification (e.g. 84%). Every change is versioned with immutable audit records.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              100% In-Memory Privacy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Resume files are processed entirely in-memory. Your raw documents and sensitive work history are never stored unencrypted or used to train external LLMs.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ATS-Certified PDF & HTML Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export cleanly styled, single-column documents built specifically to parse flawlessly through Workday, Taleo, Greenhouse, and Lever ATS systems.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Lower Section: Candidate ATS Alignment Trajectory (Small Read-Only Graph) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Deterministic ATS Trajectory</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {authStatus && userSeries.length > 0
                  ? "Your Resume Alignment Progression"
                  : "Deterministic Alignment Trajectory"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authStatus && userSeries.length > 0
                  ? "Read-only snapshot of your version history on Home. Open your Dashboard to inspect and filter interactive metrics."
                  : "Watch match scores elevate with verified evidence. Static demonstration graph."}
              </p>
            </div>

            {authStatus ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400 hover:underline"
              >
                <span>Interactive Dashboard Graph</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C3A] dark:text-emerald-400 hover:underline"
              >
                <span>Sign in for your live graph</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="relative">
            <ScoreGraph
              series={userSeries.length > 0 ? userSeries : BENCHMARK_SERIES}
              interactive={false}
              compact={true}
              title={
                authStatus && userSeries.length > 0
                  ? "Candidate Score Trajectory (Read-Only Preview)"
                  : "Benchmark Score Trajectory (Static Preview)"
              }
              subtitle={
                authStatus && userSeries.length > 0
                  ? "Read-only score progression across versions for your tailored applications"
                  : "Progression curve demonstrating baseline score growth from initial upload to verified evidence approval"
              }
              badgeText="Target: 75%+"
            />
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#0F4C3A] text-white p-8 sm:p-12 text-center space-y-5 shadow-lg shadow-[#0F4C3A]/10 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to pass ATS filters with a resume you can truly defend?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Create your account today. Upload your resume, verify real project achievements, and download a tailored resume with zero fabricated claims.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              {authStatus ? (
                <Link
                  to="/studio"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#0F4C3A] hover:bg-emerald-50 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tailor A Resume Now</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#0F4C3A] hover:bg-emerald-50 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0A382A] hover:bg-[#072B20] text-emerald-100 border border-emerald-700/50 font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

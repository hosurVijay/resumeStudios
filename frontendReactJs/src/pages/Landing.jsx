import React from "react";
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
} from "lucide-react";
import heroImg from "../assets/hero.png";

export default function Landing() {
  const { status: authStatus, userData } = useSelector((state) => state.auth);
  return (
    <div className="space-y-24 py-12">
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Truth-Preserving AI Resume Tailoring</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Pass ATS screenings without{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            hallucinating fake claims
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Generic AI tools invent metrics and jobs that fail background checks.
          Resume Studio elicits your real hands-on evidence, aligns it to your target Job Description, and generates ATS-ready resumes you can defend with confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {authStatus && userData ? (
            <>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/studio"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Tailor Resume</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <span>Start Free (3 Updates)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <span>Candidate Sign In</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pt-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% In-Memory Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evidence-Backed Bullets
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant ATS Export
          </span>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Target JD Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our deterministic engine extracts mandatory vs. preferred requirements and calculates your initial ATS alignment score.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Evidence Q&A Interview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                For missing skills, you confirm your real tasks, projects, and metrics. We never fabricate unverified experience.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Approval & ATS Export
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Review side-by-side improvements, confirm factual accuracy, freeze immutable snapshots, and export printable HTML/PDF.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

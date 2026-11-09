import React from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            ResumeStudio
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            • Truth-Preserving ATS Intelligence
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Factual safeguards for candidates. Zero hallucinated claims.
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link>
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
          <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}

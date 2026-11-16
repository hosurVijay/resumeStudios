import React from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo to="/" size="sm" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            • Truth-Preserving ATS Intelligence
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Factual safeguards for candidates. Zero hallucinated claims.
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/pricing" className="hover:text-[#0F4C3A] dark:hover:text-emerald-400">Pricing</Link>
          <Link to="/" className="hover:text-[#0F4C3A] dark:hover:text-emerald-400">Privacy</Link>
          <Link to="/" className="hover:text-[#0F4C3A] dark:hover:text-emerald-400">Terms</Link>
          <Link to="/dashboard" className="hover:text-[#0F4C3A] dark:hover:text-emerald-400">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}

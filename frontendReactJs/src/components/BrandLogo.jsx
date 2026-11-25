import React from "react";
import { Link } from "react-router-dom";

export function BrandIcon({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-7 h-7 rounded-md",
    md: "w-8 h-8 rounded-lg",
    lg: "w-11 h-11 rounded-xl",
  }[size] || "w-8 h-8 rounded-lg";

  const svgSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size] || "w-4 h-4";

  return (
    <div
      className={`${sizeClasses} bg-[#0F4C3A] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform ${className}`}
    >
      <svg
        className={svgSizes}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {/* Modern ladder / document rails icon matching ResumeStudio design */}
        <path d="M5.5 3.5v13" />
        <path d="M14.5 3.5v13" />
        <path d="M5.5 6.5h9" />
        <path d="M5.5 10h9" />
        <path d="M5.5 13.5h9" />
      </svg>
    </div>
  );
}

export default function BrandLogo({ to = "/", showSubtitle = false, size = "md" }) {
  const content = (
    <div className="flex items-center gap-2.5 select-none">
      <BrandIcon size={size} />
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          Resume<span className="text-[#0F4C3A] dark:text-emerald-400">Studio</span>
        </span>
        {showSubtitle && (
          <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">
            Truth-Preserving AI
          </span>
        )}
      </div>
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} className="group inline-flex items-center">
      {content}
    </Link>
  );
}

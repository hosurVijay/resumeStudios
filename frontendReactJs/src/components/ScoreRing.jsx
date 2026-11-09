import React from "react";

export default function ScoreRing({ score = 0, size = 110, strokeWidth = 8, label = "" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let colorClass = "stroke-emerald-500 text-emerald-500";
  let band = "Strong Match";
  if (score < 50) {
    colorClass = "stroke-rose-500 text-rose-500";
    band = "Low Alignment";
  } else if (score < 75) {
    colorClass = "stroke-amber-500 text-amber-500";
    band = "Developing";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${colorClass} transition-all duration-700 ease-out`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
            {score}%
          </span>
          {label && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>

      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
        {band}
      </span>
    </div>
  );
}

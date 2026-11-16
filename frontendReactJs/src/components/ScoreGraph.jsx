import React, { useState } from "react";
import { TrendingUp, Award, Layers } from "lucide-react";

export default function ScoreGraph({
  series = [],
  interactive = true,
  compact = false,
  title = "ATS Alignment Trajectory",
  subtitle = "Score evolution across versions for all target job descriptions",
  badgeText = "Target: 75%+",
}) {
  const [activeSeries, setActiveSeries] = useState({});
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!series || series.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/30 ${compact ? "p-6" : "p-8"}`}>
        <TrendingUp className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No Score Progression Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Tailor a resume for your target jobs to watch your ATS alignment trajectory climb across versions.
        </p>
      </div>
    );
  }

  const toggleLine = (id) => {
    if (!interactive) return;
    setActiveSeries((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const visibleSeries = interactive
    ? series.filter((s) => activeSeries[s.applicationId] !== false)
    : series;

  let maxVersion = 1;
  series.forEach((s) => {
    s.history?.forEach((h) => {
      if (h.version > maxVersion) maxVersion = h.version;
    });
  });
  maxVersion = Math.max(maxVersion, 3);

  const width = 640;
  const height = compact ? 190 : 240;
  const padLeft = 38;
  const padRight = 24;
  const padTop = compact ? 16 : 20;
  const padBottom = compact ? 26 : 30;

  const getX = (version) => {
    const range = width - padLeft - padRight;
    return padLeft + ((version - 1) / (maxVersion - 1)) * range;
  };

  const getY = (score) => {
    const range = height - padTop - padBottom;
    return height - padBottom - (score / 100) * range;
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {badgeText && (
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((s) => {
            const isVisible = interactive ? activeSeries[s.applicationId] !== false : true;

            if (!interactive) {
              return (
                <div
                  key={s.applicationId}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 select-none"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color || "#0F4C3A" }}
                  />
                  <span className="truncate max-w-[130px]">
                    {s.targetRole} {s.targetCompany ? `@ ${s.targetCompany}` : ""}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={s.applicationId}
                onClick={() => toggleLine(s.applicationId)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isVisible
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-xs"
                    : "opacity-40 border-transparent bg-transparent text-slate-400"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color || "#0F4C3A" }}
                />
                <span className="truncate max-w-[120px]">
                  {s.targetRole} {s.targetCompany ? `@ ${s.targetCompany}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-auto min-w-[480px] select-none ${
            !interactive ? "pointer-events-none" : ""
          }`}
        >
          <line
            x1={padLeft}
            y1={getY(75)}
            x2={width - padRight}
            y2={getY(75)}
            stroke="#0F4C3A"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity="0.35"
          />

          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={getY(tick)}
                x2={width - padRight}
                y2={getY(tick)}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={getY(tick) + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
              >
                {tick}%
              </text>
            </g>
          ))}

          {Array.from({ length: maxVersion }, (_, i) => i + 1).map((v) => (
            <g key={v}>
              <line
                x1={getX(v)}
                y1={padTop}
                x2={getX(v)}
                y2={height - padBottom}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/60"
                strokeWidth="1"
              />
              <text
                x={getX(v)}
                y={height - padBottom + 14}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
              >
                v{v}
              </text>
            </g>
          ))}

          {visibleSeries.map((s) => {
            if (!s.history || s.history.length === 0) return null;
            const sorted = [...s.history].sort((a, b) => a.version - b.version);
            const pathData = sorted
              .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(pt.version)} ${getY(pt.score)}`)
              .join(" ");

            const lineColor = s.color || "#0F4C3A";

            return (
              <g key={s.applicationId}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />

                {sorted.map((pt) => {
                  const cx = getX(pt.version);
                  const cy = getY(pt.score);
                  const isHovered =
                    interactive &&
                    hoveredPoint?.applicationId === s.applicationId &&
                    hoveredPoint?.version === pt.version;

                  return (
                    <g key={pt.version}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 7 : (compact ? 4 : 4.5)}
                        fill={pt.isApproved ? "#0F4C3A" : lineColor}
                        stroke="white"
                        className={`dark:stroke-slate-900 transition-all ${
                          interactive ? "cursor-pointer" : ""
                        }`}
                        strokeWidth="2"
                        onMouseEnter={
                          interactive
                            ? () =>
                                setHoveredPoint({
                                  ...pt,
                                  applicationId: s.applicationId,
                                  targetRole: s.targetRole,
                                  targetCompany: s.targetCompany,
                                  color: lineColor,
                                  x: cx,
                                  y: cy,
                                })
                            : undefined
                        }
                        onMouseLeave={interactive ? () => setHoveredPoint(null) : undefined}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {interactive && hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-2 text-xs shadow-xl border border-slate-700 dark:border-slate-200"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: hoveredPoint.color }}
              />
              <span>{hoveredPoint.targetRole}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] opacity-90">
              <span>Version {hoveredPoint.version}</span>
              <span>•</span>
              <span className="font-extrabold text-emerald-400 dark:text-emerald-600">
                {hoveredPoint.score}%
              </span>
              {hoveredPoint.isApproved && (
                <span className="bg-emerald-500/20 text-emerald-300 dark:text-emerald-700 px-1 rounded text-[9px] font-semibold">
                  Approved
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

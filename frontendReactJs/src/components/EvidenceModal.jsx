import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function EvidenceModal({
  requirements = [],
  initialAnswers = [],
  onSave,
  onClose,
  isSubmitting = false,
}) {
  const [answers, setAnswers] = useState(() => {
    const map = {};
    initialAnswers.forEach((ans) => {
      map[ans.requirement_text || ans.requirementText] = {
        response: ans.candidate_response || ans.candidateResponse,
        context:
          typeof ans.context_data === "string"
            ? JSON.parse(ans.context_data || "{}")
            : ans.context_data || ans.contextData || {},
      };
    });
    return map;
  });

  const handleResponseChange = (reqText, responseType) => {
    setAnswers((prev) => ({
      ...prev,
      [reqText]: {
        response: responseType,
        context: prev[reqText]?.context || {
          where: "",
          whatDone: "",
          measurableOutcomes: "",
        },
      },
    }));
  };

  const handleContextChange = (reqText, field, val) => {
    setAnswers((prev) => ({
      ...prev,
      [reqText]: {
        response: prev[reqText]?.response || "yes",
        context: {
          ...(prev[reqText]?.context || {}),
          [field]: val,
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = requirements.map((req) => {
      const state = answers[req.label || req.requirementText] || {};
      return {
        requirementText: req.label || req.requirementText,
        isMandatory: req.priority === "mandatory" || req.isMandatory || false,
        candidateResponse: state.response || "skip",
        contextData: state.context || {},
      };
    });
    onSave(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col my-auto transition-colors">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Truth-Preserving Evidence Interview
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              Confirm your actual experience for detected JD gaps. We never fabricate claims—only verified facts will be tailored into your resume.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {requirements.map((req, idx) => {
            const reqLabel = req.label || req.requirementText;
            const current = answers[reqLabel] || { response: "skip", context: {} };
            const isMandatory = req.priority === "mandatory" || req.isMandatory;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {reqLabel}
                    </span>
                    {req.suggestion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {req.suggestion}
                      </p>
                    )}
                  </div>
                  {isMandatory ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
                      Mandatory Gap
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Preferred
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "yes")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      current.response === "yes"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Yes
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "limited")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      current.response === "limited"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Limited
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "no")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      current.response === "no"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    No
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResponseChange(reqLabel, "skip")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      current.response === "skip"
                        ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-700"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Skip
                  </button>
                </div>

                {(current.response === "yes" || current.response === "limited") && (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Where did you apply it?
                      </label>
                      <input
                        type="text"
                        value={current.context?.where || ""}
                        onChange={(e) => handleContextChange(reqLabel, "where", e.target.value)}
                        placeholder="Company / Project name"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Specific task / work
                      </label>
                      <input
                        type="text"
                        value={current.context?.whatDone || ""}
                        onChange={(e) => handleContextChange(reqLabel, "whatDone", e.target.value)}
                        placeholder="E.g. built microservice API"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Measurable outcome
                      </label>
                      <input
                        type="text"
                        value={current.context?.measurableOutcomes || ""}
                        onChange={(e) =>
                          handleContextChange(reqLabel, "measurableOutcomes", e.target.value)
                        }
                        placeholder="E.g. reduced latency by 30%"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg shadow-sm shadow-blue-600/30 transition-all"
            >
              <span>{isSubmitting ? "Synthesizing Evidence..." : "Confirm & Tailor Resume"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

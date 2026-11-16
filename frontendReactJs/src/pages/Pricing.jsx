import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Zap,
  HelpCircle,
} from "lucide-react";

export default function Pricing() {
  const { status: authStatus } = useSelector((state) => state.auth);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Clock className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
          <span>Pro Plans Launching Soon</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Simple, Transparent Pricing
        </h1>

        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Start for free today with 3 tailoring credits. Pro subscriptions with unlimited tailoring and version management are coming soon.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* Plan 1: Free Starter */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#0F4C3A] dark:text-emerald-400 uppercase tracking-wider">
                Starter Free
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Free Forever
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Essential truth-preserving tailoring for active job applicants.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span><strong>3 Free Resume Updates</strong> included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Deterministic ATS alignment scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Evidence Q&A interview loop</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>1 active target job application</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Single-column ATS PDF & HTML exports</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              to={authStatus ? "/studio" : "/register"}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
            >
              <span>{authStatus ? "Tailor Resume Now" : "Get Started Free"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Plan 2: Pro Career (Coming Soon) */}
        <div className="relative rounded-3xl border-2 border-[#0F4C3A] dark:border-emerald-500 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-[#0F4C3A]/5">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0F4C3A] text-white text-[11px] font-bold tracking-wide uppercase shadow-sm">
            Coming Soon
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#0F4C3A] dark:text-emerald-400 uppercase tracking-wider">
                Pro Career
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Unlimited Growth
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                For serious job seekers applying to multiple selective roles.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$19</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span><strong>Unlimited</strong> resume adaptations & approvals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Multiple target job applications saved</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Persistent verified evidence vault</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Side-by-side interactive version trajectory</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400 shrink-0" />
                <span>Priority ATS formatting & custom themes</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl bg-[#0F4C3A]/20 dark:bg-emerald-950/40 text-[#0F4C3A] dark:text-emerald-300 border border-[#0F4C3A]/30 cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pro Plan — Coming Soon</span>
            </button>
          </div>
        </div>

        {/* Plan 3: Enterprise / Coaching (Coming Soon) */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Enterprise & Coaches
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Team & Bulk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                For universities, bootcamps, and career consultancy firms.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Custom</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ bulk seats</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Cohort license management & bulk credits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Coach review & approval workflow</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Direct ATS integration API</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
            >
              <span>Coming Soon</span>
            </button>
          </div>
        </div>
      </section>

      {/* Early Access Notification Bar */}
      <section className="max-w-2xl mx-auto rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 p-6 text-center space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Want Early Access to Pro?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Leave your email to get notified the minute Pro subscriptions open and receive 5 bonus tailoring credits.
        </p>

        {waitlistSubmitted ? (
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            ✓ You're on the list! We'll notify you when Pro goes live.
          </p>
        ) : (
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto pt-1">
            <input
              type="email"
              placeholder="Enter your email"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0F4C3A] hover:bg-[#0A382A] text-white text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer"
            >
              Notify Me
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

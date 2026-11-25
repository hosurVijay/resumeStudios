import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Sparkles,
  LogOut,
  User,
  PlusCircle,
  LayoutDashboard,
  Home,
  Tag,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { toggleTheme } from "../store/themeSlice.js";
import { logout } from "../store/authSlice.js";
import { api } from "../api/client.js";
import BrandLogo from "./BrandLogo.jsx";
import { getMediaUrl } from "../utils/mediaUrl.js";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData, status } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking anywhere outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
    } catch {}
    dispatch(logout());
    setMenuOpen(false);
    navigate("/login");
  };

  const isDark = mode === "dark";
  const isPro = userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100;
  const subscriptionName = isPro ? "Pro Plan (Launch Special)" : "Starter Free Plan";

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <BrandLogo to="/" showSubtitle={true} size="md" />

        <div className="flex items-center gap-1.5 sm:gap-3">
          {status && userData ? (
            <>
              {/* 1. Home - Hidden on mobile, accessible via BrandLogo or avatar dropdown */}
              <Link
                to="/"
                className="hidden md:flex text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F4C3A] dark:hover:text-emerald-400 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>

              {/* 2. Tailor Resume - Clean & adaptive on all screen sizes */}
              <Link
                to="/studio"
                className="text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Tailor Resume</span>
                <span className="sm:hidden">Tailor</span>
              </Link>

              {/* 3. Pricing - Hidden on small mobile, accessible via avatar dropdown */}
              <Link
                to="/pricing"
                className="hidden sm:flex text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F4C3A] dark:hover:text-emerald-400 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Pricing</span>
              </Link>

              {/* 4. Credits - Hidden on mobile navbar to prevent crowding */}
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Sparkles className="w-3 h-3 text-[#0F4C3A] dark:text-emerald-400" />
                <span className="whitespace-nowrap">{userData?.freeCredits > 100 || isPro ? "Unlimited Credits" : `${userData.freeCredits ?? 3} Credits`}</span>
              </div>

              {/* 5. User Avatar Icon & Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="User menu"
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:ring-2 hover:ring-[#0F4C3A]/30 overflow-hidden transition-all cursor-pointer"
                >
                  {userData.profileImage ? (
                    <img
                      src={getMediaUrl(userData.profileImage)}
                      alt={userData.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : userData.name ? (
                    userData.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                    {/* User Identity Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {userData.name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {userData.email}
                      </p>

                      {/* Active Subscription Badge */}
                      <div className="pt-1.5 pb-0.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
                            <div className="text-left">
                              <span className="text-[10px] text-slate-400 font-medium block leading-none">
                                Plan
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {subscriptionName}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {userData?.freeCredits > 100 || isPro ? "Unlimited" : `${userData.freeCredits ?? 3} Cr`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation inside Icon Dropdown */}
                    <div className="py-1">
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="md:hidden flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F4C3A] dark:hover:text-emerald-400 transition-colors"
                      >
                        <Home className="w-4 h-4 text-slate-400" />
                        <span>Home</span>
                      </Link>

                      <Link
                        to="/pricing"
                        onClick={() => setMenuOpen(false)}
                        className="sm:hidden flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F4C3A] dark:hover:text-emerald-400 transition-colors"
                      >
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span>Pricing</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F4C3A] dark:hover:text-emerald-400 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F4C3A] dark:hover:text-emerald-400 transition-colors"
                      >
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <span>Edit Profile</span>
                      </Link>

                      {/* Theme Toggle Button inside Dropdown */}
                      <button
                        onClick={() => dispatch(toggleTheme())}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? (
                            <Sun className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          )}
                          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                          {isDark ? "Dark" : "Light"}
                        </span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/pricing"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F4C3A] dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F4C3A] dark:hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] text-white px-3.5 py-2 rounded-lg shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

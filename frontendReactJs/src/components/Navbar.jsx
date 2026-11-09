import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  User,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
import { toggleTheme } from "../store/themeSlice.js";
import { logout } from "../store/authSlice.js";
import { api } from "../api/client.js";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData, status } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
    } catch {}
    dispatch(logout());
    setMenuOpen(false);
    navigate("/login");
  };

  const isDark = mode === "dark";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={status && userData ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              Resume<span className="text-blue-600 dark:text-blue-400">Studio</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Truth-Preserving AI
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {status && userData ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/studio"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Tailor Resume
              </Link>

              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3 h-3 text-blue-500" />
                {userData.subscriptionStatus === "active" ? (
                  <span>Pro Member</span>
                ) : (
                  <span>{userData.freeCredits ?? 3} Credits</span>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  {userData.name ? userData.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {userData.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {userData.email}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex sm:hidden items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      to="/studio"
                      onClick={() => setMenuOpen(false)}
                      className="flex sm:hidden items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Tailor Resume
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all hover:shadow-md"
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

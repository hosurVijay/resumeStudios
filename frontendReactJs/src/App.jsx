import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { api } from "./api/client.js";
import { login, logout } from "./store/authSlice.js";

export default function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme?.mode);

  // Synchronize document class directly whenever themeMode changes
  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);

  useEffect(() => {
    api
      .post("/users/direct-login")
      .then((response) => {
        if (response.data?.data) {
          dispatch(login(response.data.data));
        }
      })
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  return (
    <ToastProvider>
      {!loading ? (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
          <div className="w-10 h-10 border-3 border-[#0F4C3A]/20 border-t-[#0F4C3A] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            Initializing Studio...
          </p>
        </div>
      )}
    </ToastProvider>
  );
}

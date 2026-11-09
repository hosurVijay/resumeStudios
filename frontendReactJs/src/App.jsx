import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Protected from "./components/Protected.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TailorStudio from "./pages/TailorStudio.jsx";
import { api } from "./api/client.js";
import { login, logout } from "./store/authSlice.js";

export default function App() {
  const dispatch = useDispatch();
  const authStatus = useSelector((state) => state.auth.status);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    api
      .post("/users/direct-login")
      .then((res) => {
        if (res.data?.data) {
          dispatch(login(res.data.data));
        }
      })
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        setInitLoading(false);
      });
  }, [dispatch]);

  if (initLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">
          Initializing Studio...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={authStatus ? <Navigate to="/dashboard" replace /> : <Landing />}
          />
          <Route
            path="/login"
            element={
              <Protected authentication={false}>
                <Login />
              </Protected>
            }
          />
          <Route
            path="/register"
            element={
              <Protected authentication={false}>
                <Register />
              </Protected>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Protected authentication={false}>
                <ForgotPassword />
              </Protected>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected authentication={true}>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/studio"
            element={
              <Protected authentication={true}>
                <TailorStudio />
              </Protected>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { api } from "../api/client.js";
import { login } from "../store/authSlice.js";
import { toast } from "../components/Toast.jsx";
import { getMediaUrl } from "../utils/mediaUrl.js";

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setPhoneNumber(userData.phoneNumber || userData.phone_number || "");
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      }
    }
  }, [userData]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file size must be under 10 MB.");
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(userData?.profileImage || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phoneNumber", phoneNumber.trim());
      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      const response = await api.patch("/users/update-details", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.data) {
        dispatch(login(response.data.data));
        toast.success("Profile updated successfully!");
        setImageFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const currentInitials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your account identity, candidate photo, and contact information
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A] dark:text-emerald-400" />
          <span>
            {userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100
              ? "Unlimited Credits"
              : `${userData?.freeCredits ?? 3} Free Credits Available`}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Avatar Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Profile Photo
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {imagePreview ? (
                  <img
                    src={getMediaUrl(imagePreview)}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-300">
                    {currentInitials}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0F4C3A] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0F4C3A] hover:bg-[#0A382A] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Upload New Photo
                </button>

                {imageFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Reset Selected
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Supports JPG, PNG, or WebP. Max 10 MB. Resized and stored securely.
              </p>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Personal & Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] dark:focus:ring-emerald-500/20 dark:focus:border-emerald-500 transition-all"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +91 98800 56019"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] dark:focus:ring-emerald-500/20 dark:focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Email Address (Non-editable) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" /> Non-editable
                </span>
              </label>
              <input
                type="email"
                value={userData?.email || ""}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Your registered email is tied to authentication credentials and account verification records.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription & Account Tier Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Subscription Plan
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100
                  ? "Pro Plan (Launch Special)"
                  : "Starter Free Plan"}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0F4C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100
                  ? "Unlimited Credits"
                  : `${userData?.freeCredits ?? 3} Credits Remaining`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              {userData?.subscriptionStatus === "active" || (userData?.freeCredits ?? 0) > 100
                ? "Special promotional launch period: enjoy unlimited truth-preserving resume adaptations and ATS performance."
                : "Free plans include 3 full ATS resume tailoring updates with deterministic scoring."}
            </p>
          </div>

          <Link
            to="/pricing"
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
          >
            View Pricing Plans
          </Link>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/dashboard"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-[#0F4C3A] hover:bg-[#0A382A] text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

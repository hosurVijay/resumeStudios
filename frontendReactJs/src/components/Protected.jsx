import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Protected({ children, authentication = true }) {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authentication && authStatus !== authentication) {
      navigate("/login");
    } else if (!authentication && authStatus !== authentication) {
      navigate("/dashboard");
    }
    setLoader(false);
  }, [authStatus, navigate, authentication]);

  return loader ? (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-[#0F4C3A]/20 border-t-[#0F4C3A] rounded-full animate-spin" />
      <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 animate-pulse">
        Verifying Session...
      </p>
    </div>
  ) : (
    <>{children}</>
  );
}

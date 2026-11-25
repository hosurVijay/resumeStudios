import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to translate raw technical errors into friendly user-facing messages
export function formatErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  // 1. Network / Offline / Connection errors
  if (!error.response) {
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      return "Network connection lost. Please check your internet connection.";
    }
    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("Failed to fetch")
    ) {
      return "Network connection lost. Please check your internet connection and try again.";
    }
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return "The connection timed out. Please check your network and try again.";
    }
    return "Unable to reach the server. Please check your internet connection.";
  }

  // 2. HTTP Server responses
  const status = error.response.status;
  const serverMsg = error.response.data?.message;

  if (status >= 500) {
    // Hide raw database or internal syntax error leakages
    if (
      !serverMsg ||
      /sql|er_|syntax|econn|timeout|eacces|eperm|internal server error|table|query|database|unexpected token/i.test(
        serverMsg
      )
    ) {
      return "Something went wrong on our end. Please try again in a moment.";
    }
    return serverMsg;
  }

  if (status === 404) {
    return serverMsg || "The requested item could not be found.";
  }

  if (status === 403) {
    return serverMsg || "You do not have permission to perform this action.";
  }

  if (status === 401) {
    return serverMsg || "Your session has expired. Please sign in again.";
  }

  return serverMsg || "An unexpected error occurred. Please try again.";
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/refresh-token") &&
      !originalRequest?.url?.includes("/users/direct-login") &&
      !originalRequest?.url?.includes("/users/login")
    ) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh-token");
        return api(originalRequest);
      } catch (refreshError) {
        // Fall through to error formatting below
      }
    }

    // Attach human-friendly user message
    const friendlyMessage = formatErrorMessage(error);
    error.friendlyMessage = friendlyMessage;

    if (error.response && error.response.data && typeof error.response.data === "object") {
      error.response.data.message = friendlyMessage;
    } else {
      error.response = error.response || {};
      error.response.data = error.response.data || {};
      error.response.data.message = friendlyMessage;
    }

    return Promise.reject(error);
  },
);

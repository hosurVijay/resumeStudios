import { createSlice } from "@reduxjs/toolkit";

const THEME_STORAGE_KEY = "resumestudio_theme";

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    // If user explicitly chose and saved "dark", honor it
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      return "dark";
    }
    // Default is 100% LIGHT mode
    document.documentElement.classList.remove("dark");
    return "light";
  }
  return "light";
};

const initialState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
        localStorage.setItem("theme", state.mode);
        if (state.mode === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    setTheme: (state, action) => {
      state.mode = action.payload === "dark" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
        localStorage.setItem("theme", state.mode);
        if (state.mode === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;

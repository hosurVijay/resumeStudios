import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import resumeSlice from "./resumeSlice";
import themeSlice from "./themeSlice";

const store = configureStore({
  reducer: {
    auth: authSlice,
    resume: resumeSlice,
    theme: themeSlice,
  },
});

export default store;

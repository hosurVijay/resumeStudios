import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  resumes: [],
  dashboardSeries: [],
  activeApplication: null,
  tailoredPreview: null,
};

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    setResumes: (state, action) => {
      state.resumes = action.payload;
    },
    setDashboardSeries: (state, action) => {
      state.dashboardSeries = action.payload;
    },
    setActiveApplication: (state, action) => {
      state.activeApplication = action.payload;
    },
    setTailoredPreview: (state, action) => {
      state.tailoredPreview = action.payload;
    },
    clearTailoredPreview: (state) => {
      state.tailoredPreview = null;
    },
  },
});

export const {
  setResumes,
  setDashboardSeries,
  setActiveApplication,
  setTailoredPreview,
  clearTailoredPreview,
} = resumeSlice.actions;

export default resumeSlice.reducer;

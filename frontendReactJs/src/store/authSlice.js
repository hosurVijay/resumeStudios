import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userData: null,
  status: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload?.userData || action.payload;
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
    },
    updateCredits: (state, action) => {
      if (state.userData) {
        state.userData.freeCredits = action.payload;
      }
    },
  },
});

export const { login, logout, updateCredits } = authSlice.actions;
export default authSlice.reducer;

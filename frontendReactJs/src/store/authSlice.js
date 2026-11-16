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
      const user = action.payload?.user || action.payload?.userData || action.payload;
      if (user && typeof user === "object") {
        state.userData = {
          ...user,
          freeCredits:
            typeof user.freeCredits === "number"
              ? user.freeCredits
              : typeof user.free_credits === "number"
              ? user.free_credits
              : 3,
        };
      } else {
        state.userData = user;
      }
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

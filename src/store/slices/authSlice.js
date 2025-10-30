import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  user: null,
  userRole: "admin", // Default to prevent null errors
  userRoles: [],
  token: null,
  lastLocation: "/schoolchat/principal",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user, userRole, userRoles } = action.payload;
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      state.userRole = userRole || "admin";
      state.userRoles = userRoles || [];
    },
    setLastLocation: (state, action) => {
      state.lastLocation = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.userRole = "admin";
      state.userRoles = [];
      state.token = null;
    },
    restoreAuth: (state, action) => {
      const { token, user, userRole, userRoles, lastLocation } = action.payload;
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      state.userRole = userRole || "admin";
      state.userRoles = userRoles || [];
      if (lastLocation) state.lastLocation = lastLocation;
    },
  },
});

export const { setCredentials, setLastLocation, logout, restoreAuth } =
  authSlice.actions;
export default authSlice.reducer;

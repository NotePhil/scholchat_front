import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => {
  const token = localStorage.getItem("accessToken");

  // Default values - NO DEFAULT ROLE
  let userRole = null;
  let userRoles = [];
  let user = null;
  let lastLocation = "/schoolchat/principal";
  let isAuthenticated = false;

  if (token) {
    try {
      // Get user role
      const storedRole = localStorage.getItem("userRole");
      userRole = storedRole || null;

      // Get user roles array
      const userRolesStr = localStorage.getItem("userRoles");
      try {
        userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];
      } catch (e) {
        console.error("Error parsing user roles:", e);
        userRoles = [];
      }

      // Get user information
      const userEmail = localStorage.getItem("userEmail") || "";
      const username = localStorage.getItem("username") || "";
      const decodedTokenStr = localStorage.getItem("decodedToken");

      let name = username || "";
      let phone = "";

      if (decodedTokenStr) {
        try {
          const decodedToken = JSON.parse(decodedTokenStr);
          phone = decodedToken.phone || decodedToken.phoneNumber || "";

          // Try to extract role from token if not in localStorage
          if (!userRole && decodedToken.role) {
            userRole = decodedToken.role;
          }
          if (userRoles.length === 0 && decodedToken.roles) {
            userRoles = Array.isArray(decodedToken.roles)
              ? decodedToken.roles
              : [decodedToken.roles];
          }
        } catch (e) {
          console.error("Error parsing decoded token:", e);
        }
      }

      if (!name && userEmail) {
        name = userEmail.split("@")[0];
      }

      user = {
        name: name || "User",
        email: userEmail,
        phone: phone,
        username: username,
      };

      const savedLocation = localStorage.getItem("lastLocation");
      if (savedLocation) {
        lastLocation = savedLocation;
      }

      isAuthenticated = true;
    } catch (error) {
      console.error("Error initializing auth state:", error);
      // Reset everything on error
      userRole = null;
      userRoles = [];
      user = null;
      isAuthenticated = false;
    }
  }

  return {
    isAuthenticated,
    user,
    userRole,
    userRoles,
    token,
    lastLocation,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { token, user, userRole, userRoles } = action.payload;

      console.log("Setting credentials:", { token, user, userRole, userRoles });

      // Save to localStorage
      if (token) {
        localStorage.setItem("accessToken", token);
      }

      if (userRole) {
        localStorage.setItem("userRole", userRole);
      }

      if (userRoles && Array.isArray(userRoles)) {
        localStorage.setItem("userRoles", JSON.stringify(userRoles));
      }

      if (user?.email) {
        localStorage.setItem("userEmail", user.email);
      }

      if (user?.username) {
        localStorage.setItem("username", user.username);
      }

      // Update state
      state.isAuthenticated = true;
      state.token = token;
      state.user = user || state.user;
      state.userRole = userRole;
      state.userRoles = userRoles || [];
    },

    setLastLocation: (state, action) => {
      state.lastLocation = action.payload;
      localStorage.setItem("lastLocation", action.payload);
    },

    logout: (state) => {
      // Clean localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("username");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("decodedToken");
      localStorage.removeItem("authResponse");
      localStorage.removeItem("lastLocation");

      // Reset state
      state.isAuthenticated = false;
      state.user = null;
      state.userRole = null;
      state.userRoles = [];
      state.token = null;
      state.lastLocation = "/schoolchat/principal";
    },

    restoreAuth: (state, action) => {
      const { token, user, userRole, userRoles, lastLocation } = action.payload;

      console.log("Restoring auth:", { token, user, userRole, userRoles });

      state.isAuthenticated = true;
      state.token = token;
      state.user = user || state.user;
      state.userRole = userRole;
      state.userRoles = userRoles || [];

      if (lastLocation) {
        state.lastLocation = lastLocation;
        localStorage.setItem("lastLocation", lastLocation);
      }
    },

    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };

        if (action.payload.username) {
          localStorage.setItem("username", action.payload.username);
        }
        if (action.payload.email) {
          localStorage.setItem("userEmail", action.payload.email);
        }
      }
    },
  },
});

export const {
  setCredentials,
  setLastLocation,
  logout,
  restoreAuth,
  updateUserProfile,
} = authSlice.actions;

export default authSlice.reducer;

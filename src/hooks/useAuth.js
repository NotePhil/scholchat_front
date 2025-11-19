import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => {
  // Récupération sécurisée des données du localStorage
  const token = localStorage.getItem("accessToken");
  let userRole = "admin";
  let userRoles = [];
  let user = { name: "User", email: "", phone: "", username: "" };
  let lastLocation = "/schoolchat/principal";

  if (token) {
    try {
      userRole = localStorage.getItem("userRole") || "admin";

      const userRolesStr = localStorage.getItem("userRoles");
      try {
        userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];
      } catch (e) {
        console.error("Error parsing user roles:", e);
        userRoles = [];
      }

      const userEmail = localStorage.getItem("userEmail") || "";
      const username = localStorage.getItem("username") || "";
      const decodedTokenStr = localStorage.getItem("decodedToken");

      let name = username || "";
      let phone = "";

      if (decodedTokenStr) {
        try {
          const decodedToken = JSON.parse(decodedTokenStr);
          phone = decodedToken.phone || decodedToken.phoneNumber || "";
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
    } catch (error) {
      console.error("Error initializing auth state:", error);
    }
  }

  return {
    isAuthenticated: !!token,
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

      // Sauvegarde dans le localStorage
      localStorage.setItem("accessToken", token);
      if (userRole) localStorage.setItem("userRole", userRole);
      if (userRoles)
        localStorage.setItem("userRoles", JSON.stringify(userRoles));
      if (user?.email) localStorage.setItem("userEmail", user.email);
      if (user?.username) localStorage.setItem("username", user.username);

      // Mise à jour du state
      state.isAuthenticated = true;
      state.token = token;
      state.user = user || state.user;
      state.userRole = userRole || state.userRole;
      state.userRoles = userRoles || state.userRoles;
    },
    setLastLocation: (state, action) => {
      state.lastLocation = action.payload;
      localStorage.setItem("lastLocation", action.payload);
    },
    logout: (state) => {
      // Nettoyage du localStorage
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

      // Réinitialisation du state
      state.isAuthenticated = false;
      state.user = { name: "User", email: "", phone: "", username: "" };
      state.userRole = "admin";
      state.userRoles = [];
      state.token = null;
      state.lastLocation = "/schoolchat/principal";
    },
    restoreAuth: (state, action) => {
      const { token, user, userRole, userRoles, lastLocation } = action.payload;

      state.isAuthenticated = true;
      state.token = token;
      state.user = user || state.user;
      state.userRole = userRole || state.userRole;
      state.userRoles = userRoles || state.userRoles;
      if (lastLocation) {
        state.lastLocation = lastLocation;
        localStorage.setItem("lastLocation", lastLocation);
      }
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Mettre à jour le localStorage si nécessaire
        if (action.payload.username) {
          localStorage.setItem("username", action.payload.username);
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

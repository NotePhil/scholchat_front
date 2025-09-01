import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTokenValid = (token) => {
    if (!token) return false;

    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      return tokenPayload.exp && tokenPayload.exp > currentTime + 300;
    } catch (error) {
      return false;
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    localStorage.removeItem("decodedToken");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("authResponse");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("loginTime");
    setUser(null);
  };

  const loadUserFromStorage = () => {
    try {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");
      const userEmail = localStorage.getItem("userEmail");
      const username = localStorage.getItem("username");

      if (
        isAuthenticated === "true" &&
        accessToken &&
        userId &&
        isTokenValid(accessToken)
      ) {
        const userData = {
          id: userId,
          email: userEmail,
          username,
          role: userRole,
          token: accessToken,
        };

        setUser(userData);
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      clearAuthData();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        loadUserFromStorage();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "isAuthenticated" || e.key === "accessToken") {
        loadUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (authData) => {
    const accessToken = authData.accessToken;
    const userData = {
      id: localStorage.getItem("userId"),
      email: localStorage.getItem("userEmail"),
      username: localStorage.getItem("username"),
      role: localStorage.getItem("userRole"),
      token: accessToken,
    };

    setUser(userData);
  };

  const logout = () => {
    clearAuthData();
    navigate("/schoolchat/login");
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem("accessToken");
    const authFlag = localStorage.getItem("isAuthenticated");
    return authFlag === "true" && !!token && isTokenValid(token);
  };

  const hasRole = (requiredRole) => {
    if (!user?.role) return false;
    return user.role === requiredRole;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

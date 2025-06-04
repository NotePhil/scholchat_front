// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user data in localStorage when app starts
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const userRole = localStorage.getItem("userRole");
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");
        const username = localStorage.getItem("username");
        const decodedToken = localStorage.getItem("decodedToken");

        if (accessToken && userRole) {
          setUser({
            id: userId,
            email: userEmail,
            username,
            role: userRole,
            token: accessToken,
            decodedToken: decodedToken ? JSON.parse(decodedToken) : null,
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (authData) => {
    // This would be called after successful login
    const accessToken = authData.accessToken;
    const refreshToken = authData.refreshToken;
    const decodedToken = JSON.parse(localStorage.getItem("decodedToken"));

    const userData = {
      id: localStorage.getItem("userId"),
      email: localStorage.getItem("userEmail"),
      username: localStorage.getItem("username"),
      role: localStorage.getItem("userRole"),
      token: accessToken,
      decodedToken,
    };

    setUser(userData);
  };

  const logout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    localStorage.removeItem("decodedToken");
    localStorage.removeItem("userRoles");

    setUser(null);
    navigate("/schoolchat/login");
  };

  const isAuthenticated = () => {
    return !!user?.token;
  };

  const hasRole = (requiredRole) => {
    if (!user?.role) return false;
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

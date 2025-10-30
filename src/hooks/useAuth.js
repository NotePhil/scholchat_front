import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction, restoreAuth } from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    // Only run once on mount
    const token = localStorage.getItem("accessToken");
    if (token && !auth.isAuthenticated) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;

        if (Date.now() < expirationTime) {
          const userRole = localStorage.getItem("userRole") || "admin";
          const userRolesStr = localStorage.getItem("userRoles");
          let userRoles = [];

          try {
            userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];
          } catch (e) {
            console.error("Error parsing user roles:", e);
            userRoles = [];
          }

          const lastLocation = localStorage.getItem("lastLocation");
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

          const user = {
            name: name || "User",
            email: userEmail,
            phone: phone,
            username: username,
          };

          dispatch(
            restoreAuth({
              token,
              user,
              userRole,
              userRoles,
              lastLocation,
            })
          );
        } else {
          // Token expired
          handleLogout();
        }
      } catch (error) {
        console.error("Token validation error:", error);
        handleLogout();
      }
    }
  }, []); // Empty dependency array - run only once

  const handleLogout = () => {
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

    dispatch(logoutAction());
    navigate("/schoolchat/login");
  };

  return {
    ...auth,
    logout: handleLogout,
    // Provide safe defaults
    userRole: auth.userRole || "admin",
    userRoles: auth.userRoles || [],
    user: auth.user || { name: "User", email: "", phone: "", username: "" },
  };
};

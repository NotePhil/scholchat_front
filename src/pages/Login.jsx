import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import "../CSS/Login.css";

const decodeJWT = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const rawPayload = atob(base64);
    const jsonPayload = decodeURIComponent(
      rawPayload
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const decodedToken = JSON.parse(jsonPayload);
    return decodedToken;
  } catch (error) {
    return null;
  }
};

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8486/scholchat/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de l'authentification");
      }

      const authData = await response.json();
      const accessToken = authData.accessToken;
      const refreshToken = authData.refreshToken;

      if (!accessToken) {
        throw new Error("Token d'accès manquant dans la réponse");
      }

      // Clear localStorage
      localStorage.clear();

      const decodedToken = decodeJWT(accessToken);
      if (!decodedToken) {
        throw new Error("Token invalide");
      }

      console.log("Decoded Token:", decodedToken);
      console.log("Auth Data:", authData);

      const userId = authData.userId;
      const userEmail =
        authData.userEmail || decodedToken.email || formData.email;
      const username =
        authData.username || decodedToken.username || userEmail.split("@")[0];

      if (!userId) {
        throw new Error("Erreur d'authentification: ID utilisateur manquant");
      }

      if (userId.includes("@")) {
        throw new Error("Erreur d'authentification: ID utilisateur invalide");
      }

      // Extract roles from token - roles come as array from backend
      let userRoles = [];
      let primaryRole = null;

      if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
        // Backend sends roles like ["ROLE_USER", "ROLE_PROFESSOR"]
        userRoles = decodedToken.roles;
        // Get the specific role (usually second one if there are multiple)
        primaryRole =
          decodedToken.roles.length > 1
            ? decodedToken.roles[1]
            : decodedToken.roles[0];
      } else if (decodedToken.role) {
        primaryRole = decodedToken.role;
        userRoles = [decodedToken.role];
      } else if (Array.isArray(decodedToken.authorities)) {
        userRoles = decodedToken.authorities;
        primaryRole = decodedToken.authorities[0];
      }

      console.log("Primary Role:", primaryRole);
      console.log("User Roles:", userRoles);

      // Prepare user object
      const user = {
        name: username,
        email: userEmail,
        username: username,
        phone: decodedToken.phone || decodedToken.phoneNumber || "",
        id: userId,
      };

      // Save to localStorage (for persistence)
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("userRole", primaryRole);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("username", username);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("loginTime", new Date().getTime().toString());
      localStorage.setItem("userRoles", JSON.stringify(userRoles));
      localStorage.setItem("decodedToken", JSON.stringify(decodedToken));
      localStorage.setItem("authResponse", JSON.stringify(authData));

      // Dispatch to Redux with exact role format from backend
      const credentials = {
        token: accessToken,
        user: user,
        userRole: primaryRole, // ROLE_ADMIN, ROLE_PROFESSOR, etc.
        userRoles: userRoles, // Array of roles
      };

      console.log("Dispatching credentials:", credentials);
      dispatch(setCredentials(credentials));

      // Small delay for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.dispatchEvent(new Event("storage"));

      // Navigate based on role - backend sends ROLE_ADMIN, ROLE_PROFESSOR, etc.
      let dashboardPath = "/schoolchat/principal";

      if (primaryRole === "ROLE_ADMIN") {
        dashboardPath = "/schoolchat/principal/AdminDashboard";
      } else if (primaryRole === "ROLE_PROFESSOR") {
        dashboardPath = "/schoolchat/principal/ProfessorDashboard";
      } else if (primaryRole === "ROLE_PARENT") {
        dashboardPath = "/schoolchat/principal/ParentDashboard";
      } else if (primaryRole === "ROLE_STUDENT") {
        dashboardPath = "/schoolchat/principal/StudentDashboard";
      } else if (primaryRole === "ROLE_TUTOR") {
        dashboardPath = "/schoolchat/principal/ProfessorDashboard";
      }

      console.log("Navigating to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "Identifiants invalides. Veuillez vérifier et réessayer."
      );

      // Clear storage on error
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("username");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("decodedToken");
      localStorage.removeItem("authResponse");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear all authentication data on mount
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("decodedToken");
    localStorage.removeItem("authResponse");
    localStorage.removeItem("loginTime");
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Bienvenue</h2>
        <p className="login-subtitle">
          Connectez-vous à votre compte ou{" "}
          <span
            className="create-account"
            onClick={() => navigate("/schoolchat/signup")}
          >
            créez un compte
          </span>
        </p>

        <div className="login-form">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email" className="login-label">
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Entrez votre adresse e-mail"
                className="login-input"
                required
              />
            </div>

            <div className="input-group password-group">
              <label htmlFor="password" className="login-label">
                Mot de passe
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Entrez votre mot de passe"
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div className="flex-container">
              <a href="/schoolchat/forgot-password" className="forgot-password">
                Mot de passe oublié ?
              </a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <span className="loading-text">
                  <span className="loading-spinner"></span>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              En vous connectant, vous acceptez nos{" "}
              <a href="/terms">Conditions d'utilisation</a> et notre{" "}
              <a href="/privacy">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

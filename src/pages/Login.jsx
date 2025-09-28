import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

      localStorage.clear();

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("authToken", accessToken);

      const decodedToken = decodeJWT(accessToken);
      if (!decodedToken) {
        throw new Error("Token invalide");
      }

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

      let tokenUserRole;

      if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
        tokenUserRole =
          decodedToken.roles.length > 1
            ? decodedToken.roles[1]
            : decodedToken.roles[0];
      } else {
        tokenUserRole =
          decodedToken.role ||
          (decodedToken.authorities && decodedToken.authorities[0]) ||
          decodedToken.userType ||
          decodedToken.userRole ||
          decodedToken.type ||
          authData.userType;
      }

      const userTypeMapping = {
        utilisateurs: "student",
        professeurs: "professor",
        admin: "admin",
        ROLE_ADMIN: "admin",
        ADMIN: "admin",
        PROFESSOR: "professor",
        ROLE_PROFESSOR: "professor",
        PARENT: "parent",
        STUDENT: "student",
        ROLE_STUDENT: "student",
        ROLE_USER: "student",
        parents: "parent",
        ROLE_PARENT: "parent",
      };

      const userRole =
        userTypeMapping[tokenUserRole] ||
        tokenUserRole ||
        userTypeMapping[authData.userType] ||
        "student";

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("username", username);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("loginTime", new Date().getTime().toString());

      if (Array.isArray(decodedToken.roles)) {
        localStorage.setItem("userRoles", JSON.stringify(decodedToken.roles));
      }
      localStorage.setItem("decodedToken", JSON.stringify(decodedToken));
      localStorage.setItem("authResponse", JSON.stringify(authData));

      await new Promise((resolve) => setTimeout(resolve, 100));
      window.dispatchEvent(new Event("storage"));

      navigate("/schoolchat/principal", { replace: true });
    } catch (err) {
      setError(
        err.message || "Identifiants invalides. Veuillez vérifier et réessayer."
      );

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any remembered credentials on component mount
    localStorage.removeItem("rememberedEmail");

    // Clear all authentication data to force fresh login
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

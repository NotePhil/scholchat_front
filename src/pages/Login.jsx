import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Login.css";

// Function to decode JWT token with extensive logging
const decodeJWT = (token) => {
  try {
    // Log the original token
    console.log("Original JWT Token:", token);

    // Split the token into parts
    const parts = token.split(".");
    console.log("Token parts:", parts);

    if (parts.length !== 3) {
      console.error("Invalid JWT format: Token does not have three parts");
      return null;
    }

    // Get the payload (second part)
    const base64Url = parts[1];
    console.log("Base64Url payload:", base64Url);

    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    console.log("Converted base64:", base64);

    // Decode base64
    const rawPayload = atob(base64);
    console.log("Raw decoded payload:", rawPayload);

    // Convert to JSON
    const jsonPayload = decodeURIComponent(
      rawPayload
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    console.log("JSON payload:", jsonPayload);

    // Parse JSON
    const decodedToken = JSON.parse(jsonPayload);
    console.log("DECODED TOKEN FULL DATA:", decodedToken);

    return decodedToken;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
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
      console.log("Starting login process for email:", formData.email);

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
      console.log("Auth response data:", authData);

      const accessToken = authData.accessToken;
      const refreshToken = authData.refreshToken;

      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Also store as authToken for backward compatibility with any existing code
      localStorage.setItem("authToken", accessToken);

      // Decode the access token to get user information
      const decodedToken = decodeJWT(accessToken);
      if (!decodedToken) {
        throw new Error("Token invalide");
      }

      // Log all possible role fields to identify the correct field
      console.log("Possible role fields in token:");
      console.log("- role:", decodedToken.role);
      console.log("- roles:", decodedToken.roles);
      console.log("- userType:", decodedToken.userType);
      console.log("- type:", decodedToken.type);
      console.log("- userRole:", decodedToken.userRole);
      console.log("- authorities:", decodedToken.authorities);
      console.log("- scope:", decodedToken.scope);
      console.log("- API response userType:", authData.userType);

      // Extract user information from the decoded token
      const userId = decodedToken.sub || decodedToken.userId || authData.userId;
      const userEmail =
        decodedToken.email || authData.userEmail || formData.email;
      const username =
        decodedToken.username || authData.username || userEmail.split("@")[0];

      // Extract role information - handle array case
      let tokenUserRole;

      // Check if roles is an array and has at least one element
      if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
        // Get the most privileged role (usually the last one, like ROLE_ADMIN)
        // In this case, we take the second element if it exists
        tokenUserRole =
          decodedToken.roles.length > 1
            ? decodedToken.roles[1]
            : decodedToken.roles[0];
      } else {
        // Fall back to other possible role fields
        tokenUserRole =
          decodedToken.role ||
          (decodedToken.authorities && decodedToken.authorities[0]) ||
          decodedToken.userType ||
          decodedToken.userRole ||
          decodedToken.type ||
          authData.userType;
      }

      console.log("Extracted raw user role from token:", tokenUserRole);

      // Normalize user type mapping
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
        ROLE_USER: "student", // Default basic user to student
        parents: "parent",
        ROLE_PARENT: "parent",
      };

      // Log the mapping result
      console.log(
        `Mapping "${tokenUserRole}" to:`,
        userTypeMapping[tokenUserRole] || tokenUserRole
      );

      // Determine user role from token, falling back to response data if needed
      const userRole =
        userTypeMapping[tokenUserRole] ||
        tokenUserRole ||
        userTypeMapping[authData.userType] ||
        "student";

      console.log("Final determined user role:", userRole);

      // Store user information from token
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("username", username);

      // Store the original roles array if available
      if (Array.isArray(decodedToken.roles)) {
        localStorage.setItem("userRoles", JSON.stringify(decodedToken.roles));
      }

      // Store the full decoded token for future reference
      localStorage.setItem("decodedToken", JSON.stringify(decodedToken));

      // Remember me functionality
      if (formData.remember) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      console.log(
        "Authentication complete. Navigating based on role:",
        userRole
      );

      // Handle navigation based on user role
      switch (userRole) {
        case "admin":
          console.log("Navigating to admin dashboard");
          navigate("/schoolchat/Principal");
          break;
        case "professor":
          console.log("Navigating to professor dashboard");
          navigate("/schoolchat/Principal");
          break;
        case "parent":
          console.log("Navigating to parent dashboard");
          navigate("/schoolchat/Principal");
          break;
        case "student":
        default:
          console.log("Navigating to student dashboard");
          navigate("/schoolchat/Principal");
          break;
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError(
        err.message || "Identifiants invalides. Veuillez vérifier et réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        remember: true,
      }));
    }
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Bienvenue</h2>
        <p className="login-subtitle">
          Connectez-vous à votre compte ou{" "}
          <span
            className="create-account"
            onClick={() => navigate("/schoolchat/register")}
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
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="remember-checkbox"
                />
                <label htmlFor="remember" className="remember-label">
                  Se souvenir de moi
                </label>
              </div>
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

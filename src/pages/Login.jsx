import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Login.css";

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

      // Store auth data in localStorage
      localStorage.setItem("accessToken", authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);

      // Normalize user type mapping
      const userTypeMapping = {
        utilisateurs: "student", // Default to student for utilisateurs
        professeurs: "professor",
        admin: "admin",
        ROLE_ADMIN: "admin",
        parents: "parent",
      };

      // Determine user role, defaulting to student if not explicitly mapped
      const userRole = userTypeMapping[authData.userType] || "student";

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", authData.userId);
      localStorage.setItem("userEmail", authData.userEmail);
      localStorage.setItem("username", authData.username);

      // Remember me functionality
      if (formData.remember) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Handle navigation based on user role
      switch (userRole) {
        case "admin":
          navigate("/schoolchat/admin/dashboard");
          break;
        case "professor":
          navigate("/schoolchat/professor-dashboard");
          break;
        case "parent":
          navigate("/schoolchat/parent-dashboard");
          break;
        case "student":
        default:
          navigate("/schoolchat/student-dashboard");
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

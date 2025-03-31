import React, { useState, useEffect } from "react";
import { Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PasswordPage = () => {
  const navigate = useNavigate();
  const [passeAccess, setPasseAccess] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      showAlert("Aucun email trouvé. Veuillez vous réinscrire.");
    }
  }, []);

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (passeAccess.length < 8) {
      showAlert("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    if (passeAccess !== confirmPassword) {
      showAlert("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    const hasUppercase = /[A-Z]/.test(passeAccess);
    const hasLowercase = /[a-z]/.test(passeAccess);
    const hasNumber = /[0-9]/.test(passeAccess);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passeAccess);

    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecialChar)) {
      showAlert("Mot de passe trop faible. Utilisez des caractères variés.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8486/scholchat/auth/registerPassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            passeAccess: passeAccess,
            type: "utilisateur"
          }),
        }
      );

      const responseData = await response;

      if (!response.ok) {
        throw new Error(
          responseData.message || "Échec de la définition du mot de passe"
        );
      }

      showAlert("Mot de passe défini avec succès !", "success");

      localStorage.removeItem("userEmail");

      setTimeout(() => {
        navigate("/schoolchat/login", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      showAlert(
        error.message || "Erreur lors de la définition du mot de passe"
      );
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="password-page">
      {alertMessage && (
        <div className={`alert-message ${alertType}`}>{alertMessage}</div>
      )}
      <div className="password-container">
        <div className="password-icon">
          <Lock size={64} strokeWidth={1.5} />
        </div>
        <h2>Définir un nouveau mot de passe</h2>
        {userEmail && <p className="email-display">Pour: {userEmail}</p>}
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="input-group">
            <label htmlFor="passeAccess">Mot de passe</label>
            <div className="input-wrapper">
              <KeyRound className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                id="passeAccess"
                value={passeAccess}
                onChange={(e) => setPasseAccess(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => togglePasswordVisibility("password")}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="password-requirements">
              Le mot de passe doit contenir:
              <br />- Au moins 8 caractères - Une majuscule - Un chiffre - Un
              caractère spécial
            </p>
          </div>
          <div className="input-group">
            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
            <div className="input-wrapper">
              <KeyRound className="input-icon" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="button-container">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Traitement en cours..." : "Définir le mot de passe"}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .password-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a365d, #2d3748);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .password-container {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 3rem 2rem;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          text-align: center;
        }
        .password-icon {
          width: 110px;
          height: 110px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f5e9;
          border-radius: 50%;
          color: #4caf50;
        }
        .password-container h2 {
          font-size: 1.8rem;
          color: #333;
          margin-bottom: 1rem;
          font-weight: 600;
          text-align: center;
        }
        .email-display {
          color: #555;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .input-group {
          margin-bottom: 1.5rem;
          text-align: left;
        }
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 500;
        }
        .input-wrapper {
          position: relative;
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 40px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }
        .visibility-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
        }
        .password-requirements {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.5rem;
          line-height: 1.4;
        }
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }
        .submit-button {
          padding: 0.85rem 2rem;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
          text-align: center;
          width: 100%;
        }
        .submit-button:hover {
          background: #45a049;
        }
        .submit-button:disabled {
          background: #9e9e9e;
          cursor: not-allowed;
        }
        .alert-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 6px;
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          text-align: left;
        }
        .alert-message.error {
          background: #fff2f2;
          color: #e53935;
          border-left: 4px solid #e53935;
        }
        .alert-message.success {
          background: #f1f8e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .password-container {
            margin: 1rem;
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordPage;

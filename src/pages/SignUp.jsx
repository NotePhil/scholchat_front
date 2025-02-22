import React, { useState, useCallback } from "react";
import PhoneInput from "react-phone-number-input/input";
import "react-phone-number-input/style.css";
import {
  X,
  Save,
  ArrowRight,
  ArrowLeft,
  Loader,
  Eye,
  EyeOff,
} from "lucide-react";
import PhoneInputs from "./PhoneInput";

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("CM");

  const [formData, setFormData] = useState({
    type: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    passeaccess: "",
    adresse: "",
    etat: "INACTIVE",
    niveau: "",
    cniUrlRecto: "",
    cniUrlVerso: "",
    nomEtablissement: "",
    matriculeProfesseur: "",
    nomClasse: "",
  });

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const validateFileSize = async (file) => {
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      let quality = 0.7;
      let compressedDataUrl = await compressImage(file, quality);
      let compressedSize = atob(compressedDataUrl.split(",")[1]).length;

      while (compressedSize > maxSize && quality > 0.1) {
        quality -= 0.1;
        compressedDataUrl = await compressImage(file, quality);
        compressedSize = atob(compressedDataUrl.split(",")[1]).length;
      }

      if (compressedSize > maxSize) {
        showAlert("Image is too large. Please use a smaller image.");
        return null;
      }
      return compressedDataUrl;
    }
    return await compressImage(file, 0.7);
  };

  const compressImage = async (file, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const maxWidth = 800;
          const maxHeight = 600;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const validateStep1 = useCallback(() => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      showAlert("Last name (Nom) is required");
      newErrors.nom = true;
    }
    if (!formData.prenom.trim()) {
      showAlert("First name (Prénom) is required");
      newErrors.prenom = true;
    }
    if (!formData.email.trim()) {
      showAlert("Email is required");
      newErrors.email = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("Please enter a valid email address");
      newErrors.email = true;
    }
    if (!formData.telephone) {
      showAlert("Phone number is required");
      newErrors.telephone = true;
    }
    if (!formData.passeaccess.trim()) {
      showAlert("Password is required");
      newErrors.passeaccess = true;
    } else if (formData.passeaccess.length < 6) {
      showAlert("Password must be at least 6 characters long");
      newErrors.passeaccess = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (!formData.type) {
      showAlert("Please select a user type");
      newErrors.type = true;
    }

    if (formData.type === "professeur") {
      if (!formData.cniUrlRecto) {
        showAlert("Front ID card image is required");
        newErrors.cniUrlRecto = true;
      }
      if (!formData.cniUrlVerso) {
        showAlert("Back ID card image is required");
        newErrors.cniUrlVerso = true;
      }
      if (!formData.nomEtablissement.trim()) {
        showAlert("School name is required");
        newErrors.nomEtablissement = true;
      }
      if (!formData.matriculeProfesseur.trim()) {
        showAlert("Professor ID is required");
        newErrors.matriculeProfesseur = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      telephone: value || "",
    }));
    if (errors.telephone) {
      setErrors((prev) => ({ ...prev, telephone: false }));
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Please upload an image file (JPEG, PNG)");
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await validateFileSize(file);
      if (!compressedDataUrl) {
        e.target.value = "";
        return;
      }

      const base64Data = compressedDataUrl.split(",")[1];
      const fieldMapping = {
        cniUrlFront: "cniUrlRecto",
        cniUrlBack: "cniUrlVerso",
      };

      const backendFieldName = fieldMapping[fieldName] || fieldName;
      setFormData((prev) => ({
        ...prev,
        [backendFieldName]: base64Data,
      }));

      setErrors((prev) => ({
        ...prev,
        [fieldName]: false,
        [backendFieldName]: false,
      }));
    } catch (error) {
      console.error("Error processing image:", error);
      showAlert("Error processing image. Please try another image.");
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    try {
      if (!validateStep2()) return;

      setIsSubmitting(true);

      const apiUrl = "http://localhost:8486/scholchat/utilisateurs";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      showAlert("Registration successful!", "success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      showAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="signup-page">
      {alertMessage && (
        <div className={`alert-message ${alertType}`}>{alertMessage}</div>
      )}

      <div className="signup-container">
        <div className="progress-bar">
          <div className="step-circles">
            <div className={`step-circle ${currentStep >= 1 ? "active" : ""}`}>
              1
            </div>
            <div className="step-line"></div>
            <div className={`step-circle ${currentStep >= 2 ? "active" : ""}`}>
              2
            </div>
          </div>
          <div className="step-labels">
            <span>Personal Information</span>
            <span>Account Details</span>
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name (Prénom)</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={errors.prenom ? "error" : ""}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name (Nom)</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={errors.nom ? "error" : ""}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group phone-input">
              <label>Phone Number</label>
              <PhoneInputs
                value={formData.telephone || ""}
                onChange={handlePhoneChange}
                onCountryChange={handleCountryChange}
                error={errors.telephone}
              />
            </div>

            <div className="form-group password-input">
              <label>Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="passeaccess"
                  value={formData.passeaccess}
                  onChange={handleInputChange}
                  className={errors.passeaccess ? "error" : ""}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Address (Optional)</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                placeholder="Enter your address"
                rows="3"
              />
            </div>

            <button
              type="button"
              className="next-button"
              onClick={handleNextStep}
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <div className="signup-form">
            <div className="form-group">
              <label>User Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={errors.type ? "error" : ""}
              >
                <option value="">Select User Type</option>
                <option value="professeur">Professor</option>
                <option value="eleve">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {formData.type === "professeur" && (
              <div className="professor-details">
                <div className="form-grid">
                  <div className="form-group">
                    <label>ID Card Front (CNI Recto)</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlFront")}
                      className={errors.cniUrlRecto ? "error" : ""}
                      accept="image/*"
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Card Back (CNI Verso)</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlBack")}
                      className={errors.cniUrlVerso ? "error" : ""}
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>School Name (Établissement)</label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement}
                      onChange={handleInputChange}
                      className={errors.nomEtablissement ? "error" : ""}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Professor ID (Matricule)</label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur}
                      onChange={handleInputChange}
                      className={errors.matriculeProfesseur ? "error" : ""}
                      placeholder="Enter professor ID"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                type="button"
                className="prev-button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} />
                Previous Step
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Sign Up
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a365d, #2d3748);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .signup-container {
          width: 100%;
          max-width: 600px;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .progress-bar {
          margin-bottom: 2rem;
        }

        .step-circles {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-weight: bold;
          margin: 0 1rem;
        }

        .step-circle.active {
          background: #4caf50;
          color: white;
        }

        .step-line {
          height: 2px;
          width: 100px;
          background: #e0e0e0;
        }

        .step-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 0.9rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .error {
          border-color: #dc3545;
        }

        .password-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }

        .prev-button,
        .submit-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .prev-button {
          background: #f0f0f0;
          color: #333;
        }

        .prev-button:hover {
          background: #e0e0e0;
        }

        .submit-button {
          background: #4caf50;
          color: white;
        }

        .submit-button:hover {
          background: #45a049;
        }

        .submit-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        .alert-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem;
          border-radius: 4px;
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
        }

        .alert-message.error {
          background: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }

        .alert-message.success {
          background: #e8f5e9;
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
          .signup-container {
            margin: 1rem;
            padding: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .button-group {
            flex-direction: column;
            gap: 1rem;
          }

          .prev-button,
          .submit-button {
            width: 100%;
            justify-content: center;
          }

          .step-labels {
            font-size: 0.8rem;
          }

          .step-line {
            width: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignUp;

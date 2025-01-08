import React, { useState, useCallback } from "react";
import { X, Save, ArrowRight, ArrowLeft, Loader } from "lucide-react";
import { useScholchat } from "../hooks/useScholchat";

const SignUp = () => {
  const { createProfessor, createParent, createStudent, loading, error } =
    useScholchat();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  const validateFileSize = async (file) => {
    const maxSize = 500 * 1024; // Reduce to 500KB
    if (file.size > maxSize) {
      let quality = 0.7;
      let compressedDataUrl = await compressImage(file, quality);
      let compressedSize = atob(compressedDataUrl.split(",")[1]).length;

      // Progressive compression until size is acceptable
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
          // Calculate dimensions to maintain aspect ratio
          let width = img.width;
          let height = img.height;

          // Maximum dimensions for ID card images
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
          ctx.fillStyle = "#FFFFFF"; // White background
          ctx.fillRect(0, 0, width, height);

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with specified quality
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    adresse: "",
    userType: "",
    cniUrlFront: null,
    cniUrlBack: null,
    nomEtablissement: "",
    matriculeProfesseur: "",
    niveau: "",
  });

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
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
    if (!formData.telephone.trim()) {
      showAlert("Phone number is required");
      newErrors.telephone = true;
    }
    if (!formData.password.trim()) {
      showAlert("Password is required");
      newErrors.password = true;
    } else if (formData.password.length < 6) {
      showAlert("Password must be at least 6 characters long");
      newErrors.password = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (!formData.userType) {
      showAlert("Please select a user type");
      newErrors.userType = true;
    }

    if (formData.userType === "Professeur") {
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

    if (formData.userType === "Eleve" && !formData.niveau) {
      showAlert("Please select a level");
      newErrors.niveau = true;
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

     // Verify base64 string length before setting state
     const base64Length = atob(compressedDataUrl.split(",")[1]).length;
     if (base64Length > 200000) {
       // ~200KB after base64 encoding
       showAlert(
         "Image is still too large after compression. Please use a smaller image."
       );
       e.target.value = "";
       return;
     }

     const fieldMapping = {
       cniUrlFront: "cniUrlRecto",
       cniUrlBack: "cniUrlVerso",
     };

     const backendFieldName = fieldMapping[fieldName] || fieldName;
     setFormData((prev) => ({
       ...prev,
       [backendFieldName]: compressedDataUrl,
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
      if (!validateStep2()) {
        return;
      }

      setIsSubmitting(true);

      const baseUserData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        passeAccess: formData.password,
        adresse: formData.adresse.trim(),
        etat: "active",
      };

      if (formData.userType === "Professeur") {
        const professorData = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone.trim(),
          adresse: formData.adresse.trim(),
          etat: "active",
          nomEtablissement: formData.nomEtablissement,
          matriculeProfesseur: formData.matriculeProfesseur,
          nomClasse: formData.nomClasse || "",
          cniUrlRecto: formData.cniUrlRecto?.split(",")[1] || null,
          cniUrlVerso: formData.cniUrlVerso?.split(",")[1] || null,
        };

        await createProfessor(professorData);
      } else if (formData.userType === "Parent") {
        await createParent(baseUserData);
      } else if (formData.userType === "Eleve") {
        await createStudent({
          ...baseUserData,
          niveau: formData.niveau,
        });
      }

      showAlert("Registration successful! You can now login.", "success");

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

  const renderActionButton = () => (
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
      ) : currentStep === 1 ? (
        <>
          Next Step
          <ArrowRight size={16} />
        </>
      ) : (
        <>
          Complete Sign Up
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );

  return (
    <div className="signup-page">
      {loading && <div className="loading-overlay">Loading...</div>}

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

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className={errors.telephone ? "error" : ""}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
              />
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
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className={errors.userType ? "error" : ""}
              >
                <option value="">Select User Type</option>
                <option value="Parent">Parent</option>
                <option value="Professeur">Professor</option>
                <option value="Eleve">Student</option>
              </select>
            </div>

            {formData.userType === "Professeur" && (
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

            {formData.userType === "Eleve" && (
              <div className="form-group">
                <label>Level</label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleInputChange}
                  className={errors.niveau ? "error" : ""}
                >
                  <option value="">Select Level</option>
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="HIGH_SCHOOL">High School</option>
                </select>
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
              {renderActionButton()}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a365d, #2d3748);
        }

        .signup-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-weight: bold;
        }

        .step-circle.active {
          background: #4caf50;
          color: white;
        }

        .step-line {
          height: 2px;
          flex-grow: 1;
          background: #e0e0e0;
          margin: 0 1rem;
        }

        .step-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
        }

        .signup-form {
          margin-top: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
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

        input.error,
        select.error {
          border-color: #dc3545;
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .prev-button {
          background: #f5f5f5;
          color: #666;
        }

        .next-button,
        .submit-button {
          background: #4caf50;
          color: white;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.2rem;
          z-index: 1000;
        }

        .alert-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 4px;
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
        }

        .alert-message.error {
          background: #fee;
          color: #dc3545;
        }

        .alert-message.success {
          background: #efe;
          color: #4caf50;
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
          .form-grid {
            grid-template-columns: 1fr;
          }

          .signup-container {
            padding: 1rem;
          }

          .button-group {
            flex-direction: column;
            gap: 1rem;
          }

          .prev-button,
          .next-button,
          .submit-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SignUp;

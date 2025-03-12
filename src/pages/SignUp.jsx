import React, { useState, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";
import "../CSS/Signup.css"; // Import the separate CSS file

const SignUp = () => {
  const navigate = useNavigate();
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
    passeAccess: "", // Correspond au champ du backend
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

  // Improved image compression with better error handling
  const validateFileSize = async (file) => {
    const maxSize = 300 * 1024; // Reduced to 300KB for better handling
    if (file.size > maxSize) {
      let quality = 0.5; // Start with lower quality
      let compressedDataUrl = await compressImage(file, quality);
      let compressedSize = atob(compressedDataUrl.split(",")[1]).length;

      while (compressedSize > maxSize && quality > 0.1) {
        quality -= 0.1;
        compressedDataUrl = await compressImage(file, quality);
        compressedSize = atob(compressedDataUrl.split(",")[1]).length;
      }

      if (compressedSize > maxSize) {
        showAlert(
          "L'image est trop volumineuse. Veuillez utiliser une image plus petite."
        );
        return null;
      }
      return compressedDataUrl;
    }
    return await compressImage(file, 0.5); // Use lower default quality
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

          const maxWidth = 600; // Reduced from 800
          const maxHeight = 400; // Reduced from 600

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
      showAlert("Le nom est requis");
      newErrors.nom = true;
    }
    if (!formData.prenom.trim()) {
      showAlert("Le prénom est requis");
      newErrors.prenom = true;
    }
    if (!formData.email.trim()) {
      showAlert("L'email est requis");
      newErrors.email = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("Veuillez entrer une adresse email valide");
      newErrors.email = true;
    }
    if (!formData.telephone) {
      showAlert("Le numéro de téléphone est requis");
      newErrors.telephone = true;
    }
    if (!formData.passeAccess.trim()) {
      showAlert("Le mot de passe est requis");
      newErrors.passeAccess = true;
    } else if (formData.passeAccess.length < 8) {
      showAlert("Le mot de passe doit contenir au moins 8 caractères");
      newErrors.passeAccess = true;
    } else if (!formData.passeAccess.match(/.*[A-Z].*/)) {
      showAlert("Le mot de passe doit contenir au moins une majuscule");
      newErrors.passeAccess = true;
    } else if (!formData.passeAccess.match(/.*[a-z].*/)) {
      showAlert("Le mot de passe doit contenir au moins une minuscule");
      newErrors.passeAccess = true;
    } else if (!formData.passeAccess.match(/.*\d.*/)) {
      showAlert("Le mot de passe doit contenir au moins un chiffre");
      newErrors.passeAccess = true;
    } else if (
      !formData.passeAccess.match(/.*[!@#$%^&*()_+\-=\[\]{};':"\\\|,.<>\/?].*/)
    ) {
      showAlert("Le mot de passe doit contenir au moins un caractère spécial");
      newErrors.passeAccess = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (!formData.type) {
      showAlert("Veuillez sélectionner un type d'utilisateur");
      newErrors.type = true;
      return false;
    }

    // Different validation based on user type
    if (formData.type === "professeur") {
      if (!formData.nomEtablissement.trim()) {
        showAlert("Le nom de l'établissement est requis");
        newErrors.nomEtablissement = true;
      }
      if (!formData.matriculeProfesseur.trim()) {
        showAlert("Le matricule du professeur est requis");
        newErrors.matriculeProfesseur = true;
      }
      if (!formData.nomClasse.trim()) {
        showAlert("Le nom de la classe est requis");
        newErrors.nomClasse = true;
      }
      if (!formData.cniUrlRecto) {
        showAlert("L'image recto de la CNI est requise");
        newErrors.cniUrlRecto = true;
      }
      if (!formData.cniUrlVerso) {
        showAlert("L'image verso de la CNI est requise");
        newErrors.cniUrlVerso = true;
      }
    } else if (formData.type === "repetiteur") {
      if (!formData.nomEtablissement.trim()) {
        showAlert("Le nom de l'établissement est requis");
        newErrors.nomEtablissement = true;
      }
      if (!formData.matriculeProfesseur.trim()) {
        showAlert("Le matricule du répétiteur est requis");
        newErrors.matriculeProfesseur = true;
      }
    } else if (formData.type === "eleve") {
      if (!formData.niveau.trim()) {
        showAlert("Le niveau d'éducation est requis");
        newErrors.niveau = true;
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

  // Updated file handling to generate URLs instead of base64 data
  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Veuillez télécharger un fichier image (JPEG, PNG)");
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await validateFileSize(file);
      if (!compressedDataUrl) {
        e.target.value = "";
        return;
      }

      // Map frontend field names to backend field names
      const fieldMapping = {
        cniUrlFront: "cniUrlRecto",
        cniUrlBack: "cniUrlVerso",
      };

      const backendFieldName = fieldMapping[fieldName] || fieldName;

      // Create a temporary URL for the compressed image
      // In production, you would upload to a server and get a URL
      // This is a simplified example
      const mockUrl = `http://example.com/${file.name.replace(/\s+/g, "_")}`;

      setFormData((prev) => ({
        ...prev,
        [backendFieldName]: mockUrl,
      }));

      setErrors((prev) => ({
        ...prev,
        [fieldName]: false,
        [backendFieldName]: false,
      }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      showAlert(
        "Erreur lors du traitement de l'image. Veuillez essayer une autre image."
      );
      e.target.value = "";
    }
  };

  // Updated submit handler with improved error handling
  const handleSubmit = async () => {
    try {
      if (!validateStep2()) return;

      setIsSubmitting(true);

      // Prepare payload based on user type
      let payloadData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        passeAccess: formData.passeAccess, // Correspond au champ du backend
        telephone: formData.telephone,
        adresse: formData.adresse,
        type: formData.type,
        etat: "INACTIVE",
      };

      // Add specific fields based on user type
      if (formData.type === "professeur") {
        payloadData = {
          ...payloadData,
          cniUrlRecto: formData.cniUrlRecto,
          cniUrlVerso: formData.cniUrlVerso,
          nomEtablissement: formData.nomEtablissement,
          matriculeProfesseur: formData.matriculeProfesseur,
          nomClasse: formData.nomClasse,
        };
      } else if (formData.type === "repetiteur") {
        payloadData = {
          ...payloadData,
          nomEtablissement: formData.nomEtablissement,
          matriculeProfesseur: formData.matriculeProfesseur,
        };
      } else if (formData.type === "eleve") {
        payloadData = {
          ...payloadData,
          niveau: formData.niveau,
        };
      } else if (formData.type === "parent") {
        // Default fields are already included
      }

      console.log("Sending data:", JSON.stringify(payloadData, null, 2));

      const apiUrl = "http://localhost:8486/scholchat/auth/register";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials if needed
        body: JSON.stringify(payloadData),
      });

      // Log response details for debugging
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers])
      );

      const responseData = await response.text();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData || `Error ${response.status}: Registration failed`
        );
      }

      // Display the exact message from the backend
      showAlert(responseData, "success");

      // Navigate to verification page with email as a query parameter (using search params for React Router)
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error("Detailed registration error:", err);
      const errorMessage =
        err.message || "L'inscription a échoué. Veuillez réessayer.";
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
            <span>Informations personnelles</span>
            <span>Détails du compte</span>
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  valuetype="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={errors.prenom ? "error" : ""}
                  placeholder="Entrez votre prénom"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={errors.nom ? "error" : ""}
                  placeholder="Entrez votre nom"
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
                placeholder="Entrez votre email"
              />
            </div>

            <div className="form-group phone-input">
              <label>Numéro de téléphone</label>
              <PhoneInputs
                value={formData.telephone || ""}
                onChange={handlePhoneChange}
                onCountryChange={handleCountryChange}
                error={errors.telephone}
              />
            </div>

            <div className="form-group password-input">
              <label>Mot de passe</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="passeAccess"
                  value={formData.passeAccess}
                  onChange={handleInputChange}
                  className={errors.passeAccess ? "error" : ""}
                  placeholder="Entrez votre mot de passe"
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
              <label>Adresse (Optionnel)</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                placeholder="Entrez votre adresse"
                rows="3"
              />
            </div>

            <button
              type="button"
              className="next-button"
              onClick={handleNextStep}
            >
              Étape suivante
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <div className="signup-form">
            <div className="form-group">
              <label>Type d'utilisateur</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={errors.type ? "error" : ""}
              >
                <option value="">Sélectionnez le type d'utilisateur</option>
                <option value="professeur">Professeur</option>
                <option value="repetiteur">Répétiteur</option>
                <option value="eleve">Élève</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {formData.type === "professeur" && (
              <div className="professor-details">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      CNI Recto <span className="required">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlFront")}
                      className={errors.cniUrlRecto ? "error" : ""}
                      accept="image/*"
                    />
                    {formData.cniUrlRecto && (
                      <div className="image-preview-info">
                        Image sélectionnée ✓
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>
                      CNI Verso <span className="required">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlBack")}
                      className={errors.cniUrlVerso ? "error" : ""}
                      accept="image/*"
                    />
                    {formData.cniUrlVerso && (
                      <div className="image-preview-info">
                        Image sélectionnée ✓
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Nom de l'établissement <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement}
                      onChange={handleInputChange}
                      className={errors.nomEtablissement ? "error" : ""}
                      placeholder="Entrez le nom de l'établissement"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Matricule du professeur{" "}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur}
                      onChange={handleInputChange}
                      className={errors.matriculeProfesseur ? "error" : ""}
                      placeholder="Entrez le matricule du professeur"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Nom de la classe <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="nomClasse"
                    value={formData.nomClasse}
                    onChange={handleInputChange}
                    className={errors.nomClasse ? "error" : ""}
                    placeholder="Entrez le nom de la classe"
                  />
                </div>
              </div>
            )}

            {formData.type === "repetiteur" && (
              <div className="tutor-details">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Nom de l'établissement <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement}
                      onChange={handleInputChange}
                      className={errors.nomEtablissement ? "error" : ""}
                      placeholder="Entrez le nom de l'établissement"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Matricule du répétiteur{" "}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur}
                      onChange={handleInputChange}
                      className={errors.matriculeProfesseur ? "error" : ""}
                      placeholder="Entrez le matricule du répétiteur"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === "eleve" && (
              <div className="student-details">
                <div className="form-group">
                  <label>
                    Niveau d'éducation <span className="required">*</span>
                  </label>
                  <select
                    name="niveau"
                    value={formData.niveau}
                    onChange={handleInputChange}
                    className={errors.niveau ? "error" : ""}
                  >
                    <option value="">Sélectionnez le niveau d'éducation</option>
                    <option value="primaire">École primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="universite">Université</option>
                  </select>
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
                Étape précédente
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
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    Terminer l'inscription
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;

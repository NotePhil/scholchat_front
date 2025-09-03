import React, { useState, useCallback, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { ArrowRight, ArrowLeft, Loader, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/Signup.css";
import axios from "axios";

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [token, setToken] = useState("");
  const [createdUserId, setCreatedUserId] = useState(null);

  const [imagePreviews, setImagePreviews] = useState({
    cniRecto: null,
    cniVerso: null,
    selfie: null,
  });

  const [formData, setFormData] = useState({
    type: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    etat: "INACTIVE",
    niveau: "",
    cniRecto: "",
    cniVerso: "",
    selfie: "",
    matriculeProfesseur: "",
    hasUploaded: false,
  });

  const handleTypeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    localStorage.setItem("userType", value);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get("email");
    const tokenParam = urlParams.get("token");

    if (emailParam && tokenParam) {
      setIsUpdateMode(true);
      setToken(tokenParam);

      const fetchUserData = async () => {
        try {
          setIsSubmitting(true);
          const response = await axios.get(
            `http://localhost:8486/scholchat/auth/users/byEmail`,
            {
              params: { email: emailParam, token: tokenParam },
            }
          );

          if (response.data) {
            const userData = response.data;
            setFormData({
              id: userData.id || "",
              type: userData.type || "",
              nom: userData.nom || "",
              prenom: userData.prenom || "",
              email: emailParam,
              telephone: userData.telephone || "",
              adresse: userData.adresse || "",
              etat: userData.etat || "INACTIVE",
              niveau: userData.niveau || "",
              cniRecto: userData.cniUrlRecto || "",
              cniVerso: userData.cniUrlVerso || "",
              selfie: userData.selfieUrl || "",
              matriculeProfesseur: userData.matriculeProfesseur || "",
            });

            if (userData.type) {
              localStorage.setItem("userType", userData.type);
            }

            if (userData.telephone) {
              if (userData.telephone.startsWith("+237")) {
                setSelectedCountry("CM");
              } else if (userData.telephone.startsWith("+33")) {
                setSelectedCountry("FR");
              }
            }

            setImagePreviews({
              cniRecto: userData.cniUrlRecto || null,
              cniVerso: userData.cniUrlVerso || null,
              selfie: userData.selfieUrl || null,
            });

            if (
              userData.type === "professeur" &&
              (userData.cniUrlRecto ||
                userData.cniUrlVerso ||
                userData.selfieUrl)
            ) {
              setCurrentStep(3);
            } else if (userData.type) {
              setCurrentStep(2);
            }

            showAlert(
              "Veuillez vérifier et mettre à jour vos informations",
              "info"
            );
          }
        } catch (err) {
          console.error("Erreur lors du chargement des données:", err);
          showAlert(
            err.response?.data?.message ||
              "Erreur lors du chargement de vos informations",
            "error"
          );
        } finally {
          setIsSubmitting(false);
        }
      };

      fetchUserData();
    } else {
      const storedData = localStorage.getItem("signupFormData");
      const storedPreviews = localStorage.getItem("imagePreviews");
      const storedUserType = localStorage.getItem("userType");
      const storedUserId = localStorage.getItem("createdUserId");

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setFormData(parsedData);

        if (parsedData.telephone && parsedData.telephone.startsWith("+")) {
          if (parsedData.telephone.startsWith("+237")) {
            setSelectedCountry("CM");
          } else if (parsedData.telephone.startsWith("+33")) {
            setSelectedCountry("FR");
          }
        }
      }

      if (storedPreviews) {
        setImagePreviews(JSON.parse(storedPreviews));
      }

      if (storedUserType) {
        setFormData((prev) => ({ ...prev, type: storedUserType }));
      }

      if (storedUserId) {
        setCreatedUserId(storedUserId);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (!isUpdateMode) {
      localStorage.setItem("signupFormData", JSON.stringify(formData));
      localStorage.setItem("imagePreviews", JSON.stringify(imagePreviews));
    }
  }, [formData, imagePreviews, isUpdateMode]);

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
  };

  const compressImage = async (file, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
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
    if (!formData.telephone) {
      showAlert("Le numéro de téléphone est requis");
      newErrors.telephone = true;
    } else {
      const cleanedPhone = formData.telephone.replace(/\s+|-|\(|\)/g, "");

      if (
        selectedCountry === "CM" &&
        !cleanedPhone.match(/^(\+237|00237)?[6-9]\d{8}$/)
      ) {
        showAlert("Format de téléphone camerounais invalide");
        newErrors.telephone = true;
      } else if (
        selectedCountry === "FR" &&
        !cleanedPhone.match(/^(\+33|0033)?[1-9]\d{8}$/)
      ) {
        showAlert("Format de téléphone français invalide");
        newErrors.telephone = true;
      }
    }

    if (!formData.email.trim()) {
      showAlert("L'email est requis");
      newErrors.email = true;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showAlert("Adresse email invalide");
      newErrors.email = true;
    }

    if (!formData.adresse.trim()) {
      showAlert("L'adresse est requise");
      newErrors.adresse = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedCountry]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (!formData.type) {
      showAlert("Veuillez sélectionner un type d'utilisateur");
      newErrors.type = true;
      return false;
    }

    if (formData.type === "eleve") {
      if (!formData.niveau.trim()) {
        showAlert("Le niveau d'éducation est requis");
        newErrors.niveau = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

const validateStep3 = useCallback(() => {
  const newErrors = {};
  if (formData.type === "professeur" && !isUpdateMode) {
    if (!formData.cniRecto) {
      showAlert("La photo recto de la CNI est requise");
      newErrors.cniRecto = true;
    }
    if (!formData.cniVerso) {
      showAlert("La photo verso de la CNI est requise");
      newErrors.cniVerso = true;
    }
    if (!formData.selfie) {
      showAlert("Une photo de profil est requise");
      newErrors.selfie = true;
    }
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [formData, isUpdateMode]);


  const handlePhoneChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      telephone: value || "",
    }));

    if (value) {
      if (value.startsWith("+237")) {
        setSelectedCountry("CM");
      } else if (value.startsWith("+33")) {
        setSelectedCountry("FR");
      }
    }

    if (errors.telephone) {
      setErrors((prev) => ({ ...prev, telephone: false }));
    }
  };

  const CountrySelect = ({ value, onChange, options, ...restProps }) => {
    const countryToFlag = (countryCode) => {
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt())
        );
    };

    return (
      <select
        {...restProps}
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        style={{
          width: "60px",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-down'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1rem",
          appearance: "none",
        }}
      >
        {options?.map(({ value, label }) => (
          <option key={value} value={value}>
            {countryToFlag(value)} {label}
          </option>
        ))}
        <option value={value} style={{ display: "none" }}>
          {value ? countryToFlag(value) : ""}
        </option>
      </select>
    );
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Veuillez télécharger un fichier image (JPEG, PNG)");
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setImagePreviews((prev) => ({
        ...prev,
        [fieldName]: compressedDataUrl,
      }));

      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));

      setErrors((prev) => ({
        ...prev,
        [fieldName]: false,
      }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      showAlert("Erreur lors du traitement de l'image. Veuillez réessayer.");
      e.target.value = "";
    }
  };

  const handleRemoveImage = (fieldName) => {
    setImagePreviews((prev) => ({
      ...prev,
      [fieldName]: null,
    }));

    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

const uploadFileToS3 = async (file, userId, documentType) => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;

    // Generate presigned URL
    const presignedResponse = await axios.post(
      "http://localhost:8486/scholchat/media/presigned-url",
      {
        fileName: fileName,
        contentType: file.type,
        mediaType: "IMAGE",
        ownerId: userId,
        documentType: documentType,
      }
    );

    const { url } = presignedResponse.data;

    // Upload the file
    let fileToUpload;
    if (typeof file === "string" && file.startsWith("data:")) {
      const res = await fetch(file);
      fileToUpload = await res.blob();
    } else {
      fileToUpload = file;
    }

    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: fileToUpload,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed with status ${uploadResponse.status}: ${errorText}`
      );
    }

    // Return the full URL from the presigned response
    return url.split("?")[0];
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(`Upload error: ${error.message}`);
  }
};


  const createBasicProfile = async () => {
    try {
      setIsSubmitting(true);

      const payloadData = {
        type: formData.type,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        etat: "INACTIVE",
      };

      if (formData.type === "eleve") {
        payloadData.niveau = formData.niveau;
      }

      const response = await axios.post(
        "http://localhost:8486/scholchat/utilisateurs",
        payloadData
      );

      const newUserId = response.data.id;
      setCreatedUserId(newUserId);
      localStorage.setItem("createdUserId", newUserId);

      showAlert("Profil créé avec succès!", "success");

      if (formData.type === "professeur") {
        setCurrentStep(3);
      } else {
        completeRegistration();
      }
    } catch (err) {
      console.error("Erreur lors de la création du profil:", err);
      showAlert(
        err.response?.data?.message || "Erreur lors de la création du profil"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
const handleDocumentSubmission = async () => {
  try {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    const userId = isUpdateMode ? formData.id : createdUserId;

    const updatePayload = {
      id: userId,
      type: formData.type,
      hasUploaded: false, // Default to false
    };

    if (formData.matriculeProfesseur?.trim()) {
      updatePayload.matriculeProfesseur = formData.matriculeProfesseur.trim();
    }

    // Upload files and collect URLs
    if (formData.cniRecto instanceof File || typeof formData.cniRecto === "string") {
      const cniRectoUrl = await uploadFileToS3(formData.cniRecto, userId, "cni-recto");
      updatePayload.cniUrlRecto = cniRectoUrl;
    }

    if (formData.cniVerso instanceof File || typeof formData.cniVerso === "string") {
      const cniVersoUrl = await uploadFileToS3(formData.cniVerso, userId, "cni-verso");
      updatePayload.cniUrlVerso = cniVersoUrl;
    }

    if (formData.selfie instanceof File || typeof formData.selfie === "string") {
      const selfieUrl = await uploadFileToS3(formData.selfie, userId, "selfie");
      updatePayload.selfieUrl = selfieUrl;
    }

    // Check if all required images are uploaded
    const allImagesUploaded =
      updatePayload.cniUrlRecto &&
      updatePayload.cniUrlVerso &&
      updatePayload.selfieUrl;

    // Set hasUploaded to true only if all images are uploaded
    if (allImagesUploaded) {
      updatePayload.hasUploaded = true;
    }

    // Update user with the collected URLs and hasUploaded status
    if (isUpdateMode) {
      await axios.post(
        "http://localhost:8486/scholchat/auth/users/update",
        updatePayload,
        {
          params: {
            email: formData.email,
            token: token,
          },
        }
      );
      showAlert("Vos informations ont été mises à jour avec succès!", "success");
      setTimeout(() => {
        navigate("/schoolchat/login");
      }, 2000);
    } else {
      await axios.patch(
        `http://localhost:8486/scholchat/utilisateurs/${userId}`,
        updatePayload
      );
      completeRegistration();
    }
  } catch (err) {
    console.error("Erreur lors du traitement des documents:", err);
    showAlert(
      err.response?.data?.message || "Erreur lors du traitement des documents"
    );
  } finally {
    setIsSubmitting(false);
  }
};



  const completeRegistration = () => {
    localStorage.setItem("userEmail", formData.email);
    localStorage.removeItem("signupFormData");
    localStorage.removeItem("imagePreviews");
    localStorage.removeItem("createdUserId");

    showAlert(
      "Inscription réussie! Veuillez vérifier votre email pour activer votre compte.",
      "success"
    );

    navigate(
      `/schoolchat/verify-email?email=${encodeURIComponent(formData.email)}`
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      createBasicProfile();
    } else if (currentStep === 3) {
      handleDocumentSubmission();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
    setErrors({});
  };

  const getPageTitle = () => {
    return isUpdateMode ? "Mise à jour des informations" : "Inscription";
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Traitement en cours...";
    }

    if (currentStep === 1) {
      return "Étape suivante";
    } else if (currentStep === 2) {
      return formData.type === "professeur"
        ? "Créer le profil"
        : "Terminer l'inscription";
    } else if (currentStep === 3) {
      return isUpdateMode
        ? "Mettre à jour mes informations"
        : "Terminer l'inscription";
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return "Informations personnelles";
    if (currentStep === 2) return "Type de compte";
    if (currentStep === 3) return "Documents et photo";
  };

  const ImagePreview = ({ src, alt, onRemove }) => {
    if (!src) return null;

    return (
      <div className="image-preview">
        <img src={src} alt={alt} />
        <button
          type="button"
          className="remove-image-btn"
          onClick={onRemove}
          aria-label="Supprimer l'image"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="signup-page">
      {alertMessage && (
        <div className={`alert-message ${alertType}`}>{alertMessage}</div>
      )}

      <div className="signup-container">
        <h2 className="page-title">{getPageTitle()}</h2>

        <div className="progress-bar">
          <div className="step-circles">
            <div className={`step-circle ${currentStep >= 1 ? "active" : ""}`}>
              1
            </div>
            <div
              className={`step-line ${currentStep >= 2 ? "active" : ""}`}
            ></div>
            <div className={`step-circle ${currentStep >= 2 ? "active" : ""}`}>
              2
            </div>
            {formData.type === "professeur" && (
              <>
                <div
                  className={`step-line ${currentStep >= 3 ? "active" : ""}`}
                ></div>
                <div
                  className={`step-circle ${currentStep >= 3 ? "active" : ""}`}
                >
                  3
                </div>
              </>
            )}
          </div>
          <div className="step-labels">
            <span className={currentStep >= 1 ? "active" : ""}>
              Informations personnelles
            </span>
            <span className={currentStep >= 2 ? "active" : ""}>
              Type de compte
            </span>
            {formData.type === "professeur" && (
              <span className={currentStep >= 3 ? "active" : ""}>
                Documents
              </span>
            )}
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-three-columns">
              <div className="form-group">
                <label>
                  Prénom <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={errors.prenom ? "error" : ""}
                  placeholder="Entrez votre prénom"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Nom <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={errors.nom ? "error" : ""}
                  placeholder="Entrez votre nom"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Email"
                  disabled={isUpdateMode}
                  required
                />
              </div>
            </div>

            <div className="form-three-columns">
              <div className="form-group phone-group">
                <label>
                  Numéro de téléphone <span className="required">*</span>
                </label>
                <div
                  className={`phone-input-container ${
                    errors.telephone ? "error" : ""
                  }`}
                >
                  <PhoneInput
                    defaultCountry={selectedCountry}
                    value={formData.telephone}
                    onChange={handlePhoneChange}
                    countrySelectComponent={CountrySelect}
                    placeholder="Entrez votre numéro"
                    international
                    countryCallingCodeEditable={false}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Adresse <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className={errors.adresse ? "error" : ""}
                  placeholder="Entrez votre adresse"
                  required
                />
              </div>

              <div className="form-group"></div>
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
              <label>
                Type d'utilisateur <span className="required">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className={errors.type ? "error" : ""}
                disabled={isUpdateMode}
                required
              >
                <option value="">Sélectionnez le type d'utilisateur</option>
                <option value="professeur">Professeur</option>
                <option value="eleve">Élève</option>
                <option value="parent">Parent</option>
              </select>
            </div>

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
                    required
                  >
                    <option value="">Sélectionnez votre niveau</option>
                    <option value="primaire">Primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="superieur">Supérieur</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-navigation">
              <button
                type="button"
                className="prev-button"
                onClick={handlePrevStep}
              >
                <ArrowLeft size={16} />
                Retour
              </button>
              <button
                type="button"
                className="next-button"
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="spinner" /> Traitement...
                  </>
                ) : (
                  <>
                    {getSubmitButtonText()}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && formData.type === "professeur" && (
          <div className="signup-form">
            <div className="professor-details">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    CNI Recto{" "}
                    {!isUpdateMode && <span className="required">*</span>}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "cniRecto")}
                    className={errors.cniRecto ? "error" : ""}
                    accept="image/*"
                    required={!isUpdateMode}
                  />
                  <ImagePreview
                    src={imagePreviews.cniRecto}
                    alt="CNI Recto"
                    onRemove={() => handleRemoveImage("cniRecto")}
                  />
                </div>

                <div className="form-group">
                  <label>
                    CNI Verso{" "}
                    {!isUpdateMode && <span className="required">*</span>}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "cniVerso")}
                    className={errors.cniVerso ? "error" : ""}
                    accept="image/*"
                    required={!isUpdateMode}
                  />
                  <ImagePreview
                    src={imagePreviews.cniVerso}
                    alt="CNI Verso"
                    onRemove={() => handleRemoveImage("cniVerso")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Photo de profil{" "}
                  {!isUpdateMode && <span className="required">*</span>}
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "selfie")}
                  className={errors.selfie ? "error" : ""}
                  accept="image/*"
                  required={!isUpdateMode}
                />
                <ImagePreview
                  src={imagePreviews.selfie}
                  alt="Photo de profil"
                  onRemove={() => handleRemoveImage("selfie")}
                />
              </div>

              <div className="form-group">
                <label>Matricule du professeur (Optionnel)</label>
                <input
                  type="text"
                  name="matriculeProfesseur"
                  value={formData.matriculeProfesseur || ""}
                  onChange={handleInputChange}
                  placeholder="Entrez votre matricule"
                />
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="prev-button"
                onClick={handlePrevStep}
              >
                <ArrowLeft size={16} />
                Retour
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="spinner" /> Traitement...
                  </>
                ) : (
                  getSubmitButtonText()
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

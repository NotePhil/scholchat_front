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

  // Image preview states
  const [imagePreviews, setImagePreviews] = useState({
    cniUrlRecto: null,
    cniUrlVerso: null,
    selfieUrl: null,
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
    cniUrlRecto: "",
    cniUrlVerso: "",
    selfieUrl: "",
    nomEtablissement: "",
    matriculeProfesseur: "",
  });

  // Parse URL parameters to detect update mode
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get("email");
    const tokenParam = urlParams.get("token");

    if (emailParam && tokenParam) {
      setIsUpdateMode(true);
      setToken(tokenParam);

      // Fetch existing user data for update mode
      const fetchUserData = async () => {
        try {
          setIsSubmitting(true);
          // Use axios baseURL or provide the full URL here if needed
          const response = await axios.get(`/auth/users/byEmail`, {
            params: { email: emailParam, token: tokenParam },
            baseURL: "http://localhost:8486/scholchat",
          });

          if (response.data) {
            const userData = response.data;

            // Map all fields from the API response to the form
            setFormData((prev) => ({
              ...prev,
              id: userData.id || "", // Make sure ID is included for update
              type: userData.type || "",
              nom: userData.nom || "",
              prenom: userData.prenom || "",
              email: emailParam,
              telephone: userData.telephone || "",
              adresse: userData.adresse || "",
              etat: userData.etat || "INACTIVE",
              niveau: userData.niveau || "",
              cniUrlRecto: userData.cniUrlRecto || "",
              cniUrlVerso: userData.cniUrlVerso || "",
              selfieUrl: userData.selfieUrl || "",
              nomEtablissement: userData.nomEtablissement || "",
              nomClasse: userData.nomClasse || "",
              matriculeProfesseur: userData.matriculeProfesseur || "",
            }));

            // Set country based on phone number
            if (userData.telephone) {
              if (userData.telephone.startsWith("+237")) {
                setSelectedCountry("CM");
              } else if (userData.telephone.startsWith("+33")) {
                setSelectedCountry("FR");
              }
            }

            // Set image previews if images exist
            if (userData.cniUrlRecto)
              setImagePreviews((prev) => ({
                ...prev,
                cniUrlRecto: userData.cniUrlRecto,
              }));
            if (userData.cniUrlVerso)
              setImagePreviews((prev) => ({
                ...prev,
                cniUrlVerso: userData.cniUrlVerso,
              }));
            if (userData.selfieUrl)
              setImagePreviews((prev) => ({
                ...prev,
                selfieUrl: userData.selfieUrl,
              }));

            showAlert(
              "Veuillez vérifier et mettre à jour vos informations",
              "info"
            );
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
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
      // Check for stored form data (normal signup flow)
      const pageAccessedByReload =
        (window.performance.navigation &&
          window.performance.navigation.type === 1) ||
        window.performance
          .getEntriesByType("navigation")
          .map((nav) => nav.type)
          .includes("reload");

      if (pageAccessedByReload) {
        localStorage.removeItem("signupFormData");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("imagePreviews");
      } else {
        const storedData = localStorage.getItem("signupFormData");
        const storedEmail = localStorage.getItem("signupEmail");
        const storedPreviews = localStorage.getItem("imagePreviews");

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
        } else if (storedEmail) {
          setFormData((prev) => ({ ...prev, email: storedEmail }));
        }

        if (storedPreviews) {
          setImagePreviews(JSON.parse(storedPreviews));
        }
      }
    }
  }, [location.search]);

  // Save form data and image previews to localStorage for non-update mode
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

  // const validateFileSize = async (file) => {
  //   const maxSize = 300 * 1024;
  //   if (file.size > maxSize) {
  //     let quality = 0.5;
  //     let compressedDataUrl = await compressImage(file, quality);
  //     let compressedSize = atob(compressedDataUrl.split(",")[1]).length;

  //     while (compressedSize > maxSize && quality > 0.1) {
  //       quality -= 0.1;
  //       compressedDataUrl = await compressImage(file, quality);
  //       compressedSize = atob(compressedDataUrl.split(",")[1]).length;
  //     }

  //     if (compressedSize > maxSize) {
  //       showAlert(
  //         "L'image est trop volumineuse. Veuillez utiliser une image plus petite."
  //       );
  //       return null;
  //     }
  //     return compressedDataUrl;
  //   }
  //   return await compressImage(file, 0.5);
  // };

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

          const maxWidth = 600;
          const maxHeight = 400;

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

    if (formData.type === "professeur") {
      // In update mode, we don't force the user to reupload images if they already exist
      if (!isUpdateMode) {
        if (!formData.cniUrlRecto) {
          showAlert("L'image recto de la CNI est requise");
          newErrors.cniUrlRecto = true;
        }
        if (!formData.cniUrlVerso) {
          showAlert("L'image verso de la CNI est requise");
          newErrors.cniUrlVerso = true;
        }
        if (!formData.selfieUrl) {
          showAlert("Une photo de profil est requise");
          newErrors.selfieUrl = true;
        }
      }
    } else if (formData.type === "eleve") {
      if (!formData.niveau.trim()) {
        showAlert("Le niveau d'éducation est requis");
        newErrors.niveau = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isUpdateMode]);

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

  // Fixed CountrySelect component to remove iconComponent warning
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
      // Validate and possibly compress the file first
      const compressedDataUrl = await validateFileSize(file);
      if (!compressedDataUrl) {
        e.target.value = "";
        return;
      }

      // Field name mapping
      const fieldMapping = {
        cniUrlFront: "cniUrlRecto",
        cniUrlBack: "cniUrlVerso",
        selfiePhoto: "selfieUrl",
      };
      const backendFieldName = fieldMapping[fieldName] || fieldName;

      // Get the owner ID if user is registered (will be null/empty for anonymous)
      const ownerId = formData.id || "";

      // 1. Get presigned URL from backend (works for both anonymous and registered users)
      const presignedResponse = await axios.post(
        "http://localhost:8486/scholchat/media/presigned-url",
        {
          fileName: file.name,
          contentType: file.type,
          mediaType: "IMAGE",
          ownerId: ownerId, // This can be empty for anonymous users
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const { url, filePath, mediaId } = presignedResponse.data;

      // 2. Upload file directly to MinIO
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // 3. Update form state with the file path
      setFormData((prev) => ({
        ...prev,
        [backendFieldName]: filePath,
        // Store mediaId if you need it for registered users
        [`${backendFieldName}MediaId`]: mediaId,
      }));

      // 4. Create preview for UI display
      setImagePreviews((prev) => ({
        ...prev,
        [backendFieldName]: compressedDataUrl,
      }));

      // Clear any errors for this field
      setErrors((prev) => ({
        ...prev,
        [fieldName]: false,
        [backendFieldName]: false,
      }));
    } catch (error) {
      console.error("Upload error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
      console.error("Full error:", error);
      showAlert("Erreur lors du téléchargement. Veuillez réessayer.");
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (fieldName) => {
    const fieldMapping = {
      cniUrlFront: "cniUrlRecto",
      cniUrlBack: "cniUrlVerso",
      selfiePhoto: "selfieUrl",
    };

    const backendFieldName = fieldMapping[fieldName] || fieldName;
    const filePath = formData[backendFieldName];
    const mediaId = formData[`${backendFieldName}MediaId`];

    try {
      if (filePath) {
        // If we have a mediaId, use that for deletion
        if (mediaId) {
          await axios.delete(
            `http://localhost:8486/scholchat/media/${mediaId}`,
            {
              withCredentials: true,
            }
          );
        } else {
          // Otherwise use the filePath
          await axios.delete(`http://localhost:8486/scholchat/media`, {
            params: { filePath },
            withCredentials: true,
          });
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
      // Continue with UI updates even if delete fails
    }

    // Update form data to remove the image reference
    setFormData((prev) => ({
      ...prev,
      [backendFieldName]: "",
      [`${backendFieldName}MediaId`]: "",
    }));

    // Remove the preview
    setImagePreviews((prev) => ({
      ...prev,
      [backendFieldName]: null,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!validateStep2()) return;

      setIsSubmitting(true);

      let payloadData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        type: formData.type,
        etat: formData.etat || "INACTIVE",
      };

      // Include id for update requests
      if (isUpdateMode && formData.id) {
        payloadData.id = formData.id;
      }

      if (formData.type === "professeur") {
        // For existing images in update mode, keep the paths
        payloadData = {
          ...payloadData,
          cniUrlRecto:
            formData.cniUrlRecto && formData.cniUrlRecto !== "pending"
              ? formData.cniUrlRecto
              : null,
          cniUrlVerso:
            formData.cniUrlVerso && formData.cniUrlVerso !== "pending"
              ? formData.cniUrlVerso
              : null,
          selfieUrl:
            formData.selfieUrl && formData.selfieUrl !== "pending"
              ? formData.selfieUrl
              : null,
          nomEtablissement: formData.nomEtablissement?.trim() || null,
          matriculeProfesseur: formData.matriculeProfesseur?.trim() || null,
          nomClasse: formData.nomClasse?.trim() || null,
        };
      } else if (formData.type === "eleve") {
        payloadData = {
          ...payloadData,
          niveau: formData.niveau,
        };
      }

      console.log(
        `Data being sent to backend (${isUpdateMode ? "UPDATE" : "CREATE"})`,
        payloadData
      );

      let response;
      let newUserId;

      if (isUpdateMode) {
        // Update existing user
        response = await axios.post(
          "http://localhost:8486/scholchat/auth/users/update",
          payloadData,
          {
            params: {
              email: formData.email,
              token: token,
            },
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        newUserId = formData.id;
      } else {
        // Create new user
        const apiUrl = "http://localhost:8486/scholchat/utilisateurs";
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payloadData),
        });

        if (!response.ok) {
          let responseData;
          try {
            responseData = await response.json();
          } catch (e) {
            responseData = await response.text();
          }

          if (
            response.status === 400 &&
            typeof responseData === "object" &&
            responseData.code === "INVALID_INPUT"
          ) {
            if (responseData.message.includes("Email already registered")) {
              throw new Error(
                "Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse ou récupérer votre mot de passe."
              );
            }
          }
          throw new Error(
            typeof responseData === "string"
              ? responseData
              : responseData.message ||
                `Error ${response.status}: Registration failed`
          );
        }

        const userData = await response.json();
        newUserId = userData.id; // Get the new user ID from response
      }

      // For new users or if files need uploading in update mode
      if (formData.type === "professeur" && !isUpdateMode) {
        // If there are uploaded files for an anonymous user, update their ownership
        await updateMediaOwnership(newUserId);
      }

      // Handle success
      if (isUpdateMode) {
        showAlert(
          "Vos informations ont été mises à jour avec succès!",
          "success"
        );
        setTimeout(() => {
          navigate("/schoolchat/login");
        }, 2000);
      } else {
        localStorage.setItem("userEmail", formData.email);
        localStorage.removeItem("signupFormData");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("imagePreviews");

        showAlert(
          "Inscription réussie! Veuillez vérifier votre email pour activer votre compte.",
          "success"
        );

        navigate(
          `/schoolchat/verify-email?email=${encodeURIComponent(formData.email)}`
        );
      }
    } catch (err) {
      console.error("Detailed error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        (isUpdateMode
          ? "La mise à jour a échoué."
          : "L'inscription a échoué. Veuillez réessayer.");
      showAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to update media ownership after user creation
  const updateMediaOwnership = async (newUserId) => {
    try {
      // Check if we have media IDs to update
      const mediaIds = [
        formData.cniUrlRectoMediaId,
        formData.cniUrlVersoMediaId,
        formData.selfieUrlMediaId,
      ].filter((id) => id);

      if (mediaIds.length === 0) return;

      // Call an endpoint to update media ownership
      await axios.post(
        "http://localhost:8486/scholchat/media/update-ownership",
        {
          mediaIds: mediaIds,
          newOwnerId: newUserId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error("Failed to update media ownership:", error);
      // Continue execution even if this fails
    }
  };

  // Sample implementation of validateFileSize function if needed
  const validateFileSize = async (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showAlert("L'image est trop grande. La taille maximale est de 5MB.");
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
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

  const getPageTitle = () => {
    return isUpdateMode ? "Mise à jour des informations" : "Inscription";
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Traitement en cours...";
    }
    return isUpdateMode
      ? "Mettre à jour mes informations"
      : "Terminer l'inscription";
  };

  // Image Preview Component
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
            <div className="form-three-columns">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
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

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Email"
                  disabled={isUpdateMode} // Email cannot be changed in update mode
                />
              </div>
            </div>

            <div className="form-three-columns">
              <div className="form-group phone-group">
                <label>Numéro de téléphone</label>
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
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className={errors.adresse ? "error" : ""}
                  placeholder="Entrez votre adresse"
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
              <label>Type d'utilisateur</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={errors.type ? "error" : ""}
                disabled={isUpdateMode} // Cannot change user type in update mode
              >
                <option value="">Sélectionnez le type d'utilisateur</option>
                <option value="professeur">Professeur</option>
                <option value="eleve">Élève</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {formData.type === "professeur" && (
              <div className="professor-details">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      CNI Recto{" "}
                      {!isUpdateMode && <span className="required">*</span>}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlFront")}
                      className={errors.cniUrlRecto ? "error" : ""}
                      accept="image/*"
                    />
                    {imagePreviews.cniUrlRecto ? (
                      <ImagePreview
                        src={imagePreviews.cniUrlRecto}
                        alt="CNI Recto"
                        onRemove={() => handleRemoveImage("cniUrlFront")}
                      />
                    ) : (
                      formData.cniUrlRecto && (
                        <div className="image-preview-info">
                          Image sélectionnée ✓
                        </div>
                      )
                    )}
                  </div>
                  <div className="form-group">
                    <label>
                      CNI Verso{" "}
                      {!isUpdateMode && <span className="required">*</span>}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlBack")}
                      className={errors.cniUrlVerso ? "error" : ""}
                      accept="image/*"
                    />
                    {imagePreviews.cniUrlVerso ? (
                      <ImagePreview
                        src={imagePreviews.cniUrlVerso}
                        alt="CNI Verso"
                        onRemove={() => handleRemoveImage("cniUrlBack")}
                      />
                    ) : (
                      formData.cniUrlVerso && (
                        <div className="image-preview-info">
                          Image sélectionnée ✓
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Photo de profil{" "}
                    {!isUpdateMode && <span className="required">*</span>}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "selfiePhoto")}
                    className={errors.selfieUrl ? "error" : ""}
                    accept="image/*"
                  />
                  {imagePreviews.selfieUrl ? (
                    <ImagePreview
                      src={imagePreviews.selfieUrl}
                      alt="Photo de profil"
                      onRemove={() => handleRemoveImage("selfiePhoto")}
                    />
                  ) : (
                    formData.selfieUrl && (
                      <div className="image-preview-info">
                        Photo sélectionnée ✓
                      </div>
                    )
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom de l'établissement (Optionnel)</label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement || ""}
                      onChange={handleInputChange}
                      placeholder="Entrez le nom de l'établissement"
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
                className="submit-button"
                onClick={handleSubmit}
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

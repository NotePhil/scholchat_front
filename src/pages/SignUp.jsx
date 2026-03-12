import React, { useState, useCallback, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiUpload, FiX, FiCheck, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";

const SignUp = ({ theme }) => {
  const { t } = useTranslation();
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

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleTypeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    localStorage.setItem("userType", value);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, telephone: value || "" }));
    if (value) {
      if (value.startsWith("+237")) setSelectedCountry("CM");
      else if (value.startsWith("+33")) setSelectedCountry("FR");
    }
    if (errors.telephone) {
      setErrors((prev) => ({ ...prev, telephone: false }));
    }
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
      setImagePreviews((prev) => ({ ...prev, [fieldName]: compressedDataUrl }));
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      setErrors((prev) => ({ ...prev, [fieldName]: false }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      showAlert("Erreur lors du traitement de l'image. Veuillez réessayer.");
      e.target.value = "";
    }
  };

  const handleRemoveImage = (fieldName) => {
    setImagePreviews((prev) => ({ ...prev, [fieldName]: null }));
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
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
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};
    if (!formData.type) {
      showAlert("Veuillez sélectionner un type d'utilisateur");
      newErrors.type = true;
      return false;
    }
    // Niveau is optional for students
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

  const uploadFileToS3 = async (file, userId, documentType) => {
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;

      const presignedResponse = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/media/presigned-url`,
        {
          fileName: fileName,
          contentType: file.type,
          mediaType: "IMAGE",
          ownerId: userId,
          documentType: documentType,
        }
      );

      const { url } = presignedResponse.data;

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
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      return url.split("?")[0];
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload error: ${error.message}`);
    }
  };

  const createBasicProfile = async () => {
    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

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
        `${process.env.REACT_APP_API_BASE_URL}/utilisateurs`,
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
      showAlert(err.response?.data?.message || "Erreur lors de la création du profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentSubmission = async () => {
    try {
      if (!validateStep3()) return;
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      let userId = isUpdateMode ? formData.id : createdUserId;

      if (!isUpdateMode && !createdUserId) {
        const payloadData = {
          type: formData.type,
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone,
          adresse: formData.adresse.trim(),
          etat: "INACTIVE",
        };

        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/utilisateurs`,
          payloadData
        );

        userId = response.data.id;
        setCreatedUserId(userId);
        localStorage.setItem("createdUserId", userId);
      }

      const updatePayload = {
        id: userId,
        type: formData.type,
        hasUploaded: false,
      };

      if (formData.matriculeProfesseur?.trim()) {
        updatePayload.matriculeProfesseur = formData.matriculeProfesseur.trim();
      }

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

      const allImagesUploaded =
        updatePayload.cniUrlRecto && updatePayload.cniUrlVerso && updatePayload.selfieUrl;

      if (allImagesUploaded) {
        updatePayload.hasUploaded = true;
      }

      if (isUpdateMode) {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/users/update`,
          updatePayload,
          { params: { email: formData.email, token: token } }
        );
        showAlert("Vos informations ont été mises à jour avec succès!", "success");
        setTimeout(() => navigate("/schoolchat/login"), 2000);
      } else {
        await axios.patch(
          `${process.env.REACT_APP_API_BASE_URL}/utilisateurs/${userId}`,
          updatePayload
        );
        completeRegistration();
      }
    } catch (err) {
      console.error("Erreur lors du traitement des documents:", err);
      showAlert(err.response?.data?.message || "Erreur lors du traitement des documents");
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
    navigate(`/schoolchat/verify-email?email=${encodeURIComponent(formData.email)}`);
  };

  const handleNextStep = async () => {
    if (isSubmitting) return;

    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      if (formData.type === "professeur") {
        setCurrentStep(3);
      } else {
        await createBasicProfile();
      }
    } else if (currentStep === 3) {
      await handleDocumentSubmission();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    setErrors({});
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get("email");
    const tokenParam = urlParams.get("token");

    if (emailParam && tokenParam) {
      setIsUpdateMode(true);
      setToken(tokenParam);
      // Fetch user data logic here (simplified for brevity)
    } else {
      const storedData = localStorage.getItem("signupFormData");
      const storedPreviews = localStorage.getItem("imagePreviews");
      const storedUserId = localStorage.getItem("createdUserId");

      if (storedData) setFormData(JSON.parse(storedData));
      if (storedPreviews) setImagePreviews(JSON.parse(storedPreviews));
      if (storedUserId) setCreatedUserId(storedUserId);
    }
  }, [location.search]);

  useEffect(() => {
    if (!isUpdateMode) {
      localStorage.setItem("signupFormData", JSON.stringify(formData));
      localStorage.setItem("imagePreviews", JSON.stringify(imagePreviews));
    }
  }, [formData, imagePreviews, isUpdateMode]);

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900 dark' : 'bg-gray-50'
      }`}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isUpdateMode ? "Mise à jour" : "Créer un compte"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Déjà inscrit?{" "}
            <button
              onClick={() => navigate("/schoolchat/login")}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Se connecter
            </button>
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            {[1, 2, formData.type === "professeur" ? 3 : null].filter(Boolean).map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= step
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                    }`}
                  >
                    {currentStep > step ? <FiCheck className="w-5 h-5" /> : step}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                    {step === 1 ? "Informations" : step === 2 ? "Type" : "Documents"}
                  </span>
                </div>
                {idx < ([1, 2, formData.type === "professeur" ? 3 : null].filter(Boolean).length - 1) && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                      currentStep > step
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Alert */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl text-sm ${
                alertType === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              }`}
            >
              {alertMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* First Row: Prénom, Nom, Email - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("pages.signup.firstName")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.prenom
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Prénom"
                      />
                    </div>
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("pages.signup.lastName")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.nom
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Nom"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("pages.signup.email")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.email
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Second Row: Téléphone, Adresse - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("pages.signup.phone")} <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      international
                      defaultCountry={selectedCountry}
                      value={formData.telephone}
                      onChange={handlePhoneChange}
                      className={`phone-input-custom ${
                        errors.telephone ? "border-red-500" : ""
                      }`}
                    />
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("pages.signup.address")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.adresse
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Votre adresse complète"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Account Type */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Type de compte <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: "parent", label: "Parent", icon: "👨‍👩‍👧" },
                      { value: "eleve", label: "Élève", icon: "🎓" },
                      { value: "professeur", label: "Professeur", icon: "👨‍🏫" },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.type === type.value
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={handleTypeChange}
                          className="sr-only"
                        />
                        <span className="text-3xl mr-3">{type.icon}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {type.label}
                        </span>
                        {formData.type === type.value && (
                          <FiCheck className="absolute top-4 right-4 w-6 h-6 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.type === "eleve" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Niveau d'éducation
                    </label>
                    <input
                      type="text"
                      name="niveau"
                      value={formData.niveau}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.niveau
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Ex: 6ème, 5ème..."
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Documents (Professeur only) */}
            {currentStep === 3 && formData.type === "professeur" && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Matricule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Matricule Professeur (optionnel)
                  </label>
                  <input
                    type="text"
                    name="matriculeProfesseur"
                    value={formData.matriculeProfesseur}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Votre matricule"
                  />
                </div>

                {/* File Uploads */}
                {[
                  { name: "cniRecto", label: "CNI Recto", required: true },
                  { name: "cniVerso", label: "CNI Verso", required: true },
                  { name: "selfie", label: "Photo de profil", required: true },
                ].map((doc) => (
                  <div key={doc.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {doc.label} {doc.required && <span className="text-red-500">*</span>}
                    </label>
                    {imagePreviews[doc.name] ? (
                      <div className="relative group">
                        <img
                          src={imagePreviews[doc.name]}
                          alt={doc.label}
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(doc.name)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 ${
                          errors[doc.name]
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <FiUpload className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Cliquez pour télécharger
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, doc.name)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handlePrevStep}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <FiArrowLeft className="w-5 h-5" />
                Retour
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <span>
                    {currentStep === 3 || (currentStep === 2 && formData.type !== "professeur")
                      ? "Terminer"
                      : "Suivant"}
                  </span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Custom Styles for Phone Input */}
        <style jsx>{`
          .phone-input-custom {
            width: 100%;
          }
          .phone-input-custom input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.75rem;
            background-color: #f9fafb;
            color: #111827;
            font-size: 1rem;
          }
          .dark .phone-input-custom input {
            background-color: #374151;
            border-color: #4b5563;
            color: #ffffff;
          }
          .phone-input-custom input:focus {
            outline: none;
            ring: 2px;
            ring-color: #3b82f6;
          }
        `}</style>
      </div>
      </div>
    </motion.div>
  );
};

export default SignUp;




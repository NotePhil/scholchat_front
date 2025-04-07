import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  User,
  Mail,
  Phone,
  Home,
  Lock,
  Image,
  CheckCircle,
} from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { scholchatService } from "../../../../services/ScholchatService";

const UserModal = ({ user, type, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: "student",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    etat: "ACTIVE",
    niveau: "",
    cniUrlRecto: "",
    cniUrlVerso: "",
    selfieUrl: "",
    nomEtablissement: "",
    matriculeProfesseur: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [previewImages, setPreviewImages] = useState({
    cniUrlRecto: null,
    cniUrlVerso: null,
    selfieUrl: null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        type: user.type || "student",
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        etat: user.etat || "ACTIVE",
        niveau: user.niveau || "",
        cniUrlRecto: user.cniUrlRecto || "",
        cniUrlVerso: user.cniUrlVerso || "",
        selfieUrl: user.selfieUrl || "",
        nomEtablissement: user.nomEtablissement || "",
        matriculeProfesseur: user.matriculeProfesseur || "",
      });

      if (user.telephone) {
        if (user.telephone.startsWith("+237")) {
          setSelectedCountry("CM");
        } else if (user.telephone.startsWith("+33")) {
          setSelectedCountry("FR");
        }
      }

      if (user.cniUrlRecto) {
        setPreviewImages((prev) => ({
          ...prev,
          cniUrlRecto: user.cniUrlRecto,
        }));
      }
      if (user.cniUrlVerso) {
        setPreviewImages((prev) => ({
          ...prev,
          cniUrlVerso: user.cniUrlVerso,
        }));
      }
      if (user.selfieUrl) {
        setPreviewImages((prev) => ({ ...prev, selfieUrl: user.selfieUrl }));
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const CountrySelect = ({ value, onChange, options, ...props }) => {
    const countryToFlag = (countryCode) => {
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt())
        );
    };

    return (
      <select
        {...props}
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
        {options.map(({ value, label }) => (
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

  const validateFileSize = async (file) => {
    const maxSize = 300 * 1024;
    if (file.size > maxSize) {
      let quality = 0.5;
      let compressedDataUrl = await compressImage(file, quality);
      let compressedSize = atob(compressedDataUrl.split(",")[1]).length;

      while (compressedSize > maxSize && quality > 0.1) {
        quality -= 0.1;
        compressedDataUrl = await compressImage(file, quality);
        compressedSize = atob(compressedDataUrl.split(",")[1]).length;
      }

      if (compressedSize > maxSize) {
        alert(
          "L'image est trop volumineuse. Veuillez utiliser une image plus petite."
        );
        return null;
      }
      return compressedDataUrl;
    }
    return await compressImage(file, 0.5);
  };

  const compressImage = async (file, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
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

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez télécharger un fichier image (JPEG, PNG)");
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await validateFileSize(file);
      if (!compressedDataUrl) {
        e.target.value = "";
        return;
      }

      setPreviewImages((prev) => ({ ...prev, [fieldName]: compressedDataUrl }));

      const mockUrl = `http://example.com/${file.name.replace(/\s+/g, "_")}`;

      setFormData((prev) => ({
        ...prev,
        [fieldName]: mockUrl,
      }));

      setErrors((prev) => ({
        ...prev,
        [fieldName]: false,
      }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      alert(
        "Erreur lors du traitement de l'image. Veuillez essayer une autre image."
      );
      e.target.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    }
    if (!formData.telephone) {
      newErrors.telephone = "Le numéro de téléphone est requis";
    } else {
      const cleanedPhone = formData.telephone.replace(/\s+|-|\(|\)/g, "");

      if (
        selectedCountry === "CM" &&
        !cleanedPhone.match(/^(\+237|00237)?[6-9]\d{8}$/)
      ) {
        newErrors.telephone = "Format de téléphone camerounais invalide";
      } else if (
        selectedCountry === "FR" &&
        !cleanedPhone.match(/^(\+33|0033)?[1-9]\d{8}$/)
      ) {
        newErrors.telephone = "Format de téléphone français invalide";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Adresse email invalide";
    }

    if (!formData.adresse.trim()) {
      newErrors.adresse = "L'adresse est requise";
    }

    if (formData.type === "professor") {
      if (!formData.cniUrlRecto) {
        newErrors.cniUrlRecto = "L'image recto de la CNI est requise";
      }
      if (!formData.cniUrlVerso) {
        newErrors.cniUrlVerso = "L'image verso de la CNI est requise";
      }
      if (!formData.selfieUrl) {
        newErrors.selfieUrl = "Une photo de profil est requise";
      }
    } else if (formData.type === "student") {
      if (!formData.niveau.trim()) {
        newErrors.niveau = "Le niveau d'éducation est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let payloadData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        type: formData.type,
        etat: formData.etat,
      };

      if (formData.type === "professor") {
        payloadData = {
          ...payloadData,
          cniUrlRecto: formData.cniUrlRecto,
          cniUrlVerso: formData.cniUrlVerso,
          selfieUrl: formData.selfieUrl,
          nomEtablissement: formData.nomEtablissement || null,
          matriculeProfesseur: formData.matriculeProfesseur || null,
        };
      } else if (formData.type === "student") {
        payloadData = {
          ...payloadData,
          niveau: formData.niveau,
        };
      }

      // Use the specified API endpoint directly
      const apiUrl = "http://localhost:8486/scholchat/utilisateurs";

      // For update operations (if needed)
      const method = type === "edit" && user?.id ? "PUT" : "POST";
      const urlWithId =
        type === "edit" && user?.id ? `${apiUrl}/${user.id}` : apiUrl;

      const response = await fetch(urlWithId, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payloadData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();

      // Inform the parent component about the successful submission
      if (typeof onSubmit === "function") {
        await onSubmit(result);
      }

      setSuccessMessage(
        `Utilisateur ${
          type === "edit" ? "modifié" : "enregistré"
        } avec succès, et un mail d'activation a été envoyé à ${formData.email}`
      );

      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        error.message || "Une erreur est survenue lors de l'enregistrement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderImagePreview = (fieldName, label) => {
    if (!previewImages[fieldName]) return null;

    return (
      <div className="mt-2">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <div className="relative w-full h-40 border rounded-md overflow-hidden">
          <img
            src={previewImages[fieldName]}
            alt={label}
            className="w-full h-full object-contain bg-gray-100"
          />
        </div>
      </div>
    );
  };

  const renderFileInput = (fieldName, label, required = false) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center">
          <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <input
              type="file"
              onChange={(e) => handleFileChange(e, fieldName)}
              className="hidden"
              accept="image/*"
            />
            <div className="flex items-center">
              <Image className="h-4 w-4 mr-2" />
              Choisir un fichier
            </div>
          </label>
          {formData[fieldName] && (
            <span className="ml-2 text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Fichier sélectionné
            </span>
          )}
        </div>
        {errors[fieldName] && (
          <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
        )}
        {renderImagePreview(fieldName, label)}
      </div>
    );
  };

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Succès</h3>
            <div className="mt-2 text-sm text-gray-500">{successMessage}</div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={() => {
                  setSuccessMessage("");
                  onClose();
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">
            {type === "create"
              ? "Créer un nouvel utilisateur"
              : type === "edit"
              ? "Modifier l'utilisateur"
              : type === "view"
              ? "Détails de l'utilisateur"
              : "Confirmer la suppression"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === "delete" ? (
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action
              est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    // Call the async deleteUser API
                    await scholchatService.delete(`/utilisateurs/${user?.id}`);
                    // Inform parent component about successful deletion
                    if (typeof onSubmit === "function") {
                      onSubmit(user);
                    }
                    onClose();
                  } catch (error) {
                    console.error("Error deleting user:", error);
                    alert("Une erreur est survenue lors de la suppression");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        ) : type === "view" ? (
          <div className="p-6">
            <div className="flex items-start mb-6">
              {user?.selfieUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mr-6">
                  <img
                    src={user.selfieUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold mr-6">
                  {user?.nom?.charAt(0)}
                  {user?.prenom?.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold">
                  {user?.nom} {user?.prenom}
                </h4>
                <p className="text-gray-500">{user?.email}</p>
                <div className="flex mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.etat === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user?.etat}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      user?.type === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user?.type === "professor"
                        ? "bg-blue-100 text-blue-800"
                        : user?.type === "parent"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user?.type?.charAt(0).toUpperCase() + user?.type?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-3">
                  Informations personnelles
                </h5>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" /> {user?.email}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />{" "}
                    {user?.telephone || "Non fourni"}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <Home className="w-4 h-4 mr-2" />{" "}
                    {user?.adresse || "Non fourni"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-3">
                  Informations supplémentaires
                </h5>
                <div className="space-y-2">
                  {user?.type === "student" && user?.niveau && (
                    <p className="text-gray-600">Niveau: {user.niveau}</p>
                  )}
                  {user?.type === "professor" && user?.nomEtablissement && (
                    <p className="text-gray-600">
                      Établissement: {user.nomEtablissement}
                    </p>
                  )}
                  {user?.type === "professor" && user?.matriculeProfesseur && (
                    <p className="text-gray-600">
                      Matricule: {user.matriculeProfesseur}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {user?.type === "professor" && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.cniUrlRecto && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">
                      CNI Recto
                    </h5>
                    <div className="relative w-full h-48 border rounded-md overflow-hidden">
                      <img
                        src={user.cniUrlRecto}
                        alt="CNI Recto"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                {user.cniUrlVerso && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">
                      CNI Verso
                    </h5>
                    <div className="relative w-full h-48 border rounded-md overflow-hidden">
                      <img
                        src={user.cniUrlVerso}
                        alt="CNI Verso"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className={`pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${
                      errors.prenom ? "border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${
                      errors.nom ? "border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div
                  className={`phone-input-container ${
                    errors.telephone ? "border-red-500 rounded-md" : ""
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
                    className={`block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${
                      errors.telephone ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.telephone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.telephone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    className={`pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${
                      errors.adresse ? "border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {errors.adresse && (
                  <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'utilisateur <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border ${
                    errors.type ? "border-red-500" : ""
                  }`}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="professor">Professeur</option>
                  <option value="parent">Parent</option>
                  <option value="student">Élève</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut <span className="text-red-500">*</span>
                </label>
                <select
                  name="etat"
                  value={formData.etat}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  required
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                </select>
              </div>
            </div>

            {formData.type === "student" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'éducation <span className="text-red-500">*</span>
                </label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border ${
                    errors.niveau ? "border-red-500" : ""
                  }`}
                  required
                >
                  <option value="">Sélectionnez le niveau d'éducation</option>
                  <option value="primaire">École primaire</option>
                  <option value="college">Collège</option>
                  <option value="lycee">Lycée</option>
                  <option value="universite">Université</option>
                </select>
                {errors.niveau && (
                  <p className="mt-1 text-sm text-red-600">{errors.niveau}</p>
                )}
              </div>
            )}

            {formData.type === "professor" && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">
                  Documents du professeur
                </h4>

                {renderFileInput("cniUrlRecto", "CNI Recto", true)}
                {renderFileInput("cniUrlVerso", "CNI Verso", true)}
                {renderFileInput("selfieUrl", "Photo de profil", true)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'établissement (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matricule du professeur (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    En cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {type === "create" ? "Créer" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserModal;

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Camera,
  Upload,
  Check,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  FileImage,
  AlertCircle,
  Shield,
} from "lucide-react";
import { scholchatService } from "../../../../services/ScholchatService";
import axios from "axios";

const ProfessorModal = ({
  showModal,
  setShowModal,
  modalMode,
  selectedProfessor,
  classes,
  loadData,
  setError,
  setLoading,
  loading,
}) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    matriculeProfesseur: "",
    statut: "EN_ATTENTE", // Default status
  });

  const [imagePreview, setImagePreview] = useState({
    cniRecto: null,
    cniVerso: null,
    selfie: null,
  });

  const [existingImages, setExistingImages] = useState({
    cniRecto: null,
    cniVerso: null,
    selfie: null,
  });

  const [imageUrls, setImageUrls] = useState({
    cniRecto: null,
    cniVerso: null,
    selfie: null,
  });

  // Initialize form data when modal opens or selectedProfessor changes
  useEffect(() => {
    if (showModal) {
      if (modalMode === "create") {
        // Reset form for create mode
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          adresse: "",
          matriculeProfesseur: "",
          statut: "EN_ATTENTE",
        });
        setImagePreview({
          cniRecto: null,
          cniVerso: null,
          selfie: null,
        });
        setExistingImages({
          cniRecto: null,
          cniVerso: null,
          selfie: null,
        });
        setImageUrls({
          cniRecto: null,
          cniVerso: null,
          selfie: null,
        });
      } else if (
        (modalMode === "edit" || modalMode === "view") &&
        selectedProfessor
      ) {
        // Populate form with existing professor data
        setFormData({
          nom: selectedProfessor.nom || "",
          prenom: selectedProfessor.prenom || "",
          email: selectedProfessor.email || "",
          telephone: selectedProfessor.telephone || "",
          adresse: selectedProfessor.adresse || "",
          matriculeProfesseur: selectedProfessor.matriculeProfesseur || "",
          statut: selectedProfessor.statut || "EN_ATTENTE",
        });

        // Store existing image references
        setExistingImages({
          cniRecto: selectedProfessor.cniUrlRecto || null,
          cniVerso: selectedProfessor.cniUrlVerso || null,
          selfie: selectedProfessor.selfieUrl || null,
        });

        // Clear new image previews
        setImagePreview({
          cniRecto: null,
          cniVerso: null,
          selfie: null,
        });

        // Load existing images from S3
        loadExistingImages(selectedProfessor);
      }
    }
  }, [showModal, modalMode, selectedProfessor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);

      // Update the professor's status
      await scholchatService.updateUser(selectedProfessor.id, {
        statut: newStatus,
      });

      // Update local state
      setFormData((prev) => ({
        ...prev,
        statut: newStatus,
      }));

      // Reload data to refresh the list
      await loadData();

      // Optional: Close modal after status change
      // setShowModal(false);
    } catch (err) {
      console.error("Error updating status:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la mise à jour du statut";
      setError("Erreur lors de la mise à jour du statut: " + errorMessage);
    } finally {
      setLoading(false);
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
      setError("Veuillez télécharger un fichier image (JPEG, PNG)");
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setImagePreview((prev) => ({
        ...prev,
        [fieldName]: compressedDataUrl,
      }));

      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      setError("Erreur lors du traitement de l'image. Veuillez réessayer.");
      e.target.value = "";
    }
  };

  const handleRemoveImage = (fieldName) => {
    setImagePreview((prev) => ({
      ...prev,
      [fieldName]: null,
    }));

    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let professorData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim().toLowerCase(), // Ensure lowercase email
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        matriculeProfesseur: formData.matriculeProfesseur?.trim() || null,
        type: "professeur",
        statut: formData.statut,
      };

      if (modalMode === "create") {
        // Step 1: Create the professor first
        const response = await scholchatService.createUser(professorData);
        const newUserId = response.id;

        // Step 2: Upload files and update professor with media references
        const updatePayload = {};
        const mediaPromises = [];

        // Handle CNI Recto upload
        if (formData.cniRecto) {
          mediaPromises.push(
            uploadFileToS3(formData.cniRecto, newUserId, "CNI_RECTO").then(
              (fileName) => {
                updatePayload.cniUrlRecto = fileName;
              }
            )
          );
        }

        // Handle CNI Verso upload
        if (formData.cniVerso) {
          mediaPromises.push(
            uploadFileToS3(formData.cniVerso, newUserId, "CNI_VERSO").then(
              (fileName) => {
                updatePayload.cniUrlVerso = fileName;
              }
            )
          );
        }

        // Handle Selfie upload
        if (formData.selfie) {
          mediaPromises.push(
            uploadFileToS3(formData.selfie, newUserId, "PROFILE_PHOTO").then(
              (fileName) => {
                updatePayload.selfieUrl = fileName;
              }
            )
          );
        }

        // Wait for all uploads to complete
        await Promise.all(mediaPromises);

        // Update professor with media references if any uploads were successful
        if (Object.keys(updatePayload).length > 0) {
          await scholchatService.updateUser(newUserId, updatePayload);
        }
      } else {
        // Edit mode - handle updates
        const updatePayload = { ...professorData };
        const mediaPromises = [];

        // Handle file updates only if new files were provided
        if (formData.cniRecto) {
          mediaPromises.push(
            uploadFileToS3(
              formData.cniRecto,
              selectedProfessor.id,
              "CNI_RECTO"
            ).then((fileName) => {
              updatePayload.cniUrlRecto = fileName;
            })
          );
        } else if (existingImages.cniRecto) {
          updatePayload.cniUrlRecto = existingImages.cniRecto;
        }

        if (formData.cniVerso) {
          mediaPromises.push(
            uploadFileToS3(
              formData.cniVerso,
              selectedProfessor.id,
              "CNI_VERSO"
            ).then((fileName) => {
              updatePayload.cniUrlVerso = fileName;
            })
          );
        } else if (existingImages.cniVerso) {
          updatePayload.cniUrlVerso = existingImages.cniVerso;
        }

        if (formData.selfie) {
          mediaPromises.push(
            uploadFileToS3(
              formData.selfie,
              selectedProfessor.id,
              "PROFILE_PHOTO"
            ).then((fileName) => {
              updatePayload.selfieUrl = fileName;
            })
          );
        } else if (existingImages.selfie) {
          updatePayload.selfieUrl = existingImages.selfie;
        }

        // Wait for any uploads to complete
        await Promise.all(mediaPromises);

        // Use patch for partial updates
        await scholchatService.patchUser(selectedProfessor.id, updatePayload);
      }

      await loadData();
      setShowModal(false);
    } catch (err) {
      console.error("Error details:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'enregistrement";
      setError("Erreur lors de l'enregistrement: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadFileToS3 = async (file, userId, documentType) => {
    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const fileName = `${userId}_${documentType}_${timestamp}.${fileExtension}`;

      // Step 1: Get presigned URL from backend
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

      // Step 2: Prepare file for upload
      let fileToUpload;
      if (typeof file === "string" && file.startsWith("data:")) {
        // Handle base64/data URL
        const res = await fetch(file);
        fileToUpload = await res.blob();
      } else if (file instanceof Blob) {
        // Already a blob
        fileToUpload = file;
      } else {
        // Convert File to Blob
        fileToUpload = new Blob([file], { type: file.type });
      }

      // Step 3: Upload to S3 using presigned URL
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: fileToUpload,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      // Step 4: Return the file path that can be used to retrieve the file
      return fileName;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload ${documentType}: ${error.message}`);
    }
  };

  const loadExistingImages = async (professor) => {
    try {
      const imageTypes = [
        { field: "cniRecto", urlField: "cniUrlRecto", docType: "CNI_RECTO" },
        { field: "cniVerso", urlField: "cniUrlVerso", docType: "CNI_VERSO" },
        { field: "selfie", urlField: "selfieUrl", docType: "PROFILE_PHOTO" },
      ];
      const urls = {};

      for (const { field, urlField, docType } of imageTypes) {
        if (professor[urlField]) {
          try {
            // Extract the file name from the URL
            const filePath = professor[urlField];
            const fileName = filePath.split("/").pop();

            // Get the download URL
            const downloadResponse = await axios.get(
              `http://localhost:8486/scholchat/media/download-by-path`,
              { params: { filePath: fileName } }
            );

            if (downloadResponse.data && downloadResponse.data.url) {
              urls[field] = downloadResponse.data.url;
            } else {
              urls[field] = getDefaultImage(docType);
            }
          } catch (error) {
            console.warn(`Failed to load ${field}:`, error);
            urls[field] = getDefaultImage(docType);
          }
        } else {
          urls[field] = getDefaultImage(docType);
        }
      }

      setImageUrls(urls);
    } catch (error) {
      console.error("Error loading existing images:", error);
      setImageUrls({
        cniRecto: getDefaultImage("CNI_RECTO"),
        cniVerso: getDefaultImage("CNI_VERSO"),
        selfie: getDefaultImage("PROFILE_PHOTO"),
      });
    }
  };

  const getDefaultImage = (docType) => {
    switch (docType) {
      case "CNI_RECTO":
        return "/default-cni-front.png";
      case "CNI_VERSO":
        return "/default-cni-back.png";
      case "PROFILE_PHOTO":
        return "/default-avatar.png";
      default:
        return "/default-image.png";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "APPROVED":
        return "Approuvé";
      case "REJECTED":
        return "Rejeté";
      case "EN_ATTENTE":
        return "En attente";
      default:
        return status;
    }
  };

  const renderImageSection = (
    fieldName,
    label,
    isRequired = false,
    icon = FileImage
  ) => {
    const hasNewImage = imagePreview[fieldName];
    const hasExistingImage = imageUrls[fieldName];
    const IconComponent = icon;

    return (
      <div className="bg-slate-50 rounded-xl p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <IconComponent size={16} className="mr-2 text-indigo-600" />
          {label}{" "}
          {isRequired && modalMode === "create" && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        {modalMode !== "view" && (
          <div className="flex items-center mb-4">
            <label className="flex items-center px-4 py-3 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 shadow-sm">
              <Camera size={16} className="mr-2 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">
                Choisir un fichier
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, fieldName)}
                className="hidden"
                required={isRequired && modalMode === "create"}
              />
            </label>
          </div>
        )}

        {/* Show new image preview if available */}
        {hasNewImage && (
          <div className="mb-4 relative">
            <p className="text-xs text-green-600 mb-2 font-medium flex items-center">
              <Check size={12} className="mr-1" />
              Nouvelle image:
            </p>
            <div className="relative inline-block">
              <img
                src={imagePreview[fieldName]}
                alt={`${label} - Nouveau`}
                className="h-24 w-36 object-cover rounded-lg border-2 border-green-200 shadow-sm"
              />
              {modalMode !== "view" && (
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  onClick={() => handleRemoveImage(fieldName)}
                  aria-label="Supprimer l'image"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show existing image if available and no new image */}
        {!hasNewImage && hasExistingImage && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">
              Image actuelle:
            </p>
            <img
              src={imageUrls[fieldName]}
              alt={`${label} - Existant`}
              className="h-24 w-36 object-cover rounded-lg border-2 border-slate-200 shadow-sm"
            />
          </div>
        )}

        {/* Show placeholder if no images */}
        {!hasNewImage && !hasExistingImage && (
          <div className="h-24 w-36 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
            <div className="text-center">
              <IconComponent className="mx-auto h-6 w-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-400">Aucune image</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!showModal) return null;

  // Check if approve/reject buttons should be shown
  const shouldShowApprovalButtons =
    modalMode === "view" &&
    selectedProfessor &&
    formData.statut === "EN_ATTENTE";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative">
        {/* Header - Fixed and sticky */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                <User className="mr-2 sm:mr-3 text-indigo-600" size={24} />
                <span className="hidden sm:inline">
                  {modalMode === "create"
                    ? "Nouveau Professeur"
                    : modalMode === "edit"
                    ? "Modifier Professeur"
                    : "Détails Professeur"}
                </span>
                <span className="sm:hidden">
                  {modalMode === "create"
                    ? "Nouveau"
                    : modalMode === "edit"
                    ? "Modifier"
                    : "Détails"}
                </span>
              </h3>
              {/* Status Badge */}
              {(modalMode === "edit" || modalMode === "view") &&
                selectedProfessor && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      formData.statut
                    )}`}
                  >
                    <Shield size={12} className="mr-1" />
                    {getStatusText(formData.statut)}
                  </span>
                )}
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                  <User size={18} className="mr-2 text-indigo-600" />
                  Informations Personnelles
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <User size={14} className="mr-1 text-indigo-600" />
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez le prénom"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <User size={14} className="mr-1 text-indigo-600" />
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez le nom"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Mail size={14} className="mr-1 text-indigo-600" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="exemple@email.com"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Phone size={14} className="mr-1 text-indigo-600" />
                      Numéro de téléphone{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <MapPin size={14} className="mr-1 text-indigo-600" />
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez l'adresse complète"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <IdCard size={14} className="mr-1 text-indigo-600" />
                      Matricule du professeur (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur || ""}
                      onChange={handleInputChange}
                      disabled={modalMode === "view"}
                      placeholder="Matricule professionnel"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                  <FileImage size={18} className="mr-2 text-indigo-600" />
                  Documents d'identité
                </h4>

                <div className="space-y-6">
                  {renderImageSection("cniRecto", "CNI Recto", true, IdCard)}
                  {renderImageSection("cniVerso", "CNI Verso", true, IdCard)}
                  {renderImageSection("selfie", "Photo de profil", true, User)}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0 sticky bottom-0 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Status Action Buttons - Only show when in view mode and EN_ATTENTE */}
            {shouldShowApprovalButtons && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange("APPROVED")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-base font-semibold text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 order-1 sm:order-3"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Check size={16} className="mr-2" />
                  )}
                  {loading ? "Traitement..." : "Approuver"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("REJECTED")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-base font-semibold text-white hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 order-2 sm:order-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <XCircle size={16} className="mr-2" />
                  )}
                  {loading ? "Traitement..." : "Rejeter"}
                </button>
              </>
            )}

            {/* Regular Form Buttons */}
            {modalMode !== "view" && (
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 order-1 sm:order-2"
                onClick={handleSubmit}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-slate-300 shadow-sm px-6 py-3 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 order-3 sm:order-1"
            >
              <X size={16} className="mr-2" />
              {modalMode === "view" ? "Fermer" : "Annuler"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;

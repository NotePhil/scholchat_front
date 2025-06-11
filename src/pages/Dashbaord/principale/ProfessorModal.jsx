import React, { useState, useEffect } from "react";
import { X, Save, Camera, Upload } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
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
    etat: "INACTIVE",
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
          etat: "INACTIVE",
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
          etat: selectedProfessor.etat || "INACTIVE",
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

  const loadExistingImages = async (professor) => {
    try {
      const imageTypes = [
        { field: "cniRecto", url: "cniUrlRecto" },
        { field: "cniVerso", url: "cniUrlVerso" },
        { field: "selfie", url: "selfieUrl" },
      ];
      const urls = {};

      for (const { field, url } of imageTypes) {
        if (professor[url]) {
          try {
            // Generate download URL for existing image using the same pattern as SignUp
            const response = await axios.get(
              `http://localhost:8486/scholchat/media/download-by-path`,
              {
                params: { filePath: professor[url] },
              }
            );
            if (response.data && response.data.url) {
              urls[field] = response.data.url;
            }
          } catch (error) {
            console.warn(`Failed to load ${field}:`, error);
          }
        }
      }

      setImageUrls(urls);
    } catch (error) {
      console.error("Error loading existing images:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const uploadFileToS3 = async (file, userId, documentType) => {
    try {
      // Generate a unique filename
      const fileName = `${userId}_${documentType}_${Date.now()}.${file.name
        .split(".")
        .pop()}`;

      // Get presigned URL from backend using the same endpoint as SignUp
      const presignedResponse = await axios.post(
        "http://localhost:8486/scholchat/media/presigned-url",
        {
          fileName: fileName,
          contentType: file.type,
          mediaType: "IMAGE",
          ownerId: userId === "temp" ? null : userId,
          documentType: documentType,
        }
      );

      const { url } = presignedResponse.data;

      // Convert data URL to Blob if needed
      let fileToUpload = file;
      if (typeof file === "string" && file.startsWith("data:")) {
        const res = await fetch(file);
        fileToUpload = await res.blob();
      }

      // Upload the file directly to S3 using the presigned URL
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

      // Return the file name that was used for upload
      return fileName;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let professorData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        etat: formData.etat || "INACTIVE",
        matriculeProfesseur: formData.matriculeProfesseur?.trim() || null,
        type: "professeur", // Add type field
      };

      if (modalMode === "create") {
        // For create mode, upload files first and use direct API call (no auth required)
        if (
          formData.cniRecto instanceof File ||
          typeof formData.cniRecto === "string"
        ) {
          professorData.cniUrlRecto = await uploadFileToS3(
            formData.cniRecto,
            "temp",
            "cni-recto"
          );
        }

        if (
          formData.cniVerso instanceof File ||
          typeof formData.cniVerso === "string"
        ) {
          professorData.cniUrlVerso = await uploadFileToS3(
            formData.cniVerso,
            "temp",
            "cni-verso"
          );
        }

        if (
          formData.selfie instanceof File ||
          typeof formData.selfie === "string"
        ) {
          professorData.selfieUrl = await uploadFileToS3(
            formData.selfie,
            "temp",
            "selfie"
          );
        }

        // Use direct API call for create (no authentication required, like signup)
        const response = await axios.post(
          "http://localhost:8486/scholchat/utilisateurs",
          professorData
        );
        const newUserId = response.data.id;

        // Update with proper user ID in background (don't wait for this)
        if (newUserId) {
          const updatePayload = {};

          try {
            if (
              formData.cniRecto instanceof File ||
              typeof formData.cniRecto === "string"
            ) {
              updatePayload.cniUrlRecto = await uploadFileToS3(
                formData.cniRecto,
                newUserId,
                "cni-recto"
              );
            }

            if (
              formData.cniVerso instanceof File ||
              typeof formData.cniVerso === "string"
            ) {
              updatePayload.cniUrlVerso = await uploadFileToS3(
                formData.cniVerso,
                newUserId,
                "cni-verso"
              );
            }

            if (
              formData.selfie instanceof File ||
              typeof formData.selfie === "string"
            ) {
              updatePayload.selfieUrl = await uploadFileToS3(
                formData.selfie,
                newUserId,
                "selfie"
              );
            }

            if (Object.keys(updatePayload).length > 0) {
              // Don't await this - let it happen in background
              axios
                .put(
                  `http://localhost:8486/scholchat/utilisateurs/${newUserId}`,
                  updatePayload
                )
                .catch((error) => {
                  console.error("Background update failed:", error);
                });
            }
          } catch (error) {
            console.error("Error in background file updates:", error);
          }
        }
      } else {
        // For edit mode, handle file uploads if new files are provided and use ScholchatService (requires auth)
        if (
          formData.cniRecto instanceof File ||
          typeof formData.cniRecto === "string"
        ) {
          professorData.cniUrlRecto = await uploadFileToS3(
            formData.cniRecto,
            selectedProfessor.id,
            "cni-recto"
          );
        } else if (existingImages.cniRecto) {
          professorData.cniUrlRecto = existingImages.cniRecto;
        }

        if (
          formData.cniVerso instanceof File ||
          typeof formData.cniVerso === "string"
        ) {
          professorData.cniUrlVerso = await uploadFileToS3(
            formData.cniVerso,
            selectedProfessor.id,
            "cni-verso"
          );
        } else if (existingImages.cniVerso) {
          professorData.cniUrlVerso = existingImages.cniVerso;
        }

        if (
          formData.selfie instanceof File ||
          typeof formData.selfie === "string"
        ) {
          professorData.selfieUrl = await uploadFileToS3(
            formData.selfie,
            selectedProfessor.id,
            "selfie"
          );
        } else if (existingImages.selfie) {
          professorData.selfieUrl = existingImages.selfie;
        }

        // Use ScholchatService for update (requires authentication)
        await scholchatService.updateUser(selectedProfessor.id, professorData);
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

  const renderImageSection = (fieldName, label, isRequired = false) => {
    const hasNewImage = imagePreview[fieldName];
    const hasExistingImage = imageUrls[fieldName];

    return (
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{" "}
          {isRequired && modalMode === "create" && (
            <span className="text-red-500">*</span>
          )}
        </label>

        {modalMode !== "view" && (
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
              <Camera size={16} className="mr-2" />
              Choisir fichier
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
          <div className="mb-2 relative">
            <p className="text-xs text-green-600 mb-1">Nouvelle image:</p>
            <div className="relative inline-block">
              <img
                src={imagePreview[fieldName]}
                alt={`${label} - Nouveau`}
                className="h-20 w-32 object-cover rounded border"
              />
              {modalMode !== "view" && (
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1">Image actuelle:</p>
            <img
              src={imageUrls[fieldName]}
              alt={`${label} - Existant`}
              className="h-20 w-32 object-cover rounded border"
            />
          </div>
        )}

        {/* Show placeholder if no images */}
        {!hasNewImage && !hasExistingImage && (
          <div className="h-20 w-32 bg-gray-100 rounded border flex items-center justify-center">
            <span className="text-xs text-gray-400">Aucune image</span>
          </div>
        )}
      </div>
    );
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setShowModal(false)}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {modalMode === "create"
                    ? "Nouveau Professeur"
                    : modalMode === "edit"
                    ? "Modifier Professeur"
                    : "Détails Professeur"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Informations Personnelles
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez votre prénom"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez votre nom"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      placeholder="Entrez votre numéro"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez votre adresse"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matricule du professeur (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur || ""}
                      onChange={handleInputChange}
                      disabled={modalMode === "view"}
                      placeholder="Entrez votre matricule"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      name="etat"
                      value={formData.etat}
                      onChange={handleInputChange}
                      disabled={modalMode === "view"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="INACTIVE">Inactif</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="PENDING">En attente</option>
                    </select>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Documents d'identité
                  </h4>

                  {renderImageSection("cniRecto", "CNI Recto", true)}
                  {renderImageSection("cniVerso", "CNI Verso", true)}
                  {renderImageSection("selfie", "Photo de profil", true)}
                </div>
              </div>
            </div>

            {modalMode !== "view" && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" />
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;

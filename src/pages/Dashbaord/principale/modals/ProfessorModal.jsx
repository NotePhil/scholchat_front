import React, { useState, useEffect } from "react";
import { X, Save, Camera, Upload, Check, XCircle } from "lucide-react";
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
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  // Check if approve/reject buttons should be shown
  const shouldShowApprovalButtons =
    modalMode === "view" &&
    selectedProfessor &&
    formData.statut == "EN_ATTENTE";

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
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {modalMode === "create"
                      ? "Nouveau Professeur"
                      : modalMode === "edit"
                      ? "Modifier Professeur"
                      : "Détails Professeur"}
                  </h3>
                  {/* Status Badge */}
                  {(modalMode === "edit" || modalMode === "view") &&
                    selectedProfessor && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          formData.statut
                        )}`}
                      >
                        {getStatusText(formData.statut)}
                      </span>
                    )}
                </div>
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

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {/* Status Action Buttons - Only show when NOT EN_ATTENTE */}
              {shouldShowApprovalButtons && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("APPROVED")}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    <Check size={16} className="mr-2" />
                    {loading ? "Traitement..." : "Approuver"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("REJECTED")}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    <XCircle size={16} className="mr-2" />
                    {loading ? "Traitement..." : "Rejeter"}
                  </button>
                </>
              )}

              {/* Regular Form Buttons */}
              {modalMode !== "view" && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" />
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {modalMode === "view" ? "Fermer" : "Annuler"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;

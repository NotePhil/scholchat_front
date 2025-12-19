import React, { useState, useRef } from "react";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Upload,
  Image,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  Eye,
  Download,
  Plus,
} from "lucide-react";
import { minioS3Service } from "../../../../../services/minioS3";

const CreateEventModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState(null);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lieu: "",
    heureDebut: "",
    heureFin: "",
    etat: "PLANIFIE",
    participantsIds: [],
    medias: [],
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est requis";
    }
    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }
    if (!formData.lieu.trim()) {
      newErrors.lieu = "Le lieu est requis";
    }
    if (!formData.heureDebut) {
      newErrors.heureDebut = "L'heure de début est requise";
    }
    if (!formData.heureFin) {
      newErrors.heureFin = "L'heure de fin est requise";
    }
    if (
      formData.heureDebut &&
      formData.heureFin &&
      new Date(formData.heureDebut) >= new Date(formData.heureFin)
    ) {
      newErrors.heureFin = "L'heure de fin doit être après l'heure de début";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);

      const uploadedMedia = [];

      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          try {
            const file =
              img.file ||
              (await fetch(img.previewUrl)
                .then((r) => r.blob())
                .then(
                  (blob) =>
                    new File([blob], img.fileName, { type: img.contentType })
                ));

            const uploadResult = await minioS3Service.uploadImage(
              file,
              "event_images"
            );

            uploadedMedia.push({
              fileName: uploadResult.fileName,
              filePath: uploadResult.filePath,
              fileType: "IMAGE",
              contentType: img.contentType,
              fileSize: img.size,
              mediaType: "IMAGE",
              bucketName: "ressources",
            });
          } catch (uploadError) {
            console.error(`Error uploading ${img.fileName}:`, uploadError);
          }
        }
      }

      const eventData = {
        ...formData,
        medias: uploadedMedia,
      };

      console.log("Submitting event data:", eventData);
      const createdEvent = await onSubmit(eventData);

      if (createdEvent && createdEvent.id) {
        setEventId(createdEvent.id);
      }
      setStep(2);
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert("Veuillez sélectionner des fichiers image (JPG, PNG, GIF)");
      return;
    }

    setUploading(true);

    try {
      for (const file of imageFiles) {
        if (!file.name || file.name.trim() === "") {
          console.error("Fichier sans nom valide:", file);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} est trop volumineux (max 5MB)`);
          continue;
        }

        try {
          const timestamp = Date.now() + Math.random();
          const extension = file.name.split(".").pop();
          const uniqueFileName = `event_image_${timestamp}.${extension}`;

          const previewUrl = URL.createObjectURL(file);

          const imageData = {
            id: timestamp,
            fileName: uniqueFileName,
            originalFileName: file.name,
            filePath: `temp/${uniqueFileName}`,
            type: "IMAGE",
            contentType: file.type,
            size: file.size,
            previewUrl: previewUrl,
            uploadedAt: new Date().toISOString(),
            file: file,
          };

          setUploadedImages((prev) => [...prev, imageData]);
        } catch (error) {
          console.error(`Erreur traitement ${file.name}:`, error);
          alert(`Erreur lors du traitement de ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Erreur générale de traitement:", error);
      alert("Erreur lors du traitement des images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (imageId) => {
    const imageToRemove = uploadedImages.find((img) => img.id === imageId);
    if (imageToRemove && imageToRemove.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const openImagePreview = (imageUrl, fileName) => {
    setPreviewImage({ url: imageUrl, name: fileName });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const downloadImage = async (image) => {
    try {
      if (image.filePath && image.filePath !== `temp/${image.fileName}`) {
        await minioS3Service.downloadFileByPath(image.filePath);
      } else {
        const response = await fetch(image.previewUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = image.originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement de l'image");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFinish = async () => {
    handleReset();
  };

  const handleReset = () => {
    uploadedImages.forEach((img) => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });

    setFormData({
      titre: "",
      description: "",
      lieu: "",
      heureDebut: "",
      heureFin: "",
      etat: "PLANIFIE",
      participantsIds: [],
      medias: [],
    });
    setUploadedImages([]);
    setErrors({});
    setStep(1);
    setEventId(null);
    setPreviewImage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? "Créer un événement" : "Ajouter des images"}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 1
                  ? "Étape 1/2: Informations de l'événement"
                  : "Étape 2/2: Images (optionnel)"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 mx-2 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => handleInputChange("titre", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.titre
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Ex: Conférence sur l'Intelligence Artificielle"
                />
                {errors.titre && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.titre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Décrivez votre événement en détail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu *
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => handleInputChange("lieu", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.lieu
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Ex: Amphithéâtre A, Université de Douala"
                  />
                </div>
                {errors.lieu && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.lieu}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Début *
                  </label>
                  <div className="relative">
                    <Clock
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="datetime-local"
                      value={formData.heureDebut}
                      onChange={(e) =>
                        handleInputChange("heureDebut", e.target.value)
                      }
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.heureDebut
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.heureDebut && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.heureDebut}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin *
                  </label>
                  <div className="relative">
                    <Clock
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="datetime-local"
                      value={formData.heureFin}
                      onChange={(e) =>
                        handleInputChange("heureFin", e.target.value)
                      }
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.heureFin
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.heureFin && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.heureFin}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.etat}
                  onChange={(e) => handleInputChange("etat", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ajouter des images (optionnel)
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto">
                      <Image size={32} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Ajoutez des images pour votre événement
                      </p>
                      <p className="text-sm text-gray-500">
                        Formats supportés: JPG, PNG, GIF • Taille max: 5MB par
                        image
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Sélectionner des images
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Image size={16} />
                    Images sélectionnées ({uploadedImages.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="relative group">
                          <img
                            src={image.previewUrl}
                            alt={image.originalFileName}
                            className="w-full h-32 object-cover cursor-pointer"
                            onClick={() =>
                              openImagePreview(
                                image.previewUrl,
                                image.originalFileName
                              )
                            }
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() =>
                                openImagePreview(
                                  image.previewUrl,
                                  image.originalFileName
                                )
                              }
                              className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors mr-2"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadImage(image)}
                              className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-gray-900 truncate"
                                title={image.originalFileName}
                              >
                                {image.originalFileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(image.size)} • Prêt à être
                                uploadé
                              </p>
                            </div>
                            <button
                              onClick={() => removeImage(image.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors ml-2"
                              title="Supprimer cette image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="font-medium">Événement créé avec succès !</p>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Votre événement a été créé et les images ont été sauvegardées.
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Image size={16} />
                    Images sauvegardées ({uploadedImages.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="relative group">
                          <img
                            src={image.previewUrl}
                            alt={image.originalFileName}
                            className="w-full h-32 object-cover cursor-pointer"
                            onClick={() =>
                              openImagePreview(
                                image.previewUrl,
                                image.originalFileName
                              )
                            }
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() =>
                                openImagePreview(
                                  image.previewUrl,
                                  image.originalFileName
                                )
                              }
                              className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors mr-2"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadImage(image)}
                              className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-gray-900 truncate"
                                title={image.originalFileName}
                              >
                                {image.originalFileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(image.size)} • Sauvegardé
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-200 rounded-lg hover:bg-white"
          >
            {step === 1 ? "Annuler" : "Fermer"}
          </button>

          {step === 1 ? (
            <button
              onClick={handleSaveEvent}
              disabled={loading || uploading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {loading || uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {uploading ? "Traitement..." : "Création..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  Créer l'événement
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Calendar size={18} />
              Terminer
            </button>
          )}
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
              <p className="text-sm font-medium">{previewImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventModal;

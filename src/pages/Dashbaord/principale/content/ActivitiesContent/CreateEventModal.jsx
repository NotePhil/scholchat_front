import React, { useState } from "react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Check,
} from "lucide-react";

const CreateEventModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lieu: "",
    heureDebut: "",
    heureFin: "",
    etat: "PLANIFIE",
  });
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    setUploadingFiles(true);
    setError("");

    try {
      // Validate files before uploading
      const validFiles = [];
      const errors = [];

      for (const file of fileArray) {
        try {
          minioS3Service.validateImageFile(file, 10 * 1024 * 1024); // 10MB limit
          validFiles.push(file);
        } catch (validationError) {
          errors.push(`${file.name}: ${validationError.message}`);
        }
      }

      if (errors.length > 0) {
        setError(`File validation errors: ${errors.join(", ")}`);
      }

      if (validFiles.length > 0) {
        // Upload files to MinIO
        const uploadResults = await minioS3Service.uploadMultipleFiles(
          validFiles,
          "IMAGE",
          "event-images"
        );

        if (uploadResults.failed.length > 0) {
          console.error("Some uploads failed:", uploadResults.failed);
          setError(`Failed to upload ${uploadResults.failed.length} file(s)`);
        }

        // Add successfully uploaded files to media state
        const newMediaItems = uploadResults.successful.map((result) => ({
          id: `temp_${Date.now()}_${Math.random()}`,
          fileName: result.fileName,
          filePath: result.fileName, // Store the fileName for later retrieval
          contentType: result.contentType,
          fileSize: result.fileSize,
          type: "IMAGE",
        }));

        setMedia((prev) => [...prev, ...newMediaItems]);

        if (uploadResults.successful.length > 0) {
          console.log(
            `Successfully uploaded ${uploadResults.successful.length} files`
          );
        }
      }
    } catch (err) {
      console.error("Error handling files:", err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (files) {
      await handleFiles(files);
    }
    // Clear the input so the same file can be selected again
    e.target.value = "";
  };

  const removeMedia = async (index) => {
    const mediaItem = media[index];

    try {
      // If the media has been uploaded to MinIO, we might want to delete it
      // Note: This would require implementing a delete method or keeping track of media IDs
      console.log("Removing media item:", mediaItem.fileName);
    } catch (error) {
      console.error("Error removing media:", error);
    }

    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.titre.trim()) {
      setError("Event title is required");
      setLoading(false);
      return;
    }

    if (!formData.heureDebut) {
      setError("Start time is required");
      setLoading(false);
      return;
    }

    // Check if end time is after start time
    if (formData.heureFin && formData.heureDebut) {
      const startTime = new Date(formData.heureDebut);
      const endTime = new Date(formData.heureFin);

      if (endTime <= startTime) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }
    }

    try {
      const eventData = {
        ...formData,
        createurId: activityFeedService.getValidUserId(),
        medias: media,
        participantsIds: [],
      };

      await onSubmit(eventData);
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    {
      value: "PLANIFIE",
      label: "Scheduled",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      value: "EN_COURS",
      label: "Live",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "TERMINE",
      label: "Completed",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      value: "ANNULE",
      label: "Cancelled",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getMediaPreviewUrl = async (mediaItem) => {
    try {
      // Generate a download URL for preview
      const downloadData = await minioS3Service.generateDownloadUrlByPath(
        mediaItem.filePath
      );
      return downloadData.downloadUrl;
    } catch (error) {
      console.error("Error generating preview URL:", error);
      return "/api/placeholder/200/150";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create New Event</h2>
                <p className="text-blue-100">
                  Share something amazing with your community
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Event Title */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Event Title *</span>
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Give your event an exciting title..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4" />
                <span>Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Tell people what makes this event special..."
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Where will this event take place?"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>Start Time *</span>
                </label>
                <input
                  type="datetime-local"
                  name="heureDebut"
                  value={formData.heureDebut}
                  onChange={handleInputChange}
                  min={getCurrentDateTime()}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>End Time</span>
                </label>
                <input
                  type="datetime-local"
                  name="heureFin"
                  value={formData.heureFin}
                  onChange={handleInputChange}
                  min={formData.heureDebut || getCurrentDateTime()}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Check className="w-4 h-4" />
                <span>Event Status</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statusOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="etat"
                      value={option.value}
                      checked={formData.etat === option.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        formData.etat === option.value
                          ? `${option.bgColor} border-current ${option.color} font-semibold`
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <ImageIcon className="w-4 h-4" />
                <span>Event Photos</span>
              </label>

              <div
                className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : uploadingFiles
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                  disabled={uploadingFiles}
                />
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto">
                    {uploadingFiles ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    {uploadingFiles ? (
                      <p className="text-blue-600 font-semibold">
                        Uploading files...
                      </p>
                    ) : (
                      <>
                        <label
                          htmlFor="media-upload"
                          className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Choose files
                        </label>
                        <span className="text-gray-500"> or drag and drop</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, WebP up to 10MB each
                  </p>
                </div>
              </div>

              {/* Media Preview */}
              {media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {media.map((mediaItem, index) => (
                    <MediaPreview
                      key={mediaItem.id || index}
                      mediaItem={mediaItem}
                      onRemove={() => removeMedia(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </div>
                ) : uploadingFiles ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Separate component for media preview to handle async URL generation
const MediaPreview = ({ mediaItem, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState("/api/placeholder/200/150");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadPreviewUrl = async () => {
      try {
        setLoading(true);
        const downloadData = await minioS3Service.generateDownloadUrlByPath(
          mediaItem.filePath
        );
        setPreviewUrl(downloadData.downloadUrl);
      } catch (error) {
        console.error("Error loading preview:", error);
        setPreviewUrl("/api/placeholder/200/150");
      } finally {
        setLoading(false);
      }
    };

    if (mediaItem.filePath) {
      loadPreviewUrl();
    }
  }, [mediaItem.filePath]);

  return (
    <div className="relative group">
      <div className="relative w-full h-24 bg-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <img
            src={previewUrl}
            alt={mediaItem.fileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/api/placeholder/200/150";
            }}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="mt-1">
        <p
          className="text-xs text-gray-500 truncate"
          title={mediaItem.fileName}
        >
          {mediaItem.fileName}
        </p>
        <p className="text-xs text-gray-400">
          {minioS3Service.formatFileSize(mediaItem.fileSize)}
        </p>
      </div>
    </div>
  );
};

export default CreateEventModal;

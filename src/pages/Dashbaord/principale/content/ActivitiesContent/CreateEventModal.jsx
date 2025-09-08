import React, { useState, useEffect } from "react";
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
  Eye,
  Trash2,
  RefreshCw,
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
  const [localPreviews, setLocalPreviews] = useState(new Map()); // For local file previews
  const [uploadedMedia, setUploadedMedia] = useState(new Map()); // For uploaded media URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(new Map());

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
    setError("");

    try {
      // First, validate files and create local previews
      const validFiles = [];
      const errors = [];
      const newLocalPreviews = new Map();

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        try {
          minioS3Service.validateImageFile(file, 10 * 1024 * 1024); // 10MB limit
          validFiles.push(file);

          // Create local preview immediately
          if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            const tempId = `temp_${Date.now()}_${i}_${Math.random()}`;
            newLocalPreviews.set(tempId, {
              url,
              file,
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              isLocal: true,
            });
          }
        } catch (validationError) {
          errors.push(`${file.name}: ${validationError.message}`);
        }
      }

      if (errors.length > 0) {
        setError(`File validation errors: ${errors.join(", ")}`);
      }

      if (validFiles.length > 0) {
        // Update local previews state
        setLocalPreviews((prev) => new Map([...prev, ...newLocalPreviews]));

        // Add media items to state with temporary IDs
        const newMediaItems = Array.from(newLocalPreviews.entries()).map(
          ([tempId, preview]) => ({
            id: tempId,
            fileName: preview.fileName,
            filePath: null, // Will be set after upload
            contentType: preview.contentType,
            fileSize: preview.fileSize,
            type: "IMAGE",
            isLocal: true,
            uploadStatus: "pending", // pending, uploading, uploaded, failed
          })
        );

        setMedia((prev) => [...prev, ...newMediaItems]);

        // Start uploading in background
        uploadFilesInBackground(newMediaItems, validFiles);
      }
    } catch (err) {
      console.error("Error handling files:", err);
      setError(`Upload failed: ${err.message}`);
    }
  };

  const uploadFilesInBackground = async (mediaItems, files) => {
    setUploadingFiles(true);

    try {
      // Process each file individually for better progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaItem = mediaItems[i];

        if (!mediaItem) continue;

        try {
          // Update status to uploading
          setMedia((prev) =>
            prev.map((item) =>
              item.id === mediaItem.id
                ? { ...item, uploadStatus: "uploading" }
                : item
            )
          );

          setUploadProgress((prev) => new Map([...prev, [mediaItem.id, 0]]));

          // Upload single file to MinioS3
          console.log(`Starting upload for: ${file.name}`);
          const uploadResult = await minioS3Service.uploadFile(
            file,
            "IMAGE",
            "event-images"
          );

          if (uploadResult.success) {
            // Generate download URL immediately after upload
            let downloadData;
            try {
              downloadData = await minioS3Service.generateDownloadUrlByPath(
                uploadResult.fileName
              );
            } catch (urlError) {
              console.warn(
                "Failed to generate URL by path, trying by ID:",
                urlError
              );
              // If path-based URL fails, we might need to use ID-based approach
              // This depends on your backend implementation
            }

            // Update the media item with upload results
            setMedia((prev) =>
              prev.map((item) =>
                item.id === mediaItem.id
                  ? {
                      ...item,
                      filePath: uploadResult.fileName,
                      uploadStatus: "uploaded",
                      isLocal: false,
                      // Store server response data
                      serverId: uploadResult.mediaId, // If returned by your service
                      downloadUrl: downloadData?.downloadUrl,
                    }
                  : item
              )
            );

            // Store in uploaded media map for quick access
            if (downloadData?.downloadUrl) {
              setUploadedMedia(
                (prev) =>
                  new Map([
                    ...prev,
                    [
                      mediaItem.id,
                      {
                        url: downloadData.downloadUrl,
                        fileName: uploadResult.fileName,
                        filePath: uploadResult.fileName,
                        contentType: uploadResult.contentType,
                        fileSize: uploadResult.fileSize,
                        isLocal: false,
                      },
                    ],
                  ])
              );
            }

            setUploadProgress(
              (prev) => new Map([...prev, [mediaItem.id, 100]])
            );

            console.log(`Upload successful for: ${file.name}`);
          } else {
            throw new Error("Upload failed");
          }
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);

          // Mark this specific item as failed
          setMedia((prev) =>
            prev.map((item) =>
              item.id === mediaItem.id
                ? { ...item, uploadStatus: "failed" }
                : item
            )
          );

          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            newMap.delete(mediaItem.id);
            return newMap;
          });
        }
      }

      // Show success message for successful uploads
      const successfulUploads = mediaItems.filter(
        (item) =>
          media.find((m) => m.id === item.id)?.uploadStatus === "uploaded"
      );

      if (successfulUploads.length > 0) {
        console.log(`Successfully processed ${successfulUploads.length} files`);
      }
    } catch (err) {
      console.error("Error in upload process:", err);
      setError(`Upload process failed: ${err.message}`);
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
      // Clean up local preview URL if it exists
      const localPreview = localPreviews.get(mediaItem.id);
      if (localPreview && localPreview.isLocal) {
        URL.revokeObjectURL(localPreview.url);
        setLocalPreviews((prev) => {
          const newMap = new Map(prev);
          newMap.delete(mediaItem.id);
          return newMap;
        });
      }

      // Clean up uploaded media URL if it exists
      setUploadedMedia((prev) => {
        const newMap = new Map(prev);
        newMap.delete(mediaItem.id);
        return newMap;
      });

      // Clean up progress tracking
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(mediaItem.id);
        return newMap;
      });

      console.log("Removing media item:", mediaItem.fileName);
    } catch (error) {
      console.error("Error removing media:", error);
    }

    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const retryUpload = async (mediaItem) => {
    const localPreview = localPreviews.get(mediaItem.id);
    if (localPreview && localPreview.file) {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === mediaItem.id
            ? { ...item, uploadStatus: "uploading" }
            : item
        )
      );

      setUploadProgress((prev) => new Map([...prev, [mediaItem.id, 0]]));

      try {
        const uploadResult = await minioS3Service.uploadFile(
          localPreview.file,
          "IMAGE",
          "event-images"
        );

        if (uploadResult.success) {
          const downloadData = await minioS3Service.generateDownloadUrlByPath(
            uploadResult.fileName
          );

          setUploadedMedia(
            (prev) =>
              new Map([
                ...prev,
                [
                  mediaItem.id,
                  {
                    url: downloadData.downloadUrl,
                    fileName: uploadResult.fileName,
                    filePath: uploadResult.fileName,
                    contentType: uploadResult.contentType,
                    fileSize: uploadResult.fileSize,
                    isLocal: false,
                  },
                ],
              ])
          );

          setMedia((prev) =>
            prev.map((item) =>
              item.id === mediaItem.id
                ? {
                    ...item,
                    filePath: uploadResult.fileName,
                    uploadStatus: "uploaded",
                    isLocal: false,
                    downloadUrl: downloadData.downloadUrl,
                  }
                : item
            )
          );

          setUploadProgress((prev) => new Map([...prev, [mediaItem.id, 100]]));
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Retry upload failed:", error);
        setMedia((prev) =>
          prev.map((item) =>
            item.id === mediaItem.id
              ? { ...item, uploadStatus: "failed" }
              : item
          )
        );
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(mediaItem.id);
          return newMap;
        });
      }
    }
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

    // Check if there are any uploads still in progress
    const stillUploading = media.some(
      (item) =>
        item.uploadStatus === "uploading" || item.uploadStatus === "pending"
    );
    if (stillUploading) {
      setError("Please wait for all images to finish uploading");
      setLoading(false);
      return;
    }

    try {
      // Only include successfully uploaded media with proper format for backend
      const uploadedMediaItems = media
        .filter((item) => item.uploadStatus === "uploaded")
        .map((item) => ({
          fileName: item.fileName,
          filePath: item.filePath,
          contentType: item.contentType,
          fileSize: item.fileSize,
          type: item.type,
          // Include any server-generated IDs if available
          ...(item.serverId && { id: item.serverId }),
        }));

      const eventData = {
        ...formData,
        createurId: minioS3Service.getValidUserId(),
        medias: uploadedMediaItems,
        participantsIds: [],
      };

      console.log("Submitting event with data:", eventData);

      await onSubmit(eventData);

      // Clean up local preview URLs
      localPreviews.forEach((preview) => {
        if (preview.isLocal) {
          URL.revokeObjectURL(preview.url);
        }
      });
    } catch (err) {
      console.error("Error creating event:", err);
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

  const getMediaPreviewUrl = (mediaItem) => {
    // First check if it's uploaded and has a download URL
    if (mediaItem.downloadUrl) {
      return mediaItem.downloadUrl;
    }

    // Then check uploaded media map
    const uploadedData = uploadedMedia.get(mediaItem.id);
    if (uploadedData) {
      return uploadedData.url;
    }

    // Finally check local previews
    const localPreview = localPreviews.get(mediaItem.id);
    if (localPreview) {
      return localPreview.url;
    }

    return "/api/placeholder/200/150";
  };

  const handleImageView = (mediaItem) => {
    const previewUrl = getMediaPreviewUrl(mediaItem);
    setSelectedImage({
      ...mediaItem,
      url: previewUrl,
    });
  };

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      localPreviews.forEach((preview) => {
        if (preview.isLocal) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  return (
    <>
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
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                          Uploading files to MinIO S3...
                        </p>
                      ) : (
                        <>
                          <label
                            htmlFor="media-upload"
                            className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            Choose files
                          </label>
                          <span className="text-gray-500">
                            {" "}
                            or drag and drop
                          </span>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {media.map((mediaItem, index) => (
                      <MediaPreview
                        key={mediaItem.id}
                        mediaItem={mediaItem}
                        index={index}
                        onRemove={() => removeMedia(index)}
                        onRetry={() => retryUpload(mediaItem)}
                        onView={() => handleImageView(mediaItem)}
                        getPreviewUrl={getMediaPreviewUrl}
                        uploadProgress={uploadProgress.get(mediaItem.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Status Summary */}
              {media.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Upload Status:</span>
                    <div className="flex space-x-4">
                      <span className="text-green-600">
                        {
                          media.filter((m) => m.uploadStatus === "uploaded")
                            .length
                        }{" "}
                        uploaded
                      </span>
                      <span className="text-blue-600">
                        {
                          media.filter((m) => m.uploadStatus === "uploading")
                            .length
                        }{" "}
                        uploading
                      </span>
                      <span className="text-red-600">
                        {
                          media.filter((m) => m.uploadStatus === "failed")
                            .length
                        }{" "}
                        failed
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                      <span>Creating Event...</span>
                    </div>
                  ) : uploadingFiles ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Uploading to S3...</span>
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

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

// Enhanced MediaPreview component with upload progress
const MediaPreview = ({
  mediaItem,
  index,
  onRemove,
  onRetry,
  onView,
  getPreviewUrl,
  uploadProgress,
}) => {
  const [imageError, setImageError] = useState(false);
  const previewUrl = getPreviewUrl(mediaItem);

  const getStatusIndicator = () => {
    switch (mediaItem.uploadStatus) {
      case "pending":
        return (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
            <Clock className="w-3 h-3" />
          </div>
        );
      case "uploading":
        return (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
          </div>
        );
      case "uploaded":
        return (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        );
      case "failed":
        return (
          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
            <AlertCircle className="w-3 h-3" />
          </div>
        );
      default:
        return null;
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="relative group">
      <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
        {imageError ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-2">
            <AlertCircle className="w-6 h-6 mb-1" />
            <span className="text-xs text-center">Failed to load</span>
          </div>
        ) : (
          <img
            src={previewUrl}
            alt={mediaItem.fileName}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onClick={() => onView(mediaItem)}
          />
        )}

        {/* Upload Progress Bar */}
        {mediaItem.uploadStatus === "uploading" &&
          typeof uploadProgress === "number" && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-white text-xs text-center mt-1">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

        {/* Status Indicator */}
        {getStatusIndicator()}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            <button
              type="button"
              onClick={() => onView(mediaItem)}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200 shadow-lg"
            >
              <Eye className="w-4 h-4" />
            </button>
            {mediaItem.uploadStatus === "failed" && (
              <button
                type="button"
                onClick={() => onRetry(mediaItem)}
                className="bg-blue-500 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full transition-all duration-200 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
      >
        <X className="w-4 h-4" />
      </button>

      {/* File info */}
      <div className="mt-2">
        <p
          className="text-xs text-gray-600 truncate font-medium"
          title={mediaItem.fileName}
        >
          {mediaItem.fileName}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{minioS3Service.formatFileSize(mediaItem.fileSize)}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              mediaItem.uploadStatus === "uploaded"
                ? "bg-green-100 text-green-700"
                : mediaItem.uploadStatus === "uploading"
                ? "bg-blue-100 text-blue-700"
                : mediaItem.uploadStatus === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {mediaItem.uploadStatus === "uploaded"
              ? "Uploaded"
              : mediaItem.uploadStatus === "uploading"
              ? "Uploading"
              : mediaItem.uploadStatus === "failed"
              ? "Failed"
              : "Pending"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Simple Image Lightbox for preview
const ImageLightbox = ({ image, onClose }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative max-w-4xl max-h-full">
        <img
          src={image?.url || "/api/placeholder/800/600"}
          alt={image?.fileName || "Image Preview"}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            e.target.src = "/api/placeholder/800/600";
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <p className="font-medium">{image?.fileName || "Image"}</p>
          {image?.fileSize && (
            <p className="text-sm text-gray-300">
              {minioS3Service.formatFileSize(image.fileSize)}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Status:{" "}
            {image?.uploadStatus === "uploaded"
              ? "Uploaded to MinIO S3"
              : image?.uploadStatus === "uploading"
              ? "Uploading to S3..."
              : image?.uploadStatus === "failed"
              ? "Upload failed"
              : "Local preview"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;

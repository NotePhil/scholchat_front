import React, { useState } from "react";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Image,
  FileText,
  Users,
  Upload,
  AlertCircle,
} from "lucide-react";

const CreateEventModal = ({ onClose, onSubmit, currentUser }) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lieu: "",
    heureDebut: "",
    heureFin: "",
    etat: "PLANIFIE",
    participantsIds: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    uploading: false,
    current: 0,
    total: 0,
  });

  const eventTypes = [
    { id: "PLANIFIE", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    { id: "EN_COURS", label: "Live", color: "bg-green-100 text-green-800" },
    { id: "TERMINE", label: "Completed", color: "bg-gray-100 text-gray-800" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelection = (files) => {
    if (files.length === 0) return;

    const validFiles = [];
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 20MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" type is not supported.`);
        return;
      }

      validFiles.push(file);
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
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
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (fileIndex) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = (type) => {
    return type.startsWith("image/");
  };

  const createImagePreview = (file) => {
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titre.trim()) {
      alert("Please enter an event title");
      return;
    }

    if (!formData.heureDebut) {
      alert("Please select a start time");
      return;
    }

    setSubmitting(true);

    try {
      // Set upload progress if there are files
      if (selectedFiles.length > 0) {
        setUploadProgress({
          uploading: true,
          current: 0,
          total: selectedFiles.length,
        });
      }

      // Submit event data and files to parent component
      // The parent will handle creating the event first, then uploading files
      await onSubmit(formData, selectedFiles);

      // Reset form
      setFormData({
        titre: "",
        description: "",
        lieu: "",
        heureDebut: "",
        heureFin: "",
        etat: "PLANIFIE",
        participantsIds: [],
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress({
        uploading: false,
        current: 0,
        total: 0,
      });
    }
  };

  const generateUserAvatar = (userName) => {
    if (!userName) return "?";
    return userName.charAt(0).toUpperCase();
  };

  // Set minimum date to today
  const today = new Date();
  const todayString = today.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {generateUserAvatar(currentUser?.name)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create Event
              </h2>
              <p className="text-sm text-gray-600">
                {currentUser?.name} • {currentUser?.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleInputChange}
              placeholder="What's the event about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your event in detail..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="lieu"
              value={formData.lieu}
              onChange={handleInputChange}
              placeholder="Where will this event take place?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="heureDebut"
                value={formData.heureDebut}
                onChange={handleInputChange}
                min={todayString}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time
              </label>
              <input
                type="datetime-local"
                name="heureFin"
                value={formData.heureFin}
                onChange={handleInputChange}
                min={formData.heureDebut || todayString}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Event Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Status
            </label>
            <select
              name="etat"
              value={formData.etat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            >
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Event Photos/Documents
            </label>

            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Files will be uploaded after the event is successfully
                  created.
                </p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${submitting ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <label
                    className={`cursor-pointer text-blue-600 hover:text-blue-500 ${
                      submitting ? "pointer-events-none" : ""
                    }`}
                  >
                    Click to select files
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={(e) => handleFileSelection(e.target.files)}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500">
                  Support: Images, PDF, Word documents (Max 20MB each)
                </p>
              </div>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-50 rounded-lg p-3 border"
                    >
                      {/* Image Preview */}
                      {isImageFile(file.type) && (
                        <div className="mb-2">
                          <img
                            src={createImagePreview(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded"
                            onLoad={(e) => {
                              // Clean up object URL to prevent memory leaks
                              setTimeout(() => {
                                URL.revokeObjectURL(e.target.src);
                              }, 1000);
                            }}
                          />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {isImageFile(file.type) ? (
                              <Image className="w-4 h-4 text-blue-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} •{" "}
                              {isImageFile(file.type) ? "Image" : "Document"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          disabled={submitting}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Ready Indicator */}
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Clock className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Files Ready Notice */}
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-700">
                    📁 {selectedFiles.length} file(s) ready for upload. Files
                    will be uploaded after event creation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress.uploading && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Creating event and uploading files...
                </span>
                <span className="text-sm text-blue-600">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (uploadProgress.current / uploadProgress.total) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Please wait while we process your event...
              </p>
            </div>
          )}

          {/* Submission Progress */}
          {submitting && !uploadProgress.uploading && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">
                  {selectedFiles.length > 0
                    ? "Creating event..."
                    : "Creating event..."}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <Users className="w-4 h-4 inline mr-1" />
              Your event will be visible to all school members
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.titre.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>
                  {submitting
                    ? selectedFiles.length > 0
                      ? "Creating & Uploading..."
                      : "Creating..."
                    : selectedFiles.length > 0
                    ? `Create Event (${selectedFiles.length} files)`
                    : "Create Event"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;

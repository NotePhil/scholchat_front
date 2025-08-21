import React, { useState } from "react";
import {
  X,
  Calendar,
  Upload,
  ImageIcon,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";

const CreateEventModal = ({
  show,
  onClose,
  canPost,
  onCreateEvent,
  isDark,
}) => {
  const [eventForm, setEventForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    etat: "A_VENIR", // Use correct enum value
    heureDebut: "",
    heureFin: "",
    medias: null,
    mediaPreview: null,
  });
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fix: Use the correct enum values that match your backend EtatEvenement enum
  const eventStatusOptions = [
    { value: "A_VENIR", label: "Upcoming" },
    { value: "EN_COURS", label: "In Progress" },
    { value: "TERMINE", label: "Completed" },
    { value: "ANNULE", label: "Cancelled" },
  ];

  const handleEventFormChange = (field, value) => {
    setEventForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMediaSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        throw new Error("Only JPEG, PNG images or PDF files are allowed");
      }

      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }

      let previewUrl = null;
      if (file.type.startsWith("image/")) {
        previewUrl = await createImagePreview(file);
      }

      setEventForm((prev) => ({
        ...prev,
        medias: file,
        mediaPreview: previewUrl,
      }));
    } catch (error) {
      setError(error.message);
      event.target.value = "";
    }
  };

  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = () => {
    setEventForm((prev) => ({
      ...prev,
      medias: null,
      mediaPreview: null,
    }));
  };

  const resetEventForm = () => {
    setEventForm({
      titre: "",
      description: "",
      lieu: "",
      etat: "A_VENIR", // Use correct enum value
      heureDebut: "",
      heureFin: "",
      medias: null,
      mediaPreview: null,
    });
  };

  const validateEventForm = () => {
    const { titre, description, lieu, heureDebut, heureFin } = eventForm;

    if (!titre.trim()) {
      setError("Event title is required");
      return false;
    }

    if (titre.trim().length < 5) {
      setError("Event title must be at least 5 characters");
      return false;
    }

    if (!description.trim()) {
      setError("Event description is required");
      return false;
    }

    if (description.trim().length < 10) {
      setError("Event description must be at least 10 characters");
      return false;
    }

    if (!lieu.trim()) {
      setError("Event location is required");
      return false;
    }

    if (!heureDebut) {
      setError("Start time is required");
      return false;
    }

    if (!heureFin) {
      setError("End time is required");
      return false;
    }

    if (new Date(heureDebut) >= new Date(heureFin)) {
      setError("End time must be after start time");
      return false;
    }

    return true;
  };

  const uploadMedia = async (file) => {
    try {
      const media = await activityFeedService.uploadMedia(
        file,
        file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
        "EVENT"
      );
      return media;
    } catch (error) {
      console.error("❌ Failed to upload media:", error);
      throw new Error("Failed to upload media. Please try again.");
    }
  };

  const handleCreateEvent = async () => {
    if (!canPost) {
      setError("You don't have permission to create events");
      return;
    }

    if (!validateEventForm()) {
      return;
    }

    setPostLoading(true);
    setError(null);

    try {
      const validProfessorId = activityFeedService.getValidProfessorId();
      let mediaData = null;

      if (eventForm.medias) {
        mediaData = await uploadMedia(eventForm.medias);
      }

      const eventData = {
        titre: eventForm.titre.trim(),
        description: eventForm.description.trim(),
        lieu: eventForm.lieu.trim(),
        etat: eventForm.etat, // This will now be a valid enum value
        heureDebut: new Date(eventForm.heureDebut).toISOString(),
        heureFin: new Date(eventForm.heureFin).toISOString(),
        createurId: validProfessorId,
        participantsIds: [],
        medias: mediaData ? [mediaData] : [],
      };

      console.log("Sending event data:", eventData);

      const success = await onCreateEvent(eventData);
      if (success) {
        resetEventForm();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      if (error.message.includes("expired") || error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.clear();
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else if (error.message.includes("Professeur introuvable")) {
        setError("Professor not found. Please check your login status.");
      } else if (error.message.includes("enum")) {
        setError("Invalid event status. Please try again.");
      } else {
        setError(error.message || "Failed to create event. Please try again.");
      }
    } finally {
      setPostLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Create New Event</h3>
          <button
            onClick={() => {
              onClose();
              resetEventForm();
              setError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={eventForm.titre}
              onChange={(e) => handleEventFormChange("titre", e.target.value)}
              placeholder="Enter event title (min 5 characters)"
              className={`w-full px-4 py-2 border rounded-lg ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              disabled={postLoading}
              minLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) =>
                handleEventFormChange("description", e.target.value)
              }
              placeholder="Enter event description (min 10 characters)"
              rows="4"
              className={`w-full px-4 py-2 border rounded-lg resize-none ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              disabled={postLoading}
              minLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={eventForm.lieu}
              onChange={(e) => handleEventFormChange("lieu", e.target.value)}
              placeholder="Enter event location"
              className={`w-full px-4 py-2 border rounded-lg ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              disabled={postLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={eventForm.etat}
              onChange={(e) => handleEventFormChange("etat", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${
                isDark
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              disabled={postLoading}
            >
              {eventStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={eventForm.heureDebut}
                onChange={(e) =>
                  handleEventFormChange("heureDebut", e.target.value)
                }
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
                disabled={postLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={eventForm.heureFin}
                onChange={(e) =>
                  handleEventFormChange("heureFin", e.target.value)
                }
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDark
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
                disabled={postLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Media (JPEG, PNG or PDF - max 5MB)
            </label>
            <div className="space-y-2">
              {!eventForm.medias ? (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleMediaSelect}
                    disabled={postLoading}
                    className="hidden"
                  />
                  <div
                    className={`flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors ${
                      postLoading ? "opacity-50" : ""
                    }`}
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      Click to upload file (JPEG, PNG or PDF)
                    </span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {eventForm.medias.type.startsWith("image/") ? (
                      <>
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {eventForm.medias.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(eventForm.medias.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        {eventForm.mediaPreview && (
                          <img
                            src={eventForm.mediaPreview}
                            alt="Preview"
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-red-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {eventForm.medias.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(eventForm.medias.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={removeMedia}
                    disabled={postLoading}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => {
              onClose();
              resetEventForm();
              setError(null);
            }}
            disabled={postLoading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateEvent}
            disabled={postLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {postLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {postLoading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;

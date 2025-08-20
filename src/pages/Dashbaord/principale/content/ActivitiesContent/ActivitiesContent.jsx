import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Share2,
  MoreVertical,
  Send,
  Users,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
  X,
  Plus,
  Circle,
  Filter,
  UserPlus,
  Search,
  Loader2,
  MapPin,
  Clock,
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
const ActivitiesContent = ({ label = "Users", userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    etat: "A_VENIR",
    heureDebut: "",
    heureFin: "",
    medias: null,
    mediaPreview: null,
  });

  const activitiesPerPage = 5;

  // Theme settings
  const isDark = false;
  const currentTheme = "blue";
  const colorSchemes = {
    blue: { primary: "#3B82F6" },
    green: { primary: "#10B981" },
    purple: { primary: "#8B5CF6" },
    red: { primary: "#EF4444" },
  };

  const filterOptions = [
    { label: "All Updates", value: "all", icon: Users },
    { label: "Events", value: "event", icon: Calendar },
    { label: "Achievements", value: "achievement", icon: Award },
    { label: "Academic", value: "academic", icon: BookOpen },
    { label: "Announcements", value: "announcement", icon: AlertCircle },
  ];

  const eventStatusOptions = [
    { value: "A_VENIR", label: "Upcoming" },
    { value: "EN_COURS", label: "In Progress" },
    { value: "TERMINE", label: "Completed" },
    { value: "ANNULE", label: "Cancelled" },
  ];

  // Check if user can post (only admin and professor)
  const canPost = ["admin", "professor"].includes(userRole);

  // Initialize current user using service method
  useEffect(() => {
    const user = activityFeedService.getCurrentUser();
    if (user) {
      setCurrentUser({
        ...user,
        avatar: "/api/placeholder/48/48",
      });
    }
  }, [userRole]);

  // Fetch activities from API using service
  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityFeedService.getActivities(activeFilter);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setError("Failed to load activities. Please try again.");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

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
      // Check file type and size
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        throw new Error("Only JPEG, PNG images or PDF files are allowed");
      }

      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }

      // Create preview for images
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
      etat: "A_VENIR",
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

      // Upload media if present
      if (eventForm.medias) {
        mediaData = await uploadMedia(eventForm.medias);
      }

      const eventData = {
        titre: eventForm.titre.trim(),
        description: eventForm.description.trim(),
        lieu: eventForm.lieu.trim(),
        etat: eventForm.etat,
        heureDebut: new Date(eventForm.heureDebut).toISOString(),
        heureFin: new Date(eventForm.heureFin).toISOString(),
        createurId: validProfessorId,
        participantsIds: [],
        medias: mediaData ? [mediaData] : [],
      };

      const newEvent = await activityFeedService.createEvent(eventData);

      if (newEvent) {
        const newActivity = activityFeedService.transformEventsToActivities([
          newEvent,
        ])[0];
        setActivities([newActivity, ...activities]);

        resetEventForm();
        setShowCreateEventModal(false);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      if (error.message.includes("expired") || error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.clear();
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else {
        setError(error.message || "Failed to create event. Please try again.");
      }
    } finally {
      setPostLoading(false);
    }
  };

  const handleDownloadMedia = (mediaUrl, fileName = "document") => {
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format timestamp helper
  const formatTimestamp = (dateTime) => {
    return activityFeedService.formatTimestamp(dateTime);
  };

  const formatEventDateTime = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "A_VENIR":
        return "bg-blue-100 text-blue-800";
      case "EN_COURS":
        return "bg-green-100 text-green-800";
      case "TERMINE":
        return "bg-gray-100 text-gray-800";
      case "ANNULE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    const option = eventStatusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  // Components
  const UserAvatar = ({ user }) => (
    <img
      src={user?.avatar || "/api/placeholder/48/48"}
      alt={user?.name || "User"}
      className="w-12 h-12 rounded-full object-cover"
      onError={(e) => {
        e.target.src = "/api/placeholder/48/48";
      }}
    />
  );

  const ActivityTypeBadge = ({ type, eventDetails, channelDetails }) => {
    const getBadgeInfo = () => {
      switch (type) {
        case "event":
          return {
            icon: Calendar,
            label: "Event",
            color: "bg-blue-100 text-blue-800",
          };
        case "channel":
          return {
            icon: BookOpen,
            label: "Channel",
            color: "bg-green-100 text-green-800",
          };
        default:
          return {
            icon: MessageCircle,
            label: "Post",
            color: "bg-gray-100 text-gray-800",
          };
      }
    };

    const { icon: Icon, label, color } = getBadgeInfo();

    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        <Icon className="w-3 h-3" />
        {label}
      </div>
    );
  };

  const CreateEventModal = () => {
    if (!showCreateEventModal) return null;

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
                setShowCreateEventModal(false);
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
            {/* Event Title */}
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

            {/* Event Description */}
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

            {/* Event Location */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Location *
              </label>
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

            {/* Event Status */}
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

            {/* Date and Time */}
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

            {/* Media Upload */}
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

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={() => {
                setShowCreateEventModal(false);
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

  // Filter activities based on search term
  const searchFilteredActivities = activities.filter(
    (activity) =>
      activity.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.eventDetails?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      activity.channelDetails?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = searchFilteredActivities.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );
  const totalPages = Math.ceil(
    searchFilteredActivities.length / activitiesPerPage
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colorSchemes[currentTheme].primary }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{label}</h2>

        {canPost && (
          <button
            onClick={() => setShowCreateEventModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {error && !showCreateEventModal && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
            <button
              onClick={() => {
                setError(null);
                fetchActivities();
              }}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="border rounded-md px-3 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Feed section */}
      <div className="space-y-6">
        {/* Filter Options */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setActiveFilter(filterOption.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all transform hover:scale-105 ${
                activeFilter === filterOption.value
                  ? `shadow-lg`
                  : `${isDark ? "bg-gray-800" : "bg-gray-100"}`
              }`}
              style={
                activeFilter === filterOption.value
                  ? {
                      backgroundColor: `${colorSchemes[currentTheme].primary}20`,
                      color: colorSchemes[currentTheme].primary,
                    }
                  : {}
              }
            >
              <filterOption.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{filterOption.label}</span>
            </button>
          ))}
        </div>

        {/* Activities List */}
        <div className="space-y-6">
          {currentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No activities found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? `No activities match "${searchTerm}"`
                  : canPost
                  ? "Create the first event to get started!"
                  : "No events available at the moment."}
              </p>
            </div>
          ) : (
            currentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`rounded-xl p-6 shadow-lg transform transition-all hover:shadow-xl ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                {/* Activity Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <UserAvatar user={activity.user} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {activity.user?.name || "Anonymous"}
                        </h3>
                        <ActivityTypeBadge
                          type={activity.type}
                          eventDetails={activity.eventDetails}
                          channelDetails={activity.channelDetails}
                        />
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {activity.user?.role || "User"} • {activity.timestamp}
                      </p>
                    </div>
                  </div>
                  <button
                    className={`${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } hover:text-gray-700`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Details */}
                {activity.eventDetails && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-blue-900 text-lg">
                        {activity.eventDetails.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          activity.eventDetails.status
                        )}`}
                      >
                        {getStatusLabel(activity.eventDetails.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{activity.eventDetails.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatEventDateTime(activity.eventDetails.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Ends:{" "}
                          {formatEventDateTime(activity.eventDetails.endTime)}
                        </span>
                      </div>
                      {activity.eventDetails.participantsCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {activity.eventDetails.participantsCount}{" "}
                            participants
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Channel Details */}
                {activity.channelDetails && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      {activity.channelDetails.name}
                    </h4>
                    <div className="text-sm text-green-700 mt-1">
                      <span>📚 {activity.channelDetails.className}</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <p className="mb-4 whitespace-pre-wrap text-gray-700">
                  {activity.content}
                </p>

                {/* Media Section */}
                {activity.media && activity.media.length > 0 && (
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {activity.media[0].contentType?.startsWith("image/") ? (
                          <>
                            <ImageIcon className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Event Image
                              </p>
                              <p className="text-sm text-gray-500">
                                Click to view
                              </p>
                            </div>
                            <img
                              src={activity.media[0].filePath}
                              alt="Event"
                              className="w-12 h-12 object-cover rounded"
                            />
                          </>
                        ) : (
                          <>
                            <FileText className="w-8 h-8 text-red-500" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Event Document
                              </p>
                              <p className="text-sm text-gray-500">
                                {activity.media[0].contentType.includes("pdf")
                                  ? "PDF"
                                  : "Document"}{" "}
                                • Click to download
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          activityFeedService
                            .getMediaDownloadUrl(activity.media[0].filePath)
                            .then((downloadUrl) => {
                              if (downloadUrl) {
                                window.open(downloadUrl, "_blank");
                              }
                            })
                            .catch((error) => {
                              console.error(
                                "Failed to get download URL:",
                                error
                              );
                              setError(
                                "Failed to download file. Please try again."
                              );
                            });
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {activity.media[0].contentType?.startsWith("image/") ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {activity.media[0].contentType?.startsWith("image/")
                          ? "View"
                          : "Download"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-6">
                    <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                      <ThumbsUp className="w-5 h-5" />
                      <span>{activity.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span>
                        {activity.commentsCount ||
                          activity.comments?.length ||
                          0}
                      </span>
                    </button>
                  </div>
                  <button className="hover:text-blue-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <CommentSection
                  comments={activity.comments || []}
                  activityId={activity.id}
                />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50 disabled:hover:bg-white"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      currentPage === number
                        ? "bg-blue-500 text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50 disabled:hover:bg-white"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal />
    </div>
  );
};

// CommentSection Component
const CommentSection = ({ comments, activityId }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      // Here you would normally call an API to submit the comment
      // For now, we'll just simulate it
      console.log(
        "Submitting comment:",
        newComment,
        "for activity:",
        activityId
      );

      // Reset the comment input
      setNewComment("");

      // In a real app, you'd update the comments list here
      // For now, we'll just show a success message
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Toggle Comments Button */}
      {comments.length > 0 && (
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-gray-600 hover:text-gray-800 mb-3"
        >
          {showComments ? "Hide" : "Show"} {comments.length} comment
          {comments.length !== 1 ? "s" : ""}
        </button>
      )}

      {/* Comments List */}
      {showComments && (
        <div className="space-y-3 mb-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex space-x-3">
              <img
                src={comment.user?.avatar || "/api/placeholder/32/32"}
                alt={comment.user?.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user?.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp || "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex space-x-3">
        <img
          src="/api/placeholder/32/32"
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submittingComment}
            required
            minLength={1}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submittingComment}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {submittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivitiesContent;

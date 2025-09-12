import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Users,
  Clock,
  Calendar,
  Send,
  Download,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { minioS3Service } from "../../../../../services/minioS3";
// Mock services for demonstration
const mockActivityFeedService = {
  formatTimestamp: (timestamp) => {
    if (!timestamp) return "Unknown time";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  },
  getStatusLabel: (status) => {
    const labels = {
      PLANIFIE: "Planned",
      EN_COURS: "In Progress",
      TERMINE: "Completed",
      ANNULE: "Cancelled",
    };
    return labels[status] || "Unknown";
  },
};

const mockMinioService = {
  isImageFile: (contentType) => contentType?.startsWith("image/"),
  isDocumentFile: (contentType) =>
    contentType &&
    !contentType.startsWith("image/") &&
    !contentType.startsWith("video/"),
  formatFileSize: (bytes) => {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
  generateDownloadUrl: async (mediaId) => ({
    downloadUrl: `https://picsum.photos/800/600?random=${mediaId}`,
    fileName: `image-${mediaId}.jpg`,
    contentType: "image/jpeg",
  }),
  generateDownloadUrlByPath: async (filePath) => ({
    downloadUrl: `https://picsum.photos/800/600?random=${filePath
      .split("/")
      .pop()}`,
    fileName: filePath.split("/").pop(),
    contentType: "image/jpeg",
  }),
  uploadMultipleFiles: async (files) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      successful: files.map((f) => ({ fileName: f.name, success: true })),
      failed: [],
      successCount: files.length,
      failureCount: 0,
    };
  },
  downloadFile: async (mediaId) => {
    console.log("Downloading:", mediaId);
    return { success: true };
  },
  downloadFileByPath: async (filePath) => {
    console.log("Downloading:", filePath);
    return { success: true };
  },
};

const ActivityDisplay = ({
  activity,
  onReaction = () => {},
  onRemoveReaction = () => {},
  onComment = () => {},
  onShare = () => {},
  onJoinEvent = () => {},
  onMediaDownload = () => {},
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mediaLoadingStates, setMediaLoadingStates] = useState(new Map());
  const [mediaErrors, setMediaErrors] = useState(new Set());
  const [mediaUrls, setMediaUrls] = useState(new Map());
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(new Map());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showUploadButton, setShowUploadButton] = useState(true);
  const fileInputRef = useRef(null);
  const [currentUser] = useState({
    name: "Anonymous User",
    role: "user",
  });

  const reactions = [
    {
      type: "like",
      emoji: "👍",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      icon: ThumbsUp,
    },
    {
      type: "love",
      emoji: "❤️",
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
      icon: Heart,
    },
    {
      type: "haha",
      emoji: "😂",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      hoverBg: "hover:bg-yellow-100",
      icon: Laugh,
    },
    {
      type: "wow",
      emoji: "😮",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      icon: Frown,
    },
    {
      type: "sad",
      emoji: "😢",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      hoverBg: "hover:bg-indigo-100",
      icon: Frown,
    },
    {
      type: "angry",
      emoji: "😠",
      color: "text-red-700",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
      icon: Angry,
    },
  ];

  // Initialize media loading states and generate URLs
  useEffect(() => {
    if (activity?.media && activity.media.length > 0) {
      const initialStates = new Map();
      activity.media.forEach((media) => {
        const mediaKey = media.id || media.filePath;
        initialStates.set(mediaKey, false);
        generateMediaUrl(media);
      });
      setMediaLoadingStates(initialStates);
    }
  }, [activity?.media]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setShowUploadButton(false);
    setUploadingFiles(files);

    try {
      const uploadResults = await mockMinioService.uploadMultipleFiles(files);
      console.log("Upload successful:", uploadResults);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        setUploadingFiles([]);
        setShowUploadButton(true);
        alert("Files uploaded successfully! Refresh to see them.");
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadingFiles([]);
      setShowUploadButton(true);
      alert("Upload failed: " + error.message);
    }
  };

  const generateMediaUrl = async (mediaItem) => {
    try {
      const mediaKey = mediaItem.id || mediaItem.filePath;

      if (mediaUrls.has(mediaKey) || mediaItem.downloadUrl) {
        return;
      }

      let downloadData;
      if (mediaItem.id) {
        downloadData = await mockMinioService.generateDownloadUrl(mediaItem.id);
      } else if (mediaItem.filePath) {
        downloadData = await mockMinioService.generateDownloadUrlByPath(
          mediaItem.filePath
        );
      }

      if (downloadData?.downloadUrl) {
        setMediaUrls((prev) =>
          new Map(prev).set(mediaKey, {
            downloadUrl: downloadData.downloadUrl,
            fileName: downloadData.fileName || mediaItem.fileName,
            contentType: downloadData.contentType || mediaItem.contentType,
          })
        );
      }
    } catch (error) {
      console.error("Error generating media URL:", error);
      const mediaKey = mediaItem.id || mediaItem.filePath;
      setMediaErrors((prev) => new Set([...prev, mediaKey]));
    }
  };

  const handleReactionClick = async (reactionType) => {
    try {
      if (activity.userReaction === reactionType) {
        await onRemoveReaction(activity.id);
      } else {
        await onReaction(activity.id, reactionType);
      }
      setShowReactionPicker(false);
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      setIsCommenting(true);
      try {
        await onComment(activity.id, commentText.trim());
        setCommentText("");
      } catch (error) {
        console.error("Error posting comment:", error);
      } finally {
        setIsCommenting(false);
      }
    }
  };

  const handleShare = async () => {
    try {
      await onShare(activity.id);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleJoin = async () => {
    try {
      await onJoinEvent(activity.id);
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const handleDownloadMedia = async (mediaItem) => {
    try {
      const mediaKey = mediaItem.id || mediaItem.filePath;
      setMediaLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(mediaKey, true);
        return newMap;
      });

      if (onMediaDownload) {
        await onMediaDownload(mediaItem);
      } else {
        if (mediaItem.id) {
          await mockMinioService.downloadFile(mediaItem.id);
        } else if (mediaItem.filePath) {
          await mockMinioService.downloadFileByPath(mediaItem.filePath);
        } else {
          throw new Error("No valid media identifier found");
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      const mediaKey = mediaItem.id || mediaItem.filePath;
      setMediaErrors((prev) => new Set([...prev, mediaKey]));
    } finally {
      const mediaKey = mediaItem.id || mediaItem.filePath;
      setMediaLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(mediaKey, false);
        return newMap;
      });
    }
  };

  const retryMediaLoad = async (mediaItem) => {
    const mediaKey = mediaItem.id || mediaItem.filePath;
    setMediaErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(mediaKey);
      return newSet;
    });

    setMediaUrls((prev) => {
      const newMap = new Map(prev);
      newMap.delete(mediaKey);
      return newMap;
    });

    await generateMediaUrl(mediaItem);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === activity?.media?.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? activity?.media?.length - 1 : prev - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const formatTime = (timestamp) => {
    try {
      return mockActivityFeedService.formatTimestamp(timestamp);
    } catch (error) {
      return "Unknown time";
    }
  };

  const getTotalReactions = () => {
    if (!activity?.reactions) return 0;
    return Object.values(activity.reactions).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const getTopReactions = () => {
    if (!activity?.reactions) return [];
    return Object.entries(activity.reactions)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const getUserReaction = () => {
    return reactions.find((r) => r.type === activity?.userReaction);
  };

  const renderEventDetails = () => {
    if (activity?.type !== "event" || !activity?.eventDetails) return null;

    const getStatusStyle = (status) => {
      const statusStyles = {
        PLANIFIE: "bg-blue-100 text-blue-800 border-blue-200",
        EN_COURS: "bg-green-100 text-green-800 border-green-200",
        TERMINE: "bg-gray-100 text-gray-800 border-gray-200",
        ANNULE: "bg-red-100 text-red-800 border-red-200",
      };
      return statusStyles[status] || statusStyles.PLANIFIE;
    };

    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 mt-3 md:mt-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1 md:mb-2 truncate">
              {activity.eventDetails.title || "Untitled Event"}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-3 md:mb-4 text-sm md:text-base line-clamp-3 md:line-clamp-none">
              {activity.eventDetails.description || "No description available"}
            </p>
          </div>
          <span
            className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border ml-2 flex-shrink-0 ${getStatusStyle(
              activity.eventDetails.status
            )}`}
          >
            {mockActivityFeedService.getStatusLabel(
              activity.eventDetails.status || "PLANIFIE"
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center space-x-2 md:space-x-3 text-gray-700">
            <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-500">Location</p>
              <p className="font-semibold text-sm md:text-base truncate">
                {activity.eventDetails.location || "TBA"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 text-gray-700">
            <div className="bg-green-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-500">Participants</p>
              <p className="font-semibold text-sm md:text-base">
                {activity.eventDetails.participantsCount || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 text-gray-700">
            <div className="bg-purple-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-500">Start Time</p>
              <p className="font-semibold text-sm md:text-base truncate">
                {activity.eventDetails.startTime
                  ? new Date(
                      activity.eventDetails.startTime
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "TBA"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={activity.eventDetails.hasJoined}
          className={`w-full py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${
            activity.eventDetails.hasJoined
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {activity.eventDetails.hasJoined ? "Already Joined" : "Join Event"}
        </button>
      </div>
    );
  };

  const renderMediaUpload = () => {
    return (
      <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {showUploadButton && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Images or Documents
          </button>
        )}

        {uploadingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{
                        width: `${uploadProgress.get(file.name) || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMediaCarousel = () => {
    if (!activity?.media || activity.media.length === 0) return null;

    return (
      <div className="mt-4 relative">
        {/* Main carousel container with proper aspect ratio and centering */}
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
          {activity.media.map((media, index) => (
            <div
              key={media?.id || media?.filePath || index}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <MediaItem
                mediaItem={media}
                onDownload={handleDownloadMedia}
                onViewImage={setSelectedImage}
                onRetry={retryMediaLoad}
                mediaLoadingStates={mediaLoadingStates}
                mediaErrors={mediaErrors}
                mediaUrls={mediaUrls}
                isCarousel={true}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {activity.media.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {activity.media.length > 1 && (
          <div className="flex justify-center mt-3 space-x-2">
            {activity.media.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Safe render with null checks
  if (!activity) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-center text-gray-500">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span className="text-sm md:text-base">
            Activity data not available
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="p-4 md:p-6 pb-3 md:pb-4">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm md:text-lg flex-shrink-0">
              {activity.user?.name?.charAt(0) || currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                    {activity.user?.name || currentUser.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                    <span>{formatTime(activity.timestamp)}</span>
                    <span>•</span>
                    <span className="capitalize truncate">
                      {activity.user?.role || currentUser.role}
                    </span>
                    {activity.type === "event" && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      </>
                    )}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1.5 md:p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 pb-3 md:pb-4">
          <p className="text-gray-800 text-sm md:text-lg leading-relaxed break-words">
            {activity.content || ""}
          </p>
          {renderMediaCarousel()}
          {renderEventDetails()}
          {renderMediaUpload()}
        </div>

        {/* Reaction Summary */}
        {getTotalReactions() > 0 && (
          <div className="px-4 md:px-6 pb-2 md:pb-3">
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {getTopReactions().map(([type, count]) => {
                    const reaction = reactions.find((r) => r.type === type);
                    return (
                      <div
                        key={type}
                        className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center text-xs md:text-sm border border-gray-200"
                      >
                        {reaction?.emoji || "👍"}
                      </div>
                    );
                  })}
                </div>
                <span>{getTotalReactions()}</span>
              </div>
              <div className="flex items-center space-x-3 md:space-x-4">
                {(activity.commentsCount || 0) > 0 && (
                  <span className="truncate">
                    {activity.commentsCount} comments
                  </span>
                )}
                {(activity.shares || 0) > 0 && (
                  <span className="truncate">{activity.shares} shares</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onMouseEnter={() => setShowReactionPicker(true)}
                onMouseLeave={() =>
                  setTimeout(() => setShowReactionPicker(false), 500)
                }
                onClick={() =>
                  handleReactionClick(activity.userReaction || "like")
                }
                className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-200 ${
                  activity.isLiked
                    ? "text-red-600 bg-red-50 ring-1 ring-red-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
                }`}
              >
                {activity.isLiked ? (
                  <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current text-red-600" />
                ) : (
                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                )}
                <span className="font-semibold text-xs md:text-sm">
                  {activity.isLiked ? "Liked" : "Like"}
                </span>
              </button>

              {/* Reaction Picker */}
              {showReactionPicker && (
                <div
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 p-2 flex space-x-1 z-10"
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReactionClick(reaction.type)}
                      className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-125"
                      title={reaction.type}
                    >
                      <span className="text-lg md:text-2xl">
                        {reaction.emoji}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-semibold text-xs md:text-sm">Comment</span>
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-colors ${
                activity.isShared
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-semibold text-xs md:text-sm">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 bg-gray-50">
            {/* Comment Input */}
            <div className="p-4 md:p-6 pb-3 md:pb-4">
              <form
                onSubmit={handleCommentSubmit}
                className="flex space-x-2 md:space-x-3"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0 text-sm md:text-base">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a thoughtful comment..."
                    className="w-full bg-white border border-gray-200 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isCommenting}
                    className="absolute right-1.5 md:right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 text-white p-1.5 md:p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isCommenting ? (
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            {activity.comments && activity.comments.length > 0 && (
              <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3 md:space-y-4">
                {activity.comments.map((comment) => (
                  <div
                    key={comment?.id}
                    className="flex space-x-2 md:space-x-3 group"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs md:text-sm flex-shrink-0">
                      {comment?.user?.name?.charAt(0) ||
                        currentUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs md:text-sm text-gray-900 truncate">
                            {comment?.user?.name || currentUser.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(comment?.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-800 text-xs md:text-sm leading-relaxed break-words">
                          {comment?.content || ""}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 md:space-x-4 mt-1.5 md:mt-2 ml-3 md:ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="text-xs text-gray-500 hover:text-blue-600 font-semibold transition-colors duration-200">
                          Like
                        </button>
                        <button className="text-xs text-gray-500 hover:text-blue-600 font-semibold transition-colors duration-200">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty comments state */}
            {(!activity.comments || activity.comments.length === 0) && (
              <div className="px-4 md:px-6 pb-4 md:pb-6 text-center">
                <p className="text-gray-500 text-xs md:text-sm italic">
                  Be the first to comment on this post
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={handleDownloadMedia}
        />
      )}
    </>
  );
};

// Enhanced MediaItem component with improved URL handling and centered display
const MediaItem = ({
  mediaItem,
  onDownload,
  onViewImage,
  onRetry,
  mediaLoadingStates,
  mediaErrors,
  mediaUrls,
  isCarousel = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const mediaKey = mediaItem?.id || mediaItem?.filePath;
  const isLoading = mediaLoadingStates?.get(mediaKey) || false;
  const hasError = mediaErrors?.has(mediaKey) || imageError;

  // Get URL from multiple sources
  const getImageUrl = () => {
    const mediaData = mediaUrls?.get(mediaKey);
    return (
      mediaData?.downloadUrl ||
      mediaItem?.downloadUrl ||
      mediaItem?.url ||
      "/api/placeholder/400/300"
    );
  };

  const imageUrl = getImageUrl();

  const handleImageClick = () => {
    if (
      minioS3Service.isImageFile(mediaItem?.contentType) &&
      !hasError &&
      !isLoading
    ) {
      const mediaData = mediaUrls?.get(mediaKey);
      onViewImage({
        ...mediaItem,
        url: imageUrl,
        fileName: mediaData?.fileName || mediaItem?.fileName,
        downloadUrl: imageUrl,
      });
    }
  };

  const handleRetryClick = (e) => {
    e.stopPropagation();
    setImageError(false);
    onRetry(mediaItem);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload(mediaItem);
  };

  if (!mediaItem) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
      </div>
    );
  }

  const isImage = minioS3Service.isImageFile(mediaItem.contentType);
  const isDocument = minioS3Service.isDocumentFile(mediaItem.contentType);

  return (
    <div
      className={`relative group w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-gray-100 flex items-center justify-center`}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-3 md:p-4">
          <AlertCircle className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" />
          <span className="text-xs md:text-sm mb-1 md:mb-2 text-center">
            Failed to load
          </span>
          <button
            onClick={handleRetryClick}
            className="flex items-center space-x-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : isImage ? (
        <>
          <img
            src={imageUrl}
            alt={mediaItem.fileName || "Media"}
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={handleImageClick}
            onError={(e) => {
              console.error("Image load error for:", imageUrl);
              setImageError(true);
              e.target.src = "/api/placeholder/400/300";
            }}
            onLoad={() => setImageError(false)}
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 md:space-x-2">
              <button
                onClick={handleImageClick}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-1.5 md:p-2 rounded-full transition-all duration-200 shadow-lg"
                title="View full size"
              >
                <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={handleDownloadClick}
                disabled={isLoading}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-1.5 md:p-2 rounded-full transition-all duration-200 shadow-lg disabled:opacity-50"
                title="Download"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-gray-800 border-t-transparent"></div>
                ) : (
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : isDocument ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <FileText className="w-16 h-16 md:w-20 md:h-20 text-blue-500 mb-2" />
          <p className="text-sm md:text-base font-medium text-center text-gray-800 mb-2 truncate w-full">
            {mediaItem.fileName || "Document"}
          </p>
          {mediaItem.fileSize && (
            <p className="text-xs text-gray-500 mb-4">
              {minioS3Service.formatFileSize(mediaItem.fileSize)}
            </p>
          )}
          <button
            onClick={handleDownloadClick}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      ) : null}

      {/* File info overlay for images */}
      {isImage && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs md:text-sm font-medium truncate">
            {mediaItem.fileName || "Media file"}
          </p>
          {mediaItem.fileSize && (
            <p className="text-gray-300 text-xs">
              {minioS3Service.formatFileSize(mediaItem.fileSize)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Image lightbox component with mobile optimization and centered display
const ImageLightbox = ({ image, onClose, onDownload }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <img
          src={image?.url || image?.downloadUrl || "/api/placeholder/800/600"}
          alt={image?.fileName || "Image"}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            e.target.src = "/api/placeholder/800/600";
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 md:top-4 right-2 md:right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Download button */}
        <button
          onClick={() => onDownload(image)}
          className="absolute top-2 md:top-4 right-12 md:right-16 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <Download className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Image info */}
        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black bg-opacity-50 text-white p-2 md:p-3 rounded-lg max-w-xs md:max-w-sm">
          <p className="font-medium text-sm md:text-base truncate">
            {image?.fileName || "Image"}
          </p>
          {image?.fileSize && (
            <p className="text-xs md:text-sm text-gray-300">
              {minioS3Service.formatFileSize(image.fileSize)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDisplay;

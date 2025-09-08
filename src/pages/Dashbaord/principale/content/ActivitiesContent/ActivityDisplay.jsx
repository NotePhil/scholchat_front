import React, { useState, useEffect } from "react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";
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
} from "lucide-react";

const ActivityDisplay = ({
  activity,
  onReaction,
  onRemoveReaction,
  onComment,
  onShare,
  onJoinEvent,
  onMediaDownload,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mediaLoadingStates, setMediaLoadingStates] = useState(new Map());
  const [mediaErrors, setMediaErrors] = useState(new Set());
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

  // Initialize media loading states
  useEffect(() => {
    if (activity?.media && activity.media.length > 0) {
      const initialStates = new Map();
      activity.media.forEach((media) => {
        const mediaKey = media.id || media.filePath;
        initialStates.set(mediaKey, false);
      });
      setMediaLoadingStates(initialStates);
    }
  }, [activity?.media]);

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
      setMediaLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(mediaItem.id || mediaItem.filePath, true);
        return newMap;
      });

      if (onMediaDownload) {
        await onMediaDownload(mediaItem);
      } else {
        // Fallback to direct service call
        if (mediaItem.id) {
          await minioS3Service.downloadFile(mediaItem.id);
        } else if (mediaItem.filePath) {
          await minioS3Service.downloadFileByPath(mediaItem.filePath);
        } else {
          throw new Error("No valid media identifier found");
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      setMediaErrors(
        (prev) => new Set([...prev, mediaItem.id || mediaItem.filePath])
      );
    } finally {
      setMediaLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(mediaItem.id || mediaItem.filePath, false);
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

    try {
      let downloadUrl = null;

      if (mediaItem.id) {
        const downloadData = await minioS3Service.generateDownloadUrl(
          mediaItem.id
        );
        downloadUrl = downloadData.downloadUrl;
      } else if (mediaItem.filePath) {
        const downloadData = await minioS3Service.generateDownloadUrlByPath(
          mediaItem.filePath
        );
        downloadUrl = downloadData.downloadUrl;
      }

      // Force a re-render by updating the activity
      // This would ideally be handled by the parent component
      console.log("Media retry successful, new URL:", downloadUrl);
    } catch (error) {
      console.error("Retry failed:", error);
      setMediaErrors((prev) => new Set([...prev, mediaKey]));
    }
  };

  const formatTime = (timestamp) => {
    try {
      return activityFeedService.formatTimestamp(timestamp);
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mt-4 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              {activity.eventDetails.title || "Untitled Event"}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {activity.eventDetails.description || "No description available"}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(
              activity.eventDetails.status
            )}`}
          >
            {activityFeedService.getStatusLabel(
              activity.eventDetails.status || "PLANIFIE"
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 text-gray-700">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-semibold">
                {activity.eventDetails.location || "TBA"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <p className="font-semibold">
                {activity.eventDetails.participantsCount || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="font-semibold">
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
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
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

  const renderMedia = () => {
    if (!activity?.media || activity.media.length === 0) return null;

    return (
      <div className="mt-4">
        {activity.media.length === 1 ? (
          <MediaItem
            mediaItem={activity.media[0]}
            onDownload={handleDownloadMedia}
            onViewImage={setSelectedImage}
            onRetry={retryMediaLoad}
            mediaLoadingStates={mediaLoadingStates}
            mediaErrors={mediaErrors}
          />
        ) : (
          <div
            className={`grid gap-2 rounded-2xl overflow-hidden ${
              activity.media.length === 2
                ? "grid-cols-2"
                : activity.media.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {activity.media.slice(0, 4).map((media, index) => (
              <div
                key={media?.id || media?.filePath || index}
                className="relative"
              >
                <MediaItem
                  mediaItem={media}
                  onDownload={handleDownloadMedia}
                  onViewImage={setSelectedImage}
                  onRetry={retryMediaLoad}
                  mediaLoadingStates={mediaLoadingStates}
                  mediaErrors={mediaErrors}
                  isGrid={true}
                  showMoreCount={
                    index === 3 && activity.media.length > 4
                      ? activity.media.length - 4
                      : null
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Safe render with null checks
  if (!activity) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center text-gray-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Activity data not available</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
              {activity.user?.name?.charAt(0) || currentUser.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {activity.user?.name || currentUser.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{formatTime(activity.timestamp)}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {activity.user?.role || currentUser.role}
                    </span>
                    {activity.type === "event" && (
                      <>
                        <span>•</span>
                        <Calendar className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-800 text-lg leading-relaxed">
            {activity.content || ""}
          </p>
          {renderMedia()}
          {renderEventDetails()}
        </div>

        {/* Reaction Summary */}
        {getTotalReactions() > 0 && (
          <div className="px-6 pb-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {getTopReactions().map(([type, count]) => {
                    const reaction = reactions.find((r) => r.type === type);
                    return (
                      <div
                        key={type}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm border border-gray-200"
                      >
                        {reaction?.emoji || "👍"}
                      </div>
                    );
                  })}
                </div>
                <span>{getTotalReactions()}</span>
              </div>
              <div className="flex items-center space-x-4">
                {(activity.commentsCount || 0) > 0 && (
                  <span>{activity.commentsCount} comments</span>
                )}
                {(activity.shares || 0) > 0 && (
                  <span>{activity.shares} shares</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-gray-100">
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  activity.isLiked
                    ? "text-red-600 bg-red-50 ring-1 ring-red-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
                }`}
              >
                {activity.isLiked ? (
                  <Heart className="w-5 h-5 fill-current text-red-600" />
                ) : (
                  <ThumbsUp className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {activity.isLiked ? "Liked" : "Like"}
                </span>
              </button>

              {/* Reaction Picker */}
              {showReactionPicker && (
                <div
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 flex space-x-1 z-10"
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReactionClick(reaction.type)}
                      className="p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-125"
                      title={reaction.type}
                    >
                      <span className="text-2xl">{reaction.emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Comment</span>
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                activity.isShared
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-semibold">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 bg-gray-50">
            {/* Comment Input */}
            <div className="p-6 pb-4">
              <form onSubmit={handleCommentSubmit} className="flex space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a thoughtful comment..."
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isCommenting}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 text-white p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isCommenting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            {activity.comments && activity.comments.length > 0 && (
              <div className="px-6 pb-6 space-y-4">
                {activity.comments.map((comment) => (
                  <div key={comment?.id} className="flex space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {comment?.user?.name?.charAt(0) ||
                        currentUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {comment?.user?.name || currentUser.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(comment?.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed break-words">
                          {comment?.content || ""}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
              <div className="px-6 pb-6 text-center">
                <p className="text-gray-500 text-sm italic">
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

// Enhanced MediaItem component with MinioS3 integration
const MediaItem = ({
  mediaItem,
  onDownload,
  onViewImage,
  onRetry,
  mediaLoadingStates,
  mediaErrors,
  isGrid = false,
  showMoreCount = null,
}) => {
  const [imageError, setImageError] = useState(false);
  const mediaKey = mediaItem?.id || mediaItem?.filePath;
  const isLoading = mediaLoadingStates?.get(mediaKey) || false;
  const hasError =
    mediaErrors?.has(mediaKey) || imageError || !mediaItem?.hasValidUrl;

  const imageUrl = mediaItem?.downloadUrl || "/api/placeholder/400/300";

  const handleImageClick = () => {
    if (
      minioS3Service.isImageFile(mediaItem?.contentType) &&
      !hasError &&
      !isLoading
    ) {
      onViewImage({
        ...mediaItem,
        url: imageUrl,
        fileName: mediaItem?.fileName,
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
      <div className="w-full h-40 bg-gray-100 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`relative group ${
        isGrid ? "h-40" : "max-h-96"
      } overflow-hidden rounded-2xl bg-gray-100`}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm mb-2 text-center">Failed to load image</span>
          <button
            onClick={handleRetryClick}
            className="flex items-center space-x-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <>
          <img
            src={imageUrl}
            alt={mediaItem.fileName || "Media"}
            className={`w-full ${
              isGrid ? "h-full" : "max-h-96"
            } object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105`}
            onClick={handleImageClick}
            onError={(e) => {
              setImageError(true);
              e.target.src = "/api/placeholder/400/300";
            }}
            onLoad={() => setImageError(false)}
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              {minioS3Service.isImageFile(mediaItem.contentType) && (
                <button
                  onClick={handleImageClick}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200 shadow-lg"
                  title="View full size"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleDownloadClick}
                disabled={isLoading}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200 shadow-lg disabled:opacity-50"
                title="Download"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-800 border-t-transparent"></div>
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Show more count overlay */}
          {showMoreCount && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                +{showMoreCount}
              </span>
            </div>
          )}

          {/* File info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm font-medium truncate">
              {mediaItem.fileName || "Media file"}
            </p>
            {mediaItem.fileSize && (
              <p className="text-gray-300 text-xs">
                {minioS3Service.formatFileSize(mediaItem.fileSize)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Image lightbox component
const ImageLightbox = ({ image, onClose, onDownload }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative max-w-4xl max-h-full">
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
          className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Download button */}
        <button
          onClick={() => onDownload(image)}
          className="absolute top-4 right-16 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <Download className="w-6 h-6" />
        </button>

        {/* Image info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <p className="font-medium">{image?.fileName || "Image"}</p>
          {image?.fileSize && (
            <p className="text-sm text-gray-300">
              {minioS3Service.formatFileSize(image.fileSize)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDisplay;

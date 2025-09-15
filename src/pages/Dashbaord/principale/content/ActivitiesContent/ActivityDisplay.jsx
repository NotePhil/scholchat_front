import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  MoreHorizontal,
  UserPlus,
  ImageIcon,
  ZoomIn,
  Eye,
  Download,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

// Image Modal Component
const ImageModal = ({ isOpen, onClose, images, currentIndex, onNavigate }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, currentIndex]);

  const handleKeyPress = (e) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        if (currentIndex > 0) onNavigate(currentIndex - 1);
        break;
      case "ArrowRight":
        if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-10">
        <div className="text-white">
          <h3 className="text-lg font-medium">
            {currentImage.fileName || "Image"}
          </h3>
          <p className="text-sm opacity-75">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50"
        >
          ×
        </button>
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 z-10"
        >
          ←
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 z-10"
        >
          →
        </button>
      )}

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-16">
        <img
          src={currentImage.url}
          alt={currentImage.fileName || "Activity image"}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="text-white hover:text-gray-300 p-2 rounded"
        >
          -
        </button>
        <span className="text-white text-sm px-2">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          className="text-white hover:text-gray-300 p-2 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};

const ActivityDisplay = ({
  activity,
  onReaction,
  onComment,
  onShare,
  onJoinEvent,
  generateUserAvatar,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);
  const [mediaWithUrls, setMediaWithUrls] = useState([]);
  const [mediaLoading, setMediaLoading] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [downloading, setDownloading] = useState({});

  // Helper function to determine if a file is an image based on multiple criteria
  const isImageFile = (media) => {
    // Check multiple properties for image type
    const isImageByType = media.type === "IMAGE" || media.mediaType === "IMAGE";
    const isImageByContentType = media.contentType?.startsWith("image/");
    const isImageByFileName =
      media.fileName &&
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(media.fileName);

    return isImageByType || isImageByContentType || isImageByFileName;
  };

  // Create content preview
  const contentPreview =
    activity.content.length > 200
      ? activity.content.substring(0, 200) + "..."
      : activity.content;

  // Get modal images (only the images from mediaWithUrls)
  const modalImages = mediaWithUrls.filter(isImageFile);

  useEffect(() => {
    const processMediaUrls = async () => {
      if (activity.media && activity.media.length > 0) {
        console.log(
          "Processing media for activity:",
          activity.id,
          activity.media
        );

        const processedMedia = await Promise.all(
          activity.media.map(async (media, index) => {
            try {
              // Set loading state
              setMediaLoading((prev) => ({
                ...prev,
                [media.id || index]: true,
              }));

              let downloadUrl = media.url;
              let fileName = media.fileName;
              let contentType = media.contentType || media.type;

              // Debug: Log what we have for this media
              console.log(`Processing media ${index}:`, {
                id: media.id,
                url: media.url,
                fileName: media.fileName,
                contentType: media.contentType,
                type: media.type,
                filePath: media.filePath,
                mediaType: media.mediaType,
              });

              // If URL is not available, get it from MinIO
              if (!downloadUrl) {
                console.log(`Fetching URL for media ${index}:`, media.id);

                // Try to get download URL by ID first
                try {
                  if (media.id) {
                    const downloadData =
                      await minioS3Service.generateDownloadUrl(media.id);
                    downloadUrl = downloadData.downloadUrl;
                    fileName = downloadData.fileName || media.fileName;
                    contentType =
                      downloadData.contentType ||
                      media.contentType ||
                      media.type;
                    console.log(
                      `Got URL by ID for media ${index}:`,
                      downloadUrl
                    );
                  } else {
                    throw new Error("No media ID available");
                  }
                } catch (error) {
                  console.log(
                    `Failed to get URL by ID for media ${index}:`,
                    error.message
                  );

                  // If ID method fails, try by path if we have one
                  if (media.filePath) {
                    console.log(
                      `Trying download by path for media ${index}:`,
                      media.filePath
                    );
                    const downloadData =
                      await minioS3Service.generateDownloadUrlByPath(
                        media.filePath
                      );
                    downloadUrl = downloadData.downloadUrl;
                    fileName = downloadData.fileName || media.fileName;
                    contentType =
                      downloadData.contentType ||
                      media.contentType ||
                      media.type;
                    console.log(
                      `Got URL by path for media ${index}:`,
                      downloadUrl
                    );
                  } else if (media.fileName) {
                    // Try to construct a path based on common patterns
                    const userId = minioS3Service.getValidUserId();
                    const mediaType = (
                      media.mediaType ||
                      media.type ||
                      "DOCUMENT"
                    ).toLowerCase();
                    const documentType = media.documentType || "general";
                    const possiblePath = `users/${userId}/${
                      mediaType === "image" ? "images" : mediaType
                    }/${documentType}/${media.fileName}`;

                    console.log(
                      `Trying constructed path for media ${index}:`,
                      possiblePath
                    );
                    try {
                      const downloadData =
                        await minioS3Service.generateDownloadUrlByPath(
                          possiblePath
                        );
                      downloadUrl = downloadData.downloadUrl;
                      fileName = downloadData.fileName || media.fileName;
                      contentType =
                        downloadData.contentType ||
                        media.contentType ||
                        media.type;
                      console.log(
                        `Got URL by constructed path for media ${index}:`,
                        downloadUrl
                      );
                    } catch (pathError) {
                      console.log(
                        `Failed to get URL by constructed path for media ${index}:`,
                        pathError.message
                      );
                      throw new Error(
                        `Could not retrieve media: ${error.message}`
                      );
                    }
                  } else {
                    throw error;
                  }
                }

                if (!downloadUrl) {
                  throw new Error("No download URL returned");
                }
              }

              const processedItem = {
                ...media,
                url: downloadUrl,
                fileName: fileName,
                contentType: contentType,
              };

              console.log(
                `Successfully processed media ${index}:`,
                processedItem
              );
              return processedItem;
            } catch (error) {
              console.error(`Failed to get URL for media ${index}:`, error);
              setMediaErrors((prev) => ({
                ...prev,
                [media.id || index]: true,
              }));

              return {
                ...media,
                url: null,
                error: true,
                errorMessage: error.message,
              };
            } finally {
              setMediaLoading((prev) => ({
                ...prev,
                [media.id || index]: false,
              }));
            }
          })
        );

        console.log("All processed media:", processedMedia);
        setMediaWithUrls(processedMedia);
      } else {
        console.log("No media found for activity:", activity.id);
        setMediaWithUrls([]);
      }
    };

    processMediaUrls();
  }, [activity.media]);

  const formatTimestamp = (timestamp) => {
    return activityFeedService.formatTimestamp(timestamp);
  };

  const getStatusColor = (status) => {
    return activityFeedService.getStatusColor(status);
  };

  const getStatusLabel = (status) => {
    return activityFeedService.getStatusLabel(status);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await onComment(activity.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleImageError = (mediaId, error) => {
    console.error(`Image load error for media ${mediaId}:`, error);
    setMediaErrors((prev) => ({
      ...prev,
      [mediaId]: true,
    }));
  };

  const handleImageLoad = (mediaId) => {
    console.log(`Image loaded successfully for media ${mediaId}`);
    setMediaLoading((prev) => ({
      ...prev,
      [mediaId]: false,
    }));
  };

  const handleDownloadMedia = async (media) => {
    const mediaKey = media.id || mediaWithUrls.indexOf(media);

    try {
      setDownloading((prev) => ({ ...prev, [mediaKey]: true }));

      let downloadUrl = media.url;
      let fileName = media.fileName || "download";

      // If we don't have a direct URL, generate one
      if (!downloadUrl && media.id) {
        try {
          const downloadData = await minioS3Service.generateDownloadUrl(
            media.id
          );
          downloadUrl = downloadData.downloadUrl;
          fileName = downloadData.fileName || fileName;
        } catch (error) {
          // Try by path if ID fails
          if (media.filePath) {
            const downloadData = await minioS3Service.generateDownloadUrlByPath(
              media.filePath
            );
            downloadUrl = downloadData.downloadUrl;
            fileName = downloadData.fileName || fileName;
          } else {
            throw error;
          }
        }
      }

      if (!downloadUrl) {
        throw new Error("No download URL available");
      }

      // Create a temporary link to download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download media:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      setDownloading((prev) => ({ ...prev, [mediaKey]: false }));
    }
  };

  // Add renderEventDetails function
  const renderEventDetails = () => {
    if (activity.type !== "event" || !activity.eventDetails) {
      return null;
    }

    const { eventDetails } = activity;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Event Details</span>
          </h4>
          {eventDetails.status && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                eventDetails.status
              )}`}
            >
              {getStatusLabel(eventDetails.status)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {eventDetails.startDate && (
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                {new Date(eventDetails.startDate).toLocaleDateString()}
                {eventDetails.startTime && ` at ${eventDetails.startTime}`}
              </span>
            </div>
          )}

          {eventDetails.location && (
            <div className="flex items-center space-x-2 text-gray-700">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{eventDetails.location}</span>
            </div>
          )}

          {eventDetails.participantsCount !== undefined && (
            <div className="flex items-center space-x-2 text-gray-700">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{eventDetails.participantsCount} attending</span>
            </div>
          )}
        </div>

        {eventDetails.description && (
          <p className="mt-3 text-gray-600 text-sm">
            {eventDetails.description}
          </p>
        )}

        {onJoinEvent && eventDetails.canJoin && (
          <button
            onClick={() => onJoinEvent(activity.id)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join Event</span>
          </button>
        )}
      </div>
    );
  };

  const renderMedia = () => {
    if (!mediaWithUrls || mediaWithUrls.length === 0) {
      console.log("No media to render");
      return null;
    }

    console.log("Rendering media:", mediaWithUrls);

    // Separate images from other files using improved detection
    const images = mediaWithUrls.filter(isImageFile);
    const documents = mediaWithUrls.filter((media) => !isImageFile(media));

    console.log("Images:", images);
    console.log("Documents:", documents);

    return (
      <div className="mt-4 space-y-4">
        {/* Images Grid */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div
              className={`grid gap-2 ${
                images.length === 1
                  ? "grid-cols-1"
                  : images.length === 2
                  ? "grid-cols-2"
                  : images.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {images.map((media, index) => {
                const mediaKey = media.id || index;
                const hasError = mediaErrors[mediaKey] || media.error;
                const isLoading = mediaLoading[mediaKey];
                const hasUrl = media.url && !hasError;
                const isDownloading = downloading[mediaKey];

                console.log(`Rendering image ${index}:`, {
                  id: media.id,
                  hasError,
                  isLoading,
                  hasUrl,
                  url: media.url,
                });

                return (
                  <div key={mediaKey} className="relative group">
                    {isLoading && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}

                    {hasUrl && !isLoading && (
                      <div className="relative overflow-hidden rounded-lg cursor-pointer">
                        <img
                          src={media.url}
                          alt={media.fileName || "Activity image"}
                          className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            console.error(`Image failed to load:`, media.url);
                            handleImageError(mediaKey, e);
                          }}
                          onLoad={() => handleImageLoad(mediaKey)}
                          onClick={() => {
                            const imageIndex = images.findIndex(
                              (img) =>
                                (img.id || images.indexOf(img)) === mediaKey
                            );
                            setCurrentImageIndex(imageIndex);
                            setIsImageModalOpen(true);
                          }}
                        />

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const imageIndex = images.findIndex(
                                  (img) =>
                                    (img.id || images.indexOf(img)) === mediaKey
                                );
                                setCurrentImageIndex(imageIndex);
                                setIsImageModalOpen(true);
                              }}
                              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
                              title="View full size"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadMedia(media);
                              }}
                              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
                              title="Download"
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* File name overlay */}
                        {media.fileName && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs max-w-[80%] truncate">
                            {media.fileName}
                          </div>
                        )}
                      </div>
                    )}

                    {hasError && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm text-center">
                          Failed to load image
                        </p>
                        <p className="text-gray-400 text-xs mt-1 text-center">
                          {media.fileName || "Unknown file"}
                        </p>
                        <button
                          onClick={() => handleDownloadMedia(media)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-xs underline"
                        >
                          Try download
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((media, index) => {
              const mediaKey = media.id || index;
              const isDownloading = downloading[mediaKey];

              return (
                <div
                  key={mediaKey}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {media.fileName || "Document"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {media.contentType || "Document"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {media.url && (
                        <button
                          onClick={() => window.open(media.url, "_blank")}
                          className="text-blue-600 hover:text-blue-700 p-2"
                          title="Open in new tab"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadMedia(media)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        title="Download"
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {generateUserAvatar(activity.user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {activity.user.name}
                  </h3>
                  {activity.user.role && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {activity.user.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{formatTimestamp(activity.timestamp)}</span>
                  {activity.type === "event" && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Event</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">
              {showFullContent ? activity.content : contentPreview}
            </p>
            {activity.content.length > 200 && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                {showFullContent ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Event Details */}
          {renderEventDetails()}

          {/* Media */}
          {renderMedia()}
        </div>

        {/* Engagement Stats */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {activity.likes > 0 && (
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span>{activity.likes}</span>
                </span>
              )}
              {activity.comments && activity.comments.length > 0 && (
                <span>{activity.comments.length} comments</span>
              )}
              {activity.shares > 0 && <span>{activity.shares} shares</span>}
            </div>
            <div className="text-xs">
              {activity.eventDetails?.participantsCount > 0 && (
                <span>{activity.eventDetails.participantsCount} attending</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-around">
            <button
              onClick={() => onReaction(activity.id, "like")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activity.isLiked
                  ? "bg-red-50 text-red-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${activity.isLiked ? "fill-current" : ""}`}
              />
              <span className="hidden sm:inline">
                {activity.isLiked ? "Liked" : "Like"}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </button>

            <button
              onClick={() => onShare(activity.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activity.isShared
                  ? "bg-green-50 text-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 bg-gray-50">
            {/* Comment Form */}
            <form
              onSubmit={handleCommentSubmit}
              className="p-4 border-b border-gray-200"
            >
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {generateUserAvatar("Current User")}
                </div>
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="max-h-64 overflow-y-auto">
              {activity.comments && activity.comments.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {activity.comments.map((comment) => (
                    <div key={comment.id} className="p-4">
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {generateUserAvatar(comment.user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {comment.user.name}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={modalImages}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />
    </>
  );
};

export default ActivityDisplay;

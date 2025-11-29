import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Clock,
  Users,
  Calendar,
  UserPlus,
  Download,
  FileText,
  Image,
  Video,
  MoreHorizontal,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

const ActivityDisplay = ({
  activity,
  onReaction,
  onComment,
  onShare,
  onJoinEvent,
  currentUser,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageLoadError, setImageLoadError] = useState({});

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
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await onComment(activity.id, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du commentaire:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMediaDownload = async (media) => {
    try {
      let downloadUrl;
      if (media.filePath) {
        downloadUrl = `http://localhost:8486/scholchat/media/download-by-path?filePath=${encodeURIComponent(media.filePath)}`;
      } else if (media.id) {
        downloadUrl = `http://localhost:8486/scholchat/media/${media.id}/download`;
      }
      
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = media.fileName || 'file';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  const getMediaIcon = (mediaType, contentType) => {
    if (mediaType === "IMAGE" || contentType?.startsWith("image/")) {
      return <Image size={16} className="text-blue-600" />;
    }
    if (mediaType === "VIDEO" || contentType?.startsWith("video/")) {
      return <Video size={16} className="text-purple-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  const MediaImage = ({ media }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const mediaKey = media.id || media.fileName;

    React.useEffect(() => {
      let isMounted = true;
      
      const loadImage = async () => {
        try {
          if (!media.filePath && !media.id) {
            throw new Error('No file path or ID');
          }

          let url = null;
          
          // Try to get presigned URL from MinIO service first
          if (media.id) {
            try {
              const downloadData = await minioS3Service.generateDownloadUrl(media.id);
              url = downloadData.downloadUrl;
            } catch (error) {
              console.warn('Failed to get presigned URL, falling back to direct URL');
            }
          }
          
          // Fallback to direct URL
          if (!url) {
            if (media.filePath) {
              url = `http://localhost:8486/scholchat/media/download-by-path?filePath=${encodeURIComponent(media.filePath)}`;
            } else if (media.id) {
              url = `http://localhost:8486/scholchat/media/${media.id}/download`;
            }
          }
          
          if (url && isMounted) {
            setImageUrl(url);
          }
        } catch (error) {
          console.error('Image loading error:', error);
          if (isMounted) {
            setHasError(true);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
      
      loadImage();
      
      return () => {
        isMounted = false;
      };
    }, [media.filePath, media.id, mediaKey]);

    if (loading) {
      return (
        <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Chargement...</p>
          </div>
        </div>
      );
    }

    if (hasError || imageLoadError[mediaKey] || (!imageUrl && !loading)) {
      return (
        <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <Image size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Image non disponible</p>
            <p className="text-xs mt-1 text-gray-400">Fichier non accessible</p>
            {media.fileName && (
              <p className="text-xs mt-1 text-gray-400 truncate max-w-48">{media.fileName}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative group">
        <img
          src={imageUrl}
          alt={media.fileName || "Image"}
          className="w-full h-64 sm:h-80 object-cover rounded-lg"
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            setHasError(true);
            setImageLoadError(prev => ({ ...prev, [mediaKey]: true }));
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => handleMediaDownload(media)}
            className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderMediaPreview = (media) => {
    if (media.type === "IMAGE" || media.mediaType === "IMAGE" || media.contentType?.startsWith("image/")) {
      return <MediaImage media={media} />;
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3">
          {getMediaIcon(media.type, media.contentType)}
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">
              {media.fileName || "Fichier"}
            </p>
            {media.contentType && (
              <p className="text-xs text-gray-500">{media.contentType}</p>
            )}
          </div>
          <button
            onClick={() => handleMediaDownload(media)}
            className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors"
            title="Télécharger"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
            {activity.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {activity.user?.name || "Utilisateur"}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <span className="capitalize">{activity.user?.role || "user"}</span>
                  <span>•</span>
                  <span>{formatTimestamp(activity.timestamp)}</span>
                  {activity.type === "event" && activity.eventDetails && (
                    <>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          activity.eventDetails.status
                        )}`}
                      >
                        {getStatusLabel(activity.eventDetails.status)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
            {activity.content}
          </p>

          {activity.type === "event" && activity.eventDetails && (
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">
                    {activity.eventDetails.title}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600">
                    {activity.eventDetails.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>
                          {new Date(activity.eventDetails.startTime).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    )}

                    {activity.eventDetails.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{activity.eventDetails.location}</span>
                      </div>
                    )}

                    {activity.eventDetails.participantsCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>
                          {activity.eventDetails.participantsCount} participant(s)
                        </span>
                      </div>
                    )}
                  </div>

                  {activity.eventDetails.description && (
                    <p className="mt-3 text-gray-700 text-xs sm:text-sm">
                      {activity.eventDetails.description}
                    </p>
                  )}

                  {activity.eventDetails.status === "PLANIFIE" && (
                    <button
                      onClick={() => onJoinEvent(activity.id)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <UserPlus size={16} />
                      Participer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activity.media && activity.media.length > 0 && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="space-y-3">
            {activity.media.map((media, index) => (
              <div key={media.id || index}>{renderMediaPreview(media)}</div>
            ))}
          </div>
        </div>
      )}

      {(activity.likes > 0 || activity.comments?.length > 0 || activity.shares > 0) && (
        <div className="px-4 sm:px-6 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {activity.likes > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <Heart size={10} className="text-white fill-current" />
                  </div>
                  {activity.likes}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {activity.comments?.length > 0 && (
                <span>
                  {activity.comments.length} commentaire{activity.comments.length > 1 ? "s" : ""}
                </span>
              )}
              {activity.shares > 0 && (
                <span>
                  {activity.shares} partage{activity.shares > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onReaction(activity.id, "like")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activity.isLiked
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Heart size={18} className={activity.isLiked ? "fill-current" : ""} />
            <span className="hidden sm:inline">J'aime</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Commenter</span>
          </button>

          <button
            onClick={() => onShare(activity.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activity.isShared
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-100">
          {activity.comments && activity.comments.length > 0 && (
            <div className="px-4 sm:px-6 py-3 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {activity.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="font-medium text-sm text-gray-900">
                          {comment.user.name}
                        </p>
                        <p className="text-sm text-gray-700">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(comment.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Écrivez un commentaire..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? "..." : "Publier"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDisplay;
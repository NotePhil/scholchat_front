import React, { useState, useCallback } from "react";
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
  Edit3,
  Trash2,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

const ActivityDisplay = ({
  activity,
  onReaction,
  onComment,
  onShare,
  onJoinEvent,
  onEdit,
  onDelete,
  currentUser,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageLoadError, setImageLoadError] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'admin';
  
  // Local state for likes and comments - prioritize backend data
  const [localState, setLocalState] = useState(() => {
    // Always use backend data first, then fallback to cache
    const backendData = {
      likes: activity.likes ?? 0,
      isLiked: activity.isLiked ?? false,
      comments: activity.comments ?? [],
    };
    
    // Only use cache if backend data is empty/default
    if (backendData.likes === 0 && backendData.comments.length === 0) {
      const cached = localStorage.getItem(`activity_${activity.id}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          return {
            likes: data.likes ?? backendData.likes,
            isLiked: data.isLiked ?? backendData.isLiked,
            comments: data.comments ?? backendData.comments,
          };
        } catch (e) {
          console.warn('Failed to parse cached data');
        }
      }
    }
    
    return backendData;
  });

  // Update local state when activity data changes from backend
  React.useEffect(() => {
    console.log('=== BACKEND DATA DEBUG ===');
    console.log('Activity ID:', activity.id);
    console.log('Backend likes:', activity.likes);
    console.log('Backend isLiked:', activity.isLiked);
    console.log('Backend comments:', activity.comments);
    console.log('Current local state:', localState);
    
    const backendData = {
      likes: activity.likes ?? 0,
      isLiked: activity.isLiked ?? false,
      comments: activity.comments ?? [],
    };
    
    // Update local state if backend has newer data
    if (backendData.likes !== localState.likes || 
        backendData.isLiked !== localState.isLiked || 
        backendData.comments.length !== localState.comments.length) {
      console.log('Updating from backend data:', backendData);
      setLocalState(backendData);
    }
    console.log('=== END BACKEND DEBUG ===');
  }, [activity.likes, activity.isLiked, activity.comments]);

  // Save to localStorage only for user interactions (not backend updates)
  const saveToCache = React.useCallback((newState) => {
    localStorage.setItem(`activity_${activity.id}`, JSON.stringify(newState));
  }, [activity.id]);

  // Reset image index when activity changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity.id]);

  // Handle keyboard events for image modal
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && expandedImage) {
        setExpandedImage(null);
      }
    };

    if (expandedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [expandedImage]);

  // Close admin menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAdminMenu && !event.target.closest('.admin-menu-container')) {
        setShowAdminMenu(false);
      }
    };

    if (showAdminMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAdminMenu]);

  const formatTimestamp = (timestamp) => {
    return activityFeedService.formatTimestamp(timestamp);
  };

  const getStatusColor = (status) => {
    return activityFeedService.getStatusColor(status);
  };

  const getStatusLabel = (status) => {
    return activityFeedService.getStatusLabel(status);
  };

  // Handle like with optimistic updates
  const handleLikeClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasLiked = localState.isLiked;
    const newState = {
      ...localState,
      isLiked: !wasLiked,
      likes: wasLiked ? Math.max(0, localState.likes - 1) : localState.likes + 1
    };
    
    // Optimistic update
    setLocalState(newState);
    saveToCache(newState);

    try {
      const result = await activityFeedService.addReaction(activity.id, "like");
      // Sync with server result
      const finalState = {
        ...localState,
        isLiked: result,
        likes: result ? (wasLiked ? localState.likes : localState.likes + 1) : (wasLiked ? localState.likes - 1 : localState.likes)
      };
      setLocalState(finalState);
      saveToCache(finalState);
    } catch (error) {
      // Revert on error
      const revertState = {
        ...localState,
        isLiked: wasLiked,
        likes: localState.likes
      };
      setLocalState(revertState);
      saveToCache(revertState);
      console.error("Error liking:", error);
    }
  }, [activity.id, localState, saveToCache]);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      console.log('=== COMMENT SUBMIT DEBUG ===');
      console.log('Activity ID:', activity.id);
      console.log('Comment text:', newComment.trim());
      console.log('Current comments:', localState.comments);
      
      const newCommentObj = await activityFeedService.commentOnActivity(activity.id, newComment.trim());
      
      console.log('New comment response:', newCommentObj);
      
      if (newCommentObj) {
        const newState = {
          ...localState,
          comments: [...localState.comments, newCommentObj]
        };
        console.log('Updated comments state:', newState.comments);
        setLocalState(newState);
        saveToCache(newState);
      } else {
        console.error('No comment object returned from API');
      }
      setNewComment("");
    } catch (error) {
      console.error("Error commenting:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setSubmittingComment(false);
    }
  }, [activity.id, newComment, submittingComment, localState, saveToCache]);

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
        <div className="w-full aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">Chargement...</p>
          </div>
        </div>
      );
    }

    if (hasError || imageLoadError[mediaKey] || (!imageUrl && !loading)) {
      return (
        <div className="w-full aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
          <div className="text-center p-6">
            <Image size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-400 mb-1">Image indisponible</p>
            <p className="text-xs text-gray-400">{media.fileName}</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => setExpandedImage(imageUrl)}
      >
        <img
          src={imageUrl}
          alt={media.fileName || "Image"}
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            setHasError(true);
            setImageLoadError(prev => ({ ...prev, [mediaKey]: true }));
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              Cliquer pour agrandir
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaPreview = (media) => {
    if (media.type === "IMAGE" || media.mediaType === "IMAGE" || media.contentType?.startsWith("image/")) {
      return <MediaImage media={media} />;
    }

    return (
      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
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
        </div>
      </div>
    );
  };

  return (
    <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 mb-6">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {activity.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {activity.user?.name || "Utilisateur"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 capitalize font-medium">
                    {activity.user?.role || "user"}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <time className="text-sm text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </time>
                  {activity.type === "event" && activity.eventDetails && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.eventDetails.status)}`}>
                        {getStatusLabel(activity.eventDetails.status)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="relative admin-menu-container">
                <button 
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <MoreHorizontal size={20} className="text-gray-400" />
                </button>
                
                {/* Admin Menu */}
                {showAdminMenu && isAdmin && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                    <button
                      onClick={() => {
                        setShowAdminMenu(false);
                        onEdit?.(activity);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Edit3 size={16} className="text-blue-600" />
                      Modifier l'activité
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminMenu(false);
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
                          onDelete?.(activity.id);
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <Trash2 size={16} className="text-red-600" />
                      Supprimer l'activité
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 pb-4">
        <p className="text-gray-800 text-base leading-relaxed font-medium">
          {activity.content}
        </p>

        {/* Event Details */}
        {activity.type === "event" && activity.eventDetails && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-blue-100/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-3">
                  {activity.eventDetails.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {activity.eventDetails.startTime && (
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">
                        {new Date(activity.eventDetails.startTime).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  )}

                  {activity.eventDetails.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">
                        {activity.eventDetails.location}
                      </span>
                    </div>
                  )}

                  {activity.eventDetails.participantsCount !== undefined && (
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">
                        {activity.eventDetails.participantsCount} participant(s)
                      </span>
                    </div>
                  )}
                </div>

                {activity.eventDetails.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {activity.eventDetails.description}
                  </p>
                )}

                {activity.eventDetails.status === "PLANIFIE" && (
                  <button
                    onClick={() => onJoinEvent(activity.id)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <UserPlus size={18} />
                    Participer à l'événement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media */}
      {activity.media && activity.media.length > 0 && (
        <div className="px-6 pb-6">
          {activity.media.length === 1 ? (
            <div>{renderMediaPreview(activity.media[0])}</div>
          ) : (
            <div className="relative">
              <div>{renderMediaPreview(activity.media[currentImageIndex])}</div>
              <div className="flex justify-center mt-4 gap-2">
                {activity.media.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? "bg-blue-600 shadow-lg"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {(localState.likes > 0 || localState.comments.length > 0 || activity.shares > 0) && (
        <div className="px-6 py-3 border-t border-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {localState.likes > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                      <Heart size={12} className="text-white fill-current" />
                    </div>
                  </div>
                  <span className="font-semibold text-gray-700">{localState.likes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              {localState.comments.length > 0 && (
                <span className="font-medium">
                  {localState.comments.length} commentaire{localState.comments.length > 1 ? "s" : ""}
                </span>
              )}
              {activity.shares > 0 && (
                <span className="font-medium">
                  {activity.shares} partage{activity.shares > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              localState.isLiked
                ? "text-red-600 bg-red-50 hover:bg-red-100 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
            }`}
          >
            <Heart size={20} className={localState.isLiked ? "fill-current" : ""} />
            <span>J'aime</span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all duration-300"
          >
            <MessageCircle size={20} />
            <span>Commenter</span>
          </button>

          <button
            onClick={() => onShare(activity.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activity.isShared
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
            }`}
          >
            <Share2 size={20} />
            <span>Partager</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-50 bg-gray-50/50">
          {localState.comments.length > 0 && (
            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              <div className="space-y-4">
                {localState.comments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                      {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                        <p className="font-semibold text-gray-900 text-sm mb-1">
                          {comment.user?.name || "Utilisateur"}
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-4">
                        {formatTimestamp(comment.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {localState.comments.length > 3 && (
                  <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 ml-11">
                    Voir les {localState.comments.length - 3} autres commentaires
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100">
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrivez un commentaire..."
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {submittingComment ? "..." : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={expandedImage}
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default ActivityDisplay;
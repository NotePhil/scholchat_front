import React, { useState } from "react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
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
} from "lucide-react";

const ActivityDisplay = ({
  activity,
  onReaction,
  onRemoveReaction,
  onComment,
  onShare,
  onJoinEvent,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const reactions = [
    {
      type: "like",
      emoji: "👍",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
    },
    {
      type: "love",
      emoji: "❤️",
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
    },
    {
      type: "haha",
      emoji: "😂",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      hoverBg: "hover:bg-yellow-100",
    },
    {
      type: "wow",
      emoji: "😮",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
    },
    {
      type: "sad",
      emoji: "😢",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      hoverBg: "hover:bg-indigo-100",
    },
    {
      type: "angry",
      emoji: "😠",
      color: "text-red-700",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
    },
  ];

  const handleReactionClick = (reactionType) => {
    if (activity.userReaction === reactionType) {
      onRemoveReaction(activity.id);
    } else {
      onReaction(activity.id, reactionType);
    }
    setShowReactionPicker(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      setIsCommenting(true);
      try {
        await onComment(activity.id, commentText.trim());
        setCommentText("");
      } finally {
        setIsCommenting(false);
      }
    }
  };

  const handleShare = () => {
    onShare(activity.id);
  };

  const handleJoin = () => {
    onJoinEvent(activity.id);
  };

  const formatTime = (timestamp) => {
    return activityFeedService.formatTimestamp(timestamp);
  };

  const getTotalReactions = () => {
    return Object.values(activity.reactions || {}).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const getTopReactions = () => {
    if (!activity.reactions) return [];
    return Object.entries(activity.reactions)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const getUserReaction = () => {
    return reactions.find((r) => r.type === activity.userReaction);
  };

  const renderEventDetails = () => {
    if (activity.type !== "event") return null;

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
              {activity.eventDetails.title}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {activity.eventDetails.description}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(
              activity.eventDetails.status
            )}`}
          >
            {activityFeedService.getStatusLabel(activity.eventDetails.status)}
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
                {activity.eventDetails.participantsCount}
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
                {new Date(activity.eventDetails.startTime).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
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
    if (!activity.media || activity.media.length === 0) return null;

    return (
      <div className="mt-4">
        {activity.media.length === 1 ? (
          <div className="rounded-2xl overflow-hidden">
            <img
              src={activity.media[0].filePath || "/api/placeholder/600/400"}
              alt={activity.media[0].fileName}
              className="w-full max-h-96 object-cover"
            />
          </div>
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
              <div key={index} className="relative">
                <img
                  src={media.filePath || "/api/placeholder/300/200"}
                  alt={media.fileName}
                  className={`w-full h-40 object-cover ${
                    activity.media.length === 3 && index === 0
                      ? "row-span-2 h-full"
                      : ""
                  }`}
                />
                {index === 3 && activity.media.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      +{activity.media.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start space-x-4">
          <img
            src={activity.user.avatar || "/api/placeholder/48/48"}
            alt={activity.user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {activity.user.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{formatTime(activity.timestamp)}</span>
                  <span>•</span>
                  <span className="capitalize">{activity.user.role}</span>
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
          {activity.content}
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
                      {reaction?.emoji}
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
                activity.userReaction
                  ? `${getUserReaction()?.color} ${
                      getUserReaction()?.bgColor
                    } ring-1 ring-current ring-opacity-30`
                  : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
              }`}
            >
              {activity.userReaction ? (
                <span className="text-lg">{getUserReaction()?.emoji}</span>
              ) : (
                <ThumbsUp
                  className={`w-5 h-5 transition-colors duration-200 ${
                    activity.userReaction === "like"
                      ? "text-red-500 fill-current"
                      : ""
                  }`}
                />
              )}
              <span className="font-semibold">
                {activity.userReaction
                  ? getUserReaction()?.type.charAt(0).toUpperCase() +
                    getUserReaction()?.type.slice(1)
                  : "Like"}
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
              <img
                src="/api/placeholder/40/40"
                alt="You"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
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
                <div key={comment.id} className="flex space-x-3 group">
                  <img
                    src={comment.user.avatar || "/api/placeholder/32/32"}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed break-words">
                        {comment.content}
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
  );
};

export default ActivityDisplay;

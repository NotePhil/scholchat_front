import React, { useState } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Share2,
  MoreVertical,
  Send,
  Loader2,
  MapPin,
  Clock,
  Users,
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  BookOpen,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";

const ActivityDisplay = ({
  activities,
  searchTerm,
  canPost,
  isDark,
  onLikeActivity,
  onShareActivity,
  onJoinEvent,
  formatEventDateTime,
  getStatusColor,
  getStatusLabel,
}) => {
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

  const ActivityTypeBadge = ({ type }) => {
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

  if (activities.length === 0) {
    return (
      <div
        className={`text-center py-12 ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <Users
            className={`w-16 h-16 mx-auto ${
              isDark ? "text-gray-500" : "text-gray-400"
            } mb-4`}
          />
          <h3
            className={`text-lg font-semibold ${
              isDark ? "text-gray-300" : "text-gray-600"
            } mb-2`}
          >
            No activities found
          </h3>
          <p
            className={`${isDark ? "text-gray-400" : "text-gray-500"} max-w-md`}
          >
            {searchTerm
              ? `No activities match "${searchTerm}"`
              : canPost
              ? "Create the first event to get started!"
              : "No events available at the moment."}
          </p>
          {canPost && !searchTerm && (
            <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Create First Event
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`rounded-xl p-6 shadow-lg transform transition-all hover:shadow-xl border ${
            isDark
              ? "bg-gray-800 border-gray-700 hover:border-gray-600"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <UserAvatar user={activity.user} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {activity.user?.name || "Anonymous"}
                  </h3>
                  <ActivityTypeBadge type={activity.type} />
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
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Event Details */}
          {activity.eventDetails && (
            <div
              className={`mb-6 p-6 rounded-lg border-l-4 ${
                isDark
                  ? "bg-gray-700 border-blue-400"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h4
                  className={`font-bold text-lg ${
                    isDark ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  {activity.eventDetails.title}
                </h4>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    activity.eventDetails.status
                  )}`}
                >
                  {getStatusLabel(activity.eventDetails.status)}
                </span>
              </div>

              {activity.eventDetails.description && (
                <p
                  className={`mb-4 ${
                    isDark ? "text-gray-300" : "text-blue-800"
                  }`}
                >
                  {activity.eventDetails.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-gray-300" : "text-blue-800"
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {activity.eventDetails.location || "Location TBD"}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    isDark ? "text-gray-300" : "text-blue-800"
                  }`}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Starts:{" "}
                    {formatEventDateTime(activity.eventDetails.startTime)}
                  </span>
                </div>
                {activity.eventDetails.endTime && (
                  <div
                    className={`flex items-center gap-2 ${
                      isDark ? "text-gray-300" : "text-blue-800"
                    }`}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Ends: {formatEventDateTime(activity.eventDetails.endTime)}
                    </span>
                  </div>
                )}
                {activity.eventDetails.participantsCount !== undefined && (
                  <div
                    className={`flex items-center gap-2 ${
                      isDark ? "text-gray-300" : "text-blue-800"
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {activity.eventDetails.participantsCount} participant
                      {activity.eventDetails.participantsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onJoinEvent(activity.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Join Event
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    isDark
                      ? "border border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border border-blue-500 text-blue-500 hover:bg-blue-50"
                  }`}
                >
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {activity.content && (
            <div className="mb-4">
              <p
                className={`whitespace-pre-wrap leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {activity.content}
              </p>
            </div>
          )}

          {/* Media */}
          {activity.media && activity.media.length > 0 && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                isDark
                  ? "border-gray-600 bg-gray-700"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {activity.media.map((mediaItem, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between mb-3 last:mb-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {mediaItem.contentType?.startsWith("image/") ? (
                      <>
                        <ImageIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {mediaItem.fileName || "Event Image"}
                          </p>
                          <p
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Image • Click to view
                          </p>
                        </div>
                        {mediaItem.filePath && (
                          <img
                            src={mediaItem.filePath}
                            alt="Event"
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {mediaItem.fileName || "Event Document"}
                          </p>
                          <p
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {mediaItem.contentType?.includes("pdf")
                              ? "PDF Document"
                              : "Document"}{" "}
                            • {(mediaItem.fileSize / 1024).toFixed(1)}KB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (mediaItem.filePath) {
                        if (mediaItem.contentType?.startsWith("image/")) {
                          window.open(mediaItem.filePath, "_blank");
                        } else {
                          const link = document.createElement("a");
                          link.href = mediaItem.filePath;
                          link.download = mediaItem.fileName || "document";
                          link.click();
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
                  >
                    {mediaItem.contentType?.startsWith("image/") ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {mediaItem.contentType?.startsWith("image/")
                        ? "View"
                        : "Download"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div
            className={`flex justify-between items-center pt-4 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex space-x-6">
              <button
                onClick={() => onLikeActivity(activity.id)}
                className={`flex items-center gap-2 transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-blue-400"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-medium">{activity.likes || 0}</span>
              </button>
              <button
                className={`flex items-center gap-2 transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-blue-400"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">
                  {activity.commentsCount || activity.comments?.length || 0}
                </span>
              </button>
            </div>
            <button
              onClick={() => onShareActivity(activity.id)}
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                  : "text-gray-600 hover:text-blue-500 hover:bg-gray-100"
              }`}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <CommentSection
            comments={activity.comments || []}
            activityId={activity.id}
            isDark={isDark}
          />
        </div>
      ))}
    </div>
  );
};

const CommentSection = ({ comments, activityId, isDark }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await activityFeedService.commentOnActivity(activityId, newComment);
      setNewComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="mt-4">
      {comments.length > 0 && (
        <button
          onClick={() => setShowComments(!showComments)}
          className={`text-sm font-medium mb-3 transition-colors ${
            isDark
              ? "text-gray-400 hover:text-gray-300"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {showComments ? "Hide" : "Show"} {comments.length} comment
          {comments.length !== 1 ? "s" : ""}
        </button>
      )}

      {showComments && (
        <div className="space-y-3 mb-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex space-x-3">
              <img
                src={comment.user?.avatar || "/api/placeholder/32/32"}
                alt={comment.user?.name || "User"}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = "/api/placeholder/32/32";
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`rounded-lg px-3 py-2 ${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-medium text-sm ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {comment.user?.name || "Anonymous"}
                    </span>
                    <span
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {comment.timestamp || "Just now"}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmitComment} className="flex space-x-3">
        <img
          src="/api/placeholder/32/32"
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            disabled={submittingComment}
            required
            minLength={1}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submittingComment}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            {submittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Post</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityDisplay;

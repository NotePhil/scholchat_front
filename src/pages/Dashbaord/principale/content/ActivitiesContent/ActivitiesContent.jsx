import React, { useState, useEffect } from "react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import ActivityDisplay from "./ActivityDisplay";
import CreateEventModal from "./CreateEventModal";
import {
  Plus,
  Filter,
  TrendingUp,
  Calendar,
  MessageCircle,
  Users,
} from "lucide-react";

const ActivitiesContent = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityFeedService.getActivities(filter);
      setActivities(data);
    } catch (err) {
      setError("Failed to load activities");
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (activityId, reactionType) => {
    try {
      const success = await activityFeedService.addReaction(
        activityId,
        reactionType
      );
      if (success) {
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  reactions: {
                    ...activity.reactions,
                    [reactionType]: (activity.reactions[reactionType] || 0) + 1,
                  },
                  userReaction: reactionType,
                }
              : activity
          )
        );
      }
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const handleRemoveReaction = async (activityId) => {
    try {
      const success = await activityFeedService.removeReaction(activityId);
      if (success) {
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  reactions: {
                    ...activity.reactions,
                    [activity.userReaction]: Math.max(
                      0,
                      (activity.reactions[activity.userReaction] || 0) - 1
                    ),
                  },
                  userReaction: null,
                }
              : activity
          )
        );
      }
    } catch (err) {
      console.error("Error removing reaction:", err);
    }
  };

  const handleComment = async (activityId, comment) => {
    try {
      const newComment = await activityFeedService.commentOnActivity(
        activityId,
        comment
      );
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                comments: [...(activity.comments || []), newComment],
                commentsCount: (activity.commentsCount || 0) + 1,
              }
            : activity
        )
      );
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleShare = async (activityId) => {
    try {
      const success = await activityFeedService.shareActivity(activityId);
      if (success) {
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  shares: (activity.shares || 0) + 1,
                  isShared: true,
                }
              : activity
          )
        );
      }
    } catch (err) {
      console.error("Error sharing activity:", err);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await activityFeedService.joinEvent(eventId);
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === eventId && activity.type === "event"
            ? {
                ...activity,
                eventDetails: {
                  ...activity.eventDetails,
                  participantsCount:
                    (activity.eventDetails.participantsCount || 0) + 1,
                  hasJoined: true,
                },
              }
            : activity
        )
      );
    } catch (err) {
      console.error("Error joining event:", err);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await activityFeedService.createEvent(eventData);
      const newActivity =
        activityFeedService.transformEventToActivity(newEvent);
      setActivities((prev) => [newActivity, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      setError("Failed to create event");
      console.error("Error creating event:", err);
    }
  };

  const filters = [
    { key: "all", label: "All", icon: Filter },
    { key: "events", label: "Events", icon: Calendar },
    { key: "interactions", label: "Posts", icon: MessageCircle },
    { key: "popular", label: "Popular", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-500 font-medium">Loading activities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SchoolChat Feed
                </h1>
                <p className="text-gray-500">
                  Stay connected with your academic community
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          </div>

          {/* Enhanced Filter Tabs */}
          <div className="bg-gray-50 p-2 rounded-xl">
            <div className="flex space-x-2">
              {filters.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filter === key
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="max-w-sm mx-auto">
                <div className="bg-gray-50 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No activities yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Be the first to share something with your academic community
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Create First Event
                </button>
              </div>
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityDisplay
                key={activity.id}
                activity={activity}
                onReaction={handleReaction}
                onRemoveReaction={handleRemoveReaction}
                onComment={handleComment}
                onShare={handleShare}
                onJoinEvent={handleJoinEvent}
              />
            ))
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateEvent}
          />
        )}
      </div>
    </div>
  );
};

export default ActivitiesContent;

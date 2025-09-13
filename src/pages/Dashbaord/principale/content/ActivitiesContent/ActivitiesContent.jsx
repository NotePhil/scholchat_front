import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Search,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import CreateEventModal from "./CreateEventModal";
import ActivityDisplay from "./ActivityDisplay";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

const ActivitiesContent = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const filters = [
    { id: "all", label: "All Activities", icon: Users },
    { id: "events", label: "Events", icon: Calendar },
    { id: "posts", label: "Posts", icon: TrendingUp },
    { id: "recent", label: "Recent", icon: TrendingUp },
    { id: "popular", label: "Popular", icon: TrendingUp },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    loadActivities();
  }, [activeFilter]);

  const initializeData = async () => {
    try {
      const user = activityFeedService.getCurrentUser();
      setCurrentUser(user);
      await loadActivities();
    } catch (error) {
      console.error("Failed to initialize:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityFeedService.getActivities(activeFilter);

      // Process activities and get media URLs
      const processedActivities = await Promise.all(
        data.map(async (activity) => {
          if (activity.media && activity.media.length > 0) {
            const processedMedia = await Promise.all(
              activity.media.map(async (media) => {
                try {
                  // Get download URL from Minio
                  const downloadData = await minioS3Service.generateDownloadUrl(
                    media.id
                  );
                  return {
                    ...media,
                    url: downloadData.downloadUrl,
                    fileName: downloadData.fileName,
                    contentType: downloadData.contentType,
                  };
                } catch (error) {
                  console.error("Failed to get media URL:", error);
                  return media;
                }
              })
            );
            return {
              ...activity,
              media: processedMedia,
            };
          }
          return activity;
        })
      );

      setActivities(processedActivities);
    } catch (error) {
      console.error("Failed to load activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData, files) => {
    try {
      // First create the event without media
      const createdEvent = await activityFeedService.createEvent({
        titre: eventData.titre,
        description: eventData.description,
        lieu: eventData.lieu,
        heureDebut: eventData.heureDebut,
        heureFin: eventData.heureFin,
        etat: eventData.etat,
        participantsIds: eventData.participantsIds,
      });

      // If event creation is successful and there are files to upload
      if (createdEvent && files && files.length > 0) {
        try {
          // Upload files after event creation
          const uploadPromises = files.map(async (file) => {
            try {
              // Validate file before upload
              minioS3Service.validateFile(file, 20 * 1024 * 1024); // 20MB limit

              // Upload to Minio with event-specific folder
              const result = await minioS3Service.uploadFile(
                file,
                minioS3Service.isImageFile(file.type) ? "IMAGE" : "DOCUMENT",
                `events/${createdEvent.id}`
              );

              return {
                fileName: result.fileName,
                filePath: result.fileName,
                type: minioS3Service.isImageFile(file.type)
                  ? "IMAGE"
                  : "DOCUMENT",
                contentType: file.type,
                eventId: createdEvent.id,
              };
            } catch (error) {
              console.error("Failed to upload file:", file.name, error);
              throw error;
            }
          });

          const uploadResults = await Promise.allSettled(uploadPromises);

          // Get successful uploads
          const successfulUploads = uploadResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          const failedUploads = uploadResults.filter(
            (result) => result.status === "rejected"
          ).length;

          // If there are successful uploads, associate them with the event
          if (successfulUploads.length > 0) {
            await activityFeedService.addMediaToEvent(
              createdEvent.id,
              successfulUploads
            );
          }

          // Show warning if some files failed
          if (failedUploads > 0) {
            console.warn(`${failedUploads} file(s) failed to upload`);
            // You might want to show a toast notification here
          }
        } catch (uploadError) {
          console.error("Failed to upload files:", uploadError);
          // Event is created but files failed to upload
          // You might want to show a notification that the event was created but files failed
        }
      }

      setShowCreateModal(false);
      await loadActivities();

      return createdEvent;
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
      throw error;
    }
  };

  const handleReaction = async (activityId, reactionType) => {
    try {
      const result = await activityFeedService.addReaction(
        activityId,
        reactionType
      );

      // Update activities state
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.id === activityId) {
            if (reactionType === "like") {
              return {
                ...activity,
                isLiked: result,
                likes: result ? activity.likes + 1 : activity.likes - 1,
              };
            }
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleComment = async (activityId, comment) => {
    try {
      const newComment = await activityFeedService.commentOnActivity(
        activityId,
        comment
      );

      // Update activities state
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              comments: [...(activity.comments || []), newComment],
            };
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Failed to comment:", error);
    }
  };

  const handleShare = async (activityId) => {
    try {
      await activityFeedService.shareActivity(activityId);

      // Update activities state
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              isShared: true,
              shares: activity.shares + 1,
            };
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await activityFeedService.joinEvent(eventId);

      // Update activities state
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.id === eventId && activity.eventDetails) {
            return {
              ...activity,
              eventDetails: {
                ...activity.eventDetails,
                participantsCount: activity.eventDetails.participantsCount + 1,
              },
            };
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateUserAvatar = (userName) => {
    if (!userName) return "?";
    return userName.charAt(0).toUpperCase();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                School Activities
              </h1>
              <p className="text-gray-600 text-sm">
                Stay connected with your academic community
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities, events, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeFilter === filter.id
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Post Card */}
        {currentUser && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {generateUserAvatar(currentUser.name)}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 text-left px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                What's happening in your academic life?
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Share an event, announcement, or update
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Create Event
              </button>
            </div>
          </div>
        )}

        {/* Activities Feed */}
        <div className="space-y-6">
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activities found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Be the first to create an event or post"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Event
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityDisplay
                key={activity.id}
                activity={activity}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
                onJoinEvent={handleJoinEvent}
                generateUserAvatar={generateUserAvatar}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredActivities.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => loadActivities()}
              disabled={loading}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More Activities"}
            </button>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ActivitiesContent;

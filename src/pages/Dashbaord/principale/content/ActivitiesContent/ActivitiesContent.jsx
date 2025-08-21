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
import CreateEventModal from "./CreateEventModal";
import ActivityDisplay from "./ActivityDisplay";

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

  const canPost = ["admin", "professor"].includes(userRole);

  useEffect(() => {
    const user = activityFeedService.getCurrentUser();
    if (user) {
      setCurrentUser({
        ...user,
        avatar: "/api/placeholder/48/48",
      });
    }
  }, [userRole]);

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

  const handleLikeActivity = async (activityId) => {
    try {
      await activityFeedService.likeActivity(activityId);
      setActivities(
        activities.map((activity) =>
          activity.id === activityId
            ? { ...activity, likes: (activity.likes || 0) + 1 }
            : activity
        )
      );
    } catch (error) {
      console.error("Failed to like activity:", error);
      setError("Failed to like activity. Please try again.");
    }
  };

  const handleShareActivity = async (activityId) => {
    try {
      await activityFeedService.shareActivity(activityId);
    } catch (error) {
      console.error("Failed to share activity:", error);
      setError("Failed to share activity. Please try again.");
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await activityFeedService.joinEvent(eventId);
      setActivities(
        activities.map((activity) =>
          activity.id === eventId && activity.eventDetails
            ? {
                ...activity,
                eventDetails: {
                  ...activity.eventDetails,
                  participantsCount:
                    (activity.eventDetails.participantsCount || 0) + 1,
                },
              }
            : activity
        )
      );
    } catch (error) {
      console.error("Failed to join event:", error);
      setError("Failed to join event. Please try again.");
    }
  };

  const searchFilteredActivities = activities.filter(
    (activity) =>
      activity.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.eventDetails?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const activitiesPerPage = 5;
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

      <div className="space-y-6">
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

        <ActivityDisplay
          activities={currentActivities}
          searchTerm={searchTerm}
          canPost={canPost}
          isDark={isDark}
          onLikeActivity={handleLikeActivity}
          onShareActivity={handleShareActivity}
          onJoinEvent={handleJoinEvent}
          formatEventDateTime={activityFeedService.formatEventDateTime}
          getStatusColor={activityFeedService.getStatusColor}
          getStatusLabel={activityFeedService.getStatusLabel}
        />

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

      <CreateEventModal
        show={showCreateEventModal}
        onClose={() => {
          setShowCreateEventModal(false);
          setError(null);
        }}
        canPost={canPost}
        onCreateEvent={async (eventData) => {
          try {
            const newEvent = await activityFeedService.createEvent(eventData);
            if (newEvent) {
              const newActivity =
                activityFeedService.transformEventsToActivities([newEvent])[0];
              setActivities([newActivity, ...activities]);
              setShowCreateEventModal(false);
              return true;
            }
          } catch (error) {
            console.error("Failed to create event:", error);
            setError(
              error.message || "Failed to create event. Please try again."
            );
            return false;
          }
        }}
        isDark={isDark}
      />
    </div>
  );
};

export default ActivitiesContent;

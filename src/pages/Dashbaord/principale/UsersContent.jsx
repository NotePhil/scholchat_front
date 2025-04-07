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
} from "lucide-react";

const UsersContent = ({ label = "Users", userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [newPost, setNewPost] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 5;

  // Theme settings
  const isDark = false;
  const currentTheme = "blue";
  const colorSchemes = {
    blue: { primary: "#3B82F6" },
    green: { primary: "#10B981" },
    purple: { primary: "#8B5CF6" },
    red: { primary: "#EF4444" },
  };

  const mockComments = [
    {
      id: 1,
      user: {
        name: "John Doe",
        avatar: require("./img/graduation.jpeg"),
      },
      content: "This is amazing news! Congratulations to the team! 🎉",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      user: {
        name: "Jane Smith",
        avatar: require("./img/graduation.jpeg"),
      },
      content: "Well deserved! Looking forward to the competition.",
      timestamp: "30 mins ago",
    },
  ];

  const mockActivities = [
    {
      id: 1,
      user: {
        name: "Science Department",
        avatar: require("./img/graduation.jpeg"),
        role: "School Department",
      },
      content:
        "Exciting announcement! Our robotics team has qualified for the National Science Competition! 🏆",
      timestamp: "2 hours ago",
      likes: 42,
      comments: mockComments,
      type: "achievement",
      media: [
        require("./img/graduation.jpeg"),
      ],
      visibility: ["all"],
    },
    {
      id: 2,
      user: {
        name: "School Administration",
        avatar: require("./img/defsense.jpeg"),
        role: "Official Announcement",
      },
      content:
        "Parent-Teacher Meeting scheduled for February 20th. All parents are requested to attend.",
      timestamp: "5 hours ago",
      likes: 35,
      comments: mockComments.slice(0, 1),
      type: "event",
      media: [],
      visibility: ["parent", "professor"],
    },
    {
      id: 3,
      user: {
        name: "Cultural Club",
        avatar: require("./img/defsense.jpeg"),
        role: "School Group",
      },
      content:
        "Annual Cultural Fest registrations are now open! Join us for an amazing celebration of talent and creativity.",
      timestamp: "1 day ago",
      likes: 63,
      comments: mockComments,
      type: "announcement",
      media: [
        require("./img/defsense.jpeg"),
      ],
      visibility: ["all"],
    },
    {
      id: 4,
      user: {
        name: "Mathematics Department",
        avatar: require("./img/graduation.jpeg"),
        role: "Academic Update",
      },
      content:
        "Mathematics quiz results have been published. Check your grades in the student portal.",
      timestamp: "1 day ago",
      likes: 28,
      comments: mockComments,
      type: "academic",
      media: [],
      visibility: ["student", "parent"],
    },
  ];

  const filterOptions = [
    { label: "All Updates", value: "all", icon: Users },
    { label: "Events", value: "event", icon: Calendar },
    { label: "Achievements", value: "achievement", icon: Award },
    { label: "Academic", value: "academic", icon: BookOpen },
    { label: "Announcements", value: "announcement", icon: AlertCircle },
  ];

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const newPreviewImages = files.map((file) => URL.createObjectURL(file));
    setSelectedImages((prev) => [...prev, ...files]);
    setPreviewImages((prev) => [...prev, ...newPreviewImages]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previewImages[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewPost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;

    const newActivity = {
      id: activities.length + 1,
      user: {
        name: "Current User",
        avatar: require("./img/graduation.jpeg"),
        role: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      },
      content: newPost,
      timestamp: "Just now",
      likes: 0,
      comments: [],
      type: "announcement",
      media: previewImages,
      visibility: ["all"],
    };

    setActivities([newActivity, ...activities]);
    setNewPost("");
    setSelectedImages([]);
    setPreviewImages([]);
  };

  const ImageGallery = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleDotClick = (index) => {
      setCurrentIndex(index);
    };

    return (
      <div
        className={`relative mb-4 ${images.length === 0 ? "h-0" : "h-auto"}`}
      >
        {images.length > 0 ? (
          <>
            <div className="relative h-96 flex">
              {" "}
              {/* Increased height */}
              <div className="w-full">
                <img
                  src={images[currentIndex]}
                  alt={`Media ${currentIndex + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center mt-2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className="focus:outline-none"
                >
                  <Circle
                    className={`w-3 h-3 transition-all duration-300 ${
                      currentIndex === index ? "fill-current" : "stroke-current"
                    }`}
                    style={{ color: colorSchemes[currentTheme].primary }}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-2">
            No images available
          </div>
        )}
      </div>
    );
  };

  const CommentSection = ({ comments }) => {
    const [newComment, setNewComment] = useState("");
    const [showAllComments, setShowAllComments] = useState(false);

    const displayComments = showAllComments ? comments : comments.slice(0, 2);

    return (
      <div className="mt-4 space-y-4">
        <div className="space-y-3">
          {displayComments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full"
              />
              <div
                className={`flex-1 p-3 rounded-lg ${
                  isDark ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{comment.user.name}</span>
                  <span className="text-sm text-gray-500">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length > 2 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-sm font-medium"
              style={{ color: colorSchemes[currentTheme].primary }}
            >
              View all {comments.length} comments
            </button>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <img
            src={require("./img/graduation.jpeg")}
            alt="Current user"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className={`w-full px-4 py-2 rounded-full ${
                isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
              }`}
            />
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              style={{ color: colorSchemes[currentTheme].primary }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UserAvatar = ({ user }) => (
    <img
      src={user.avatar}
      alt={user.name}
      className="w-12 h-12 rounded-full object-cover"
    />
  );

  // Check if activities are filtered based on activeFilter
  const filteredActivities = activities.filter(
    (activity) => activeFilter === "all" || activity.type === activeFilter
  );

  // Pagination logic
  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = filteredActivities.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);

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

        {["admin", "professor"].includes(userRole) && (
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
            <UserPlus size={18} />
            <span>Add {label === "Users" ? "User" : label.slice(0, -1)}</span>
          </button>
        )}
      </div>

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

      {/* Activity Feed section */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all transform hover:scale-105 ${
                activeFilter === filter.value
                  ? `shadow-lg`
                  : `${isDark ? "bg-gray-800" : "bg-gray-100"}`
              }`}
              style={
                activeFilter === filter.value
                  ? {
                      backgroundColor: `${colorSchemes[currentTheme].primary}20`,
                      color: colorSchemes[currentTheme].primary,
                    }
                  : {}
              }
            >
              <filter.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{filter.label}</span>
            </button>
          ))}
        </div>

        {["admin", "professor"].includes(userRole) && (
          <div
            className={`rounded-xl p-6 shadow-lg transform transition-all hover:shadow-xl ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-start space-x-4">
              <UserAvatar
                user={{
                  name: "Current User",
                  avatar: require("./img/graduation.jpeg"),
                }}
              />
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something inspiring..."
                  className={`w-full p-4 rounded-lg resize-none border ${
                    isDark
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  }`}
                  rows="3"
                />

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {previewImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Add Images</span>
                </div>
              </label>

              <button
                onClick={handleNewPost}
                className="px-6 py-2 rounded-full text-white flex items-center gap-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: colorSchemes[currentTheme].primary,
                }}
              >
                <Send className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {currentActivities.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-xl p-6 shadow-lg transform transition-all hover:shadow-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <UserAvatar user={activity.user} />
                  <div>
                    <h3 className="font-semibold">{activity.user.name}</h3>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {activity.user.role} • {activity.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  className={`${
                    isDark ? "text-gray-400" : "text-gray-500"
                  } hover:text-gray-700`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <p className="mb-4 whitespace-pre-wrap">{activity.content}</p>

              {activity.media && <ImageGallery images={activity.media} />}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-6">
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                    <span>{activity.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{activity.comments.length}</span>
                  </button>
                </div>
                <button className="hover:text-blue-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <CommentSection comments={activity.comments} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === number
                        ? "bg-blue-500 text-white"
                        : "border"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersContent;

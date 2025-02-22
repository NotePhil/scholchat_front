import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Share2,
  MoreVertical,
  Send,
  Users,
  Mail,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
  X,
  Plus,
  ChevronRight,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const ActivityFeed = ({ isDark, currentTheme, colorSchemes, userRole }) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [newPost, setNewPost] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const navigate = useNavigate();

  const mockComments = [
    {
      id: 1,
      user: {
        name: "John Doe",
        avatar: "/api/placeholder/32/32",
      },
      content: "This is amazing news! Congratulations to the team! 🎉",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      user: {
        name: "Jane Smith",
        avatar: "/api/placeholder/32/32",
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
        avatar: "/images/th.jpg",
        role: "School Department",
      },
      content:
        "Exciting announcement! Our robotics team has qualified for the National Science Competition! 🏆",
      timestamp: "2 hours ago",
      likes: 42,
      comments: mockComments,
      type: "achievement",
      media: [
        "/images/3.jpg",
        "/images/th.jpg",
        "/images/2.jpg",
        "/images/th.jpg",
      ],
      visibility: ["all"],
    },
    {
      id: 2,
      user: {
        name: "School Administration",
        avatar: "/images/2.jpg",
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
        avatar: "/images/2.jpg",
        role: "School Group",
      },
      content:
        "Annual Cultural Fest registrations are now open! Join us for an amazing celebration of talent and creativity.",
      timestamp: "1 day ago",
      likes: 63,
      comments: mockComments,
      type: "announcement",
      media: ["/images/th.jpg", "/images/2.jpg", "/images/3.jpg"],
      visibility: ["all"],
    },
    {
      id: 4,
      user: {
        name: "Mathematics Department",
        avatar: "/images/th.jpg",
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

  const navigateToEmail = () => {
    window.location.href = "mailto:";
  };
  const handleNewPost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;

    const newActivity = {
      id: activities.length + 1,
      user: {
        name: "Current User",
        avatar: "/api/placeholder/48/48",
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDotClick = (index) => {
      setCurrentIndex(index);
    };

    return (
      <div
        className={`relative mb-4 ${images.length === 0 ? "h-0" : "h-auto"}`}
      >
        {images.length > 0 ? (
          <>
            <div className="relative h-64 flex">
              <div className="w-full">
                <img
                  src={images[currentIndex]}
                  alt={`Media ${currentIndex + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Navigation dots (Only for existing images) */}
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
            src="/api/placeholder/32/32"
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
    <div
      className={`max-w-6xl mx-auto px-4 ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          School Activity Feed
        </h1>
        <button
          onClick={navigateToEmail}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-all hover:scale-105"
          style={{ backgroundColor: colorSchemes[currentTheme].primary }}
        >
          <Mail className="w-5 h-5" />
          <span>Open Mail</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
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

          {userRole === "admin" && (
            <div
              className={`rounded-xl p-6 shadow-lg transform transition-all hover:shadow-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-start space-x-4">
                <UserAvatar
                  user={{
                    name: "Admin User",
                    avatar: "/api/placeholder/48/48",
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
            {activities.map((activity) => (
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
        </div>

        <div className="lg:col-span-1">
          <div
            className={`sticky top-6 rounded-xl p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-lg`}
          >
            <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {[
                { label: "New Posts Today", value: "12" },
                { label: "Active Users", value: "156" },
                { label: "Total Interactions", value: "1.2k" },
              ].map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span
                    className={`${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {stat.label}
                  </span>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {[
                  { topic: "Science Fair", posts: 24 },
                  { topic: "Sports Day", posts: 18 },
                  { topic: "Art Exhibition", posts: 15 },
                ].map((topic, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    } hover:shadow-md transition-shadow`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{topic.topic}</span>
                      <span
                        className="text-sm px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${colorSchemes[currentTheme].primary}20`,
                          color: colorSchemes[currentTheme].primary,
                        }}
                      >
                        {topic.posts} posts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Parent-Teacher Meeting",
                    date: "Feb 20",
                    icon: Users,
                  },
                  {
                    title: "Science Exhibition",
                    date: "Feb 25",
                    icon: BookOpen,
                  },
                  {
                    title: "Sports Day",
                    date: "Mar 5",
                    icon: Award,
                  },
                ].map((event, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    } hover:shadow-md transition-shadow`}
                  >
                    <div
                      className="p-2 rounded-full"
                      style={{
                        backgroundColor: `${colorSchemes[currentTheme].primary}20`,
                      }}
                    >
                      <event.icon
                        className="w-5 h-5"
                        style={{ color: colorSchemes[currentTheme].primary }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {event.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;

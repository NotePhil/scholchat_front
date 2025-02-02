import React, { useState } from "react";
import { LayoutWrapper } from "../LayoutWrapper";
import {
  Book,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Filter,
  TrendingUp,
  Users,
  GraduationCap,
} from "lucide-react";

// Enhanced Card component with new styling
const Card = ({
  title,
  icon: Icon,
  children,
  className = "",
  isDark,
  currentTheme,
  colorSchemes,
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl group ${
      isDark
        ? "bg-gradient-to-br from-gray-800/40 to-gray-900/40"
        : "bg-gradient-to-br from-gray-50 to-gray-100/50"
    } ${className}`}
    style={{
      backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.8)",
    }}
  >
    {/* Hover overlay */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500"
      style={{
        backgroundColor: colorSchemes[currentTheme].primary,
      }}
    />

    <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3
          className={`text-xl font-semibold transition-colors duration-300 ${
            isDark ? "text-gray-100" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
        <div
          className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
          style={{
            boxShadow: `0 4px 12px ${colorSchemes[currentTheme].primary}20`,
          }}
        >
          <Icon
            className="w-10 h-10 transition-colors duration-300"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        </div>
      </div>

      {children}
    </div>
  </div>
);

// Keep the existing StatusBadge component
const StatusBadge = ({ status, currentTheme, colorSchemes }) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "upcoming":
        return "bg-purple-500";
      case "ongoing":
        return colorSchemes[currentTheme].primary;
      case "graded":
        return colorSchemes[currentTheme].primary;
      default:
        return "bg-gray-500";
    }
  };

  return (
    <span
      className={`${getStatusColor()} text-white text-xs px-2 py-1 rounded-full`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Keep the existing StatsCard component
const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  isDark,
  currentTheme,
  colorSchemes,
}) => (
  <Card
    title={title}
    icon={Icon}
    isDark={isDark}
    currentTheme={currentTheme}
    colorSchemes={colorSchemes}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-2xl font-semibold mt-1 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">{trend}</span>
          </div>
        )}
      </div>
    </div>
  </Card>
);

const DashboardContent = ({ isDark, themes, currentTheme, colorSchemes }) => {
  const [selectedClass, setSelectedClass] = useState("all");

  // Keep existing data
  const courses = [
    {
      id: 1,
      name: "Mathematics",
      date: "2025-02-01",
      grade: "A",
      class: "Class-A",
      progress: 85,
    },
    {
      id: 2,
      name: "Physics",
      date: "2025-01-30",
      grade: "B+",
      class: "Class-B",
      progress: 72,
    },
    {
      id: 3,
      name: "Chemistry",
      date: "2025-01-29",
      grade: "A-",
      class: "Class-A",
      progress: 90,
    },
  ];

  const assignments = [
    {
      id: 1,
      title: "Math Homework",
      status: "pending",
      dueDate: "2025-02-05",
      class: "Class-A",
      subject: "Mathematics",
    },
    {
      id: 2,
      title: "Physics Lab Report",
      status: "completed",
      dueDate: "2025-01-28",
      class: "Class-B",
      subject: "Physics",
    },
    {
      id: 3,
      title: "Chemistry Quiz",
      status: "graded",
      dueDate: "2025-01-25",
      class: "Class-A",
      subject: "Chemistry",
    },
  ];

  const events = [
    {
      id: 1,
      title: "Science Fair",
      status: "upcoming",
      date: "2025-02-15",
      class: "Class-A",
      location: "Main Hall",
    },
    {
      id: 2,
      title: "Parent-Teacher Meeting",
      status: "ongoing",
      date: "2025-02-01",
      class: "Class-B",
      location: "Room 101",
    },
    {
      id: 3,
      title: "Sports Day",
      status: "past",
      date: "2025-01-20",
      class: "Class-A",
      location: "Sports Ground",
    },
  ];

  const classes = ["all", "Class-A", "Class-B"];

  const filterItems = (items) => {
    if (selectedClass === "all") return items;
    return items.filter((item) => item.class === selectedClass);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Courses"
          value="8"
          icon={Book}
          trend="+2 new this semester"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Current GPA"
          value="3.8"
          icon={GraduationCap}
          trend="Up 0.2 from last semester"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Assignments Due"
          value="5"
          icon={CheckCircle}
          trend="2 due this week"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Class Attendance"
          value="95%"
          icon={Users}
          trend="Above class average"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
      </div>

      {/* Filter Section */}
      <div className="flex justify-between items-center">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Student Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Filter className={isDark ? "text-gray-400" : "text-gray-600"} />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              isDark
                ? "border-gray-700 bg-gray-800 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
            style={{
              "--tw-ring-color": colorSchemes[currentTheme].primary,
            }}
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls === "all" ? "All Classes" : cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Courses Card */}
        <Card
          title="Active Courses"
          icon={Book}
          className="col-span-full"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(courses).map((course) => (
              <div
                key={course.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                }`}
              >
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {course.name}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {course.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={isDark ? "text-gray-400" : "text-gray-600"}>
                      Progress
                    </div>
                    <div
                      className="text-lg font-semibold"
                      style={{ color: colorSchemes[currentTheme].primary }}
                    >
                      {course.progress}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Assignments Card */}
        <Card
          title="Assignments"
          icon={CheckCircle}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(assignments).map((assignment) => (
              <div
                key={assignment.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {assignment.title}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {assignment.subject} • Due: {assignment.dueDate}
                  </p>
                </div>
                <StatusBadge
                  status={assignment.status}
                  currentTheme={currentTheme}
                  colorSchemes={colorSchemes}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Events Card */}
        <Card
          title="Upcoming Events"
          icon={Calendar}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(events).map((event) => (
              <div
                key={event.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {event.title}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {event.location} • {event.date}
                  </p>
                </div>
                <StatusBadge
                  status={event.status}
                  currentTheme={currentTheme}
                  colorSchemes={colorSchemes}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Messages Card */}
        <Card
          title="Quick Message"
          icon={Mail}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            <textarea
              className={`w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              style={{ "--tw-ring-color": colorSchemes[currentTheme].primary }}
              rows="4"
              placeholder="Type your message here..."
            />
            <button
              className="w-full px-4 py-2 text-white rounded-lg transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            >
              Send Message
            </button>
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card
          title="Recent Activity"
          icon={Clock}
          className="col-span-full"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(
              [...courses, ...assignments, ...events]
                .sort(
                  (a, b) =>
                    new Date(b.date || b.dueDate) -
                    new Date(a.date || a.dueDate)
                )
                .slice(0, 5)
            ).map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.name || item.title}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {item.date || item.dueDate}
                  </p>
                </div>
                {item.status && (
                  <StatusBadge
                    status={item.status}
                    currentTheme={currentTheme}
                    colorSchemes={colorSchemes}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  return (
    <LayoutWrapper>
      {({ isDark, themes, currentTheme, colorSchemes }) => (
        <DashboardContent
          isDark={isDark}
          themes={themes}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
      )}
    </LayoutWrapper>
  );
};

export default StudentDashboard;
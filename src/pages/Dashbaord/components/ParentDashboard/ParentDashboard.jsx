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
  Target,
  MessageCircle,
} from "lucide-react";

// Enhanced Card component (reusing from StudentDashboard with minor modifications)
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
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500"
      style={{
        backgroundColor: colorSchemes[currentTheme].primary,
      }}
    />

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <h3
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
        <div
          className={`p-4 rounded-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <Icon
            className="w-10 h-10"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        </div>
      </div>
      {children}
    </div>
  </div>
);

const StatusBadge = ({ status, currentTheme, colorSchemes }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "upcoming":
        return "bg-purple-500";
      case "ongoing":
        return colorSchemes[currentTheme].primary;
      case "overdue":
        return "bg-red-500";
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

const DashboardContent = ({ isDark, currentTheme, colorSchemes }) => {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");

  // Sample data
  const students = [
    { id: 1, name: "Emma Smith", class: "Class-A" },
    { id: 2, name: "Lucas Brown", class: "Class-B" },
  ];

  const objectives = [
    {
      id: 1,
      student: "Emma Smith",
      class: "Class-A",
      subject: "Mathematics",
      objective: "Master quadratic equations",
      progress: 85,
      date: "2025-02-01",
    },
    {
      id: 2,
      student: "Lucas Brown",
      class: "Class-B",
      subject: "Physics",
      objective: "Complete lab experiments",
      progress: 70,
      date: "2025-01-30",
    },
  ];

  const assignments = [
    {
      id: 1,
      student: "Emma Smith",
      class: "Class-A",
      title: "Math Assignment",
      status: "pending",
      dueDate: "2025-02-05",
    },
    {
      id: 2,
      student: "Lucas Brown",
      class: "Class-B",
      title: "Physics Report",
      status: "completed",
      dueDate: "2025-01-28",
    },
  ];

  const events = [
    {
      id: 1,
      title: "Parent-Teacher Meeting",
      status: "upcoming",
      date: "2025-02-15",
      class: "Class-A",
      student: "Emma Smith",
    },
    {
      id: 2,
      title: "Science Fair",
      status: "ongoing",
      date: "2025-02-01",
      class: "Class-B",
      student: "Lucas Brown",
    },
  ];

  const filterItems = (items) => {
    return items.filter((item) => {
      const classMatch =
        selectedClass === "all" || item.class === selectedClass;
      const studentMatch =
        selectedStudent === "all" || item.student === selectedStudent;
      return classMatch && studentMatch;
    });
  };

  const classes = ["all", ...new Set(students.map((s) => s.class))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Parent Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className={isDark ? "text-gray-400" : "text-gray-600"} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`border rounded-md px-3 py-2 text-sm ${
                isDark
                  ? "border-gray-700 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-gray-800"
              }`}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className={isDark ? "text-gray-400" : "text-gray-600"} />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className={`border rounded-md px-3 py-2 text-sm ${
                isDark
                  ? "border-gray-700 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-gray-800"
              }`}
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.name}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Objectives Card */}
        <Card
          title="Learning Objectives"
          icon={Target}
          className="col-span-full"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(objectives).map((objective) => (
              <div
                key={objective.id}
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
                    {objective.subject} - {objective.objective}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {objective.student} • {objective.date}
                  </p>
                </div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: colorSchemes[currentTheme].primary }}
                >
                  {objective.progress}%
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
                    {assignment.student} • Due: {assignment.dueDate}
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
          title="Events"
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
                    {event.student} • {event.date}
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

        {/* Message Card */}
        <Card
          title="Quick Message"
          icon={MessageCircle}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            <select
              className={`w-full p-3 rounded-lg ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">Select recipient...</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Administration</option>
            </select>
            <textarea
              className={`w-full p-3 rounded-lg resize-none ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              rows="4"
              placeholder="Type your message here..."
            />
            <button
              className="w-full px-4 py-2 text-white rounded-lg transition-colors duration-200"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            >
              Send Message
            </button>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card
          title="Activity Feed"
          icon={Clock}
          className="col-span-full"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        >
          <div className="space-y-4">
            {filterItems(
              [...objectives, ...assignments, ...events]
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
                    {item.title || item.objective}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {item.student} • {item.date || item.dueDate}
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

const ParentDashboard = () => {
  return (
    <LayoutWrapper>
      {({ isDark, currentTheme, colorSchemes }) => (
        <DashboardContent
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
      )}
    </LayoutWrapper>
  );
};

export default ParentDashboard;

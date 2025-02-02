import React, { useState } from "react";
import { LayoutWrapper } from "../LayoutWrapper";
import {
  Book,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Filter,
  Target,
  Users,
  Bell,
} from "lucide-react";

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
            isDark ? "text-gray-100" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
        <div
          className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
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

const StatusBadge = ({ status, currentTheme, colorSchemes }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "completed":
      case "corrected":
        return "bg-green-500";
      case "pending":
      case "to-do":
        return "bg-yellow-500";
      case "upcoming":
        return "bg-purple-500";
      case "ongoing":
        return colorSchemes[currentTheme].primary;
      case "past":
        return "bg-gray-500";
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
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  </Card>
);

const DashboardContent = ({ isDark, currentTheme, colorSchemes }) => {
  const [selectedClass, setSelectedClass] = useState("all");

  const objectives = [
    {
      id: 1,
      title: "Complete Chapter 5 Review",
      class: "Mathematics 101",
      date: "2025-02-01",
      status: "ongoing",
    },
    {
      id: 2,
      title: "Prepare Mid-term Exam",
      class: "Physics 201",
      date: "2025-02-05",
      status: "upcoming",
    },
    {
      id: 3,
      title: "Grade Lab Reports",
      class: "Chemistry 101",
      date: "2025-01-30",
      status: "completed",
    },
  ];

  const assignments = [
    {
      id: 1,
      title: "Differential Equations",
      class: "Mathematics 101",
      status: "to-do",
      dueDate: "2025-02-05",
    },
    {
      id: 2,
      title: "Physics Lab Report",
      class: "Physics 201",
      status: "corrected",
      dueDate: "2025-01-28",
    },
    {
      id: 3,
      title: "Chemical Reactions Quiz",
      class: "Chemistry 101",
      status: "pending",
      dueDate: "2025-02-03",
    },
  ];

  const events = [
    {
      id: 1,
      title: "Department Meeting",
      class: "All Classes",
      date: "2025-02-15",
      status: "upcoming",
      location: "Room 301",
    },
    {
      id: 2,
      title: "Parent-Teacher Conference",
      class: "Mathematics 101",
      date: "2025-02-01",
      status: "ongoing",
      location: "Main Hall",
    },
    {
      id: 3,
      title: "Science Exhibition",
      class: "Physics 201",
      date: "2025-01-20",
      status: "past",
      location: "Lab Complex",
    },
  ];

  const classes = ["all", "Mathematics 101", "Physics 201", "Chemistry 101"];

  const filterItems = (items) => {
    if (selectedClass === "all") return items;
    return items.filter((item) => item.class === selectedClass);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Classes"
          value="3"
          icon={Book}
          trend="2 pending requests"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Total Students"
          value="87"
          icon={Users}
          trend="↑ 12 this semester"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Pending Assignments"
          value="15"
          icon={CheckCircle}
          trend="5 need grading"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
        <StatsCard
          title="Upcoming Events"
          value="4"
          icon={Calendar}
          trend="Next: Department Meeting"
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
      </div>

      <div className="flex justify-between items-center">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Professor Dashboard
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
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls === "all" ? "All Classes" : cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Class Objectives"
          icon={Target}
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
                <div>
                  <h3
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {objective.title}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {objective.class} • {objective.date}
                  </p>
                </div>
                <StatusBadge
                  status={objective.status}
                  currentTheme={currentTheme}
                  colorSchemes={colorSchemes}
                />
              </div>
            ))}
          </div>
        </Card>

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
                    {assignment.class} • Due: {assignment.dueDate}
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

        <Card
          title="Class Events"
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
              rows="4"
              placeholder="Send a message to your class..."
            />
            <button
              className="w-full px-4 py-2 text-white rounded-lg transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            >
              Send Message
            </button>
          </div>
        </Card>

        <Card
          title="Recent Activity"
          icon={Clock}
          className="col-span-2"
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
                    {item.title}
                  </h3>
                  <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                    {item.class} • {item.date || item.dueDate}
                  </p>
                </div>
                <StatusBadge
                  status={item.status}
                  currentTheme={currentTheme}
                  colorSchemes={colorSchemes}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProfessorDashboard = () => {
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

export default ProfessorDashboard;

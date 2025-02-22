import React, { useState } from "react";
import { LayoutWrapper } from "../LayoutWrapper";
import {
  Book,
  ClipboardList,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  PlusCircle,
  Edit,
  Trash,
  Clock,
  Calendar,
  Search,
  ArrowRight, // Import ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "../common/StatsCard";
const StatCard = ({
  title,
  icon: Icon,
  count,
  activeCount,
  tabName,
  isDark,
  themes,
  currentTheme,
  colorSchemes,
  setActiveTab,
  onViewAll,
  showViewAll = true,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl group ${
        isDark
          ? "bg-gradient-to-br from-gray-800/40 to-gray-900/40"
          : "bg-gradient-to-br from-gray-50 to-gray-100/50"
      }`}
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

        {/* Stats */}
        <div className="space-y-4">
          <div
            className="text-5xl font-bold tracking-tight transition-colors duration-300"
            style={{ color: colorSchemes[currentTheme].primary }}
          >
            {count.toLocaleString()}
          </div>
          <div className="flex items-center space-x-3">
            <div
              className="h-3 w-3 rounded-full transition-colors duration-300 animate-pulse"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            />
            <p
              className={`text-base transition-colors duration-300 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <span className="font-medium">
                {activeCount.toLocaleString()}
              </span>{" "}
              active
            </p>
          </div>
        </div>

        {/* View All Button */}
        {showViewAll && (
          <button
            className="mt-8 w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:opacity-90 group-hover:scale-105"
            style={{
              backgroundColor: colorSchemes[currentTheme].primary,
              color: "white",
              boxShadow: `0 4px 12px ${colorSchemes[currentTheme].primary}40`,
            }}
            onClick={() => {
              if (onViewAll && typeof onViewAll === "function") {
                onViewAll(tabName.toLowerCase());
              }
              if (setActiveTab && typeof setActiveTab === "function") {
                setActiveTab(tabName.toLowerCase());
              }
            }}
          >
            <span>View Details</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
const TaskCard = ({
  title,
  icon: Icon,
  children,
  isDark,
  currentTheme,
  colorSchemes,
  expanded,
  onToggle,
}) => (
  <div
    className={`rounded-xl overflow-hidden transition-all duration-300 ${
      isDark ? "bg-gray-800/40" : "bg-white"
    }`}
  >
    <div
      className="p-6 flex items-center justify-between cursor-pointer hover:bg-opacity-90"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        </div>
        <h3
          className={`text-lg font-semibold ${
            isDark ? "text-gray-100" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
      </div>
      {expanded ? (
        <ChevronUp className="w-5 h-5" />
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </div>
    {expanded && (
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        {children}
      </div>
    )}
  </div>
);

const StatusBadge = ({ status, currentTheme, colorSchemes }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-yellow-500";
      case "graded":
        return "bg-green-500";
      case "pending":
        return colorSchemes[currentTheme].primary;
      case "late":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <span
      className={`${getStatusColor()} text-white text-xs px-2 py-1 rounded-full`}
    >
      {status}
    </span>
  );
};

const TeacherDashboard = ({
  isDark = false,
  currentTheme = "light",
  colorSchemes = {
    light: { primary: "#2563eb", secondary: "#9333ea", gradient: {} },
    dark: { primary: "#60a5fa", secondary: "#c084fc", gradient: {} },
  },
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");

  // Sample data
  const classes = [
    { id: 1, name: "Mathematics 101", code: "MATH101", students: 30 },
    { id: 2, name: "Physics 201", code: "PHYS201", students: 25 },
    { id: 3, name: "Chemistry 301", code: "CHEM301", students: 28 },
  ];

  const assignments = [
    {
      id: 1,
      title: "Calculus Quiz",
      class: "Mathematics 101",
      dueDate: "2025-02-25",
      status: "pending",
      submissions: 15,
    },
    {
      id: 2,
      title: "Physics Lab Report",
      class: "Physics 201",
      dueDate: "2025-02-23",
      status: "graded",
      submissions: 25,
    },
    {
      id: 3,
      title: "Chemical Equations",
      class: "Chemistry 301",
      dueDate: "2025-02-20",
      status: "submitted",
      submissions: 20,
    },
  ];

  const submissions = [
    {
      id: 1,
      student: "Alice Smith",
      assignment: "Calculus Quiz",
      date: "2025-02-20",
      status: "submitted",
    },
    {
      id: 2,
      student: "Bob Johnson",
      assignment: "Physics Lab Report",
      date: "2025-02-19",
      status: "graded",
    },
  ];

  const performanceData = [
    { month: "Jan", average: 85, submissions: 120 },
    { month: "Feb", average: 88, submissions: 150 },
    { month: "Mar", average: 82, submissions: 140 },
    { month: "Apr", average: 90, submissions: 160 },
  ];

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Classes"
            icon={Book}
            count={classes.length}
            activeCount={classes.length} // Assuming all classes are active
            tabName="classes"
            isDark={isDark}
            themes={{}}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            setActiveTab={() => {}}
            onViewAll={() => {}}
            showViewAll={false}
          />
          <StatCard
            title="Total Students"
            icon={Users}
            count={83} // Example count
            activeCount={83} // Example active count
            tabName="students"
            isDark={isDark}
            themes={{}}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            setActiveTab={() => {}}
            onViewAll={() => {}}
            showViewAll={false}
          />
          <StatCard
            title="Pending Assignments"
            icon={ClipboardList}
            count={assignments.filter((a) => a.status === "pending").length}
            activeCount={
              assignments.filter((a) => a.status === "pending").length
            }
            tabName="assignments"
            isDark={isDark}
            themes={{}}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            setActiveTab={() => {}}
            onViewAll={() => {}}
            showViewAll={false}
          />
          <StatCard
            title="Recent Submissions"
            icon={FileText}
            count={submissions.length}
            activeCount={submissions.length}
            tabName="submissions"
            isDark={isDark}
            themes={{}}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            setActiveTab={() => {}}
            onViewAll={() => {}}
            showViewAll={false}
          />
        </div>

        {/* Task Cards */}
        <div className="space-y-4">
          {/* Class Management Card */}
          <TaskCard
            title="Class Management"
            icon={Book}
            isDark={isDark}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            expanded={expandedCard === "classes"}
            onToggle={() =>
              setExpandedCard(expandedCard === "classes" ? null : "classes")
            }
          >
            {/* Class Management Content */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search classes..."
                      className={`pl-10 pr-4 py-2 rounded-lg ${
                        isDark
                          ? "bg-gray-700 text-white placeholder-gray-400"
                          : "bg-gray-100 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <select
                    className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <option value="all">All Semesters</option>
                    <option value="current">Current Semester</option>
                    <option value="past">Past Semesters</option>
                  </select>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                  style={{
                    backgroundColor: colorSchemes[currentTheme].primary,
                  }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Class
                </button>
              </div>

              <div className="grid gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      isDark ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <h4
                        className={`font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {cls.name}
                      </h4>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Code: {cls.code} • Students: {cls.students}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={`p-2 rounded-lg ${
                          isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg ${
                          isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TaskCard>

          {/* Assignment Management Card */}
          <TaskCard
            title="Assignment Management"
            icon={ClipboardList}
            isDark={isDark}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            expanded={expandedCard === "assignments"}
            onToggle={() =>
              setExpandedCard(
                expandedCard === "assignments" ? null : "assignments"
              )
            }
          >
            {/* Assignment Management Content */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                  style={{
                    backgroundColor: colorSchemes[currentTheme].primary,
                  }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Assignment
                </button>
              </div>

              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-lg ${
                      isDark ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className={`font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {assignment.title}
                        </h4>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {assignment.class} • Due: {assignment.dueDate}
                        </p>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Submissions: {assignment.submissions} students
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge
                          status={assignment.status}
                          currentTheme={currentTheme}
                          colorSchemes={colorSchemes}
                        />
                        <div className="flex gap-2">
                          <button
                            className={`p-2 rounded-lg ${
                              isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-2 rounded-lg ${
                              isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                            }`}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TaskCard>

          {/* Submissions & Grading Card */}
          <TaskCard
            title="Submissions & Grading"
            icon={CheckSquare}
            isDark={isDark}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            expanded={expandedCard === "submissions"}
            onToggle={() =>
              setExpandedCard(
                expandedCard === "submissions" ? null : "submissions"
              )
            }
          >
            {/* Submissions & Grading Content */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <select
                  className={`px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <option value="all">All Assignments</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>

                <select
                  className={`px-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div className="grid gap-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`p-4 rounded-lg ${
                      isDark ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className={`font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {submission.student}
                        </h4>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {submission.assignment} • Submitted: {submission.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge
                          status={submission.status}
                          currentTheme={currentTheme}
                          colorSchemes={colorSchemes}
                        />
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{
                            backgroundColor: colorSchemes[currentTheme].primary,
                          }}
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Submission Analytics
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
                      />
                      <YAxis tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1f2937" : "#ffffff",
                          border: "none",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar
                        dataKey="average"
                        fill={colorSchemes[currentTheme].primary}
                        name="Class Average"
                      />
                      <Bar
                        dataKey="submissions"
                        fill={colorSchemes[currentTheme].secondary}
                        name="Total Submissions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TaskCard>

          {/* Daily Report Card */}
          <TaskCard
            title="Daily Reports"
            icon={FileText}
            isDark={isDark}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            expanded={expandedCard === "reports"}
            onToggle={() =>
              setExpandedCard(expandedCard === "reports" ? null : "reports")
            }
          >
            {/* Daily Report Content */}
            <div className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div
                  className={`p-4 rounded-lg flex-1 ${
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Today's Classes
                  </h4>
                  <p
                    className={`text-2xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    3
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg flex-1 ${
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Assignments Due
                  </h4>
                  <p
                    className={`text-2xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    2
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg flex-1 ${
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    New Submissions
                  </h4>
                  <p
                    className={`text-2xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    15
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4
                      className={`font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Today's Schedule
                    </h4>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        time: "09:00 AM",
                        class: "Mathematics 101",
                        room: "Room 301",
                      },
                      { time: "11:00 AM", class: "Physics 201", room: "Lab 2" },
                      {
                        time: "02:00 PM",
                        class: "Chemistry 301",
                        room: "Lab 4",
                      },
                    ].map((schedule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span
                            className={
                              isDark ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            {schedule.time}
                          </span>
                        </div>
                        <span
                          className={isDark ? "text-white" : "text-gray-900"}
                        >
                          {schedule.class}
                        </span>
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-600"}
                        >
                          {schedule.room}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                    style={{
                      backgroundColor: colorSchemes[currentTheme].primary,
                    }}
                  >
                    Generate Daily Report
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isDark
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    Export Schedule
                  </button>
                </div>
              </div>
            </div>
          </TaskCard>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default TeacherDashboard;

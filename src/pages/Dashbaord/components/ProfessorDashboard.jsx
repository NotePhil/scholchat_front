import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
} from "@heroicons/react/solid";
import ActivityFeed from "./StudentDashboard/ActivityFeed";
import StatsCard from "./common/StatsCard";
import ClassSchedule from "./ClassSchedule";
import { themes, colorSchemes } from "../Theme";
import StudentPerformanceChart from "./StudentPerformanceChart";
import { mockProfessorData } from "./mockProfessorData";

const ProfessorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({
    students: [],
    classes: [],
    upcomingClasses: [],
    recentActivities: [],
  });
  const [activeSection, setActiveSection] = useState("overview");

  const theme = isDark ? "dark" : "light";
  const colorScheme = colorSchemes[currentTheme] || {};

  useEffect(() => {
    const loadMockData = () => {
      try {
        // Get upcoming classes (next 7 days)
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const upcomingClasses = mockProfessorData.classes
          .filter((cls) => {
            const classDate = new Date(cls.scheduledDate);
            return classDate >= now && classDate <= nextWeek;
          })
          .sort(
            (a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)
          );

        setStats({
          students: mockProfessorData.students,
          classes: mockProfessorData.classes,
          upcomingClasses,
          recentActivities: mockProfessorData.activities,
        });
        setLoading(false);
      } catch (err) {
        setError("Error loading dashboard data");
        setLoading(false);
      }
    };

    // Simulate API delay
    setTimeout(loadMockData, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  // Helper function to get recent student submissions
  const getRecentSubmissions = () => {
    return stats.recentActivities
      .filter((activity) => activity.type === "submission")
      .slice(0, 5);
  };

  // Helper function to get upcoming deadlines
  const getUpcomingDeadlines = () => {
    const now = new Date();
    return stats.classes
      .filter((cls) => cls.assignments)
      .flatMap((cls) =>
        cls.assignments.map((assignment) => ({
          ...assignment,
          className: cls.name,
        }))
      )
      .filter((assignment) => new Date(assignment.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  };

  const renderDashboardStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={stats.students.length}
          icon={<UserGroupIcon className="h-8 w-8" />}
          change={+5}
          changeLabel="from last month"
          theme={theme}
          color={colorScheme.primary}
        />
        <StatsCard
          title="Active Classes"
          value={stats.classes.length}
          icon={<BookOpenIcon className="h-8 w-8" />}
          change={+1}
          changeLabel="from last month"
          theme={theme}
          color={colorScheme.secondary}
        />
        <StatsCard
          title="Upcoming Classes"
          value={stats.upcomingClasses.length}
          icon={<ClockIcon className="h-8 w-8" />}
          changeLabel="this week"
          theme={theme}
          color={colorScheme.accent}
        />
        <StatsCard
          title="Assignments"
          value={getUpcomingDeadlines().length}
          icon={<CalendarIcon className="h-8 w-8" />}
          changeLabel="pending review"
          theme={theme}
          color={colorScheme.highlight}
        />
      </div>
    );
  };

  const renderOverview = () => {
    return (
      <>
        {renderDashboardStats()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className={`bg-${
              theme === "dark" ? "gray-800" : "white"
            } rounded-lg shadow-md p-6 lg:col-span-1`}
          >
            <h2
              className={`text-xl font-semibold mb-4 text-${
                theme === "dark" ? "white" : "gray-800"
              }`}
            >
              Recent Activity
            </h2>
            <ActivityFeed
              activities={stats.recentActivities.slice(0, 10)}
              theme={theme}
              colorSchemes={colorSchemes}
              currentTheme={currentTheme}
              isDark={isDark}
            />
          </div>

          <div
            className={`bg-${
              theme === "dark" ? "gray-800" : "white"
            } rounded-lg shadow-md p-6 lg:col-span-2`}
          >
            <h2
              className={`text-xl font-semibold mb-4 text-${
                theme === "dark" ? "white" : "gray-800"
              }`}
            >
              Class Performance Overview
            </h2>
            <StudentPerformanceChart
              classes={stats.classes}
              theme={theme}
              colorScheme={colorScheme}
            />
          </div>
        </div>

        <div
          className={`mt-6 bg-${
            theme === "dark" ? "gray-800" : "white"
          } rounded-lg shadow-md p-6`}
        >
          <h2
            className={`text-xl font-semibold mb-4 text-${
              theme === "dark" ? "white" : "gray-800"
            }`}
          >
            Upcoming Classes
          </h2>
          <ClassSchedule
            classes={stats.upcomingClasses}
            theme={theme}
            colorScheme={colorScheme}
          />
        </div>
      </>
    );
  };

  const renderSchedule = () => {
    return (
      <div
        className={`bg-${
          theme === "dark" ? "gray-800" : "white"
        } rounded-lg shadow-md p-6`}
      >
        <h2
          className={`text-xl font-semibold mb-4 text-${
            theme === "dark" ? "white" : "gray-800"
          }`}
        >
          Your Schedule
        </h2>
        <ClassSchedule
          classes={stats.classes}
          showAll={true}
          theme={theme}
          colorScheme={colorScheme}
        />
      </div>
    );
  };

  const renderAssignments = () => {
    const deadlines = getUpcomingDeadlines();
    const submissions = getRecentSubmissions();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`bg-${
            theme === "dark" ? "gray-800" : "white"
          } rounded-lg shadow-md p-6`}
        >
          <h2
            className={`text-xl font-semibold mb-4 text-${
              theme === "dark" ? "white" : "gray-800"
            }`}
          >
            Upcoming Deadlines
          </h2>
          {deadlines.length > 0 ? (
            <ul className="space-y-4">
              {deadlines.map((assignment, index) => (
                <li
                  key={index}
                  className={`border-l-4 border-${colorScheme.primary} pl-4 py-2`}
                >
                  <h3
                    className={`font-medium text-${
                      theme === "dark" ? "white" : "gray-800"
                    }`}
                  >
                    {assignment.title}
                  </h3>
                  <p
                    className={`text-sm text-${
                      theme === "dark" ? "gray-300" : "gray-600"
                    }`}
                  >
                    {assignment.className}
                  </p>
                  <p
                    className={`text-xs mt-1 text-${
                      theme === "dark" ? "gray-400" : "gray-500"
                    }`}
                  >
                    Due: {new Date(assignment.dueDate).toLocaleDateString()} at{" "}
                    {new Date(assignment.dueDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-${theme === "dark" ? "gray-400" : "gray-500"}`}>
              No upcoming deadlines
            </p>
          )}
        </div>

        <div
          className={`bg-${
            theme === "dark" ? "gray-800" : "white"
          } rounded-lg shadow-md p-6`}
        >
          <h2
            className={`text-xl font-semibold mb-4 text-${
              theme === "dark" ? "white" : "gray-800"
            }`}
          >
            Recent Submissions
          </h2>
          {submissions.length > 0 ? (
            <ul className="space-y-4">
              {submissions.map((submission, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-3 py-3 border-b border-${
                    theme === "dark" ? "gray-700" : "gray-200"
                  } last:border-0`}
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-${colorScheme.secondary} flex items-center justify-center flex-shrink-0`}
                  >
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`font-medium text-${
                        theme === "dark" ? "white" : "gray-800"
                      }`}
                    >
                      {submission.studentName}
                    </h3>
                    <p
                      className={`text-sm text-${
                        theme === "dark" ? "gray-300" : "gray-600"
                      }`}
                    >
                      Submitted: {submission.assignmentTitle}
                    </p>
                    <p
                      className={`text-xs mt-1 text-${
                        theme === "dark" ? "gray-400" : "gray-500"
                      }`}
                    >
                      {new Date(submission.timestamp).toLocaleDateString()} at{" "}
                      {new Date(submission.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-${theme === "dark" ? "gray-400" : "gray-500"}`}>
              No recent submissions
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${isDark ? themes.dark.background : themes.light.background}`}
    >
      <div className="mb-8">
        <h1
          className={`text-2xl font-bold text-${
            theme === "dark" ? "white" : "gray-800"
          }`}
        >
          Professor Dashboard
        </h1>
        <p className={`text-${theme === "dark" ? "gray-300" : "gray-600"}`}>
          Welcome back! Here's an overview of your teaching activities.
        </p>
      </div>

      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection("overview")}
          className={`px-4 py-2 font-medium text-sm ${
            activeSection === "overview"
              ? `border-b-2 border-${colorScheme.primary} text-${colorScheme.primary}`
              : `text-${
                  theme === "dark" ? "gray-400" : "gray-500"
                } hover:text-${theme === "dark" ? "gray-200" : "gray-700"}`
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection("schedule")}
          className={`px-4 py-2 font-medium text-sm ${
            activeSection === "schedule"
              ? `border-b-2 border-${colorScheme.primary} text-${colorScheme.primary}`
              : `text-${
                  theme === "dark" ? "gray-400" : "gray-500"
                } hover:text-${theme === "dark" ? "gray-200" : "gray-700"}`
          }`}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveSection("assignments")}
          className={`px-4 py-2 font-medium text-sm ${
            activeSection === "assignments"
              ? `border-b-2 border-${colorScheme.primary} text-${colorScheme.primary}`
              : `text-${
                  theme === "dark" ? "gray-400" : "gray-500"
                } hover:text-${theme === "dark" ? "gray-200" : "gray-700"}`
          }`}
        >
          Assignments
        </button>
      </div>

      {activeSection === "overview" && renderOverview()}
      {activeSection === "schedule" && renderSchedule()}
      {activeSection === "assignments" && renderAssignments()}
    </div>
  );
};

export default ProfessorDashboard;

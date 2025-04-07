import React, { useState, useEffect } from "react";
import { useNavigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// Import all dashboard components
import ProfessorDashboard from "../Dashbaord/components/ProfessorDashboard";
import StudentDashboard from "../Dashbaord/components/StudentDashboard/StudentDashboard";
import ParentDashboard from "../Dashbaord/components/ParentDashboard/ParentDashboard";
import ClassesPage from "../Dashbaord/ClassesPage";
import EmailDashboard from "../Dashbaord/components/StudentDashboard/EmailDashboard";
import ProfesseurMotifPage from "../Dashbaord/components/ProfesseurMotifPage";
import StudentPage from "../../pages/childrenPage/StudentPage";
import ProfessorPage from "../../pages/childrenPage/ProfessorPage";
import ParentPage from "../../pages/childrenPage/ParentPage";
import ActivityFeed from "../../pages/childrenPage/ActivityFeed";
import SettingsPage from "../../pages/childrenPage/SettingsPage";
import AssignmentsPage from "../../pages/childrenPage/AssignmentsPage";
import MessagesPage from "../../pages/childrenPage/MessagesPage";
import ChildrenPage from "../../pages/childrenPage/ChildrenPage";
import ProgressPage from "../../pages/childrenPage/ProgressPage";

// Define themes and color schemes as constants outside of the component
export const themes = {
  light: {
    background: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-800",
    border: "border-gray-200",
    hover: "hover:bg-gray-50",
    chartBg: "#ffffff",
    gridColor: "#e5e7eb",
    sidebar: "bg-white border-r border-gray-200",
    activeLink: "bg-blue-600",
  },
  dark: {
    background: "bg-slate-900",
    cardBg: "bg-slate-800",
    text: "text-gray-100",
    border: "border-gray-700",
    hover: "hover:bg-slate-700",
    chartBg: "#1e293b",
    gridColor: "#374151",
    sidebar: "bg-gray-900 border-r border-gray-700",
    activeLink: "bg-blue-700",
  },
};

export const colorSchemes = {
  blue: {
    primary: "#2563eb",
    secondary: "#1d4ed8",
    accent: "#60a5fa",
    hover: "#3b82f6",
    light: "#dbeafe",
    gradient: ["rgba(37, 99, 235, 0.2)", "rgba(37, 99, 235, 0)"],
  },
  green: {
    primary: "#059669",
    secondary: "#047857",
    accent: "#34d399",
    hover: "#10b981",
    light: "#d1fae5",
    gradient: ["rgba(5, 150, 105, 0.2)", "rgba(5, 150, 105, 0)"],
  },
  purple: {
    primary: "#7c3aed",
    secondary: "#6d28d9",
    accent: "#a78bfa",
    hover: "#8b5cf6",
    light: "#ede9fe",
    gradient: ["rgba(124, 58, 237, 0.2)", "rgba(124, 58, 237, 0)"],
  },
  orange: {
    primary: "#ea580c",
    secondary: "#c2410c",
    accent: "#fb923c",
    hover: "#f97316",
    light: "#ffedd5",
    gradient: ["rgba(234, 88, 12, 0.2)", "rgba(234, 88, 12, 0)"],
  },
};

const GeneralDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("student"); // Default to student
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSidebar, setShowSidebar] = useState(true);

  // Theme settings
  const [isDark, setIsDark] = useState(false);
  const currentTheme = isDark ? "dark" : "light";

  // Get user role from localStorage on component mount
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role);
    }

    // Get the last part of the current path to set active tab
    const path = window.location.pathname.split("/").pop();
    if (path) {
      setActiveTab(path);
    }
  }, []);

  // Handle sidebar item click
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    // Generate the appropriate route based on user role and tab
    let route = "/schoolchat/";

    // Route mapping
    const routeMap = {
      dashboard: `${userRole}s/dashboard`, // e.g., students/dashboard, professors/dashboard
      students: "students",
      professors: "professors",
      parents: "parents",
      classes: "classes",
      settings: "settings",
      assignments: "assignments",
      messages: "messages",
      children: "children",
      progress: "progress",
      myClasses: "classes",
      absences: "professeur-motif",
      myChildren: "children",
    };

    route += routeMap[tabId] || tabId;
    navigate(route);
  };

  // Content based on active tab
  const renderContent = () => {
    // Dashboard mapping
    const dashboardMap = {
      professor: <ProfessorDashboard />,
      student: <StudentDashboard />,
      parent: <ParentDashboard />,
    };

    // Content mapping
    const contentMap = {
      dashboard: dashboardMap[userRole] || <StudentDashboard />,
      students: <StudentPage />,
      professors: <ProfessorPage />,
      parents: <ParentPage />,
      classes: <ClassesPage />,
      myClasses: <ClassesPage />,
      settings: <SettingsPage />,
      assignments: <AssignmentsPage />,
      messages: <MessagesPage />,
      children: <ChildrenPage />,
      myChildren: <ChildrenPage />,
      progress: <ProgressPage />,
      absences: <ProfesseurMotifPage />,
      activity: <ActivityFeed />,
    };

    return contentMap[activeTab] || <div>Content not found</div>;
  };

  return (
    <div className={`flex h-screen ${themes[currentTheme].background}`}>
      {/* Sidebar */}
      <Sidebar
        showSidebar={showSidebar}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userRole={userRole}
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${
            isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          } shadow-sm z-10`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
              <h1 className="ml-4 text-lg font-semibold">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
              <div className="ml-4 relative">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                  {localStorage.getItem("username")
                    ? localStorage.getItem("username").charAt(0).toUpperCase()
                    : "U"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main
          className={`flex-1 overflow-auto p-6 ${themes[currentTheme].background}`}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default GeneralDashboard;

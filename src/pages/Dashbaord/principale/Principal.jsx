import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import UsersContent from "./UsersContent";
import ParentsContent from "./ParentsContent";
import ProfessorsContent from "./ProfessorsContent";
import ClassesContent from "./ClassesContent";
import SettingsContent from "./SettingsContent";
import "./Principal.css";

const themes = {
  light: {
    cardBg: "bg-white",
    border: "border-gray-200",
  },
  dark: {
    cardBg: "bg-gray-800",
    border: "border-gray-700",
  },
};

const colorSchemes = {
  blue: {
    primary: "#4a6da7",
    light: "#6889c3",
  },
  green: {
    primary: "#2e7d32",
    light: "#4caf50",
  },
};

const Principal = () => {
  const navigate = useNavigate();
  const { dashboardType } = useParams();
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);

    // If the dashboard type in URL doesn't match the user role, redirect
    const expectedDashboard = `${
      role.charAt(0).toUpperCase() + role.slice(1)
    }Dashboard`;
    if (!dashboardType) {
      navigate(`/schoolchat/Principal/${expectedDashboard}`);
    }
  }, [dashboardType, navigate, userRole]);

  // Function to handle tab changes and update the URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Don't change URL for tab changes, only for the initial dashboard routing
    // If you want to include tab in the URL as well, you could add it here
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const renderContent = () => {
    const contentProps = {
      isDark,
      currentTheme,
      colorSchemes,
      userRole,
    };

    switch (activeTab) {
      case "dashboard":
        return <DashboardContent {...contentProps} />;
      case "users":
        return <UsersContent {...contentProps} />;
      case "parents":
        return <ParentsContent {...contentProps} />;
      case "professors":
        return <ProfessorsContent {...contentProps} />;
      case "students":
        return <UsersContent {...contentProps} label="Students" />;
      case "classes":
        return <ClassesContent {...contentProps} />;
      case "settings":
        return (
          <SettingsContent
            isDark={isDark}
            setIsDark={setIsDark}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
          />
        );
      default:
        return <DashboardContent {...contentProps} />;
    }
  };

  const getTabDisplayName = () => {
    if (
      activeTab === "dashboard" &&
      (userRole === "professor" || userRole === "repetiteur")
    ) {
      return "Activities";
    }
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <div className="principal-container">
      <button className="mobile-menu-button" onClick={toggleSidebar}>
        ☰
      </button>

      <Sidebar
        showSidebar={showSidebar}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDark={isDark}
        currentTheme={currentTheme}
        themes={themes}
        colorSchemes={colorSchemes}
        userRole={userRole}
      />

      <div className="main-content">
        <div className="content-header">
          <h1>{getTabDisplayName()}</h1>
          <div className="user-info">
            <span className="username">
              {localStorage.getItem("userName") || "User"}
            </span>
            <div
              className="avatar"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            >
              {(localStorage.getItem("userName") || "U")[0]}
            </div>
          </div>
        </div>

        <div
          className={`content-body ${isDark ? "bg-gray-900 text-white" : ""}`}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Principal;

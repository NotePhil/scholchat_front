import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import UsersContent from "./UsersContent";
import ParentsContent from "./ParentsContent";
import ProfessorsContent from "./ProfessorsContent";
import ClassesContent from "./ClassesContent";
import SettingsContent from "./SettingsContent";
import ManageClass from "./ManageClass/ManageClass";
import MessagingInterface from "./Messsages/MessagingInterface";
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
  const [userRoles, setUserRoles] = useState([]);
  const [showManageClass, setShowManageClass] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);

    // Get all roles if available
    try {
      const rolesStr = localStorage.getItem("userRoles");
      if (rolesStr) {
        const roles = JSON.parse(rolesStr);
        setUserRoles(roles);
        console.log("All user roles:", roles);
      }
    } catch (error) {
      console.error("Error parsing user roles:", error);
    }

    // Get username for display
    const username = localStorage.getItem("username");
    if (username) {
      localStorage.setItem("userName", username);
    }

    // If the dashboard type in URL doesn't match the user role, redirect
    const expectedDashboard = `${
      role.charAt(0).toUpperCase() + role.slice(1)
    }Dashboard`;
    if (!dashboardType) {
      navigate(`/schoolchat/Principal/${expectedDashboard}`);
    }
  }, [dashboardType, navigate]);

  // Function to handle tab changes and update the URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowManageClass(false);

    // Handle messages tab specially
    if (tab === "messages") {
      setShowMessaging(true);
    } else {
      setShowMessaging(false);
    }
  };

  const handleManageClass = () => {
    setShowManageClass(true);
  };

  const handleBackToClasses = () => {
    setShowManageClass(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Add messaging handlers
  const handleShowMessaging = (conversation = null) => {
    setShowMessaging(true);
    setSelectedConversation(conversation);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedConversation(null);
  };

  const renderContent = () => {
    const contentProps = {
      isDark,
      currentTheme,
      colorSchemes,
      userRole,
      userRoles,
      onManageClass: handleManageClass,
      onShowMessaging: handleShowMessaging,
    };

    if (showManageClass && activeTab === "classes") {
      return <ManageClass onBack={handleBackToClasses} />;
    }

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
      case "messages":
        return <MessagingInterface {...contentProps} />;
      case "settings":
        return (
          <SettingsContent
            isDark={isDark}
            setIsDark={setIsDark}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            userRoles={userRoles}
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
    if (activeTab === "messages") {
      return "Messages";
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
        userRoles={userRoles}
        onShowMessaging={handleShowMessaging}
      />

      <div
        className={`main-content ${
          showMessaging && activeTab !== "messages" ? "with-messaging" : ""
        }`}
      >
        <div className="content-header">
          <h1>{getTabDisplayName()}</h1>
        </div>

        <div
          className={`content-body ${
            isDark ? "bg-gray-900 text-white" : "bg-gray-50"
          }`}
        >
          {renderContent()}
        </div>
      </div>

      {/* Messaging Interface - appears on the right (only when not on messages tab) */}
      {showMessaging && activeTab !== "messages" && (
        <div className="messaging-sidebar">
          <MessagingInterface
            onClose={handleCloseMessaging}
            selectedConversation={selectedConversation}
            isDark={isDark}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            userRole={userRole}
          />
        </div>
      )}
    </div>
  );
};

export default Principal;

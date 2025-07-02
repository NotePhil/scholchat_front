import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import ParentsContent from "./ParentsContent";
import MotifsDeRejet from "./MotifsDeRejet";
import ProfessorsContent from "./ProfessorsContent";
import ClassesContent from "./ClassesContent";
import SettingsContent from "./SettingsContent";
import ManageClass from "./ManageClass/ManageClass";
import MessagingInterface from "./Messsages/MessagingInterface";
import "./Principal.css";
import AdminContent from "./AdminContent";
import StudentsContent from "./StudentsContent";
import OthersContent from "./OthersContent";
import CreateClassContent from "./CreateClassContent";
import ManageClassContent from "./ManageClassContent";
import ClassesListContent from "./ClassesListContent";
import CreateEstablishmentContent from "./CreateEstablishmentContent";
import ManageEstablishmentContent from "./ManageEstablishmentContent";
import ActivitiesContent from "./ActivitiesContent";
import StudentParentStats from "./StudentParentStats";
import ParentClassManagement from "./ParentSidebar/ParentClassManagement";
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

  // Helper function to check if user is parent or student
  const isParentOrStudent = () => {
    return (
      userRoles.includes("ROLE_PARENT") ||
      userRoles.includes("ROLE_STUDENT") ||
      userRole === "parent" ||
      userRole === "student"
    );
  };

  const renderContent = () => {
    const contentProps = {
      isDark,
      currentTheme,
      themes,
      colorSchemes,
      userRole,
      userRoles,
      onManageClass: handleManageClass,
      onShowMessaging: handleShowMessaging,
      onNavigateToClassesList: () => setActiveTab("classes-list"),
    };

    switch (activeTab) {
      case "dashboard":
        // Return StudentParentStats for parents and students, DashboardContent for others
        return isParentOrStudent() ? (
          <StudentParentStats {...contentProps} />
        ) : (
          <DashboardContent {...contentProps} />
        );
      case "activities":
        return <ActivitiesContent {...contentProps} />;
      case "admin":
        return <AdminContent {...contentProps} />;
      case "professors":
        return <ProfessorsContent {...contentProps} />;
      case "motifs-de-rejet":
        return <MotifsDeRejet {...contentProps} />;
      case "parents":
        return <ParentsContent {...contentProps} />;
      case "students":
        return <StudentsContent {...contentProps} />;
      case "others":
        return <OthersContent {...contentProps} />;
      case "classes":
        // Return ParentClassManagement for parents, regular ClassesContent for others
        if (userRole === "parent" || userRoles.includes("ROLE_PARENT")) {
          return <ParentClassManagement {...contentProps} />;
        }
        return showManageClass ? (
          <ManageClass onBack={handleBackToClasses} />
        ) : (
          <ClassesContent {...contentProps} />
        );
      case "create-class":
        return <CreateClassContent {...contentProps} />;
      case "manage-class":
        return <ManageClassContent {...contentProps} />;
      case "classes-list":
        return <ClassesListContent {...contentProps} />;
      case "create-establishment":
        return <CreateEstablishmentContent {...contentProps} />;
      case "manage-establishment":
        return <ManageEstablishmentContent {...contentProps} />;
      case "messages":
        return (
          <div className="messages-content-container">
            <MessagingInterface {...contentProps} />
          </div>
        );
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
        // Default case also uses the same logic as dashboard
        return isParentOrStudent() ? (
          <StudentParentStats {...contentProps} />
        ) : (
          <DashboardContent {...contentProps} />
        );
    }
  };

  const getTabDisplayName = () => {
    if (
      activeTab === "dashboard" &&
      (userRole === "professor" || userRole === "repetiteur")
    ) {
      return "Activities";
    }
    if (activeTab === "dashboard" && isParentOrStudent()) {
      return userRole === "student"
        ? "Mon Tableau de Bord"
        : "Tableau de Bord Parent";
    }
    if (activeTab === "messages") {
      return "Messages";
    }
    if (activeTab === "admin") return "Gérer Administrateurs";
    if (activeTab === "professors") return "Gérer Professeurs";
    if (activeTab === "motifs-de-rejet") return "Motifs de Rejet";
    if (activeTab === "parents") return "Gérer Parents";
    if (activeTab === "students") return "Gérer Élèves";
    if (activeTab === "others") return "Gérer Autres Utilisateurs";
    if (activeTab === "activities") return "Activités";
    if (activeTab === "create-class") return "Créer une Classe";
    if (activeTab === "manage-class") return "Gérer une Classe";
    if (activeTab === "classes-list") return "Liste des Classes";
    if (activeTab === "create-establishment") return "Créer un Établissement";
    if (activeTab === "manage-establishment") return "Gérer un Établissement";

    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <div className={`principal-container ${isDark ? "dark-mode" : ""}`}>
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
          style={{
            display:
              showMessaging && activeTab !== "messages" ? "none" : "block",
            width: showMessaging && activeTab !== "messages" ? "0" : "100%",
          }}
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

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import ParentsContent from "./content/ParentContent/ParentsContent";
import MotifsDeRejet from "./shared/MotifsDeRejet";
import ProfessorsContent from "./content/ProfessorsContent/ProfessorsContent";
import ClassesContent from "./content/AllClassesContent/ClassesContent";
import SettingsContent from "./content/othersContent/SettingsContent";
import ManageClass from "./ManageClass/ManageClass";
import MessagingInterface from "./Messsages/MessagingInterface";
import "../../../CSS/Principal.css";
import ManageEstablishmentContent from "./content/EstablishmentContent/ManageEstablishmentContent";
import AdminContent from "./content/AdminContent/AdminContent";
import StudentsContent from "./content/StudentsContent/StudentsContent";
import OthersContent from "./content/othersContent/OthersContent";
import CreateClassContent from "./content/AllClassesContent/CreateClassContent";
import ManageClassContent from "./content/AllClassesContent/ManageClassContent";
import CreateEstablishmentContent from "./content/EstablishmentContent/CreateEstablishmentContent";
import ActivitiesContent from "./content/ActivitiesContent/ActivitiesContent";
import StudentParentStats from "./shared/StudentParentStats";
import ParentClassManagement from "./ParentSidebar/ParentClassManagement";
import ParentClassManagementClass from "./ParentSidebar/ParentClassManagementClass";
import Modal from "react-modal";
import NotificationIcon from "./modals/NotificationIcon";
import {
  Bell,
  X,
  Menu,
  User,
  Globe,
  ChevronDown,
  LogOut,
  Settings,
  Phone,
  Mail,
} from "lucide-react";
import ProfessorCoursesContent from "./content/ProfessorsContent/ProfessorCoursesContent";
import CoursProgrammerContent from "./content/CoursProgrammerContent/CoursProgrammerContent";

Modal.setAppElement("#root");

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

const languages = {
  fr: {
    name: "Français",
    flag: "🇫🇷",
  },
  en: {
    name: "English",
    flag: "🇺🇸",
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
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setShowTokenExpiredModal(true);
        setTokenChecked(true);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();

        if (currentTime > expirationTime) {
          setShowTokenExpiredModal(true);
        }
        setTokenChecked(true);
      } catch (error) {
        setShowTokenExpiredModal(true);
        setTokenChecked(true);
      }
    };

    checkTokenExpiration();

    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        setShowTokenExpiredModal(true);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Extract user info from token and localStorage
  useEffect(() => {
    if (tokenChecked) {
      const email = localStorage.getItem("userEmail") || "";
      const username = localStorage.getItem("username") || "";
      const decodedTokenStr = localStorage.getItem("decodedToken");

      let name = username;
      let phone = "";

      if (decodedTokenStr) {
        try {
          const decodedToken = JSON.parse(decodedTokenStr);
          // Extract name from email if not available
          if (!name && email) {
            name = email.split("@")[0];
          }
          // You can add more fields here if they're available in your token
          phone = decodedToken.phone || decodedToken.phoneNumber || "";
        } catch (error) {
          console.error("Error parsing decoded token:", error);
        }
      }

      if (!name && email) {
        name = email.split("@")[0];
      }

      setUserInfo({
        name: name || "User",
        email: email || "",
        phone: phone || "",
        username: username || "",
      });
    }
  }, [tokenChecked]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".language-dropdown")) {
        setShowLanguageDropdown(false);
      }
      if (!event.target.closest(".user-profile-dropdown")) {
        setShowUserProfile(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("decodedToken");
    localStorage.removeItem("authResponse");
    navigate("/schoolchat/login");
  };

  useEffect(() => {
    if (!tokenChecked) return;

    const role = localStorage.getItem("userRole") || "admin";
    const rolesStr = localStorage.getItem("userRoles");
    let roles = [];

    try {
      if (rolesStr) {
        roles = JSON.parse(rolesStr);
      }
    } catch (error) {
      console.error("Error parsing user roles:", error);
    }

    setUserRole(role);
    setUserRoles(roles);

    const username = localStorage.getItem("username");
    if (username) {
      localStorage.setItem("userName", username);
    }

    let expectedDashboard;
    if (role === "admin" || roles.includes("ROLE_ADMIN")) {
      expectedDashboard = "AdminDashboard";
    } else if (role === "professor" || roles.includes("ROLE_PROFESSOR")) {
      expectedDashboard = "ProfessorDashboard";
    } else if (role === "parent" || roles.includes("ROLE_PARENT")) {
      expectedDashboard = "ParentDashboard";
    } else if (role === "student" || roles.includes("ROLE_STUDENT")) {
      expectedDashboard = "StudentDashboard";
    } else {
      expectedDashboard = `${
        role.charAt(0).toUpperCase() + role.slice(1)
      }Dashboard`;
    }

    if (!dashboardType) {
      navigate(`/schoolchat/Principal/${expectedDashboard}`);
    }
  }, [dashboardType, navigate, tokenChecked]);

  const handleTabChange = (tab) => {
    console.log(
      "Principal: Changing tab to:",
      tab,
      "User role:",
      userRole,
      "User roles:",
      userRoles
    );

    setShowManageClass(false);
    setActiveTab(tab);

    if (tab === "messages") {
      setShowMessaging(true);
    } else {
      setShowMessaging(false);
    }

    if (isMobile && showSidebar) {
      setShowSidebar(false);
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

  const handleShowMessaging = (conversation = null) => {
    setShowMessaging(true);
    setSelectedConversation(conversation);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedConversation(null);
  };

  const isParentOrStudent = () => {
    return (
      userRoles.includes("ROLE_PARENT") ||
      userRoles.includes("ROLE_STUDENT") ||
      userRole === "parent" ||
      userRole === "student"
    );
  };

  const onNavigateToClassesList = () => {
    setActiveTab("manage-class");
  };
  const onNavigateToEstablishmentsList = () => {
    setActiveTab("manage-establishment");
  };
  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    setShowLanguageDropdown(false);
    // Here you can implement actual language change logic
    console.log("Language changed to:", lang);
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
    };

    console.log("Rendering content for activeTab:", activeTab);

    switch (activeTab) {
      case "dashboard":
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
        console.log("Rendering MotifsDeRejet for user:", userRole, userRoles);
        return <MotifsDeRejet {...contentProps} />;
      case "parents":
        return <ParentsContent {...contentProps} />;
      case "students":
        return <StudentsContent {...contentProps} />;
      case "others":
        return <OthersContent {...contentProps} />;
      case "create-course":
        console.log("Rendering ProfessorCoursesContent");
        return <ProfessorCoursesContent {...contentProps} />;
      case "schedule-course":
        console.log("Rendering CoursProgrammerContent");
        return <CoursProgrammerContent {...contentProps} />;
      case "classes":
        if (userRole === "parent" || userRoles.includes("ROLE_PARENT")) {
          return <ParentClassManagementClass {...contentProps} />;
        } else if (
          userRole === "student" ||
          userRoles.includes("ROLE_STUDENT")
        ) {
          return <ParentClassManagement {...contentProps} />;
        }
        return showManageClass ? (
          <ManageClass onBack={handleBackToClasses} />
        ) : (
          <ClassesContent {...contentProps} />
        );
      case "create-class":
        return (
          <CreateClassContent
            {...contentProps}
            setActiveTab={setActiveTab}
            onNavigateToClassesList={onNavigateToClassesList}
          />
        );
      case "manage-class":
        return <ManageClassContent {...contentProps} />;
      case "create-establishment":
        return (
          <CreateEstablishmentContent
            {...contentProps}
            setActiveTab={setActiveTab}
            onNavigateToManage={onNavigateToEstablishmentsList}
          />
        );
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
        console.log("Default case - rendering default content");
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
    if (activeTab === "create-course") return "Gérer les Cours";
    if (activeTab === "schedule-course") return "Programmer le Cours";
    if (activeTab === "create-class") return "Créer une Classe";
    if (activeTab === "manage-class") return "Gérer une Classe";
    if (activeTab === "create-establishment") return "Créer un Établissement";
    if (activeTab === "manage-establishment") return "Gérer un Établissement";

    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <div className={`principal-container ${isDark ? "dark-mode" : ""}`}>
      {showSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <Modal
        isOpen={showTokenExpiredModal}
        onRequestClose={() => {}}
        contentLabel="Session expirée"
        className="modal"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={false}
      >
        <div className={`modal-content ${isDark ? "dark-mode" : ""}`}>
          <h2>Session expirée</h2>
          <p>
            Votre session a expiré en raison d'une inactivité prolongée ou d'un
            problème d'authentification. Veuillez vous reconnecter pour
            continuer.
          </p>
          <div className="modal-actions">
            <button onClick={handleLogout} className="logout-button">
              Se reconnecter
            </button>
          </div>
        </div>
      </Modal>

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
        toggleSidebar={toggleSidebar}
      />

      <div className={`main-content ${showSidebar ? "with-sidebar" : ""}`}>
        <div className="content-header fixed-header">
          <div className="header-left">
            <button
              className="menu-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <h1>{getTabDisplayName()}</h1>
          </div>
          <div className="header-actions">
            <NotificationIcon />

            {/* Language Switcher */}
            <div className="language-dropdown">
              <button
                className="language-toggle-btn"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <span className="flag">{languages[currentLanguage].flag}</span>
                <ChevronDown size={16} />
              </button>
              {showLanguageDropdown && (
                <div className="language-dropdown-menu">
                  {Object.entries(languages).map(([key, lang]) => (
                    <button
                      key={key}
                      className={`language-option ${
                        key === currentLanguage ? "active" : ""
                      }`}
                      onClick={() => handleLanguageChange(key)}
                    >
                      <span className="flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="user-profile-dropdown">
              <button
                className="user-profile-btn"
                onClick={() => setShowUserProfile(!showUserProfile)}
              >
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-info">
                  <span className="user-name">{userInfo.name}</span>
                </div>
                <ChevronDown size={16} />
              </button>
              {showUserProfile && (
                <div className="user-profile-menu">
                  <div className="user-profile-header">
                    <div className="user-avatar large">
                      <User size={32} />
                    </div>
                    <div className="user-details">
                      <h4>{userInfo.name}</h4>
                      <p className="user-role-text">{userRole}</p>
                    </div>
                  </div>
                  <div className="user-profile-info">
                    {userInfo.email && (
                      <div className="info-item">
                        <Mail size={16} />
                        <span>{userInfo.email}</span>
                      </div>
                    )}
                    {userInfo.phone && (
                      <div className="info-item">
                        <Phone size={16} />
                        <span>{userInfo.phone}</span>
                      </div>
                    )}
                    {userInfo.username && (
                      <div className="info-item">
                        <User size={16} />
                        <span>{userInfo.username}</span>
                      </div>
                    )}
                  </div>
                  <div className="user-profile-actions">
                    <button
                      className="profile-action-btn"
                      onClick={() => {
                        setActiveTab("settings");
                        setShowUserProfile(false);
                      }}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button
                      className="profile-action-btn logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`content-body ${
            isDark ? "bg-gray-900 text-white" : "bg-gray-50"
          }`}
          style={{ paddingTop: "100px" }} // Added padding to account for fixed header
        >
          {renderContent()}
        </div>
      </div>

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

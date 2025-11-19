import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";
import {
  Menu,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Phone,
  Mail,
} from "lucide-react";

import {
  setLastLocation,
  logout as logoutAction,
} from "../../../store/slices/authSlice";
import {
  toggleSidebar as toggleSidebarAction,
  setSidebar,
  setActiveTab as setActiveTabAction,
  setLanguage,
  setMessaging,
  setBreakpoints,
  setTheme as setThemeAction,
} from "../../../store/slices/uiSlice";

import { useAuth } from "../../../hooks/useAuth";
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import ParentsContent from "./content/ParentContent/ParentsContent";
import MotifsDeRejet from "./shared/MotifsDeRejet";
import ProfessorsContent from "./content/ProfessorsContent/ProfessorsContent";
import ClassesContent from "./content/AllClassesContent/ClassesContent";
import SettingsContent from "./content/othersContent/SettingsContent";
import ManageClass from "./ManageClass/ManageClass";
import MessagingInterface from "./Messsages/MessagingInterface";
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
import NotificationIcon from "./modals/NotificationIcon";
import ProfessorCoursesContent from "./content/ProfessorsContent/ProfessorCoursesContent";
import CoursProgrammerContent from "./content/CoursProgrammerContent/CoursProgrammerContent";
import ManageExercisesContent from "./content/excerciseContent/ManageExercisesContent";

import "../../../CSS/Principal.css";

Modal.setAppElement("#root");

const themes = {
  light: { cardBg: "bg-white", border: "border-gray-200" },
  dark: { cardBg: "bg-gray-800", border: "border-gray-700" },
};

const colorSchemes = {
  blue: { primary: "#4a6da7", light: "#6889c3" },
  green: { primary: "#2e7d32", light: "#4caf50" },
};

const languages = {
  fr: { name: "Français", flag: "🇫🇷" },
  en: { name: "English", flag: "🇺🇸" },
};

const Principal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { dashboardType } = useParams();

  // Use the useAuth hook for clean role handling
  const {
    user,
    displayRole,
    normalizedUserRole,
    isAdmin,
    isProfessor,
    isParent,
    isStudent,
    isParentOrStudent,
    hasRole,
  } = useAuth();

  const ui = useSelector((state) => state.ui);
  const {
    showSidebar,
    activeTab,
    isDark,
    currentTheme,
    currentLanguage,
    showMessaging,
    selectedConversation,
    isMobile,
    isCustomBreakpoint,
  } = ui;

  const [showManageClass, setShowManageClass] = useState(false);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleLogout = useCallback(() => {
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
    localStorage.removeItem("lastLocation");

    dispatch(logoutAction());
    navigate("/schoolchat/login");
  }, [dispatch, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const customBreakpoint =
        window.innerWidth <= 992 && window.innerWidth > 768;

      dispatch(
        setBreakpoints({
          isMobile: mobile,
          isCustomBreakpoint: customBreakpoint,
        })
      );

      if (mobile || customBreakpoint) {
        dispatch(setSidebar(false));
      } else if (window.innerWidth > 992) {
        dispatch(setSidebar(true));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes("/schoolchat/principal")) {
      localStorage.setItem("lastLocation", currentPath);
      dispatch(setLastLocation(currentPath));
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setShowTokenExpiredModal(true);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;

        if (Date.now() > expirationTime) {
          setShowTokenExpiredModal(true);
        }
      } catch (error) {
        setShowTokenExpiredModal(true);
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

  useEffect(() => {
    if (!normalizedUserRole) return;

    let expectedDashboard;

    if (isAdmin) {
      expectedDashboard = "AdminDashboard";
    } else if (isProfessor) {
      expectedDashboard = "ProfessorDashboard";
    } else if (isParent) {
      expectedDashboard = "ParentDashboard";
    } else if (isStudent) {
      expectedDashboard = "StudentDashboard";
    } else {
      expectedDashboard = `${
        normalizedUserRole.charAt(0).toUpperCase() + normalizedUserRole.slice(1)
      }Dashboard`;
    }

    if (!dashboardType) {
      navigate(`/schoolchat/Principal/${expectedDashboard}`);
    }
  }, [
    dashboardType,
    navigate,
    normalizedUserRole,
    isAdmin,
    isProfessor,
    isParent,
    isStudent,
  ]);

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

  const handleTabChange = useCallback(
    (tab) => {
      setShowManageClass(false);
      dispatch(setActiveTabAction(tab));

      if (isMobile || isCustomBreakpoint) {
        dispatch(setSidebar(false));
      }
    },
    [dispatch, isMobile, isCustomBreakpoint]
  );

  const handleManageClass = useCallback(() => {
    setShowManageClass(true);
  }, []);

  const handleBackToClasses = useCallback(() => {
    setShowManageClass(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch(toggleSidebarAction());
  }, [dispatch]);

  const handleShowMessaging = useCallback(
    (conversation = null) => {
      dispatch(setMessaging({ show: true, conversation }));
    },
    [dispatch]
  );

  const handleCloseMessaging = useCallback(() => {
    dispatch(setMessaging({ show: false, conversation: null }));
  }, [dispatch]);

  const handleLanguageChange = useCallback(
    (lang) => {
      dispatch(setLanguage(lang));
      setShowLanguageDropdown(false);
    },
    [dispatch]
  );

  const handleThemeChange = useCallback(
    (isDarkMode, theme) => {
      dispatch(setThemeAction({ isDark: isDarkMode, currentTheme: theme }));
    },
    [dispatch]
  );

  const onNavigateToClassesList = useCallback(() => {
    dispatch(setActiveTabAction("manage-class"));
  }, [dispatch]);

  const onNavigateToEstablishmentsList = useCallback(() => {
    dispatch(setActiveTabAction("manage-establishment"));
  }, [dispatch]);

  const contentProps = useMemo(
    () => ({
      isDark,
      currentTheme,
      themes,
      colorSchemes,
      userRole: normalizedUserRole || "admin",
      onManageClass: handleManageClass,
      onShowMessaging: handleShowMessaging,
    }),
    [
      isDark,
      currentTheme,
      normalizedUserRole,
      handleManageClass,
      handleShowMessaging,
    ]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return isParentOrStudent ? (
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
      case "create-course":
        return <ProfessorCoursesContent {...contentProps} />;
      case "schedule-course":
        return <CoursProgrammerContent {...contentProps} />;
      case "manage-exercises":
        return <ManageExercisesContent {...contentProps} />;
      case "classes":
        if (isParent) {
          return <ParentClassManagementClass {...contentProps} />;
        } else if (isStudent) {
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
            setActiveTab={handleTabChange}
            onNavigateToClassesList={onNavigateToClassesList}
          />
        );
      case "manage-class":
        return <ManageClassContent {...contentProps} />;
      case "create-establishment":
        return (
          <CreateEstablishmentContent
            {...contentProps}
            setActiveTab={handleTabChange}
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
            setIsDark={(val) => handleThemeChange(val, currentTheme)}
            currentTheme={currentTheme}
            setCurrentTheme={(val) => handleThemeChange(isDark, val)}
          />
        );
      default:
        return isParentOrStudent ? (
          <StudentParentStats {...contentProps} />
        ) : (
          <DashboardContent {...contentProps} />
        );
    }
  };

  const getTabDisplayName = () => {
    if (
      activeTab === "dashboard" &&
      (normalizedUserRole === "professor" || normalizedUserRole === "tutor")
    ) {
      return "Activities";
    }
    if (activeTab === "dashboard" && isParentOrStudent) {
      return isStudent ? "Mon Tableau de Bord" : "Tableau de Bord Parent";
    }

    const tabNames = {
      messages: "Messages",
      admin: "Gérer Administrateurs",
      professors: "Gérer Professeurs",
      "motifs-de-rejet": "Motifs de Rejet",
      parents: "Gérer Parents",
      students: "Gérer Élèves",
      others: "Gérer Autres Utilisateurs",
      activities: "Activités",
      "create-course": "Gérer les Cours",
      "schedule-course": "Programmer le Cours",
      "manage-exercises": "Gérer les Exercices",
      "create-class": "Créer une Classe",
      "manage-class": "Gérer une Classe",
      "create-establishment": "Créer un Établissement",
      "manage-establishment": "Gérer un Établissement",
    };

    return (
      tabNames[activeTab] ||
      (activeTab
        ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
        : "Dashboard")
    );
  };

  return (
    <div className={`principal-container ${isDark ? "dark-mode" : ""}`}>
      {showSidebar && (isMobile || isCustomBreakpoint) && (
        <div
          className="sidebar-overlay"
          onClick={() => dispatch(setSidebar(false))}
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
        onShowMessaging={handleShowMessaging}
        toggleSidebar={toggleSidebar}
      />

      <div
        className={`main-content ${
          showSidebar && !isMobile && !isCustomBreakpoint ? "with-sidebar" : ""
        }`}
      >
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

            <div className="user-profile-dropdown">
              <button
                className="user-profile-btn"
                onClick={() => setShowUserProfile(!showUserProfile)}
              >
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name || "User"}</span>
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
                      <h4>{user?.name || "User"}</h4>
                      <p className="user-role-text">{displayRole || "User"}</p>
                    </div>
                  </div>
                  <div className="user-profile-info">
                    {user?.email && (
                      <div className="info-item">
                        <Mail size={16} />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="info-item">
                        <Phone size={16} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user?.username && (
                      <div className="info-item">
                        <User size={16} />
                        <span>{user.username}</span>
                      </div>
                    )}
                  </div>
                  <div className="user-profile-actions">
                    <button
                      className="profile-action-btn"
                      onClick={() => {
                        handleTabChange("settings");
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
          style={{ paddingTop: "100px" }}
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
            userRole={normalizedUserRole || "admin"}
          />
        </div>
      )}
    </div>
  );
};

export default Principal;

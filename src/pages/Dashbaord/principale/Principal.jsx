import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useReturnToPage } from "../../../hooks/useReturnToPage";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";
import {
  Menu,
  User,
  ChevronDown,
  LogOut,
  RefreshCw,
  Download,
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
import OfferAdminContent from "./content/OfferAdminContent/OfferAdminContent";
import ActivitiesContent from "./content/ActivitiesContent/ActivitiesContent";
import StudentParentStats from "./shared/StudentParentStats";
import ParentClassManagement from "./ParentSidebar/ParentClassManagement";
import ParentClassManagementClass from "./ParentSidebar/ParentClassManagementClass";
import NotificationIcon from "./modals/NotificationIcon";
import ProfessorCoursesContent from "./content/ProfessorsContent/ProfessorCoursesContent";
import CreateCourseContent from "./content/ProfessorsContent/CreateCourseContent";
import CoursProgrammerContent from "./content/CoursProgrammerContent/CoursProgrammerContent";
import CoursProgrammeManagement from "./content/InterfaceCours/CoursProgrammeManagement";
import ManageExercisesContent from "./content/excerciseContent/ManageExercisesContent";
import StudentDevoirsContent from "./content/excerciseContent/StudentDevoirsContent";
import ExerciseProgrammerContent from "./content/excerciseContent/ExerciseProgrammerContent";
import ExerciseCorrectionsContent from "./content/excerciseContent/ExerciseCorrectionsContent";
import MatiereContent from "./content/MatiereContent/MatiereContent";
import GestionnaireDashboardContent from "./content/GestionnaireContent/GestionnaireDashboardContent";
import MobileBottomNav from "../components/MobileBottomNav";
import ParentChildrenList from "./ParentSidebar/ParentChildrenList";
import GestionnairesManagement from "./content/GestionnaireContent/GestionnairesManagement";
import RoleSelectorModal from "../../../components/modals/RoleSelectorModal";
import ReAuthModal from "../../../components/modals/ReAuthModal";
import ChildSelectorModal from "../../../components/modals/ChildSelectorModal";
import { InstallButton } from "../../../components/PWAInstallPrompt";

import "../../../CSS/Principal.css";

Modal.setAppElement("#root");

const themes = {
  light: {
    background: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-800",
    border: "border-gray-200",
    hover: "hover:bg-gray-50",
    chartBg: "#ffffff",
    gridColor: "#e5e7eb",
  },
  dark: {
    background: "bg-slate-900",
    cardBg: "bg-slate-800",
    text: "text-gray-100",
    border: "border-gray-700",
    hover: "hover:bg-slate-700",
    chartBg: "#1e293b",
    gridColor: "#374151",
  },
};

const colorSchemes = {
  blue: {
    name: "Bleu",
    primary: "#3b82f6",
    secondary: "#1d4ed8",
    accent: "#60a5fa",
    hover: "#2563eb",
    light: "#dbeafe",
    gradient: "from-blue-500 to-blue-600",
  },
  green: {
    name: "Vert",
    primary: "#10b981",
    secondary: "#047857",
    accent: "#34d399",
    hover: "#059669",
    light: "#d1fae5",
    gradient: "from-green-500 to-green-600",
  },
  purple: {
    name: "Violet",
    primary: "#8b5cf6",
    secondary: "#6d28d9",
    accent: "#a78bfa",
    hover: "#7c3aed",
    light: "#ede9fe",
    gradient: "from-purple-500 to-purple-600",
  },
  orange: {
    name: "Orange",
    primary: "#f97316",
    secondary: "#c2410c",
    accent: "#fb923c",
    hover: "#ea580c",
    light: "#ffedd5",
    gradient: "from-orange-500 to-orange-600",
  },
};

const languages = {
  fr: { name: "Français", flag: "🇫🇷" },
  en: { name: "English", flag: "🇺🇸" },
};

const Principal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { dashboardType, section } = useParams();
  const { storeCurrentPage, hasStoredPage } = useReturnToPage();

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
    isGestionnaire,
    hasRole,
  } = useAuth();

  const ui = useSelector((state) => state.ui);
  const {
    showSidebar,
    activeTab,
    tabData,
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
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState(null);
  const [roleSwitchLoading, setRoleSwitchLoading] = useState(false);
  // Child switcher for parents
  const [parentChildren, setParentChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [pendingChildSwitch, setPendingChildSwitch] = useState(null);
  const [showChildAuthModal, setShowChildAuthModal] = useState(false);
  const [childAuthLoading, setChildAuthLoading] = useState(false);

  // Fetch children for parent role
  useEffect(() => {
    if (isParent) {
      const fetchChildren = async () => {
        try {
          const pid = localStorage.getItem("userId");
          const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
          if (!pid || !token) return;
          const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${pid}/enfants`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const kids = await resp.json();
            setParentChildren(kids || []);
            // Auto-select stored child or first
            const storedId = localStorage.getItem("selectedChildId");
            const found = kids.find(k => k.id === storedId);
            setSelectedChild(found || (kids.length > 0 ? kids[0] : null));
            if (!found && kids.length > 0) {
              localStorage.setItem("selectedChildId", kids[0].id);
              localStorage.setItem("selectedChildName", `${kids[0].prenom || ''} ${kids[0].nom || ''}`);
            }
          }
        } catch (e) {
          console.warn("Could not fetch parent children:", e);
        }
      };
      fetchChildren();
    }
  }, [isParent]);

  const handleChildSwitch = (child) => {
    // If switching to a different child, require password verification
    if (selectedChild && selectedChild.id !== child.id) {
      setPendingChildSwitch(child);
      setShowChildDropdown(false);
      setShowChildAuthModal(true);
      return;
    }
    // Same child or first selection - just switch
    doChildSwitch(child);
  };

  const doChildSwitch = (child) => {
    setSelectedChild(child);
    // Clear previous child data from localStorage
    localStorage.removeItem("childClasses");
    localStorage.removeItem("childCourses");
    // Set new child info
    localStorage.setItem("selectedChildId", child.id);
    localStorage.setItem("selectedChildName", `${child.prenom || ''} ${child.nom || ''}`);
    localStorage.setItem("selectedChildNiveau", child.niveau || '');
    setShowChildDropdown(false);
    // Trigger full refresh of all child data
    window.dispatchEvent(new Event("childChanged"));
  };

  // PWA Install — handled by InstallButton component

  const handleLogout = useCallback(() => {
    // Store current page before logout using hook
    storeCurrentPage();

    // Clear ALL auth data (keep only language and PWA settings)
    const lang = localStorage.getItem("language");
    const pwa = localStorage.getItem("pwaInstallDismissed");
    localStorage.clear();
    if (lang) localStorage.setItem("language", lang);
    if (pwa) localStorage.setItem("pwaInstallDismissed", pwa);

    dispatch(logoutAction());
    navigate("/schoolchat/login");
  }, [dispatch, navigate, storeCurrentPage]);

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

  // Listen for session expiry events dispatched by the axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setShowTokenExpiredModal(true);
    };
    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!normalizedUserRole) return;
    // Don't do any navigation if we already have both dashboardType and section
    if (dashboardType && section) return;
    // Don't redirect if we're already on a valid dashboard path
    if (location.pathname.includes('/schoolchat/Principal/') && dashboardType) return;
    // Don't redirect if user just logged in and we're navigating to their return page
    if (hasStoredPage()) return;

    let expectedDashboard;

    if (isAdmin) {
      expectedDashboard = "AdminDashboard";
    } else if (isProfessor) {
      expectedDashboard = "ProfessorDashboard";
    } else if (isParent) {
      expectedDashboard = "ParentDashboard";
    } else if (isStudent) {
      expectedDashboard = "StudentDashboard";
    } else if (isGestionnaire) {
      expectedDashboard = "GestionnaireDashboard";
    } else {
      expectedDashboard = `${
        normalizedUserRole.charAt(0).toUpperCase() + normalizedUserRole.slice(1)
      }Dashboard`;
    }

    // Only redirect if we don't have a dashboardType at all and we're not already on the right path
    if (!dashboardType && !location.pathname.includes(expectedDashboard)) {
      navigate(`/schoolchat/Principal/${expectedDashboard}/activities`, { replace: true });
    }
  }, [
    dashboardType,
    section,
    navigate,
    normalizedUserRole,
    isAdmin,
    isProfessor,
    isParent,
    isStudent,
    location.pathname,
    hasStoredPage,
  ]);

  // Set active tab based on URL section parameter
  useEffect(() => {
    if (section) {
      dispatch(setActiveTabAction(section));
    }
  }, [section, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".language-dropdown")) {
        setShowLanguageDropdown(false);
      }
      if (!event.target.closest(".user-profile-dropdown")) {
        setShowUserProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowLanguageDropdown(false);
        setShowUserProfile(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    document.addEventListener("touchend", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("touchend", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleTabChange = useCallback(
    (tab, queryParams = null) => {
      // Skip if already on this tab, unless query params are provided (e.g. pre-filtering)
      if (tab === activeTab && !queryParams) return;

      setShowManageClass(false);
      dispatch(setActiveTabAction(tab));

      // Build the dashboard base path
      let dashboard = dashboardType;
      if (!dashboard) {
        if (isAdmin) {
          dashboard = 'AdminDashboard';
        } else if (normalizedUserRole === 'professor' || normalizedUserRole === 'tutor') {
          dashboard = 'ProfessorDashboard';
        } else if (normalizedUserRole === 'parent') {
          dashboard = 'ParentDashboard';
        } else if (normalizedUserRole === 'student') {
          dashboard = 'StudentDashboard';
        } else if (normalizedUserRole === 'gestionnaire') {
          dashboard = 'GestionnaireDashboard';
        } else {
          dashboard = 'AdminDashboard';
        }
      }

      const search = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
      navigate(`/schoolchat/Principal/${dashboard}/${tab}${search}`);

      if (isMobile || isCustomBreakpoint) {
        dispatch(setSidebar(false));
      }
    },
    [dispatch, isMobile, isCustomBreakpoint, navigate, dashboardType, normalizedUserRole, isAdmin, activeTab]
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
      setActiveTab: handleTabChange,
      tabData,
    }),
    [
      isDark,
      currentTheme,
      normalizedUserRole,
      handleManageClass,
      handleShowMessaging,
      handleTabChange,
      tabData,
    ]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (isParentOrStudent) {
          return <StudentParentStats {...contentProps} />;
        } else if (isGestionnaire) {
          return <GestionnaireDashboardContent {...contentProps} />;
        } else {
          return <DashboardContent {...contentProps} />;
        }
      case "activities":
        return <ActivitiesContent {...contentProps} />;
      case "admin":
        return <AdminContent {...contentProps} />;
      case "professors":
        return <ProfessorsContent {...contentProps} />;
      case "matieres":
        return <MatiereContent {...contentProps} />;
      case "motifs-de-rejet":
        return <MotifsDeRejet {...contentProps} />;
      case "parents":
        return <ParentsContent {...contentProps} />;
      case "students":
        return <StudentsContent {...contentProps} />;
      case "others":
        return <OthersContent {...contentProps} />;
      case "courses":
        return <ProfessorCoursesContent {...contentProps} setActiveTab={handleTabChange} />;
      case "create-course":
        return (
          <CreateCourseContent
            {...contentProps}
            onBack={() => handleTabChange("courses")}
          />
        );
      case "schedule-course":
        return <CoursProgrammerContent {...contentProps} />;
      case "manage-exercises":
        return <ManageExercisesContent {...contentProps} />;
      case "devoirs":
        return <StudentDevoirsContent />
      case "schedule-exercise":
        return <ExerciseProgrammerContent {...contentProps} />;
      case "corrections-exercise":
        return <ExerciseCorrectionsContent {...contentProps} />;
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
      case "cours":
        return (
          <CoursProgrammeManagement
            {...contentProps}
            selectedClass={null}
            onBack={() => handleTabChange('classes')}
            onScheduleCourse={(isProfessor || isAdmin) ? () => handleTabChange('schedule-course') : undefined}
          />
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
      case "manage-offers":
        return <OfferAdminContent {...contentProps} />;
      case "my-children":
        return <ParentChildrenList />;
      case "gestionnaires":
        return <GestionnairesManagement />;
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
      matieres: "Gestion des Matières",
      "motifs-de-rejet": "Motifs de Rejet",
      parents: "Gérer Parents",
      students: "Gérer Élèves",
      others: "Gérer Autres Utilisateurs",
      activities: "Activités",
      "courses": "Gérer les Cours",
      "create-course": "Créer un Cours",
      "schedule-course": "Programmer le Cours",
      "manage-exercises": "Gérer les Exercices",
      "devoirs": "Mes Devoirs",
      "schedule-exercise": "Programmer les Exercices",
      "corrections-exercise": "Corrections des Exercices",
      "create-class": "Créer une Classe",
      "manage-class": "Gérer une Classe",
      "create-establishment": "Créer un Établissement",
      "manage-establishment": "Gérer un Établissement",
      "cours": "Cours Programmés",
    };

    return (
      tabNames[activeTab] ||
      (activeTab
        ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
        : "Dashboard")
    );
  };

  // Apply theme colors to document root for global CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const scheme = colorSchemes[currentTheme] || colorSchemes.blue;
    
    root.style.setProperty('--primary-color', scheme.primary);
    root.style.setProperty('--secondary-color', scheme.secondary);
    root.style.setProperty('--accent-color', scheme.accent);
    root.style.setProperty('--hover-color', scheme.hover);
    root.style.setProperty('--light-color', scheme.light);
  }, [currentTheme]);

  return (
    <div className={`principal-container ${isDark ? "dark-mode" : ""}`} style={{
      '--primary-color': colorSchemes[currentTheme]?.primary || colorSchemes.blue.primary,
      '--secondary-color': colorSchemes[currentTheme]?.secondary || colorSchemes.blue.secondary,
      '--accent-color': colorSchemes[currentTheme]?.accent || colorSchemes.blue.accent,
      '--hover-color': colorSchemes[currentTheme]?.hover || colorSchemes.blue.hover,
      '--light-color': colorSchemes[currentTheme]?.light || colorSchemes.blue.light,
    }}>
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
        className="session-expired-modal"
        overlayClassName="session-expired-overlay"
        shouldCloseOnOverlayClick={false}
      >
        <div className={`session-expired-content ${isDark ? "dark-mode" : ""}`}>
          <div className="session-expired-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" fill="#fef3c7"/>
              <path d="M12 8v4l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="session-expired-title">Session Expirée</h2>
          <p className="session-expired-message">
            Votre session a expiré. Veuillez vous reconnecter pour continuer à utiliser l'application.
          </p>
          <div className="session-expired-actions">
            <button onClick={handleLogout} className="reconnect-button">
              Se reconnecter
            </button>
          </div>
        </div>
      </Modal>

      {/* Role Switch Flow */}
      <RoleSelectorModal
        isOpen={showRoleSwitchModal}
        roles={JSON.parse(localStorage.getItem('availableRoles') || '[]')}
        onSelect={(role) => {
          setShowRoleSwitchModal(false);
          setPendingRoleSwitch(role);
          setShowReAuthModal(true);
        }}
        onClose={() => setShowRoleSwitchModal(false)}
        title="Changer de profil"
        subtitle="Choisissez le profil vers lequel vous souhaitez basculer."
      />

      <ReAuthModal
        isOpen={showReAuthModal}
        email={localStorage.getItem('userEmail')}
        loading={roleSwitchLoading}
        onConfirm={async (encryptedPassword) => {
          setRoleSwitchLoading(true);
          try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/switch-role`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: localStorage.getItem('userEmail'),
                password: encryptedPassword,
                selectedRole: pendingRoleSwitch,
              }),
            });
            if (!response.ok) throw new Error("Mot de passe incorrect");
            const authData = await response.json();

            // Update localStorage with new role
            localStorage.setItem("accessToken", authData.accessToken);
            localStorage.setItem("authToken", authData.accessToken);
            localStorage.setItem("userRole", "ROLE_" + pendingRoleSwitch.toUpperCase());
            localStorage.setItem("authResponse", JSON.stringify(authData));
            localStorage.setItem("availableRoles", JSON.stringify(authData.availableRoles || []));
            if (authData.children) localStorage.setItem("children", JSON.stringify(authData.children));

            setShowReAuthModal(false);
            setPendingRoleSwitch(null);

            // Map role to correct dashboard path
            const dashboardMap = {
              ADMIN: "AdminDashboard",
              PROFESSOR: "ProfessorDashboard",
              PARENT: "ParentDashboard",
              STUDENT: "StudentDashboard",
              TUTOR: "ProfessorDashboard",
              GESTIONNAIRE: "GestionnaireDashboard",
            };
            const dashName = dashboardMap[pendingRoleSwitch.toUpperCase()] || "AdminDashboard";
            window.location.href = `/schoolchat/Principal/${dashName}/activities`;
          } catch (err) {
            throw err;
          } finally {
            setRoleSwitchLoading(false);
          }
        }}
        onClose={() => { setShowReAuthModal(false); setPendingRoleSwitch(null); }}
      />

      {/* Child Switch Auth Modal */}
      <ReAuthModal
        isOpen={showChildAuthModal}
        email={localStorage.getItem('userEmail')}
        loading={childAuthLoading}
        onConfirm={async (encryptedPassword) => {
          setChildAuthLoading(true);
          try {
            // Verify password by calling login
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: localStorage.getItem('userEmail'),
                password: encryptedPassword,
              }),
            });
            if (!response.ok) throw new Error("Mot de passe incorrect");

            // Password verified - do the switch
            setShowChildAuthModal(false);
            if (pendingChildSwitch) {
              doChildSwitch(pendingChildSwitch);
              setPendingChildSwitch(null);
            }
          } catch (err) {
            throw err;
          } finally {
            setChildAuthLoading(false);
          }
        }}
        onClose={() => { setShowChildAuthModal(false); setPendingChildSwitch(null); }}
      />

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
          </div>
          <div className="header-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            minWidth: 0,
            overflow: 'visible'
          }}>
            {/* Install PWA button — always visible, no popup */}
            <InstallButton />

            {/* Refresh button - hidden on very small screens */}
            <button
              onClick={() => window.location.reload()}
              className="hidden xs:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualiser"
              style={{ minHeight: '36px', minWidth: '36px' }}
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>

            <NotificationIcon />

            {/* Role Switcher - only show if user has multiple roles */}
            {(() => {
              const storedRoles = JSON.parse(localStorage.getItem('availableRoles') || '[]');
              if (storedRoles.length <= 1) return null;
              const currentRole = (normalizedUserRole || '').charAt(0).toUpperCase() + (normalizedUserRole || '').slice(1);
              return (
                <button
                  onClick={() => setShowRoleSwitchModal(true)}
                  className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  title="Changer de role"
                  style={{ minHeight: '36px' }}
                >
                  <Settings size={14} />
                  <span className="hidden sm:inline">{currentRole}</span>
                </button>
              );
            })()}

            {/* Child Switcher - only for parents with children */}
            {isParent && parentChildren.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChildDropdown(prev => !prev);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  style={{ minHeight: '36px', maxWidth: '160px' }}
                  title="Changer d'enfant"
                >
                  <User size={14} />
                  <span className="truncate">{selectedChild ? `${selectedChild.prenom || ''} ${(selectedChild.nom || '').charAt(0)}.` : 'Enfant'}</span>
                  <ChevronDown size={12} />
                </button>
                {showChildDropdown && (
                  <>
                    <div
                      onClick={() => setShowChildDropdown(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, background: 'transparent' }}
                    />
                    <div
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                        background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        zIndex: 9999, minWidth: '220px', overflow: 'hidden', border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Mes enfants
                        </span>
                      </div>
                      {parentChildren.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleChildSwitch(child)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                            padding: '10px 12px', border: 'none', background: selectedChild?.id === child.id ? '#f3e8ff' : 'white',
                            cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                            borderLeft: selectedChild?.id === child.id ? '3px solid #9333ea' : '3px solid transparent',
                          }}
                          onMouseEnter={(e) => { if (selectedChild?.id !== child.id) e.target.style.background = '#faf5ff'; }}
                          onMouseLeave={(e) => { if (selectedChild?.id !== child.id) e.target.style.background = 'white'; }}
                        >
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: selectedChild?.id === child.id ? '#9333ea' : '#e9d5ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: selectedChild?.id === child.id ? 'white' : '#7c3aed',
                            fontSize: '11px', fontWeight: 700, flexShrink: 0
                          }}>
                            {(child.prenom || '?').charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{child.prenom} {child.nom}</div>
                            {child.niveau && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{child.niveau}</div>}
                          </div>
                          {selectedChild?.id === child.id && (
                            <span style={{ marginLeft: 'auto', color: '#9333ea', fontSize: '16px', flexShrink: 0 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="language-dropdown" style={{ position: 'relative' }}>
              <button
                className="language-toggle-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLanguageDropdown(prev => !prev);
                  setShowUserProfile(false);
                }}
                style={{ 
                  touchAction: 'manipulation',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                type="button"
              >
                <span className="flag">{languages[currentLanguage].flag}</span>
                <ChevronDown size={16} />
              </button>
              {showLanguageDropdown && (
                <>
                  <div 
                    className="dropdown-backdrop"
                    onClick={() => setShowLanguageDropdown(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9998,
                      background: 'transparent'
                    }}
                  />
                  <div 
                    className="language-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      zIndex: 9999,
                      minWidth: '120px',
                      maxWidth: '200px'
                    }}
                  >
                    {Object.entries(languages).map(([key, lang]) => (
                      <button
                        key={key}
                        className={`language-option ${
                          key === currentLanguage ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLanguageChange(key);
                        }}
                        style={{ 
                          touchAction: 'manipulation',
                          minHeight: '44px',
                          width: '100%'
                        }}
                        type="button"
                      >
                        <span className="flag">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="user-profile-dropdown" style={{ position: 'relative' }}>
              <button
                className="user-profile-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUserProfile(prev => !prev);
                  setShowLanguageDropdown(false);
                }}
                style={{ 
                  touchAction: 'manipulation',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  maxWidth: '160px',
                  minHeight: '44px',
                  padding: '8px 12px'
                }}
                type="button"
              >
                <div className="user-avatar" style={{ flexShrink: 0 }}>
                  <User size={20} />
                </div>
                <div className="user-info" style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  fontSize: '14px'
                }}>
                  <span className="user-name" style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{user?.name || "User"}</span>
                </div>
                <ChevronDown size={16} style={{ flexShrink: 0 }} />
              </button>
              {showUserProfile && (
                <>
                  <div 
                    className="dropdown-backdrop"
                    onClick={() => setShowUserProfile(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9998,
                      background: 'transparent'
                    }}
                  />
                  <div 
                    className="user-profile-menu"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      position: window.innerWidth < 768 ? 'fixed' : 'absolute',
                      top: window.innerWidth < 768 ? '60px' : '100%',
                      right: window.innerWidth < 768 ? '12px' : 0,
                      marginTop: '4px',
                      zIndex: 9999,
                      minWidth: '200px',
                      maxWidth: window.innerWidth < 768 ? 'calc(100vw - 24px)' : '280px'
                    }}
                  >
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTabChange("settings");
                          setShowUserProfile(false);
                        }}
                        style={{ 
                          touchAction: 'manipulation',
                          minHeight: '44px'
                        }}
                        type="button"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <button
                        className="profile-action-btn logout"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        style={{ 
                          touchAction: 'manipulation',
                          minHeight: '44px'
                        }}
                        type="button"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className={`content-body ${
            isDark ? "bg-gray-900 text-white" : "bg-gray-50"
          }`}
          style={{ paddingTop: isMobile ? "80px" : "100px" }}
        >
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation - only on dashboard */}
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
          onLogout={handleLogout}
        />
      )}

      {showMessaging && activeTab !== "messages" && !isMobile && (
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

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Users,
  UserPlus,
  BookOpen,
  Building2,
  Mail,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Activity,
  School,
  Book,
  X,
} from "lucide-react";

const Sidebar = ({
  showSidebar,
  activeTab,
  setActiveTab,
  isDark,
  currentTheme,
  themes,
  colorSchemes,
  userRole,
  userRoles,
  onShowMessaging,
  toggleSidebar,
}) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState({
    users: false,
    classes: false,
    establishments: false,
    courses: false,
  });

  useEffect(() => {
    const coursesTabs = ["create-course", "schedule-course"];
    const usersTabs = ["admin", "professors", "parents", "students", "others"];
    const classesTabs = ["create-class", "manage-class"];
    const establishmentsTabs = ["create-establishment", "manage-establishment"];

    setOpenDropdown((prev) => ({
      ...prev,
      courses: coursesTabs.includes(activeTab),
      users: usersTabs.includes(activeTab),
      classes: classesTabs.includes(activeTab),
      establishments: establishmentsTabs.includes(activeTab),
    }));
  }, [activeTab]);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown({
      ...openDropdown,
      [dropdown]: !openDropdown[dropdown],
    });
  };

  const isAdmin = () => {
    return userRoles.includes("ROLE_ADMIN") || userRole === "admin";
  };

  const isProfessor = () => {
    return (
      userRoles.includes("ROLE_PROFESSOR") ||
      userRole === "professor" ||
      userRole === "repetiteur"
    );
  };

  const isParentOrStudent = () => {
    return (
      userRoles.includes("ROLE_PARENT") ||
      userRoles.includes("ROLE_STUDENT") ||
      userRole === "parent" ||
      userRole === "student"
    );
  };

  const getMenuItems = () => {
    const baseItems = [
      { name: "Tableau de Bord", icon: Menu, tab: "dashboard" },
      { name: "Activités", icon: Activity, tab: "activities" },
    ];

    let roleItems = [];

    if (isAdmin()) {
      roleItems = [
        {
          name: "Gérer Utilisateur",
          icon: Users,
          dropdown: "users",
          items: [
            { name: "Admin", tab: "admin" },
            { name: "Professeurs", tab: "professors" },
            { name: "Parents", tab: "parents" },
            { name: "Élèves", tab: "students" },
            { name: "Autres", tab: "others" },
          ],
        },
        {
          name: "Motifs de Rejet",
          icon: BookOpen,
          tab: "motifs-de-rejet",
        },
        {
          name: "Classes",
          icon: Building2,
          dropdown: "classes",
          items: [
            { name: "Créer une Classe", tab: "create-class" },
            { name: "Gérer une Classe", tab: "manage-class" },
          ],
        },
        {
          name: "Établissements",
          icon: School,
          dropdown: "establishments",
          items: [
            { name: "Créer un Établissement", tab: "create-establishment" },
            { name: "Gérer un Établissement", tab: "manage-establishment" },
          ],
        },
        {
          name: "Messagerie",
          icon: Mail,
          tab: "messages",
        },
      ];
    } else if (isProfessor()) {
      roleItems = [
        {
          name: "Gérer les Cours",
          icon: Book,
          dropdown: "courses",
          items: [
            { name: "Cours", tab: "create-course" },
            { name: "Programmer le Cours", tab: "schedule-course" },
          ],
        },
        {
          name: "Gérer Utilisateur",
          icon: Users,
          dropdown: "users",
          items: [
            { name: "Professeurs", tab: "professors" },
            { name: "Parents", tab: "parents" },
            { name: "Élèves", tab: "students" },
          ],
        },
        {
          name: "Classes",
          icon: Building2,
          dropdown: "classes",
          items: [
            { name: "Créer une Classe", tab: "create-class" },
            { name: "Gérer une Classe", tab: "manage-class" },
          ],
        },
        {
          name: "Messagerie",
          icon: Mail,
          tab: "messages",
        },
      ];
    } else if (isParentOrStudent()) {
      roleItems = [
        { name: "Classes", icon: Building2, tab: "classes" },
        {
          name: "Messagerie",
          icon: Mail,
          tab: "messages",
        },
      ];
    } else {
      roleItems = [
        { name: "Classes", icon: Building2, tab: "classes" },
        {
          name: "Motifs de Rejet",
          icon: BookOpen,
          tab: "motifs-de-rejet",
        },
        {
          name: "Messagerie",
          icon: Mail,
          tab: "messages",
        },
      ];
    }

    const bottomItems = [
      { name: "Paramètres", icon: Settings, tab: "settings" },
    ];

    return [...baseItems, ...roleItems, ...bottomItems];
  };

  const menuItems = getMenuItems();

  const handleTabChange = (tab) => {
    console.log(
      "Sidebar: Changing tab to:",
      tab,
      "User role:",
      userRole,
      "User roles:",
      userRoles
    );

    setActiveTab(tab);

    if (tab === "messages" && onShowMessaging) {
      onShowMessaging();
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("decodedToken");
    localStorage.removeItem("authResponse");

    navigate("/schoolchat/login");
  };

  const isActiveTab = (tab) => {
    return activeTab === tab;
  };

  const isActiveDropdown = (dropdown, items) => {
    return (
      activeTab.startsWith(dropdown) ||
      (items && items.some((subItem) => subItem.tab === activeTab))
    );
  };

  return (
    <>
      <aside
        className={`${
          isDark ? themes?.dark?.cardBg : themes?.light?.cardBg
        } sidebar ${
          showSidebar ? "open" : "closed"
        } transition-colors duration-300`}
      >
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <div className="sidebar-brand">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: colorSchemes?.[currentTheme]?.primary }}
              >
                ScholChat
              </h2>
              <p className="user-role text-sm">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            </div>
            <button
              className="sidebar-close-btn"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <React.Fragment key={item.name}>
                {item.dropdown ? (
                  <li>
                    <div
                      className={`dropdown-header ${
                        isActiveDropdown(item.dropdown, item.items)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => toggleDropdown(item.dropdown)}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <span className="icon">
                          <item.icon
                            style={{
                              color: isActiveDropdown(item.dropdown, item.items)
                                ? colorSchemes?.[currentTheme]?.primary
                                : "currentColor",
                            }}
                          />
                        </span>
                        <span className="menu-text">{item.name}</span>
                        <span className="dropdown-icon">
                          {openDropdown[item.dropdown] ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </span>
                      </a>
                    </div>
                    {openDropdown[item.dropdown] && (
                      <ul className="dropdown-menu">
                        {item.items.map((subItem) => (
                          <li
                            key={subItem.name}
                            className={
                              isActiveTab(subItem.tab) ? "active-sub" : ""
                            }
                            onClick={() => handleTabChange(subItem.tab)}
                          >
                            <a href="#" onClick={(e) => e.preventDefault()}>
                              <span className="menu-text">{subItem.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li
                    className={isActiveTab(item.tab) ? "active" : ""}
                    onClick={() => handleTabChange(item.tab)}
                  >
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      <span className="icon">
                        <item.icon
                          style={{
                            color: isActiveTab(item.tab)
                              ? colorSchemes?.[currentTheme]?.primary
                              : "currentColor",
                          }}
                        />
                      </span>
                      <span className="menu-text">{item.name}</span>
                    </a>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={openLogoutModal}>
            <span className="icon">
              <LogOut size={18} />
            </span>
            <span className="menu-text">Déconnexion</span>
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="modal-overlay-custom">
          <div
            className={`modal-custom ${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Confirmation</h3>
            <p className="mb-6">Êtes-vous sûr de vouloir vous déconnecter?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md text-white hover:opacity-90 transition-colors"
                style={{
                  backgroundColor: colorSchemes?.[currentTheme]?.primary,
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

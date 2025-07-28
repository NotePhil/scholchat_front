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
}) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState({
    users: false,
    classes: false,
    establishments: false,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Automatically show sidebar when switching to larger screen if not mobile
      if (!mobile && !showSidebar) {
        const toggleButton = document.querySelector(".mobile-menu-button");
        if (toggleButton) {
          toggleButton.click(); // This would trigger the parent component to show sidebar
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && showSidebar) {
        const sidebar = document.querySelector(".sidebar");
        const mobileButton = document.querySelector(".mobile-menu-button");

        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          mobileButton &&
          !mobileButton.contains(event.target)
        ) {
          // Close sidebar by triggering the toggle
          const toggleButton = document.querySelector(".mobile-menu-button");
          if (toggleButton) {
            toggleButton.click();
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSidebar, isMobile]);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown({
      ...openDropdown,
      [dropdown]: !openDropdown[dropdown],
    });
  };

  // Define menu items based on user role (same as before)
  const getMenuItems = () => {
    const baseItems = [
      { name: "Tableau de Bord", icon: Menu, tab: "dashboard" },
      { name: "Activités", icon: Activity, tab: "activities" },
    ];

    // Role-specific items
    let roleItems = [];
    if (userRoles.includes("ROLE_ADMIN")) {
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
    } else if (userRoles.includes("ROLE_PROFESSOR")) {
      roleItems = [
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
          name: "Messagerie",
          icon: Mail,
          tab: "messages",
        },
      ];
    } else if (
      userRoles.includes("ROLE_PARENT") ||
      userRoles.includes("ROLE_STUDENT")
    ) {
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
        { name: "Motifs de Rejet", icon: BookOpen, tab: "motifs-de-rejet" },
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

    if (
      userRoles.includes("ROLE_PARENT") ||
      userRoles.includes("ROLE_STUDENT")
    ) {
      return [...baseItems, ...roleItems, ...bottomItems];
    }

    return [...baseItems, ...roleItems, ...bottomItems];
  };

  const menuItems = getMenuItems();

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Close sidebar on mobile after selection
    if (isMobile) {
      const toggleButton = document.querySelector(".mobile-menu-button");
      if (toggleButton && showSidebar) {
        setTimeout(() => toggleButton.click(), 150);
      }
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRoles");
    navigate("/schoolchat/login");
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
          <div className="flex flex-col items-start">
            <h2
              className="text-2xl font-bold mb-1" // Added margin bottom
              style={{ color: colorSchemes?.[currentTheme]?.primary }}
            >
              ScholChat
            </h2>
            <p className="user-role text-sm">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </p>
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
                        activeTab.startsWith(item.dropdown) ||
                        (item.items &&
                          item.items.some(
                            (subItem) => subItem.tab === activeTab
                          ))
                          ? "active"
                          : ""
                      }`}
                      onClick={() => toggleDropdown(item.dropdown)}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <span className="icon">
                          <item.icon
                            style={{
                              color:
                                activeTab.startsWith(item.dropdown) ||
                                (item.items &&
                                  item.items.some(
                                    (subItem) => subItem.tab === activeTab
                                  ))
                                  ? colorSchemes?.[currentTheme]?.primary
                                  : "currentColor",
                            }}
                          />
                        </span>
                        {item.name}
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
                              activeTab === subItem.tab ? "active-sub" : ""
                            }
                            onClick={() => handleTabChange(subItem.tab)}
                          >
                            <a href="#" onClick={(e) => e.preventDefault()}>
                              {subItem.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li
                    className={activeTab === item.tab ? "active" : ""}
                    onClick={() => handleTabChange(item.tab)}
                  >
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      <span className="icon">
                        <item.icon
                          style={{
                            color:
                              activeTab === item.tab
                                ? colorSchemes?.[currentTheme]?.primary
                                : "currentColor",
                          }}
                        />
                      </span>
                      {item.name}
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
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[1002] bg-black bg-opacity-50">
          <div
            className={`modal p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
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

import React, { useState } from "react";
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

  const toggleDropdown = (dropdown) => {
    setOpenDropdown({
      ...openDropdown,
      [dropdown]: !openDropdown[dropdown],
    });
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { name: "Dashboard", icon: Menu, tab: "dashboard" },
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
            { name: "Liste des Classes", tab: "classes-list" },
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
            { name: "Liste des Classes", tab: "classes-list" },
          ],
        },
      ];
    } else {
      roleItems = [
        { name: "Classes", icon: Building2, tab: "classes" },
        { name: "Motifs de Rejet", icon: BookOpen, tab: "motifs-de-rejet" },
      ];
    }

    // Bottom items (always at the end)
    const bottomItems = [
      {
        name: "Messages",
        icon: Mail,
        tab: "messages",
        onClick: onShowMessaging,
      },
      { name: "Settings", icon: Settings, tab: "settings" },
    ];

    return [...baseItems, ...roleItems, ...bottomItems];
  };

  const menuItems = getMenuItems();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
          <h2
            className="text-2xl font-bold"
            style={{ color: colorSchemes?.[currentTheme]?.primary }}
          >
            ScholChat
          </h2>
          <p className="user-role">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <React.Fragment key={item.name}>
                {item.dropdown ? (
                  <li>
                    <div
                      className={`dropdown-header ${
                        activeTab.startsWith(item.dropdown) ? "active" : ""
                      }`}
                      onClick={() => toggleDropdown(item.dropdown)}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <span className="icon">
                          <item.icon
                            style={{
                              color: activeTab.startsWith(item.dropdown)
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
                    onClick={() =>
                      item.onClick ? item.onClick() : handleTabChange(item.tab)
                    }
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className={`modal p-6 rounded-lg shadow-lg max-w-md w-full ${
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

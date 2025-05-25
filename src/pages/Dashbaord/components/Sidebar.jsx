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
} from "lucide-react";

const Sidebar = ({
  showSidebar,
  activeTab,
  setActiveTab,
  isDark,
  currentTheme,
  themes,
  colorSchemes,
}) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole") || "admin";

  // Define menu items based on user role
  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return [
          { name: "Dashboard", icon: Menu, tab: "dashboard" },
          { name: "Activities", icon: Users, tab: "students" },
          { name: "Parents", icon: UserPlus, tab: "parents" },
          { name: "Motifs de Rejet", icon: BookOpen, tab: "professors" },
          { name: "Classes", icon: Building2, tab: "classes" },
          { name: "Messages", icon: Mail, tab: "messages" },
          { name: "Settings", icon: Settings, tab: "settings" },
        ];

      case "professor":
      case "repetiteur":
        return [
          { name: "Activities", icon: Users, tab: "students" },
          { name: "DashBoard", icon: Menu, tab: "dashboard" },
          { name: "Parents", icon: UserPlus, tab: "parents" },
          { name: "Professors", icon: BookOpen, tab: "professors" },
          { name: "Classes", icon: Building2, tab: "classes" },
          { name: "Messages", icon: Mail, tab: "messages" },
          { name: "Settings", icon: Settings, tab: "settings" },
        ];

      case "student":
        return [
          { name: "Dashboard", icon: Menu, tab: "dashboard" },
          { name: "Activities", icon: Users, tab: "students" },
          { name: "Classes", icon: Building2, tab: "classes" },
          { name: "Messages", icon: Mail, tab: "messages" },
          { name: "Settings", icon: Settings, tab: "settings" },
        ];

      case "parent":
        return [
          { name: "Dashboard", icon: Menu, tab: "dashboard" },
          { name: "Activities", icon: Users, tab: "students" },
          { name: "Classes", icon: Building2, tab: "classes" },
          { name: "Messages", icon: Mail, tab: "messages" },
          { name: "Settings", icon: Settings, tab: "settings" },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Remove the special case for messages - let it be handled like other tabs
  };

  // Show logout confirmation modal
  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  // Close the logout modal without logging out
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Handle the confirmed logout action and redirect to login page
  const confirmLogout = () => {
    // Clear any stored user data
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    // Redirect to login page
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
              <li
                key={item.name}
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

                {/* Active indicator */}
                {activeTab === item.tab && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{
                      backgroundColor: colorSchemes?.[currentTheme]?.primary,
                    }}
                  />
                )}
              </li>
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

      {/* French Logout Confirmation Modal */}
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

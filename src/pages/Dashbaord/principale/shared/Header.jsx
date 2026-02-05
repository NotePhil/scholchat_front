import React, { useState, useEffect, useRef } from "react";
import { Bell, User, ChevronDown } from "lucide-react";

const Header = ({
  isDark,
  currentTheme,
  colorSchemes,
  userRole,
  userRoles = [],
  onLanguageChange = () => {},
  currentLanguage = "fr",
}) => {
  const [userName, setUserName] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const storedUserName =
      localStorage.getItem("userName") ||
      localStorage.getItem("username") ||
      "User";
    setUserName(storedUserName);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown if clicking outside
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      // Close notifications if clicking outside
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
    };

    // Add event listeners
    document.addEventListener("click", handleClickOutside, true);
    document.addEventListener("touchend", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("touchend", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const getRoleDisplayName = (role) => {
    const roleMap = {
      ROLE_ADMIN: "Admin",
      ROLE_PROFESSOR: "Prof",
      ROLE_PARENT: "Parent",
      ROLE_STUDENT: "Student",
      admin: "Admin",
      professor: "Prof",
      parent: "Parent",
      student: "Student",
    };
    return roleMap[role] || role;
  };

  const getPrimaryRole = () => {
    if (userRoles.length > 0) {
      return getRoleDisplayName(userRoles[0]);
    }
    return getRoleDisplayName(userRole);
  };

  return (
    <header
      className={`${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-b sticky top-0 z-40 transition-colors`}
    >
      <div className="mx-auto px-2">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
              }`}
            >
              SC
            </div>
            <span
              className={`text-sm font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              ScholChat
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1">
            {/* Language Toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newLang = currentLanguage === "fr" ? "en" : "fr";
                onLanguageChange(newLang);
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors touch-manipulation ${
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {currentLanguage === "fr" ? "EN" : "FR"}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNotifications(prev => !prev);
                  setShowUserDropdown(false);
                }}
                className={`relative p-1 rounded transition-colors touch-manipulation ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                style={{ touchAction: 'manipulation' }}
                type="button"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 bg-transparent z-[9998]"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div
                    className={`absolute top-full right-0 mt-1 w-80 max-w-[calc(100vw-16px)] rounded-lg shadow-xl border z-[9999] ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`px-3 py-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                      <h3 className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`px-3 py-3 border-b last:border-b-0 ${
                            isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"
                          } transition-colors cursor-pointer`}
                        >
                          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Notification {i} - Sample notification text
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            2 min ago
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUserDropdown(prev => !prev);
                  setShowNotifications(false);
                }}
                className={`flex items-center space-x-1 px-1 py-1 rounded transition-colors touch-manipulation ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
                style={{ touchAction: 'manipulation' }}
                type="button"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs ${
                    isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                  }`}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showUserDropdown && (
                <>
                  <div 
                    className="fixed inset-0 bg-transparent z-[9998]"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div
                    className={`absolute top-full right-0 mt-1 w-64 max-w-[calc(100vw-16px)] rounded-lg shadow-xl border z-[9999] ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`px-3 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                            isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                          }`}
                        >
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                            {userName}
                          </div>
                          <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {getPrimaryRole()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full px-3 py-3 text-left transition-colors touch-manipulation ${
                        isDark
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      style={{ touchAction: 'manipulation' }}
                      type="button"
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      <span className="text-sm">Profile</span>
                    </button>

                    {userRoles.length > 1 && (
                      <div className={`px-3 py-2 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <div className={`text-xs font-semibold mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          All Roles:
                        </div>
                        {userRoles.slice(0, 3).map((role, index) => (
                          <div
                            key={index}
                            className={`text-xs py-0.5 truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}
                          >
                            • {getRoleDisplayName(role)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
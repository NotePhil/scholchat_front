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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const userButtonRef = useRef(null);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { NotificationService } = await import("../../../../services/NotificationService");
        const service = new NotificationService();
        const data = await service.getUserNotifications();
        setNotifications(data || []);
        const unread = await service.getUnreadCount();
        setUnreadCount(unread?.count || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
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

  const handleNotificationClick = async (notification) => {
    try {
      const { NotificationService } = await import("../../../../services/NotificationService");
      const service = new NotificationService();
      await service.markAsRead(notification.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigation logic based on notification type
      // Types could be: ACCESS_REQUEST, CLASS_JOIN, NEW_ACTIVITY, etc.
      if (notification.type === "ACCESS_REQUEST") {
        // Rediriger vers la gestion de la classe (onglet spécifique si possible)
        // Note: Principal.jsx handles tab changes, we might need a prop for that
        if (typeof onNavigate === 'function') {
          onNavigate('manage-class', { classId: notification.targetId, subTab: 'requests' });
        }
      } else if (notification.type === "CLASS_JOIN") {
        if (typeof onNavigate === 'function') {
          onNavigate('classes', { classId: notification.targetId });
        }
      } else {
        // Default navigation
        if (typeof onNavigate === 'function') {
          onNavigate('dashboard');
        }
      }
      
      setShowNotifications(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
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
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 bg-transparent z-[9998]"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div
                    className={`fixed md:absolute top-full right-3 md:right-0 mt-1 w-80 max-w-[calc(100vw-16px)] rounded-lg shadow-xl border z-[9999] overflow-hidden ${
                      isDark
                        ? "bg-gray-800 border-gray-700 shadow-black/40"
                        : "bg-white border-gray-200 shadow-gray-200/50"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"}`}>
                      <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-bold uppercase transition-all">
                          {unreadCount} Nouvelles
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-4 border-b last:border-b-0 transition-all cursor-pointer relative ${
                              notification.lu 
                                ? (isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50/50") 
                                : (isDark ? "bg-blue-900/10 hover:bg-blue-900/20" : "bg-blue-50/50 hover:bg-blue-100/50")
                            }`}
                          >
                            {!notification.lu && (
                              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
                            )}
                            <div className="flex flex-col gap-1">
                              <p className={`text-xs leading-relaxed ${
                                notification.lu 
                                  ? (isDark ? "text-gray-400" : "text-gray-600") 
                                  : (isDark ? "text-gray-100 font-semibold" : "text-gray-900 font-semibold")
                              }`}>
                                {notification.message}
                              </p>
                              <p className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                {notification.dateCreation ? new Date(notification.dateCreation).toLocaleString() : 'Récemment'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Bell className={`w-8 h-8 mx-auto mb-2 opacity-20 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                          <p className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Aucune notification
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={userDropdownRef}>
              <button
                ref={userButtonRef}
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
                    className={`fixed md:absolute right-3 md:right-0 w-64 max-w-[calc(100vw-16px)] rounded-lg shadow-xl border z-[9999] ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                    style={{
                      top: userButtonRef.current ? userButtonRef.current.getBoundingClientRect().bottom + 8 : undefined,
                    }}
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
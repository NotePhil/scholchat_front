import React, { useState, useEffect } from "react";
import { Bell, User, Globe, ChevronDown } from "lucide-react";

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
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    // Get user information from localStorage
    const storedUserName =
      localStorage.getItem("userName") ||
      localStorage.getItem("username") ||
      "Utilisateur";
    setUserName(storedUserName);
  }, []);

  const languages = [
    {
      code: "fr",
      name: "Français",
      flag: "🇫🇷",
    },
    {
      code: "en",
      name: "English",
      flag: "🇺🇸",
    },
  ];

  const handleLanguageSelect = (langCode) => {
    onLanguageChange(langCode);
    setShowLanguageDropdown(false);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      ROLE_ADMIN: "Administrateur",
      ROLE_PROFESSOR: "Professeur",
      ROLE_PARENT: "Parent",
      ROLE_STUDENT: "Élève",
      admin: "Administrateur",
      professor: "Professeur",
      parent: "Parent",
      student: "Élève",
    };
    return roleMap[role] || role;
  };

  const getPrimaryRole = () => {
    if (userRoles.length > 0) {
      return getRoleDisplayName(userRoles[0]);
    }
    return getRoleDisplayName(userRole);
  };

  const currentLang =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-b shadow-sm transition-colors duration-300`}
      style={{ height: "64px" }}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: colorSchemes?.[currentTheme]?.primary }}
            >
              SC
            </div>
            <span
              className="text-xl font-bold hidden sm:block"
              style={{ color: colorSchemes?.[currentTheme]?.primary }}
            >
              ScholChat
            </span>
          </div>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-lg">{currentLang.flag}</span>
              <span className="hidden sm:block text-sm font-medium">
                {currentLang.code.toUpperCase()}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showLanguageDropdown && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } z-50`}
              >
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                        currentLanguage === lang.code
                          ? isDark
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 text-gray-900"
                          : isDark
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                      {currentLanguage === lang.code && (
                        <div
                          className="w-2 h-2 rounded-full ml-auto"
                          style={{
                            backgroundColor:
                              colorSchemes?.[currentTheme]?.primary,
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            className={`p-2 rounded-lg transition-colors relative ${
              isDark
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute -top-1 -right-1 w-4 h-4 text-xs font-bold text-white rounded-full flex items-center justify-center"
              style={{ backgroundColor: colorSchemes?.[currentTheme]?.primary }}
            >
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{
                    backgroundColor: colorSchemes?.[currentTheme]?.primary,
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div
                    className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userName}
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getPrimaryRole()}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </button>

            {showUserDropdown && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } z-50`}
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: colorSchemes?.[currentTheme]?.primary,
                      }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div
                        className={`font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {userName}
                      </div>
                      <div
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {getPrimaryRole()}
                      </div>
                      {userRoles.length > 1 && (
                        <div
                          className={`text-xs mt-1 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          +{userRoles.length - 1} autre(s) rôle(s)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                      isDark
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Mon Profil</span>
                  </button>

                  {userRoles.length > 1 && (
                    <div className="px-4 py-2">
                      <div
                        className={`text-xs font-medium mb-2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Tous les rôles:
                      </div>
                      <div className="space-y-1">
                        {userRoles.map((role, index) => (
                          <div
                            key={index}
                            className={`text-xs px-2 py-1 rounded ${
                              isDark
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getRoleDisplayName(role)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserDropdown || showLanguageDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserDropdown(false);
            setShowLanguageDropdown(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;

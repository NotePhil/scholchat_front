import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useTheme } from "@emotion/react";
import UserDatasLocalStorages from "../../../../components/common/Users/UserDatasLocalStorage";
import { useTranslation } from "react-i18next";
import Footer from "../../../../components/common/FooterD";
import UserDefaultIcon from "../../../../components/assets/user-default.png";

const Principal = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, currentTheme, themes } = useTheme();

  // User data and authentication
  const currentUser = UserDatasLocalStorages.getUserDatas();
  const userRole = currentUser?.role || localStorage.getItem("userRole");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Track active tab based on URL
  const [activeTab, setActiveTab] = useState("dashboard");

  // Language settings
  const [locale, setLocale] = useState(currentUser?.language?.trim() || "en");
  const province = UserDatasLocalStorages.getProvince();

  // Check authentication and set active tab
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/schoolchat/login");
      return;
    }

    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes("dashboard")) {
      setActiveTab("dashboard");
    } else if (path.includes("students")) {
      setActiveTab("students");
    } else if (path.includes("professors")) {
      setActiveTab("professors");
    } else if (path.includes("parents")) {
      setActiveTab("parents");
    } else if (path.includes("classes")) {
      setActiveTab("classes");
    } else if (path.includes("professeur-motif")) {
      setActiveTab("professeur-motif");
    } else if (path.includes("settings")) {
      setActiveTab("settings");
    }
  }, [location, navigate]);

  // Handle language change
  const handleLanguageChange = (newLang) => {
    setLocale(newLang);
    if (currentUser) {
      currentUser.language = newLang;
      UserDatasLocalStorages.setUserDatas(currentUser);
    }
    setIsDropdownOpen(false);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={`flex h-screen ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
      <Sidebar
        showSidebar={showSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        isDark={isDark}
        currentTheme={currentTheme}
        themes={themes}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`${
            isDark ? themes.dark.cardBg : themes.light.cardBg
          } shadow-sm z-10`}
        >
          <div className="flex items-center justify-between p-4">
            {/* Mobile sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none focus:text-gray-700 md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page title */}
            <div className="text-xl font-semibold">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </div>

            {/* Right section with province, language and user */}
            <div className="flex items-center space-x-4">
              {/* Province display */}
              {province && (
                <div className="hidden md:block text-sm font-medium">
                  {t(province)}
                </div>
              )}

              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <span>{locale === "en" ? "EN" : "FR"}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => handleLanguageChange("en")}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange("fr")}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Français
                    </button>
                  </div>
                )}
              </div>

              {/* User profile dropdown */}
              <div className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center focus:outline-none"
                >
                  <img
                    src={
                      currentUser?.image
                        ? `data:image/jpg;base64, ${currentUser.image}`
                        : UserDefaultIcon
                    }
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm font-medium border-b dark:border-gray-700">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {currentUser?.username}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/schoolchat/login");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Principal;

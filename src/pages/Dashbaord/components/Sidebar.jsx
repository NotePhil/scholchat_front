import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Define menu items for different roles
const menuItems = {
  admin: [
    { id: "dashboard", icon: "chart-bar", label: "dashboard" },
    { id: "students", icon: "users", label: "students" },
    { id: "professors", icon: "academic-cap", label: "professors" },
    { id: "parents", icon: "user-group", label: "parents" },
    { id: "classes", icon: "view-grid", label: "classes" },
    { id: "settings", icon: "cog", label: "settings" },
  ],
  professor: [
    { id: "dashboard", icon: "chart-bar", label: "dashboard" },
    { id: "students", icon: "users", label: "students" },
    { id: "classes", icon: "view-grid", label: "classes" },
    { id: "professeur-motif", icon: "clipboard-list", label: "absences" },
    { id: "settings", icon: "cog", label: "settings" },
  ],
  student: [
    { id: "dashboard", icon: "chart-bar", label: "dashboard" },
    { id: "classes", icon: "view-grid", label: "myClasses" },
    { id: "assignments", icon: "clipboard-list", label: "assignments" },
    { id: "messages", icon: "mail", label: "messages" },
    { id: "settings", icon: "cog", label: "settings" },
  ],
  parent: [
    { id: "dashboard", icon: "chart-bar", label: "dashboard" },
    { id: "children", icon: "users", label: "myChildren" },
    { id: "progress", icon: "trending-up", label: "progress" },
    { id: "messages", icon: "mail", label: "messages" },
    { id: "settings", icon: "cog", label: "settings" },
  ],
};

// Default themes in case they're not provided via props
const defaultThemes = {
  light: {
    sidebar: "bg-white border-r border-gray-200",
    activeLink: "bg-blue-600",
  },
  dark: {
    sidebar: "bg-gray-900 border-r border-gray-700",
    activeLink: "bg-blue-700",
  },
};

// Adding color schemes directly to Sidebar component
export const colorSchemes = {
  blue: {
    primary: "#2563eb",
    secondary: "#1d4ed8",
    accent: "#60a5fa",
    hover: "#3b82f6",
    light: "#dbeafe",
    gradient: ["rgba(37, 99, 235, 0.2)", "rgba(37, 99, 235, 0)"],
  },
  green: {
    primary: "#059669",
    secondary: "#047857",
    accent: "#34d399",
    hover: "#10b981",
    light: "#d1fae5",
    gradient: ["rgba(5, 150, 105, 0.2)", "rgba(5, 150, 105, 0)"],
  },
  purple: {
    primary: "#7c3aed",
    secondary: "#6d28d9",
    accent: "#a78bfa",
    hover: "#8b5cf6",
    light: "#ede9fe",
    gradient: ["rgba(124, 58, 237, 0.2)", "rgba(124, 58, 237, 0)"],
  },
  orange: {
    primary: "#ea580c",
    secondary: "#c2410c",
    accent: "#fb923c",
    hover: "#f97316",
    light: "#ffedd5",
    gradient: ["rgba(234, 88, 12, 0.2)", "rgba(234, 88, 12, 0)"],
  },
};

const Sidebar = ({
  showSidebar,
  activeTab,
  setActiveTab,
  userRole = "student",
  isDark,
  currentTheme = "light",
  themes = defaultThemes,
  colorScheme = "blue",
}) => {
  const { t } = useTranslation();

  // Normalize role name (just in case)
  const normalizedRole = userRole.toLowerCase();

  // Get menu items based on user role or default to student
  const roleMenuItems = menuItems[normalizedRole] || menuItems.student;

  // Use theme based on currentTheme or isDark
  const theme =
    themes[currentTheme] ||
    (isDark ? themes.dark : themes.light) ||
    defaultThemes[currentTheme];

  // Get color scheme
  const colors = colorSchemes[colorScheme] || colorSchemes.blue;

  // Complete the icon set with all the icons used in menuItems
  const Icon = ({ name }) => {
    // Map of icon names to SVG paths
    const icons = {
      "chart-bar": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      users: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      "academic-cap": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
          />
        </svg>
      ),
      "user-group": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      "view-grid": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      cog: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      "clipboard-list": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      mail: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      "trending-up": (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    };

    return (
      icons[name] || (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
      )
    );
  };

  if (!showSidebar) {
    return null;
  }

  return (
    <div
      className={`${theme.sidebar} ${
        showSidebar ? "flex" : "hidden"
      } md:flex md:flex-shrink-0 transition-all duration-300`}
    >
      <div className="flex flex-col w-64">
        {/* Sidebar header/logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">School Chat</h2>
        </div>

        {/* Sidebar menu */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {roleMenuItems.map((item) => (
              <Link
                key={item.id}
                to={`/schoolchat/${item.id}`}
                className={`${
                  activeTab === item.id
                    ? `${theme.activeLink} text-white`
                    : `${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                } flex items-center px-4 py-2 text-sm font-medium rounded-md`}
                onClick={() => setActiveTab(item.id)}
                style={
                  activeTab === item.id
                    ? { backgroundColor: colors.primary }
                    : {}
                }
              >
                <Icon name={item.icon} />
                <span className="ml-3">{t(item.label)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

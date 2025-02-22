import React from "react";
import {
  Menu,
  Users,
  UserPlus,
  BookOpen,
  Building2,
  Mail,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  showSidebar,
  activeTab,
  setActiveTab,
  isDark,
  currentTheme,
  themes,
  colorSchemes,
}) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  // Define menu items based on user role
  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return [
          {
            name: "Dashboard",
            icon: Menu,
            tab: "dashboard",
            path: "/admin/dashboard",
          },
          { name: "Users", icon: Users, tab: "users", path: "/users" },
          {
            name: "Parents",
            icon: UserPlus,
            tab: "parents",
            path: "/parents/dashboard",
          },
          {
            name: "Professors",
            icon: BookOpen,
            tab: "professors",
            path: "/professors/dashboard",
          },
          {
            name: "Classes",
            icon: Building2,
            tab: "classes",
            path: "/classes",
          },
          { name: "Messages", icon: Mail, tab: "messages", path: "/messages" },
          {
            name: "Settings",
            icon: Settings,
            tab: "settings",
            path: "/settings",
          },
        ];

      case "professor":
      case "repetiteur":
        return [
          {
            name: "Activities",
            icon: Menu,
            tab: "dashboard",
            path: "/admin/dashboard",
          },
          {
            name: "DashBoard",
            icon: Users,
            tab: "students",
            path: "/professors/dashboard",
          },
          {
            name: "Parents",
            icon: UserPlus,
            tab: "parents",
            path: "/parents/dashboard",
          },
          {
            name: "Professors",
            icon: BookOpen,
            tab: "professors",
            path: "/professors/dashboard",
          },
          {
            name: "Classes",
            icon: Building2,
            tab: "classes",
            path: "/classes",
          },
          { name: "Messages", icon: Mail, tab: "messages", path: "/messages" },
          {
            name: "Settings",
            icon: Settings,
            tab: "settings",
            path: "/settings",
          },
        ];

      case "student":
        return [
          {
            name: "Dashboard",
            icon: Menu,
            tab: "dashboard",
            path: "/student/dashboard",
          },
          {
            name: "Students",
            icon: Users,
            tab: "students",
            path: "/students/dashboard",
          },
          {
            name: "Classes",
            icon: Building2,
            tab: "classes",
            path: "/classes",
          },
          { name: "Messages", icon: Mail, tab: "messages", path: "/messages" },
          {
            name: "Settings",
            icon: Settings,
            tab: "settings",
            path: "/settings",
          },
        ];

      case "parent":
        return [
          {
            name: "Dashboard",
            icon: Menu,
            tab: "dashboard",
            path: "/parent/dashboard",
          },
          {
            name: "Students",
            icon: Users,
            tab: "students",
            path: "/students/dashboard",
          },
          {
            name: "Classes",
            icon: Building2,
            tab: "classes",
            path: "/classes",
          },
          { name: "Messages", icon: Mail, tab: "messages", path: "/messages" },
          {
            name: "Settings",
            icon: Settings,
            tab: "settings",
            path: "/settings",
          },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path, tab) => {
    setActiveTab(tab);

    if (tab === "messages") {
      window.location.href = "mailto:";
    } else {
      navigate(path);
    }
  };

  return (
    <aside
      className={`${
        isDark ? themes.dark.cardBg : themes.light.cardBg
      } w-64 min-h-screen ${
        showSidebar ? "block" : "hidden"
      } md:block shadow-lg transition-colors duration-300`}
    >
      <div
        className={`p-6 ${
          isDark ? themes.dark.border : themes.light.border
        } border-b`}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: colorSchemes[currentTheme].primary }}
        >
          ScholChat
        </h1>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`relative flex items-center px-6 py-4 cursor-pointer transition-all duration-300 ${
              activeTab === item.tab
                ? `${
                    isDark ? "text-white" : "text-gray-900"
                  } font-medium transform scale-100`
                : isDark
                ? "text-gray-300 hover:text-white"
                : "text-gray-700 hover:text-gray-900"
            }`}
            onClick={() => handleNavigation(item.path, item.tab)}
          >
            {/* Active state background effect */}
            {activeTab === item.tab && (
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  backgroundColor: colorSchemes[currentTheme].light,
                  opacity: isDark ? 0.2 : 0.15,
                }}
              />
            )}

            {/* Active state indicator line */}
            {activeTab === item.tab && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                style={{
                  backgroundColor: colorSchemes[currentTheme].primary,
                }}
              />
            )}

            {/* Icon and text container */}
            <div className="relative flex items-center w-full group">
              <item.icon
                className={`w-6 h-6 transition-all duration-300 ${
                  activeTab === item.tab ? "" : "group-hover:scale-110"
                }`}
                style={{
                  color:
                    activeTab === item.tab
                      ? colorSchemes[currentTheme].primary
                      : isDark
                      ? "currentColor"
                      : "currentColor",
                }}
              />
              <span
                className={`mx-4 transition-all duration-300 ${
                  activeTab === item.tab
                    ? "transform translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              >
                {item.name}
              </span>
            </div>

            {/* Hover effect overlay */}
            <div
              className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                activeTab !== item.tab ? "hover:opacity-10" : ""
              }`}
              style={{
                backgroundColor: colorSchemes[currentTheme].primary,
              }}
            />
          </div>
        ))}
      </nav>
    </aside>
  );
}

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

export default function Sidebar({
  showSidebar,
  activeTab,
  setActiveTab,
  isDark,
  currentTheme,
  themes,
  colorSchemes,
}) {
  const menuItems = [
    { name: "Dashboard", icon: Menu },
    { name: "Users", icon: Users },
    { name: "Students", icon: Users },
    { name: "Parents", icon: UserPlus },
    { name: "Professors", icon: BookOpen },
    { name: "Classes", icon: Building2 },
    { name: "Messages", icon: Mail },
    { name: "Settings", icon: Settings },
  ];

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
            className={`flex items-center px-6 py-4 cursor-pointer transition-all duration-200 ${
              activeTab === item.name.toLowerCase()
                ? isDark
                  ? `bg-gray-700 border-r-4`
                  : `bg-opacity-10 border-r-4`
                : isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            style={{
              borderColor: colorSchemes[currentTheme].primary,
              backgroundColor:
                activeTab === item.name.toLowerCase()
                  ? `${colorSchemes[currentTheme].light}`
                  : "transparent",
            }}
          >
            <item.icon
              className="w-6 h-6"
              style={{ color: colorSchemes[currentTheme].primary }}
            />
            <span className="mx-4">{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

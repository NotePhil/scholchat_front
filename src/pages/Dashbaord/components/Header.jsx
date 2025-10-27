// components/Header.jsx
import React from "react";
import { Menu, Bell } from "lucide-react";
import ThemeSelector from "./ThemeSelector";

export default function Header({
  showSidebar,
  setShowSidebar,
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
  themes,
  colorSchemes,
}) {
  return (
    <header
      className={`${
        isDark ? themes.dark.cardBg : themes.light.cardBg
      } shadow-lg transition-colors duration-300`}
    >
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`md:hidden p-2 rounded-md transition-colors duration-200 ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <Menu
            className={`w-6 h-6 ${isDark ? "text-white" : "text-gray-600"}`}
          />
        </button>

        <div className="flex items-center space-x-4">
          <ThemeSelector
            isDark={isDark}
            setIsDark={setIsDark}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            colorSchemes={colorSchemes}
          />
          <div className="relative">
            <Bell
              className={`w-6 h-6 ${
                isDark ? "text-white" : "text-gray-600"
              } cursor-pointer`}
            />
            <span
              className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            >
              3
            </span>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colorSchemes[currentTheme].primary }}
          >
            <span className="text-white text-sm font-semibold">SC</span>
          </div>
        </div>
      </div>
    </header>
  );
}

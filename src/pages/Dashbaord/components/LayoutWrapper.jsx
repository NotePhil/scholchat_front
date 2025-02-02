import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export const LayoutWrapper = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [activeTab, setActiveTab] = useState("dashboard");

  const themes = {
    light: {
      background: "bg-gray-50",
      cardBg: "bg-white",
      border: "border-gray-200",
      text: "text-gray-900",
      gridColor: "#e5e7eb",
      chartBg: "#ffffff",
    },
    dark: {
      background: "bg-gray-900",
      cardBg: "bg-gray-800",
      border: "border-gray-700",
      text: "text-white",
      gridColor: "#374151",
      chartBg: "#1f2937",
    },
  };

const colorSchemes = {
  blue: {
    primary: "#3B82F6",
    light: "rgba(59, 130, 246, 0.1)",
    accent: "#60A5FA",
    secondary: "#93C5FD",
    gradient: {
      primary: {
        start: "#3B82F6",
        end: "rgba(59, 130, 246, 0.1)",
      },
      accent: {
        start: "#60A5FA",
        end: "rgba(96, 165, 250, 0.1)",
      },
      secondary: {
        start: "#93C5FD",
        end: "rgba(147, 197, 253, 0.1)",
      },
    },
  },
  green: {
    primary: "#10B981",
    light: "rgba(16, 185, 129, 0.1)",
    accent: "#34D399",
    secondary: "#6EE7B7",
    gradient: {
      primary: {
        start: "#10B981",
        end: "rgba(16, 185, 129, 0.1)",
      },
      accent: {
        start: "#34D399",
        end: "rgba(52, 211, 153, 0.1)",
      },
      secondary: {
        start: "#6EE7B7",
        end: "rgba(110, 231, 183, 0.1)",
      },
    },
  },
  orange: {
    primary: "#F97316",
    light: "rgba(249, 115, 22, 0.1)",
    accent: "#FB923C",
    secondary: "#FDBA74",
    gradient: {
      primary: {
        start: "#F97316",
        end: "rgba(249, 115, 22, 0.1)",
      },
      accent: {
        start: "#FB923C",
        end: "rgba(251, 146, 60, 0.1)",
      },
      secondary: {
        start: "#FDBA74",
        end: "rgba(253, 186, 116, 0.1)",
      },
    },
  },
  purple: {
    primary: "#8B5CF6",
    light: "rgba(139, 92, 246, 0.1)",
    accent: "#A78BFA",
    secondary: "#C4B5FD",
    gradient: {
      primary: {
        start: "#8B5CF6",
        end: "rgba(139, 92, 246, 0.1)",
      },
      accent: {
        start: "#A78BFA",
        end: "rgba(167, 139, 250, 0.1)",
      },
      secondary: {
        start: "#C4B5FD",
        end: "rgba(196, 181, 253, 0.1)",
      },
    },
  },
};

  // Theme context object that will be passed to children
  const themeContext = {
    isDark,
    setIsDark,
    currentTheme,
    setCurrentTheme,
    themes,
    colorSchemes,
    showSidebar,
    setShowSidebar,
    activeTab,
    setActiveTab,
  };

  return (
    <div
      className={`flex h-screen ${
        isDark ? themes.dark.background : themes.light.background
      } transition-colors duration-300`}
    >
      <Sidebar
        showSidebar={showSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        currentTheme={currentTheme}
        themes={themes}
        colorSchemes={colorSchemes}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          isDark={isDark}
          setIsDark={setIsDark}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          themes={themes}
          colorSchemes={colorSchemes}
        />

        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto p-8 transition-colors duration-300 ${
            isDark ? themes.dark.background : themes.light.background
          }`}
        >
          {typeof children === "function"
            ? children(themeContext)
            : React.Children.map(children, (child) =>
                React.isValidElement(child)
                  ? React.cloneElement(child, themeContext)
                  : child
              )}
        </main>
      </div>
    </div>
  );
};

export default LayoutWrapper;

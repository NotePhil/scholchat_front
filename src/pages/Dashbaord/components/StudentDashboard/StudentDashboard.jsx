import React, { useState } from "react";
import { LayoutWrapper } from "../LayoutWrapper";
import ActivityFeed from "./ActivityFeed";
import EmailDashboard from "./EmailDashboard";
import { Home, Mail, Bell, User, Settings } from "lucide-react";

const StudentDashboard = () => {
  const [activeView, setActiveView] = useState("activity");

  return (
    <LayoutWrapper>
      {({ isDark, themes, currentTheme, colorSchemes }) => (
        <div className="flex h-screen">
          {/* Sidebar Navigation */}
          <div
            className={`w-20 flex flex-col items-center py-8 space-y-4 ${
              isDark ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <div className="space-y-4">
              {[
                { icon: Home, view: "activity", label: "Activity" },
                { icon: Mail, view: "email", label: "Email" },
                { icon: Bell, view: "notifications", label: "Notifications" },
                { icon: User, view: "profile", label: "Profile" },
                { icon: Settings, view: "settings", label: "Settings" },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`p-3 rounded-xl hover:bg-opacity-20 transition-all ${
                    activeView === item.view
                      ? `${colorSchemes[currentTheme].primary} bg-opacity-20`
                      : "hover:bg-gray-200"
                  }`}
                >
                  <item.icon
                    className={`w-6 h-6 ${
                      activeView === item.view
                        ? colorSchemes[currentTheme].primary
                        : isDark
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeView === "activity" && (
              <ActivityFeed
                isDark={isDark}
                currentTheme={currentTheme}
                colorSchemes={colorSchemes}
              />
            )}
            {activeView === "email" && (
              <EmailDashboard
                isDark={isDark}
                currentTheme={currentTheme}
                colorSchemes={colorSchemes}
              />
            )}
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
};

export default StudentDashboard;

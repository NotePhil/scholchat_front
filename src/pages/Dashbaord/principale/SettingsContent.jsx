import React, { useState } from "react";

const SettingsContent = ({
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
}) => {
  const themes = {
    light: {
      cardBg: "bg-white",
      border: "border-gray-200",
    },
    dark: {
      cardBg: "bg-gray-800",
      border: "border-gray-700",
    },
  };

  const colorSchemes = {
    blue: {
      primary: "#4a6da7",
      light: "#6889c3",
    },
    green: {
      primary: "#2e7d32",
      light: "#4caf50",
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDark}
                  onChange={() => setIsDark(!isDark)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block mb-2">Color Scheme</label>
              <div className="flex gap-4">
                {Object.keys(colorSchemes).map((scheme) => (
                  <div
                    key={scheme}
                    className={`w-10 h-10 rounded-full cursor-pointer ${
                      currentTheme === scheme
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : ""
                    }`}
                    style={{ backgroundColor: colorSchemes[scheme].primary }}
                    onClick={() => setCurrentTheme(scheme)}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          {/* Add account settings form here */}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Preferences</h2>
          {/* Add system preferences here */}
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;

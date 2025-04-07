import React from "react";
import { useOutletContext } from "react-router-dom";

const SettingsPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h1
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        Account Settings
      </h1>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        Update your profile information, password, and notification preferences.
      </p>
    </div>
  );
};

export default SettingsPage;

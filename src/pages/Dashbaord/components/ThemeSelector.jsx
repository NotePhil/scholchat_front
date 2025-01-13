// components/ThemeSelector.jsx
import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSelector({
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
  colorSchemes,
}) {
  return (
    <div className="flex items-center space-x-2">
      {Object.keys(colorSchemes).map((theme) => (
        <button
          key={theme}
          onClick={() => setCurrentTheme(theme)}
          className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 transform hover:scale-110 ${
            currentTheme === theme
              ? "border-gray-600 scale-110"
              : "border-gray-300"
          }`}
          style={{ backgroundColor: colorSchemes[theme].primary }}
        />
      ))}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"
        } hover:scale-110 transform`}
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
    </div>
  );
}

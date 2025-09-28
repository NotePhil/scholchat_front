import React from "react";
import { ArrowSmUpIcon, ArrowSmDownIcon } from "@heroicons/react/solid";

const StatsCard = ({
  title,
  icon: Icon, // Renamed to uppercase to indicate it's a component
  count,
  activeCount,
  onClick,
  isActive,
  theme,
  color = "blue-600",
}) => {
  // Convert a color like "blue-600" to a CSS variable color if available
  const getIconBgColor = () => {
    return `bg-${color}/10`;
  };

  const getIconColor = () => {
    return `text-${color}`;
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-sm cursor-pointer ${
        isActive ? "border-l-4 border-blue-600" : ""
      } ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <h3
          className={`text-lg font-medium ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
        <div className={`p-2 rounded-full ${getIconBgColor()}`}>
          <div className={getIconColor()}>
            {/* Render the icon as a component */}
            {Icon && <Icon size={24} />}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-3xl font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {count}
        </p>

        {activeCount !== undefined && (
          <div className="mt-2 flex items-center">
            <span
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Active: {activeCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

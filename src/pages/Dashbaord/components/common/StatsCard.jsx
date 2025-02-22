import React from "react";
import { ArrowSmUpIcon, ArrowSmDownIcon } from "@heroicons/react/solid";

const StatsCard = ({
  title,
  value,
  icon,
  change,
  changeLabel,
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
      className={`p-6 rounded-lg shadow-sm ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
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
          <div className={getIconColor()}>{icon}</div>
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-3xl font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </p>

        {(change !== undefined || changeLabel) && (
          <div className="mt-2 flex items-center">
            {change !== undefined && (
              <>
                {change > 0 ? (
                  <ArrowSmUpIcon className="h-5 w-5 text-green-500" />
                ) : change < 0 ? (
                  <ArrowSmDownIcon className="h-5 w-5 text-red-500" />
                ) : null}

                <span
                  className={`text-sm ${
                    change > 0
                      ? "text-green-500"
                      : change < 0
                      ? "text-red-500"
                      : theme === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  } ml-1`}
                >
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </>
            )}

            {changeLabel && (
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                } ml-1`}
              >
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

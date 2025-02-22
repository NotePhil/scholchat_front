import React from "react";
import {
  ClockIcon,
  LocationMarkerIcon,
  UserGroupIcon,
} from "@heroicons/react/outline";

const ClassSchedule = ({ classes, showAll = false, theme, colorScheme }) => {
  if (!classes || classes.length === 0) {
    return (
      <div
        className={`p-4 rounded-md bg-${
          theme === "dark" ? "gray-700" : "gray-100"
        }`}
      >
        <p
          className={`text-${
            theme === "dark" ? "gray-300" : "gray-600"
          } text-center`}
        >
          No classes scheduled
        </p>
      </div>
    );
  }

  // Format date display
  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel = date.toLocaleDateString(undefined, { weekday: "long" });

    if (date.toDateString() === today.toDateString()) {
      dayLabel = "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = "Tomorrow";
    }

    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayLabel} at ${timeString}`;
  };

  // Either show all classes or just upcoming ones based on the showAll prop
  const classesToDisplay = showAll
    ? classes.sort(
        (a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)
      )
    : classes.slice(0, 5);

  return (
    <div className="space-y-4">
      {classesToDisplay.map((cls, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 border-${
            colorScheme.primary
          } bg-${
            theme === "dark" ? "gray-700" : "gray-50"
          } flex flex-col md:flex-row md:items-center md:justify-between`}
        >
          <div className="flex-1">
            <h3
              className={`font-medium text-${
                theme === "dark" ? "white" : "gray-800"
              } text-lg`}
            >
              {cls.name || cls.title}
            </h3>
            <p
              className={`text-${
                theme === "dark" ? "gray-300" : "gray-600"
              } text-sm`}
            >
              {cls.description || cls.subject}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center">
                <ClockIcon
                  className={`h-4 w-4 mr-1 text-${
                    theme === "dark" ? "gray-400" : "gray-500"
                  }`}
                />
                <span
                  className={`text-xs text-${
                    theme === "dark" ? "gray-300" : "gray-600"
                  }`}
                >
                  {formatScheduledTime(cls.scheduledDate)}
                </span>
              </div>

              {cls.location && (
                <div className="flex items-center">
                  <LocationMarkerIcon
                    className={`h-4 w-4 mr-1 text-${
                      theme === "dark" ? "gray-400" : "gray-500"
                    }`}
                  />
                  <span
                    className={`text-xs text-${
                      theme === "dark" ? "gray-300" : "gray-600"
                    }`}
                  >
                    {cls.location}
                  </span>
                </div>
              )}

              {cls.students && (
                <div className="flex items-center">
                  <UserGroupIcon
                    className={`h-4 w-4 mr-1 text-${
                      theme === "dark" ? "gray-400" : "gray-500"
                    }`}
                  />
                  <span
                    className={`text-xs text-${
                      theme === "dark" ? "gray-300" : "gray-600"
                    }`}
                  >
                    {cls.students.length} students
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md bg-${colorScheme.primary} text-white hover:bg-${colorScheme.primaryDark} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${colorScheme.primary}`}
            >
              View Details
            </button>
          </div>
        </div>
      ))}

      {!showAll && classes.length > 5 && (
        <div className="text-center mt-4">
          <button
            className={`px-4 py-2 text-sm font-medium text-${colorScheme.primary} hover:text-${colorScheme.primaryDark}`}
          >
            View All Classes
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassSchedule;

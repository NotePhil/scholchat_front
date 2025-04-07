import React from "react";
import { useOutletContext } from "react-router-dom";

const StudentPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h1
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        Hello Students
      </h1>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        Welcome to your student dashboard. Here you can view your classes,
        assignments, and messages.
      </p>
    </div>
  );
};

export default StudentPage;

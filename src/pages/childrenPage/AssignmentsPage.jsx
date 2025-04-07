import React from "react";
import { useOutletContext } from "react-router-dom";

const AssignmentsPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();
  const userRole = localStorage.getItem("userRole") || "student";

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h1
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        {userRole === "student" ? "My Assignments" : "Assignments"}
      </h1>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        {userRole === "student"
          ? "View and submit your assignments."
          : "Create and manage assignments for your classes."}
      </p>
    </div>
  );
};

export default AssignmentsPage;

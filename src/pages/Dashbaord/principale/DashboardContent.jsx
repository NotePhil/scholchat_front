import React from "react";
import AdminDashboard from "./AdminDashboard";
import ProfessorDashboard from "./ProfessorDashboard";
import StudentDashboard from "./StudentDashboard";
import ParentDashboard from "./ParentDashboard";

const DashboardContent = ({
  isDark,
  currentTheme,
  colorSchemes,
  userRole,
  userRoles = [],
}) => {
  const dashboardProps = {
    isDark,
    currentTheme,
    colorSchemes,
    userRoles,
  };

  // Check if the user has admin rights in the roles array
  const hasAdminRole =
    Array.isArray(userRoles) &&
    userRoles.some((role) => role === "ROLE_ADMIN" || role === "ADMIN");

  // If the user has ROLE_ADMIN in their roles array, prioritize showing admin dashboard
  if (hasAdminRole) {
    return <AdminDashboard {...dashboardProps} />;
  }

  // Otherwise use the main userRole from localStorage
  switch (userRole) {
    case "admin":
      return <AdminDashboard {...dashboardProps} />;
    case "professor":
    case "repetiteur":
      return <ProfessorDashboard {...dashboardProps} />;
    case "student":
      return <StudentDashboard {...dashboardProps} />;
    case "parent":
      return <ParentDashboard {...dashboardProps} />;
    default:
      return <StudentDashboard {...dashboardProps} />; // Default to student dashboard as fallback
  }
};

export default DashboardContent;

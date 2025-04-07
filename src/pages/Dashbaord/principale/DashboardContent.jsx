import React from "react";
import AdminDashboard from "./AdminDashboard";
import ProfessorDashboard from "./ProfessorDashboard";
import StudentDashboard from "./StudentDashboard";
import ParentDashboard from "./ParentDashboard";

const DashboardContent = ({ isDark, currentTheme, colorSchemes, userRole }) => {
  const dashboardProps = {
    isDark,
    currentTheme,
    colorSchemes,
  };

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
      return <AdminDashboard {...dashboardProps} />;
  }
};

export default DashboardContent;

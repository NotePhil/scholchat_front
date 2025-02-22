import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PostLoginClassModal from "./ClassSelectionModal";

const ClassSelectionWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");

  const handleClassSelect = (selectedClass) => {
    // Store the selected class in localStorage
    localStorage.setItem("selectedClass", selectedClass);

    // Navigate to the appropriate dashboard based on user role
    switch (userRole) {
      case "professor":
        navigate("/professors/dashboard");
        break;
      case "repetiteur":
        navigate("/professors/dashboard");
        break;
      case "student":
        navigate("/students/dashboard");
        break;
      case "parent":
        navigate("/parents/dashboard");
        break;
      default:
        navigate("/");
        break;
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  // If no showClassModal in state or no userRole, redirect to login
  if (!location.state?.showClassModal || !userRole) {
    navigate("/login");
    return null;
  }

  return (
    <PostLoginClassModal
      onClose={handleClose}
      onClassSelect={handleClassSelect}
    />
  );
};

export default ClassSelectionWrapper;
